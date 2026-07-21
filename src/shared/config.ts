import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export interface Config {
  env: 'development' | 'production';
  logLevel: string;
  schedulerEnabled: boolean;
  publishLive: boolean;
  anthropicApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  telegramBotToken?: string;
  newsapiKey?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  // Flags para saber qué integraciones están disponibles
  hasAnthropicKey: boolean;
  hasSupabase: boolean;
  hasTelegram: boolean;
  hasNewsApi: boolean;
  hasLinkedin: boolean;
}

function getConfig(): Config {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'production';
  const logLevel = process.env.LOG_LEVEL || 'debug';
  const schedulerEnabled = process.env.SCHEDULER_ENABLED !== 'false';
  const publishLive = process.env.PUBLISH_LIVE === 'true';

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const newsapiKey = process.env.NEWSAPI_KEY;
  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
  const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  return {
    env,
    logLevel,
    schedulerEnabled,
    publishLive,
    anthropicApiKey,
    supabaseUrl,
    supabaseAnonKey,
    telegramBotToken,
    newsapiKey,
    linkedinClientId,
    linkedinClientSecret,
    hasAnthropicKey: !!anthropicApiKey,
    hasSupabase: !!(supabaseUrl && supabaseAnonKey),
    hasTelegram: !!telegramBotToken,
    hasNewsApi: !!newsapiKey,
    hasLinkedin: !!(linkedinClientId && linkedinClientSecret),
  };
}

export const config = getConfig();

if (process.env.NODE_ENV !== 'test') {
  logger.info(`Config loaded: env=${config.env}, scheduler=${config.schedulerEnabled}, live=${config.publishLive}`);
  logger.debug(
    `Available integrations: Anthropic=${config.hasAnthropicKey}, Supabase=${config.hasSupabase}, Telegram=${config.hasTelegram}, NewsAPI=${config.hasNewsApi}, LinkedIn=${config.hasLinkedin}`
  );
}

export default config;
