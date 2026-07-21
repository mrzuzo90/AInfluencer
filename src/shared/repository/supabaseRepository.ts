import { SupabaseClient } from '@supabase/supabase-js';
import { Article, Post } from '../types.js';
import { IArticleRepository } from './articleRepository.js';
import { IPostRepository } from './postRepository.js';
import {
  IAnalyticsRepository,
  PostMetrics,
  AnalyticsRecord,
  computeDailyRecord,
} from './analyticsRepository.js';
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

interface PostMetricsRow {
  post_id: string;
  platform: string;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  engagement_rate: number;
  created_at: string;
  updated_at: string;
}

function rowToPostMetrics(row: PostMetricsRow): PostMetrics {
  return {
    postId: row.post_id,
    platform: row.platform,
    impressions: row.impressions,
    clicks: row.clicks,
    shares: row.shares,
    comments: row.comments,
    engagementRate: row.engagement_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  constructor(private db: SupabaseClient) {}

  async saveMetrics(metrics: PostMetrics): Promise<void> {
    const { error } = await this.db.from('post_metrics').upsert({
      post_id: metrics.postId,
      platform: metrics.platform,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      shares: metrics.shares,
      comments: metrics.comments,
      engagement_rate: metrics.engagementRate,
      created_at: metrics.createdAt,
      updated_at: metrics.updatedAt,
    });
    if (error) {
      logger.error(`Error saving post metrics: ${error.message}`);
      throw error;
    }
  }

  async getMetrics(postId: string): Promise<PostMetrics | null> {
    const { data, error } = await this.db
      .from('post_metrics')
      .select('*')
      .eq('post_id', postId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error(`Error finding post metrics: ${error.message}`);
      return null;
    }
    return rowToPostMetrics(data);
  }

  async getTodaysAnalytics(): Promise<AnalyticsRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAnalyticsForDate(today);
  }

  async getWeeklyAnalytics(): Promise<AnalyticsRecord[]> {
    const now = new Date();
    const records: AnalyticsRecord[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = await this.getAnalyticsForDate(dateStr);
      if (record) records.push(record);
    }

    return records;
  }

  private async getAnalyticsForDate(date: string): Promise<AnalyticsRecord | null> {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data, error } = await this.db
      .from('post_metrics')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (error) {
      logger.error(`Error fetching post metrics for ${date}: ${error.message}`);
      return null;
    }

    const postsForDate = (data || []).map(rowToPostMetrics);
    return computeDailyRecord(date, postsForDate);
  }
}
