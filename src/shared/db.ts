import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { logger } from './logger.js';

export const db = createClient(config.supabaseUrl, config.supabaseAnonKey);

logger.info('Supabase client initialized');

export default db;
