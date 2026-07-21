import { logger } from '../shared/logger.js';
import { config } from '../shared/config.js';

export interface YouTubeVideoStats {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
}

let accessToken: string | null = null;
let tokenExpires = 0;

async function ensureAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpires) {
    return accessToken;
  }

  if (!config.hasYoutube) return null;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.youtubeClientId!,
        client_secret: config.youtubeClientSecret!,
        refresh_token: config.youtubeRefreshToken!,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      logger.warn(`YouTube analytics OAuth refresh failed: ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    accessToken = data.access_token;
    tokenExpires = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (err) {
    logger.warn(`YouTube analytics OAuth refresh error: ${err}`);
    return null;
  }
}

/** Extracts a YouTube video id from a shorts/watch URL, or null if it doesn't match. */
export function extractYouTubeVideoId(url: string): string | null {
  const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
  if (shortsMatch) return shortsMatch[1];
  const watchMatch = url.match(/[?&]v=([\w-]+)/);
  if (watchMatch) return watchMatch[1];
  return null;
}

/**
 * Fetches view/like/comment counts for a published YouTube video.
 * Returns null on any failure (no credentials, network error, video not
 * found) — callers treat this as "no fresh data available" rather than
 * a hard error.
 */
export async function fetchVideoStats(videoId: string): Promise<YouTubeVideoStats | null> {
  const token = await ensureAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      logger.warn(`YouTube stats fetch failed: ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as {
      items: Array<{ statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }>;
    };

    const stats = data.items[0]?.statistics;
    if (!stats) return null;

    return {
      videoId,
      views: parseInt(stats.viewCount || '0', 10),
      likes: parseInt(stats.likeCount || '0', 10),
      comments: parseInt(stats.commentCount || '0', 10),
    };
  } catch (err) {
    logger.warn(`YouTube stats fetch error: ${err}`);
    return null;
  }
}
