import { Article } from '../shared/types.js';

/**
 * Calculate trending score based on CLAUDE.md formula:
 * TRENDING_SCORE = (
 *   (mentions_last_24h / max_mentions) × 0.4 +
 *   (search_volume_spike / baseline) × 0.4 +
 *   (recency_hours < 12 ? 1 : 0.5) × 0.2
 * ) × 100
 *
 * Using Reddit engagement as proxy for mentions (upvotes + comments normalized)
 */
export function calculateTrendingScore(article: Article): number {
  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);

  // Extract engagement from description (Reddit format: "score upvotes, comments")
  let mentions = 0;
  const match = article.description.match(/(\d+)\s+upvotes.*?(\d+)\s+comments/);
  if (match) {
    mentions = parseInt(match[1]) + parseInt(match[2]);
  }

  // Normalize to 0-1 (assume max ~5000 for high-engagement Reddit post)
  const maxMentions = 5000;
  const mentionsNormalized = Math.min(mentions / maxMentions, 1);

  // Recency: full points if < 12 hours, half if older
  const recencyFactor = ageHours < 12 ? 1 : 0.5;

  // Search volume spike: approximate with engagement intensity (mentions/age in hours)
  const engagementVelocity = mentions / Math.max(ageHours, 0.1);
  const velocityNormalized = Math.min(engagementVelocity / 100, 1); // Assume 100+ per hour is peak

  const trendingScore = (mentionsNormalized * 0.4 + velocityNormalized * 0.4 + recencyFactor * 0.2) * 100;

  return Math.round(trendingScore);
}
