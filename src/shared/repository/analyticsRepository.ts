import { logger } from '../logger.js';

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
 * Shared rollup logic so in-memory and Supabase-backed repositories compute
 * the same AnalyticsRecord shape from a flat list of PostMetrics for a day.
 */
export function computeDailyRecord(
  date: string,
  postsForDate: PostMetrics[]
): AnalyticsRecord | null {
  if (postsForDate.length === 0) return null;

  const totalImpressions = postsForDate.reduce((sum, m) => sum + m.impressions, 0);
  const totalEngagement = postsForDate.reduce(
    (sum, m) => sum + m.clicks + m.shares + m.comments,
    0
  );
  const avgEngagementRate =
    postsForDate.reduce((sum, m) => sum + m.engagementRate, 0) / postsForDate.length;
  const topPost = postsForDate.reduce(
    (top, m) => (!top || m.engagementRate > top.engagementRate ? m : top),
    null as PostMetrics | null
  );

  return {
    date,
    topicId: '',
    totalPosts: postsForDate.length,
    totalImpressions,
    totalEngagement,
    avgEngagementRate,
    topPost,
  };
}

/**
 * In-memory analytics repository. Used when Supabase isn't configured;
 * metrics are lost on process restart.
 */
export class InMemoryAnalyticsRepository implements IAnalyticsRepository {
  private metrics: Map<string, PostMetrics> = new Map();

  async saveMetrics(metrics: PostMetrics): Promise<void> {
    this.metrics.set(metrics.postId, metrics);
    logger.info(`📊 Saved metrics for post ${metrics.postId}`);
  }

  async getMetrics(postId: string): Promise<PostMetrics | null> {
    return this.metrics.get(postId) || null;
  }

  async getTodaysAnalytics(): Promise<AnalyticsRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    const postsForDate = Array.from(this.metrics.values()).filter(
      (m) => m.createdAt.split('T')[0] === today
    );
    return computeDailyRecord(today, postsForDate);
  }

  async getWeeklyAnalytics(): Promise<AnalyticsRecord[]> {
    const now = new Date();
    const records: AnalyticsRecord[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const postsForDate = Array.from(this.metrics.values()).filter(
        (m) => m.createdAt.split('T')[0] === dateStr
      );
      const record = computeDailyRecord(dateStr, postsForDate);
      if (record) records.push(record);
    }

    return records;
  }
}
