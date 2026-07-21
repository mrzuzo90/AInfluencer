import { config } from '../shared/config.js';
import { logger } from '../shared/logger.js';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
  source: { id: string; name: string };
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

export class NewsApiClient {
  private baseUrl = 'https://newsapi.org/v2';

  async getTopHeadlines(category: string = 'technology', limit: number = 20): Promise<NewsArticle[]> {
    if (!config.hasNewsApi) {
      logger.debug('NewsAPI key not configured, skipping');
      return [];
    }

    try {
      const url = `${this.baseUrl}/top-headlines?category=${category}&language=en&limit=${limit}&apiKey=${config.newsapiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`NewsAPI error: ${response.status}`);
        return [];
      }

      const data = (await response.json()) as NewsResponse;
      return data.articles;
    } catch (err) {
      logger.error(`Error fetching NewsAPI: ${err}`);
      return [];
    }
  }

  async search(query: string, limit: number = 20): Promise<NewsArticle[]> {
    if (!config.hasNewsApi) {
      logger.debug('NewsAPI key not configured, skipping');
      return [];
    }

    try {
      const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${limit}&apiKey=${config.newsapiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`NewsAPI error: ${response.status}`);
        return [];
      }

      const data = (await response.json()) as NewsResponse;
      return data.articles;
    } catch (err) {
      logger.error(`Error searching NewsAPI: ${err}`);
      return [];
    }
  }
}

export const newsApiClient = new NewsApiClient();
export default newsApiClient;
