import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';

export interface StockClip {
  url: string;
  durationSeconds: number;
  source: string;
  width: number;
  height: number;
}

export interface IStockFootageProvider {
  fetchClips(keywords: string[], count: number): Promise<StockClip[]>;
}

/**
 * Pexels Video API — free tier, no attribution required for most uses.
 * https://www.pexels.com/api/documentation/#videos-search
 */
class PexelsFootageProvider implements IStockFootageProvider {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/videos/search';

  constructor() {
    this.apiKey = config.pexelsApiKey || '';
  }

  async fetchClips(keywords: string[], count: number): Promise<StockClip[]> {
    const query = keywords.filter(Boolean).slice(0, 3).join(' ') || 'technology';

    try {
      const response = await fetch(
        `${this.baseUrl}?query=${encodeURIComponent(query)}&orientation=portrait&per_page=${count}`,
        { headers: { Authorization: this.apiKey } }
      );

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        videos: Array<{
          duration: number;
          video_files: Array<{ link: string; width: number; height: number; quality: string }>;
        }>;
      };

      return data.videos.slice(0, count).map((video) => {
        // Prefer a portrait HD file close to Shorts resolution (1080x1920);
        // fall back to whatever file Pexels returns first.
        const file =
          video.video_files.find((f) => f.height >= f.width && f.quality === 'hd') ||
          video.video_files[0];

        return {
          url: file.link,
          durationSeconds: video.duration,
          source: 'pexels',
          width: file.width,
          height: file.height,
        };
      });
    } catch (err) {
      logger.error(`Pexels footage fetch failed: ${err}`);
      return [];
    }
  }
}

/**
 * Fallback when PEXELS_API_KEY isn't configured: no real clips, caller
 * falls back to an audio-only video (solid background) rather than failing.
 */
class PlaceholderFootageProvider implements IStockFootageProvider {
  async fetchClips(): Promise<StockClip[]> {
    logger.info('🖼️  (Placeholder) No stock footage provider configured — video will use a solid background');
    return [];
  }
}

export class StockFootageProvider {
  private provider: IStockFootageProvider;

  constructor() {
    this.provider = config.hasPexels
      ? new PexelsFootageProvider()
      : new PlaceholderFootageProvider();
  }

  async fetchClips(keywords: string[], count = 3): Promise<StockClip[]> {
    logger.info(`🎞️  Fetching ${count} stock clip(s) for: ${keywords.join(', ')}`);
    return this.provider.fetchClips(keywords, count);
  }
}

export const stockFootageProvider = new StockFootageProvider();
