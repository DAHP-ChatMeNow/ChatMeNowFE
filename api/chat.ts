import api from "@/lib/axios";
import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: Message[];
}

export const chatService = {
  getConversations: async () => {
    const res = await api.get<ConversationsResponse>("/chat/conversations");
    return res.data;
  },
  getMessages: async (conversationId: string) => {
    const res = await api.get<MessagesResponse>(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },
  sendMessage: async (data: { conversationId: string; content: string; type: string }) => {
    const res = await api.post<Message>("/chat/messages", data);
    return res.data;
  },
};