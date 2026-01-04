export interface MessageAttachment {
  url: string;
  fileType: string;
  fileName: string;
  fileSize: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  type: string;
  attachments?: MessageAttachment[];
  replyToMessageId?: string;
  readBy?: string[];
  isUnsent?: boolean;
  createdAt: Date;
}
