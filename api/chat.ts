import api from "@/lib/axios";
import { Conversation } from "@/types/conversation";
import { Message } from "@/types/message";

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface ConversationDetailsResponse {
  conversation: Conversation;
}

export interface MessagesResponse {
  messages: Message[];
}

// Helper function to map _id to id for MongoDB compatibility
const mapMongoId = (obj: any): any => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => mapMongoId(item));
  }
  
  if (typeof obj === 'object') {
    const mapped: any = {
      ...obj,
      id: obj._id || obj.id,
    };
    return mapped;
  }
  
  return obj;
};

export const chatService = {
  // Lấy danh sách conversations
  getConversations: async () => {
    const res = await api.get<ConversationsResponse>("/chat/conversations");
    if (res.data.conversations) {
      res.data.conversations = res.data.conversations.map((conv: any) => mapMongoId(conv));
    }
    return res.data;
  },

  // Tạo conversation mới
  createConversation: async (memberIds: string[]) => {
    const res = await api.post<ConversationDetailsResponse>("/chat/conversations", { memberIds });
    return mapMongoId(res.data.conversation);
  },

  // Lấy chi tiết conversation
  getConversationDetails: async (conversationId: string) => {
    const res = await api.get<ConversationDetailsResponse>(`/chat/conversations/${conversationId}`);
    return mapMongoId(res.data.conversation);
  },

  // Lấy messages của conversation
  getMessages: async (conversationId: string) => {
    const res = await api.get<MessagesResponse>(`/chat/conversations/${conversationId}/messages`);
    if (res.data.messages) {
      res.data.messages = res.data.messages.map((msg: any) => mapMongoId(msg));
    }
    return res.data;
  },

  // Gửi message
  sendMessage: async (data: { conversationId: string; content: string; type: string }) => {
    const res = await api.post<Message>("/chat/messages", data);
    return mapMongoId(res.data);
  },
};