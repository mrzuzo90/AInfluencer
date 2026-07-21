import { Article, Post } from '../types.js';
import { IArticleRepository } from './articleRepository.js';
import { IPostRepository } from './postRepository.js';

export class InMemoryArticleRepository implements IArticleRepository {
  private articles = new Map<string, Article>();

  async save(article: Article): Promise<void> {
    this.articles.set(article.id, article);
  }

  async findAll(): Promise<Article[]> {
    return Array.from(this.articles.values());
  }

  async findById(id: string): Promise<Article | null> {
    return this.articles.get(id) || null;
  }

  async findByUrl(url: string): Promise<Article | null> {
    for (const article of this.articles.values()) {
      if (article.url === url) return article;
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    this.articles.delete(id);
  }
}

export class InMemoryPostRepository implements IPostRepository {
  private posts = new Map<string, Post>();

  async save(post: Post): Promise<Post> {
    this.posts.set(post.id, post);
    return post;
  }

  async findAll(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async findById(id: string): Promise<Post | null> {
    return this.posts.get(id) || null;
  }

  async findByArticleId(articleId: string): Promise<Post[]> {
    return Array.from(this.posts.values()).filter((p) => p.articleId === articleId);
  }

  async updateStatus(id: string, status: Post['status']): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.status = status;
      if (status === 'published') {
        post.publishedAt = new Date().toISOString();
      }
    }
  }

  async delete(id: string): Promise<void> {
    this.posts.delete(id);
  }
}
