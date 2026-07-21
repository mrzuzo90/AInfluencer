import { Post } from '../types.js';

export interface IPostRepository {
  save(post: Post): Promise<Post>;
  findAll(): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
  findByArticleId(articleId: string): Promise<Post[]>;
  updateStatus(id: string, status: Post['status']): Promise<void>;
  delete(id: string): Promise<void>;
}
