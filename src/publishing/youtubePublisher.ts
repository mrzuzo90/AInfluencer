import { readFile, stat } from 'node:fs/promises';
import { logger } from '../shared/logger.js';
import { Post, GeneratedContent } from '../shared/types.js';
import { IPostRepository } from '../shared/repository/postRepository.js';
import { randomUUID } from 'crypto';
import { config } from '../shared/config.js';
import { CompiledVideo } from '../video/videoAssembler.js';

const YOUTUBE_UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

/**
 * YouTube Shorts Publisher
 * Publishes 15-30s vertical videos to YouTube Shorts
 * Requires: YOUTUBE_REFRESH_TOKEN (OAuth credential)
 *
 * Note: doesn't implement IPublisher — always needs a CompiledVideo,
 * unlike text-only publishers. Only called via publishVideo().
 */
export class YouTubePublisher {
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

  async publishVideo(
    articleId: string,
    content: GeneratedContent,
    video: CompiledVideo
  ): Promise<Post> {
    logger.info('📹 Publishing video to YouTube Shorts...');

    if (!this.refreshToken) {
      logger.warn('YouTube credentials not configured');
      return this.publishAsPlaceholder(articleId, content, video);
    }

    if (!video.filePath) {
      logger.warn(
        '⚠️  No rendered video file (ffmpeg or stock footage unavailable) — cannot upload, saving as scheduled placeholder instead'
      );
      return this.publishAsPlaceholder(articleId, content, video);
    }

    try {
      await this.ensureAccessToken();
      const videoId = await this.uploadVideo(content, video);

      const post: Post = {
        id: randomUUID(),
        articleId,
        platform: 'youtube',
        content: content.linkedinPost || '',
        status: 'published',
        url: `https://youtube.com/shorts/${videoId}`,
        hooks: content.hooks?.join(' | '),
        hashtags: content.hashtags?.join(' '),
        script: video.metadata.script,
      };

      logger.info(`✅ Video uploaded to YouTube: ${post.url}`);

      await this.postRepository.save(post);
      return post;
    } catch (err) {
      logger.error(`Video publishing failed: ${err}`);
      throw err;
    }
  }

  private async uploadVideo(content: GeneratedContent, video: CompiledVideo): Promise<string> {
    if (!video.filePath) {
      throw new Error('uploadVideo called without a rendered video file');
    }

    const fileBuffer = await readFile(video.filePath);
    const { size } = await stat(video.filePath);

    const title = (content.title || video.title || 'Untitled').slice(0, 100);
    const description = [content.linkedinPost, content.hashtags?.join(' ')]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 5000);
    const tags = (content.hashtags || []).map((tag) => tag.replace(/^#/, '')).slice(0, 15);

    // 1. Initiate a resumable upload session.
    const initResponse = await fetch(YOUTUBE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': size.toString(),
      },
      body: JSON.stringify({
        snippet: { title, description, tags },
        status: {
          privacyStatus: config.youtubePrivacyStatus,
          selfDeclaredMadeForKids: false,
        },
      }),
    });

    if (!initResponse.ok) {
      throw new Error(
        `YouTube upload init failed: ${initResponse.status} ${await initResponse.text()}`
      );
    }

    const uploadUrl = initResponse.headers.get('location');
    if (!uploadUrl) {
      throw new Error('YouTube did not return a resumable upload URL');
    }

    // 2. Upload the video bytes to the session URL.
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': size.toString(),
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `YouTube upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`
      );
    }

    const result = (await uploadResponse.json()) as { id: string };
    return result.id;
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
    content: GeneratedContent,
    video?: CompiledVideo
  ): Promise<Post> {
    const post: Post = {
      id: randomUUID(),
      articleId,
      platform: 'youtube',
      content: content.linkedinPost || '',
      status: 'draft',
      hooks: content.hooks?.join(' | '),
      hashtags: content.hashtags?.join(' '),
      script: video?.metadata.script ?? content.script,
    };

    await this.postRepository.save(post);
    return post;
  }
}
