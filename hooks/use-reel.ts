"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { reelService } from "@/services/reel";

// ─── Feed ────────────────────────────────────────────────────────────────────

export const useReelFeed = () =>
    useInfiniteQuery({
        queryKey: ["reel-feed"],
        queryFn: ({ pageParam }) =>
            reelService.getReelFeed({ pageParam: pageParam as string | null }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 30_000,
    });

// ─── My Reels ────────────────────────────────────────────────────────────────

export const useMyReels = () =>
    useInfiniteQuery({
        queryKey: ["my-reels"],
        queryFn: ({ pageParam }) =>
            reelService.getMyReels({ pageParam: pageParam as string | null }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

// ─── Single Reel ─────────────────────────────────────────────────────────────

export const useReelById = (reelId?: string) =>
    useQuery({
        queryKey: ["reel", reelId],
        queryFn: () => reelService.getReelById(reelId!),
        enabled: !!reelId,
    });

// ─── Toggle Like ─────────────────────────────────────────────────────────────

export const useToggleLike = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reelId: string) => reelService.toggleLike(reelId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reel-feed"] });
        },
    });
};

// ─── Comments ────────────────────────────────────────────────────────────────

export const useReelComments = (reelId?: string) =>
    useInfiniteQuery({
        queryKey: ["reel-comments", reelId],
        queryFn: ({ pageParam }) =>
            reelService.getComments(reelId!, {
                pageParam: pageParam as string | null,
                limit: 15,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!reelId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

export const useAddReelComment = (reelId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { content: string; replyToCommentId?: string }) =>
            reelService.addComment(reelId, payload),
        onSuccess: (newComment) => {
            // Update comments cache immediately
            qc.setQueryData(["reel-comments", reelId], (oldData: any) => {
                if (!oldData) return oldData;
                const pages = [...oldData.pages];
                if (pages.length === 0) {
                    pages.push({
                        comments: [newComment],
                        hasMore: false,
                        nextCursor: null,
                    });
                } else {
                    const lastIdx = pages.length - 1;
                    pages[lastIdx] = {
                        ...pages[lastIdx],
                        comments: [...pages[lastIdx].comments, newComment],
                    };
                }
                return {
                    ...oldData,
                    pages,
                };
            });

            // Update commentCount in reel-feed and my-reels caches directly
            const updateCountInFeedCache = (queryKey: string[]) => {
                qc.setQueriesData({ queryKey }, (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any) => ({
                            ...page,
                            reels: page.reels.map((reel: any) =>
                                reel._id === reelId
                                    ? { ...reel, commentCount: (reel.commentCount ?? 0) + 1 }
                                    : reel
                            ),
                        })),
                    };
                });
            };

            updateCountInFeedCache(["reel-feed"]);
            updateCountInFeedCache(["my-reels"]);

            // Update commentCount in single reel query cache
            qc.setQueryData(["reel", reelId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    commentCount: (oldData.commentCount ?? 0) + 1,
                };
            });
        },
    });
};

// ─── Delete Reel ─────────────────────────────────────────────────────────────

export const useDeleteReel = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (reelId: string) => reelService.deleteReel(reelId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reel-feed"] });
            qc.invalidateQueries({ queryKey: ["my-reels"] });
        },
    });
};
