import { SupabaseClient } from '@supabase/supabase-js';
import { Article, Post } from '../types.js';
import { IArticleRepository } from './articleRepository.js';
import { IPostRepository } from './postRepository.js';
import { logger } from '../logger.js';

export class SupabaseArticleRepository implements IArticleRepository {
  constructor(private db: SupabaseClient) {}

  async save(article: Article): Promise<void> {
    const { error } = await this.db.from('articles').upsert(article);
    if (error) {
      logger.error(`Error saving article: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<Article[]> {
    const { data, error } = await this.db.from('articles').select('*');
    if (error) {
      logger.error(`Error fetching articles: ${error.message}`);
      return [];
    }
    return data || [];
  }

  async findById(id: string): Promise<Article | null> {
    const { data, error } = await this.db.from('articles').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error(`Error finding article: ${error.message}`);
      throw error;
    }
    return data;
  }

  async findByUrl(url: string): Promise<Article | null> {
    const { data, error } = await this.db.from('articles').select('*').eq('url', url).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error(`Error finding article by URL: ${error.message}`);
      return null;
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('articles').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting article: ${error.message}`);
      throw error;
    }
  }
}

export class SupabasePostRepository implements IPostRepository {
  constructor(private db: SupabaseClient) {}

  async save(post: Post): Promise<Post> {
    const { data, error } = await this.db.from('posts').upsert(post).select().single();
    if (error) {
      logger.error(`Error saving post: ${error.message}`);
      throw error;
    }
    return data;
  }

  async findAll(): Promise<Post[]> {
    const { data, error } = await this.db.from('posts').select('*');
    if (error) {
      logger.error(`Error fetching posts: ${error.message}`);
      return [];
    }
    return data || [];
  }

  async findById(id: string): Promise<Post | null> {
    const { data, error } = await this.db.from('posts').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error(`Error finding post: ${error.message}`);
      throw error;
    }
    return data;
  }

  async findByArticleId(articleId: string): Promise<Post[]> {
    const { data, error } = await this.db.from('posts').select('*').eq('article_id', articleId);
    if (error) {
      logger.error(`Error finding posts by article: ${error.message}`);
      return [];
    }
    return data || [];
  }

  async updateStatus(id: string, status: Post['status']): Promise<void> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }
    const { error } = await this.db.from('posts').update(updateData).eq('id', id);
    if (error) {
      logger.error(`Error updating post status: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('posts').delete().eq('id', id);
    if (error) {
      logger.error(`Error deleting post: ${error.message}`);
      throw error;
    }
  }
}
