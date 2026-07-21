import { logger } from '../shared/logger.js';
import { Post, GeneratedContent } from '../shared/types.js';
import { IPostRepository } from '../shared/repository/postRepository.js';
import { IPublisher, DraftPublisher } from './draftPublisher.js';
import { YouTubePublisher } from './youtubePublisher.js';
import { LinkedInPublisher } from './draftPublisher.js';
import { videoAssembler, CompiledVideo } from '../video/videoAssembler.js';
import { config } from '../shared/config.js';
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

    // 1. Assemble video
    let video: CompiledVideo | null = null;
    if (config.publishVideo) {
      try {
        video = await videoAssembler.assemble(articleId, content);
      } catch (err) {
        logger.warn(`Video assembly failed, continuing with text: ${err}`);
      }
    }

    // 2. Publish to platforms based on config
    const posts: Post[] = [];

    if (!config.publishLive) {
      // DRAFT ONLY (default safe mode)
      logger.info('📝 DRAFT MODE: Text post only');
      const textPost = await this.draftPublisher.publish(articleId, content);
      posts.push(textPost);

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

    // 3. Return primary post (for notifications)
    const primaryPost = posts[0];
    logger.info(`\n✅ Publishing complete: ${posts.length} post(s) created`);

    return primaryPost;
  }
}

export const createVideoPublisher = (repo: IPostRepository) =>
  new VideoPublisher(repo);
