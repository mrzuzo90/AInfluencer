import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { logger } from './logger.js';

let db: SupabaseClient | null = null;

if (config.hasSupabase) {
  db = createClient(config.supabaseUrl!, config.supabaseAnonKey!);
  logger.info('✅ Supabase client initialized');
} else {
  logger.warn('⚠️ Supabase not configured (SUPABASE_URL/ANON_KEY missing) — using in-memory storage');
}

export { db };
export default db;
