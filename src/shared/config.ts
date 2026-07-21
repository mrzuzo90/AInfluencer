import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

interface Config {
  env: 'development' | 'production';
  logLevel: string;
  anthropicApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  telegramBotToken: string;
  newsapiKey?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  twitterApiKey?: string;
  twitterApiSecret?: string;
  twitterBearerToken?: string;
}

function getConfig(): Config {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'production';
  const logLevel = process.env.LOG_LEVEL || 'debug';

  const requiredVars = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TELEGRAM_BOT_TOKEN'];

  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(', ')}. Check .env.example and create .env file.`
    );
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }

  return {
    env,
    logLevel,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    newsapiKey: process.env.NEWSAPI_KEY,
    redditClientId: process.env.REDDIT_CLIENT_ID,
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET,
    linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
    linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    twitterApiKey: process.env.TWITTER_API_KEY,
    twitterApiSecret: process.env.TWITTER_API_SECRET,
    twitterBearerToken: process.env.TWITTER_BEARER_TOKEN,
  };
}

export const config = getConfig();
export default config;
