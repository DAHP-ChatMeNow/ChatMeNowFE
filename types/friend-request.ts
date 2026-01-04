import { User } from './user';

export interface FriendRequest {
  id: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
