import { logger } from '../shared/logger.js';

interface RedditPost {
  title: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  selftext: string;
}

interface RedditResponse {
  data: {
    children: Array<{ data: RedditPost }>;
  };
}

export class RedditClient {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 AInfluencer/1.0';

  async getTrending(subreddit: string = 'technology', limit: number = 10): Promise<RedditPost[]> {
    try {
      const url = `${this.baseUrl}/r/${subreddit}/top.json?t=day&limit=${limit}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        // Avoid rate-limit: use cache and backoff if needed
      });

      if (!response.ok) {
        logger.warn(`Reddit API error: ${response.status}`);
        return [];
      }

      const data: RedditResponse = await response.json();
      return data.data.children.map((c) => c.data);
    } catch (err) {
      logger.error(`Error fetching Reddit: ${err}`);
      return [];
    }
  }
}

export const redditClient = new RedditClient();
export default redditClient;
