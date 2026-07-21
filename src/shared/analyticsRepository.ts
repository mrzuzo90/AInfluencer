import { logger } from './logger.js';

export interface PostMetrics {
  postId: string;
  platform: string;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  engagementRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsRecord {
  date: string;
  topicId: string;
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPost: PostMetrics | null;
}

export interface IAnalyticsRepository {
  saveMetrics(metrics: PostMetrics): Promise<void>;
  getMetrics(postId: string): Promise<PostMetrics | null>;
  getTodaysAnalytics(): Promise<AnalyticsRecord | null>;
  getWeeklyAnalytics(): Promise<AnalyticsRecord[]>;
}

/**
 * In-memory analytics repository (Phase 3 placeholder)
 * Swap with Supabase analytics table when ready
 */
export class InMemoryAnalyticsRepository implements IAnalyticsRepository {
  private metrics: Map<string, PostMetrics> = new Map();
  private dailyRecords: Map<string, AnalyticsRecord> = new Map();

  async saveMetrics(metrics: PostMetrics): Promise<void> {
    this.metrics.set(metrics.postId, metrics);
    logger.info(`📊 Saved metrics for post ${metrics.postId}`);
  }

  async getMetrics(postId: string): Promise<PostMetrics | null> {
    return this.metrics.get(postId) || null;
  }

  async getTodaysAnalytics(): Promise<AnalyticsRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyRecords.get(today) || null;
  }

  async getWeeklyAnalytics(): Promise<AnalyticsRecord[]> {
    const now = new Date();
    const records: AnalyticsRecord[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = this.dailyRecords.get(dateStr);
      if (record) records.push(record);
    }

    return records;
  }

  updateDailyRecord(record: AnalyticsRecord): void {
    this.dailyRecords.set(record.date, record);
  }
}

export const analyticsRepository = new InMemoryAnalyticsRepository();
