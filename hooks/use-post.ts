"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postService, CreatePostPayload } from "@/api/post";
import { Post } from "@/types/post";

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

  return useMutation({
    mutationFn: ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      return isLiked ? postService.unlikePost(postId) : postService.likePost(postId);
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["posts", "feed"] });

      const previousData = queryClient.getQueryData(["posts", "feed"]);

      queryClient.setQueryData(["posts", "feed"], (oldData: any) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((post: Post) => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
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

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["posts", "feed"], context.previousData);
      }
      toast.error("Không thể cập nhật trạng thái thích");
    },
  });
};
