import { logger } from '../shared/logger.js';
import { Post, GeneratedContent } from '../shared/types.js';
import { IPostRepository } from '../shared/repository/postRepository.js';
import { IPublisher } from './draftPublisher.js';
import { randomUUID } from 'crypto';
import { config } from '../shared/config.js';
import { CompiledVideo } from '../video/videoAssembler.js';

/**
 * YouTube Shorts Publisher
 * Publishes 15-30s vertical videos to YouTube Shorts
 * Requires: YOUTUBE_REFRESH_TOKEN (OAuth credential)
 */
export class YouTubePublisher implements IPublisher {
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpires: number = 0;

  constructor(private postRepository: IPostRepository) {
    this.refreshToken = config.youtubeRefreshToken || '';
    this.clientId = config.youtubeClientId || '';
    this.clientSecret = config.youtubeClientSecret || '';
  }

  async publish(articleId: string, content: GeneratedContent): Promise<Post> {
    logger.info('📹 YouTube Shorts Publisher initialized');

    if (!this.refreshToken) {
      logger.warn(
        '⚠️  YOUTUBE_REFRESH_TOKEN not configured. YouTube publishing disabled.'
      );
      return this.publishAsPlaceholder(articleId, content);
    }

    try {
      // Ensure access token is valid
      await this.ensureAccessToken();

      const post: Post = {
        id: randomUUID(),
        articleId,
        platform: 'youtube',
        content: content.linkedinPost || '',
        status: 'scheduled',
        hooks: content.hooks?.join(' | '),
        hashtags: content.hashtags?.join(' '),
        script: content.script,
      };

      // TODO: Implement actual YouTube Shorts upload
      // This requires:
      // 1. Initialize: https://www.googleapis.com/youtube/v3/videos
      // 2. Upload resumable: multipart upload with video binary
      // 3. Set: title, description, tags, thumbnail
      // 4. Publish: change privacy to PUBLIC

      logger.info('📹 YouTube Shorts placeholder (API integration pending)');
      logger.info(`   Title: ${content.title || '(untitled)'}`);
      logger.info(`   Description: ${content.linkedinPost}`);
      logger.info('   ⚠️  Requires OAuth setup + video file upload');

      await this.postRepository.save(post);
      return post;
    } catch (err) {
      logger.error(`YouTube publishing failed: ${err}`);
      throw err;
    }
  }

  async publishVideo(
    articleId: string,
    content: GeneratedContent,
    video: CompiledVideo
  ): Promise<Post> {
    logger.info('📹 Publishing video to YouTube Shorts...');

    if (!this.refreshToken) {
      logger.warn('YouTube credentials not configured');
      return this.publishAsPlaceholder(articleId, content);
    }

    try {
      await this.ensureAccessToken();

      // Video upload would go here
      const post: Post = {
        id: randomUUID(),
        articleId,
        platform: 'youtube',
        content: content.linkedinPost || '',
        status: 'published',
        hooks: content.hooks?.join(' | '),
        hashtags: content.hashtags?.join(' '),
        script: video.metadata.script,
      };

      logger.info(`✅ Video published to YouTube (placeholder)`);
      logger.info(`   Video ID: ${video.id}`);
      logger.info(`   Duration: ${video.duration}ms`);

      await this.postRepository.save(post);
      return post;
    } catch (err) {
      logger.error(`Video publishing failed: ${err}`);
      throw err;
    }
  }

  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpires) {
      return;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`OAuth error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
      };
      this.accessToken = data.access_token;
      this.tokenExpires = Date.now() + (data.expires_in - 60) * 1000;

      logger.info('🔑 YouTube OAuth token refreshed');
    } catch (err) {
      logger.error(`OAuth refresh failed: ${err}`);
      throw err;
    }
  }

  private async publishAsPlaceholder(
    articleId: string,
    content: GeneratedContent
  ): Promise<Post> {
    const post: Post = {
      id: randomUUID(),
      articleId,
      platform: 'youtube',
      content: content.linkedinPost || '',
      status: 'draft',
      hooks: content.hooks?.join(' | '),
      hashtags: content.hashtags?.join(' '),
      script: content.script,
    };

    await this.postRepository.save(post);
    return post;
  }
}
