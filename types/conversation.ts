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
  _id: string;
  type: string;
  name?: string;
  groupAvatar?: string;
  members: ConversationMember[];
  lastMessage?: LastMessage;
  createdAt: Date;
  updatedAt: Date;
}
