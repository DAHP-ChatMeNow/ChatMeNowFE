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
  conversation?: Conversation;
}

export interface PartnerResponse {
  partner: {
    _id: string;
    displayName: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
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
    const res = await api.get<ConversationDetailsResponse | any>(`/chat/conversations/${conversationId}`);
    // Handle cả format cũ (trực tiếp) và format mới (wrapped)
    const conversation = res.data.conversation || res.data;
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    return mapMongoId(conversation);
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

  // Lấy private conversation với một người
  getPrivateConversation: async (partnerId: string) => {
    const res = await api.get<ConversationDetailsResponse>(`/chat/private/${partnerId}`);
    return mapMongoId(res.data.conversation);
  },

  // Lấy thông tin partner trong private conversation
  getPrivateConversationPartner: async (conversationId: string) => {
    const res = await api.get<PartnerResponse>(`/chat/conversations/${conversationId}/partner`);
    return mapMongoId(res.data.partner);
  },
};