"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatService, ConversationsResponse, MessagesResponse } from "@/api/chat";
import { Message } from "@/types/message";

export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: (): Promise<ConversationsResponse> => chatService.getConversations(),
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: (): Promise<MessagesResponse> =>
      chatService.getMessages(conversationId),
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: (newMessage: Message) => {
      queryClient.invalidateQueries({ queryKey: ["messages", newMessage.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Đã gửi tin nhắn");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Không thể gửi tin nhắn");
    },
  });
};