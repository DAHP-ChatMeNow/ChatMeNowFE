import { User } from './user';

export interface PostMedia {
  url: string;
  type: string;
  duration?: number;
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  privacy: string;
  media?: PostMedia[];
  likesCount: number;
  commentsCount: number;
  trendingScore: number;
  createdAt: Date;
  updatedAt?: Date;
}
