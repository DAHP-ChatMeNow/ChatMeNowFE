export interface ConversationMember {
  userId: string;
  joinedAt: Date;
  role: string;
  lastReadAt?: Date;
}

export interface LastMessage {
  content?: string;
  senderId?: string;
  senderName?: string;
  type?: string;
  createdAt?: Date;
}

export interface Conversation {
  id: string;
  type: string;
  name?: string;
  groupAvatar?: string;
  adminId: string;
  members: ConversationMember[];
  lastMessage?: LastMessage;
  createdAt: Date;
  updatedAt: Date;
}
