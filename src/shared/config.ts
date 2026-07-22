import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export interface Config {
  env: 'development' | 'production';
  logLevel: string;
  schedulerEnabled: boolean;
  dashboardEnabled: boolean;
  dashboardPort: number;
  publishLive: boolean;
  publishVideo: boolean;
  hybridRatio: number;
  hybridEnabled: boolean;
  // Phase 1 & 0
  anthropicApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  telegramBotToken?: string;
  telegramChatId?: number;
  newsapiKey?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  // Phase 2 (Video)
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  youtubeClientId?: string;
  youtubeClientSecret?: string;
  youtubeRefreshToken?: string;
  pexelsApiKey?: string;
  videoWatermarkText: string;
  videoOutputDir: string;
  youtubePrivacyStatus: 'public' | 'unlisted' | 'private';
  // Integration flags
  hasAnthropicKey: boolean;
  hasSupabase: boolean;
  hasTelegram: boolean;
  hasNewsApi: boolean;
  hasLinkedin: boolean;
  hasElevenLabs: boolean;
  hasYoutube: boolean;
  hasPexels: boolean;
}

function getConfig(): Config {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'production';
  const logLevel = process.env.LOG_LEVEL || 'debug';
  const schedulerEnabled = process.env.SCHEDULER_ENABLED !== 'false';
  const dashboardEnabled = process.env.DASHBOARD_ENABLED !== 'false';
  const dashboardPort = parseInt(process.env.PORT || process.env.DASHBOARD_PORT || '3000', 10);
  const publishLive = process.env.PUBLISH_LIVE === 'true';
  const publishVideo = process.env.PUBLISH_VIDEO === 'true';
  const hybridRatio = parseInt(process.env.HYBRID_RATIO || '5', 10);
  const hybridEnabled = process.env.HYBRID_ENABLED !== 'false';

  // Phase 0-1
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID
    ? parseInt(process.env.TELEGRAM_CHAT_ID, 10)
    : undefined;
  const newsapiKey = process.env.NEWSAPI_KEY;
  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
  const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  // Phase 2 (Video)
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;
  const youtubeClientId = process.env.YOUTUBE_CLIENT_ID;
  const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const youtubeRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const pexelsApiKey = process.env.PEXELS_API_KEY;
  const videoWatermarkText = process.env.VIDEO_WATERMARK_TEXT || 'AInfluencer';
  const videoOutputDir = process.env.VIDEO_OUTPUT_DIR || './output';
  const youtubePrivacyStatus = (process.env.YOUTUBE_PRIVACY_STATUS || 'unlisted') as
    | 'public'
    | 'unlisted'
    | 'private';

  return {
    env,
    logLevel,
    schedulerEnabled,
    dashboardEnabled,
    dashboardPort,
    publishLive,
    publishVideo,
    hybridRatio,
    hybridEnabled,
    anthropicApiKey,
    supabaseUrl,
    supabaseAnonKey,
    telegramBotToken,
    telegramChatId,
    newsapiKey,
    linkedinClientId,
    linkedinClientSecret,
    elevenLabsApiKey,
    elevenLabsVoiceId,
    youtubeClientId,
    youtubeClientSecret,
    youtubeRefreshToken,
    pexelsApiKey,
    videoWatermarkText,
    videoOutputDir,
    youtubePrivacyStatus,
    hasAnthropicKey: !!anthropicApiKey,
    hasSupabase: !!(supabaseUrl && supabaseAnonKey),
    hasTelegram: !!telegramBotToken,
    hasNewsApi: !!newsapiKey,
    hasLinkedin: !!(linkedinClientId && linkedinClientSecret),
    hasElevenLabs: !!elevenLabsApiKey,
    hasYoutube: !!(youtubeClientId && youtubeClientSecret && youtubeRefreshToken),
    hasPexels: !!pexelsApiKey,
  };
}

export const config = getConfig();

if (process.env.NODE_ENV !== 'test') {
  logger.info(`Config loaded: env=${config.env}, scheduler=${config.schedulerEnabled}, live=${config.publishLive}, video=${config.publishVideo}`);
  logger.debug(
    `Phase 0-1: Anthropic=${config.hasAnthropicKey}, Supabase=${config.hasSupabase}, Telegram=${config.hasTelegram}, NewsAPI=${config.hasNewsApi}, LinkedIn=${config.hasLinkedin}`
  );
  logger.debug(
    `Phase 2+: ElevenLabs=${config.hasElevenLabs}, YouTube=${config.hasYoutube}, Hybrid=${config.hybridEnabled} (ratio=${config.hybridRatio})`
  );
}

export default config;
