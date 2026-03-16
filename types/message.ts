export interface MessageAttachment {
  url: string;
  fileType: string;
  fileName: string;
  fileSize: number;
}

export interface MessageSenderInfo {
  _id?: string;
  id?: string;
  displayName?: string;
  avatar?: string;
}

export type MessageStatus = "sending" | "sent" | "failed";

export interface Message {
  id: string;
  conversationId: string;
  _id?: string;
  senderId: string | MessageSenderInfo;
  content?: string;
  type: string;
  attachments?: MessageAttachment[];
  replyToMessageId?: string;
  readBy?: string[];
  isUnsent?: boolean;
  createdAt: Date | string;
  clientTempId?: string;
  status?: MessageStatus;
  isOptimistic?: boolean;
}
