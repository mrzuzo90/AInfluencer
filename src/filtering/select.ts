import { Article } from '../shared/types.js';
import { logger } from '../shared/logger.js';
import { calculateTrendingScore } from './trendingScore.js';
import { HeuristicMonetizationScorer, ClaudeMonetizationScorer } from './monetizationScorer.js';
import { getTodaysTopic, getTopicEmoji } from './topicRotation.js';
import { config } from '../shared/config.js';

export class ArticleSelector {
  private monetizationScorer = config.hasAnthropicKey ? new ClaudeMonetizationScorer() : new HeuristicMonetizationScorer();

  async selectTopArticle(articles: Article[]): Promise<Article | null> {
    if (articles.length === 0) {
      logger.warn('No articles to select from');
      return null;
    }

    const topic = getTodaysTopic();
    logger.info(`📅 Today's topic: ${getTopicEmoji(topic)} ${topic}`);

    // Score all articles
    for (const article of articles) {
      article.trendingScore = calculateTrendingScore(article);
      article.monetizationScore = await this.monetizationScorer.score(article);
      article.finalScore = article.trendingScore * 0.4 + article.monetizationScore * 0.6;
      article.evaluatedAt = new Date().toISOString();

      logger.debug(`Article: "${article.title.substring(0, 50)}..."`);
      logger.debug(`  Trending: ${article.trendingScore}, Monetization: ${article.monetizationScore}, Final: ${article.finalScore}`);
    }

    // Filter by category (topic) and select top 1
    const topicMatches = articles.filter((a) => a.category === topic || !a.category);
    const candidates = topicMatches.length > 0 ? topicMatches : articles;

    const selected = candidates.reduce((best, current) => (current.finalScore > best.finalScore ? current : best));

    logger.info(`✅ Selected: "${selected.title}"`);
    logger.info(`   Scores: Trending=${selected.trendingScore}, Monetization=${selected.monetizationScore}, Final=${selected.finalScore}`);

    return selected;
  }
}

export const articleSelector = new ArticleSelector();
export default articleSelector;
