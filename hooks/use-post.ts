"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { postService, CreatePostPayload } from "@/api/post";
import { Post } from "@/types/post";
import { Comment } from "@/types/comment";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: ["posts", "feed"],
    queryFn: ({ pageParam }) => postService.getFeed({ pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1, // Start from page 1
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: (newPost) => {
      queryClient.setQueryData(["posts", "feed"], (oldData: any) => {
        if (!oldData) {
          return {
            pages: [{ posts: [newPost], hasMore: false }],
            pageParams: [""],
          };
        }

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          posts: [newPost, ...newPages[0].posts],
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });

      toast.success("Đã đăng bài thành công");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể đăng bài");
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();

  const updatePostLikeState = (
    queryKey: unknown[],
    postId: string,
    isLiked: boolean,
  ) => {
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page: any) => ({
        ...page,
        posts: page.posts.map((post: Post) => {
          if (post.id !== postId) return post;

          const nextLikesCount = isLiked
            ? (post.likesCount || 0) + 1
            : Math.max((post.likesCount || 0) - 1, 0);

          return {
            ...post,
            likesCount: nextLikesCount,
            isLikedByCurrentUser: isLiked,
          };
        }),
      }));

      return {
        ...oldData,
        pages: newPages,
      };
    });
  };

  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      return isLiked
        ? postService.unlikePost(postId)
        : postService.likePost(postId);
    },
    onMutate: async ({ postId, isLiked }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["posts", "feed"] }),
        queryClient.cancelQueries({ queryKey: ["posts", "me"] }),
      ]);

      const previousFeedData = queryClient.getQueryData(["posts", "feed"]);
      const previousMyPostsData = queryClient.getQueryData(["posts", "me"]);

      updatePostLikeState(["posts", "feed"], postId, !isLiked);
      updatePostLikeState(["posts", "me"], postId, !isLiked);

      return { previousFeedData, previousMyPostsData };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousFeedData) {
        queryClient.setQueryData(["posts", "feed"], context.previousFeedData);
      }
      if (context?.previousMyPostsData) {
        queryClient.setQueryData(["posts", "me"], context.previousMyPostsData);
      }
      toast.error(error?.response?.data?.message || "Không thể thích bài viết");
    },
  });
};

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => postService.getComments(postId),
    enabled: !!postId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => {
      return postService.addComment(postId, content);
    },
    onSuccess: (newComment) => {
      // Update comments list
      queryClient.setQueryData(
        ["comments", newComment.postId],
        (oldData: Comment[] | undefined) => {
          return [...(oldData || []), newComment];
        },
      );

      // Update post comments count in feed
      queryClient.setQueryData(["posts", "feed"], (oldData: any) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) => {
            if (post.id === newComment.postId) {
              return {
                ...post,
                commentsCount: post.commentsCount + 1,
              };
            }
            return post;
          }),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });

      toast.success("Đã bình luận thành công");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể bình luận");
    },
  });
};

export const useUserPosts = (userId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ["posts", "me"],
    queryFn: ({ pageParam }) => postService.getMyPosts({ pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
    enabled: !!userId,
  });
};
