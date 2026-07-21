export interface Article {
  id: string;
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
  content?: string;
  trendingScore: number;
  monetizationScore: number;
  finalScore: number;
  evaluatedAt: string;
}

export interface Post {
  id: string;
  articleId: string;
  platform: 'linkedin' | 'youtube' | 'tiktok' | 'instagram';
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt?: string;
  url?: string;
}

export interface AnalyticsEvent {
  id: string;
  postId: string;
  eventType: 'impression' | 'click' | 'share' | 'engagement';
  count: number;
  timestamp: string;
}
