import api from "@/lib/axios";
import { Post } from "@/types/post";
import { User } from "@/types/user";

export type CreatePostPayload = {
  content: string;
  media?: Array<{ url: string; type: string; duration?: number }>;
  privacy?: "public" | "friends" | "private";
};


interface BackendPost {
  id: string;
  authorId: User; 
  content: string;
  privacy: string;
  media?: Array<{ url: string; type: string; duration?: number }>;
  likesCount: number;
  commentsCount: number;
  trendingScore: number;
  createdAt: Date;
  updatedAt?: Date;
}

const getFeed = async ({ pageParam = 1 }: { pageParam?: number }) => {
  const { data } = await api.get<BackendPost[]>("/posts/feed", { 
    params: { 
      page: pageParam, 
      limit: 10 
    } 
  });
  
  
  const posts: Post[] = data.map((post) => ({
    id: post.id,
    authorId: typeof post.authorId === 'object' ? post.authorId.id : post.authorId,
    author: post.authorId as User, 
    content: post.content,
    privacy: post.privacy,
    media: post.media,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    trendingScore: post.trendingScore,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));
  
  return {
    posts,
    hasMore: data.length === 10, 
    nextPage: pageParam + 1,
  };
};

const createPost = async (payload: CreatePostPayload) => {
  const { data } = await api.post<Post>("/posts", payload);
  return data;
};

const likePost = async (postId: string) => {
  const { data } = await api.post(`/posts/${postId}/like`);
  return data;
};

const unlikePost = async (postId: string) => {
  const { data } = await api.delete(`/posts/${postId}/like`);
  return data;
};

export const postService = { getFeed, createPost, likePost, unlikePost };
