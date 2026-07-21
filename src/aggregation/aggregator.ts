import { Article } from '../shared/types.js';
import { logger } from '../shared/logger.js';
import { redditClient } from './redditClient.js';
import { newsApiClient } from './newsApiClient.js';
import { getSampleArticlesByCategory } from './sampleArticles.js';
import { randomUUID } from 'crypto';

export class NewsAggregator {
  private subredditMap: Record<string, string> = {
    technology: 'technology',
    business: 'business',
    finance: 'investing',
    general: 'news',
  };

  async aggregate(category: string = 'technology'): Promise<Article[]> {
    logger.info(`Aggregating news for category: ${category}`);

    const articles: Article[] = [];
    const seenUrls = new Set<string>();

    // Try Reddit (always works, public)
    try {
      const subreddit = this.subredditMap[category] || 'technology';
      const redditPosts = await redditClient.getTrending(subreddit, 10);
      for (const post of redditPosts) {
        if (seenUrls.has(post.url)) continue;
        if (post.url.includes('reddit.com')) continue; // Skip self posts

        const article: Article = {
          id: randomUUID(),
          title: post.title,
          description: `${post.score} upvotes, ${post.num_comments} comments on r/${post.subreddit}`,
          url: post.url,
          source: `Reddit r/${post.subreddit}`,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          content: post.selftext || post.title,
          category,
          trendingScore: 0,
          monetizationScore: 0,
          finalScore: 0,
          evaluatedAt: new Date().toISOString(),
        };

        articles.push(article);
        seenUrls.add(post.url);
      }

      logger.info(`✅ Fetched ${articles.length} articles from Reddit`);
    } catch (err) {
      logger.warn(`Reddit fetch failed: ${err}, will use sample articles`);
    }

    // Try NewsAPI (if configured)
    if (articles.length < 5) {
      try {
        const newsArticles = await newsApiClient.getTopHeadlines(category, 10);
        for (const newsArticle of newsArticles) {
          if (seenUrls.has(newsArticle.url)) continue;

          const article: Article = {
            id: randomUUID(),
            title: newsArticle.title,
            description: newsArticle.description,
            url: newsArticle.url,
            source: newsArticle.source.name,
            publishedAt: newsArticle.publishedAt,
            content: newsArticle.content,
            category,
            trendingScore: 0,
            monetizationScore: 0,
            finalScore: 0,
            evaluatedAt: new Date().toISOString(),
          };

          articles.push(article);
          seenUrls.add(newsArticle.url);
        }

        logger.info(`✅ Fetched ${newsArticles.length} articles from NewsAPI`);
      } catch (err) {
        logger.warn(`NewsAPI fetch failed: ${err}`);
      }
    }

    // Fallback to samples if no articles found
    if (articles.length === 0) {
      const samples = getSampleArticlesByCategory(category);
      articles.push(...samples);
      logger.info(`📦 Using ${samples.length} sample articles as fallback`);
    }

    return articles;
  }
}

export const newsAggregator = new NewsAggregator();
export default newsAggregator;
