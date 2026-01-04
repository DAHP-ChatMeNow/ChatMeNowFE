"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contactService, ContactsResponse } from "@/api/contact";
import { User } from "@/types/user";
import { FriendRequest } from "@/types/friend-request";

export const useContacts = () => {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: (): Promise<ContactsResponse> => contactService.getContacts(),
  });
};

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const res = await contactService.getFriendRequests();
      return res as { requests: FriendRequest[] };
    },
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactService.sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast.success("Đã gửi lời mời kết bạn");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể gửi lời mời");
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactService.acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Đã chấp nhận lời mời kết bạn");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể chấp nhận lời mời");
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactService.rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast.success("Đã từ chối lời mời kết bạn");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể từ chối lời mời");
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactService.removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Đã xóa bạn");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể xóa bạn");
    },
  });
};
