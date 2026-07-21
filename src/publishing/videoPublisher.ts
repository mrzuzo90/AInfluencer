import { logger } from '../shared/logger.js';
import { Post, GeneratedContent } from '../shared/types.js';
import { IPostRepository } from '../shared/repository/postRepository.js';
import { IPublisher, DraftPublisher, LinkedInPublisher } from './draftPublisher.js';
import { YouTubePublisher } from './youtubePublisher.js';
import { videoAssembler, CompiledVideo } from '../video/videoAssembler.js';
import { config } from '../shared/config.js';
import { getNotifier } from '../notifications/notifier.js';
import { randomUUID } from 'crypto';

/**
 * Multi-platform video publisher (Phase 2)
 * Orchestrates publishing to LinkedIn + YouTube Shorts
 * Supports:
 * - Draft-only (default)
 * - LinkedIn + YouTube (with credentials)
 * - Text + video publishing in parallel
 */
export class VideoPublisher {
  private draftPublisher: IPublisher;
  private linkedinPublisher: IPublisher;
  private youtubePublisher: YouTubePublisher;

  constructor(private postRepository: IPostRepository) {
    this.draftPublisher = new DraftPublisher(postRepository);
    this.linkedinPublisher = new LinkedInPublisher(postRepository);
    this.youtubePublisher = new YouTubePublisher(postRepository);
  }

  async publish(
    articleId: string,
    content: GeneratedContent
  ): Promise<Post> {
    logger.info('\n📹 VIDEO PUBLISHER: Starting multi-platform publishing...\n');

    // 1. Assemble video and publish text draft concurrently — independent operations
    const assembleVideo = async (): Promise<CompiledVideo | null> => {
      if (!config.publishVideo) return null;
      try {
        return await videoAssembler.assemble(articleId, content);
      } catch (err) {
        logger.warn(`Video assembly failed, continuing with text: ${err}`);
        return null;
      }
    };

    const [video, textPost] = await Promise.all([
      assembleVideo(),
      !config.publishLive
        ? this.draftPublisher.publish(articleId, content)
        : Promise.resolve(null),
    ]);

    // 2. Publish to platforms based on config
    const posts: Post[] = [];

    if (!config.publishLive) {
      // DRAFT ONLY (default safe mode)
      logger.info('📝 DRAFT MODE: Text post only');
      posts.push(textPost as Post);

      if (video) {
        logger.info('📹 Video draft generated (not published)');
        const videoPost: Post = {
          id: randomUUID(),
          articleId,
          platform: 'youtube',
          content: content.linkedinPost || '',
          status: 'draft',
          hooks: content.hooks?.join(' | '),
          hashtags: content.hashtags?.join(' '),
          script: video.metadata.script,
        };
        await this.postRepository.save(videoPost);
        posts.push(videoPost);
      }
    } else {
      // LIVE PUBLISHING
      logger.info('🔴 LIVE MODE: Publishing to all platforms...');

      // LinkedIn text
      const linkedinPost = await this.linkedinPublisher.publish(
        articleId,
        content
      );
      posts.push(linkedinPost);

      // YouTube video
      if (video) {
        const youtubePost = await this.youtubePublisher.publishVideo(
          articleId,
          content,
          video
        );
        posts.push(youtubePost);
      } else {
        logger.info('⚠️  Video generation failed, LinkedIn text published only');
      }
    }

    // 3. Notify any secondary posts directly — the caller only notifies
    // the primary post it gets back, so extra posts (e.g. the video/YouTube
    // one alongside the text draft) would otherwise go unannounced.
    const [primaryPost, ...secondaryPosts] = posts;
    if (secondaryPosts.length > 0) {
      const notifier = getNotifier();
      for (const post of secondaryPosts) {
        await notifier.notify(post, content.title || 'Untitled');
      }
    }

    logger.info(`\n✅ Publishing complete: ${posts.length} post(s) created`);

    return primaryPost;
  }
}

// Cached per repo instance so YouTubePublisher's OAuth access-token cache
// survives across pipeline runs within the same process (postRepo is a
// module-level singleton from factory.ts, so in practice this cache holds
// exactly one entry).
const videoPublisherCache = new WeakMap<IPostRepository, VideoPublisher>();

export function createVideoPublisher(repo: IPostRepository): VideoPublisher {
  let publisher = videoPublisherCache.get(repo);
  if (!publisher) {
    publisher = new VideoPublisher(repo);
    videoPublisherCache.set(repo, publisher);
  }
  return publisher;
}

/**
 * Single source of truth for publisher selection.
 * Used by every pipeline entry point so video/draft routing can't drift
 * between call sites.
 */
export function selectPublisher(repo: IPostRepository): IPublisher {
  if (config.publishVideo) {
    return createVideoPublisher(repo);
  }
  if (config.publishLive) {
    return new LinkedInPublisher(repo);
  }
  return new DraftPublisher(repo);
}
