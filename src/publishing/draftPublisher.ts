import { Post, GeneratedContent } from '../shared/types.js';
import { logger } from '../shared/logger.js';
import { IPostRepository } from '../shared/repository/postRepository.js';
import { randomUUID } from 'crypto';

export interface IPublisher {
  publish(articleId: string, content: GeneratedContent): Promise<Post>;
}

/**
 * Draft publisher: saves posts to repository with draft status and logs them
 * Default mode until PUBLISH_LIVE=true
 */
export class DraftPublisher implements IPublisher {
  constructor(private postRepository: IPostRepository) {}

  async publish(articleId: string, content: GeneratedContent): Promise<Post> {
    const post: Post = {
      id: randomUUID(),
      articleId,
      platform: 'draft',
      content: content.linkedinPost || JSON.stringify(content),
      status: 'draft',
      hooks: content.hooks?.join(' | '),
      hashtags: content.hashtags?.join(' '),
      script: content.script,
    };

    await this.postRepository.save(post);

    logger.info('📝 Post saved as DRAFT:');
    logger.info(`   Platform: ${post.platform}`);
    logger.info(`   Content:\n${post.content}`);
    if (post.hooks) logger.info(`   Hooks: ${post.hooks}`);
    if (post.hashtags) logger.info(`   Hashtags: ${post.hashtags}`);
    logger.info('   ⚠️  Review before publishing to production');

    return post;
  }
}

/**
 * LinkedIn publisher: publishes to real LinkedIn API
 * Only used if PUBLISH_LIVE=true and credentials exist
 */
export class LinkedInPublisher implements IPublisher {
  constructor(private postRepository: IPostRepository) {}

  async publish(articleId: string, content: GeneratedContent): Promise<Post> {
    const post: Post = {
      id: randomUUID(),
      articleId,
      platform: 'linkedin',
      content: content.linkedinPost || '',
      status: 'scheduled',
    };

    // TODO: Implement actual LinkedIn API call
    // This requires OAuth and LinkedIn OAuth2 flow
    // For now, log as placeholder
    logger.warn('LinkedIn publishing not yet implemented (requires OAuth)');
    logger.info(`Would publish to LinkedIn:\n${content.linkedinPost}`);

    await this.postRepository.save(post);
    return post;
  }
}
