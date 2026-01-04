export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: string;
  referenced?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
