import { config } from '../config.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { IArticleRepository } from './articleRepository.js';
import { IPostRepository } from './postRepository.js';
import { IAnalyticsRepository, InMemoryAnalyticsRepository } from './analyticsRepository.js';
import { InMemoryArticleRepository, InMemoryPostRepository } from './inMemoryRepository.js';
import {
  SupabaseArticleRepository,
  SupabasePostRepository,
  SupabaseAnalyticsRepository,
} from './supabaseRepository.js';

let articleRepo: IArticleRepository;
let postRepo: IPostRepository;
let analyticsRepo: IAnalyticsRepository;

if (config.hasSupabase && db) {
  logger.info('Using Supabase repositories');
  articleRepo = new SupabaseArticleRepository(db);
  postRepo = new SupabasePostRepository(db);
  analyticsRepo = new SupabaseAnalyticsRepository(db);
} else {
  logger.info('Using in-memory repositories (Supabase not configured)');
  articleRepo = new InMemoryArticleRepository();
  postRepo = new InMemoryPostRepository();
  analyticsRepo = new InMemoryAnalyticsRepository();
}

export { articleRepo, postRepo, analyticsRepo };
export default { articleRepo, postRepo, analyticsRepo };
