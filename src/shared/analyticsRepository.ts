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
    this.recomputeDailyRecord(metrics.createdAt.split('T')[0]);
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

  private recomputeDailyRecord(date: string): void {
    const postsForDate = Array.from(this.metrics.values()).filter(
      (m) => m.createdAt.split('T')[0] === date
    );

    if (postsForDate.length === 0) return;

    const totalImpressions = postsForDate.reduce((sum, m) => sum + m.impressions, 0);
    const totalEngagement = postsForDate.reduce(
      (sum, m) => sum + m.clicks + m.shares + m.comments,
      0
    );
    const avgEngagementRate =
      postsForDate.reduce((sum, m) => sum + m.engagementRate, 0) / postsForDate.length;
    const topPost = postsForDate.reduce((top, m) =>
      !top || m.engagementRate > top.engagementRate ? m : top
    , null as PostMetrics | null);

    this.dailyRecords.set(date, {
      date,
      topicId: '',
      totalPosts: postsForDate.length,
      totalImpressions,
      totalEngagement,
      avgEngagementRate,
      topPost,
    });
  }
}

export const analyticsRepository = new InMemoryAnalyticsRepository();
