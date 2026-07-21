import { config } from '../config.js';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { IArticleRepository } from './articleRepository.js';
import { IPostRepository } from './postRepository.js';
import { InMemoryArticleRepository, InMemoryPostRepository } from './inMemoryRepository.js';
import { SupabaseArticleRepository, SupabasePostRepository } from './supabaseRepository.js';

let articleRepo: IArticleRepository;
let postRepo: IPostRepository;

if (config.hasSupabase && db) {
  logger.info('Using Supabase repositories');
  articleRepo = new SupabaseArticleRepository(db);
  postRepo = new SupabasePostRepository(db);
} else {
  logger.info('Using in-memory repositories (Supabase not configured)');
  articleRepo = new InMemoryArticleRepository();
  postRepo = new InMemoryPostRepository();
}

export { articleRepo, postRepo };
export default { articleRepo, postRepo };
