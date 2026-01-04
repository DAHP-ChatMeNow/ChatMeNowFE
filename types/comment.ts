export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  replyToCommentId?: string;
  createdAt: Date;
}
