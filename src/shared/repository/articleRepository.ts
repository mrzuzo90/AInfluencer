import { Article } from '../types.js';

export interface IArticleRepository {
  save(article: Article): Promise<void>;
  findAll(): Promise<Article[]>;
  findById(id: string): Promise<Article | null>;
  findByUrl(url: string): Promise<Article | null>;
  delete(id: string): Promise<void>;
}
