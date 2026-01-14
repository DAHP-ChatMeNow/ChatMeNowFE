"use client";

import { useConversationDisplay } from "@/hooks/use-chat";
import { ChatItem } from "./chat-item";
import { Conversation } from "@/types/conversation";

export function ConversationItemDisplay({
  conversation,
  currentUserId,
  isActive,
}: {
  conversation: Conversation;
  currentUserId: string | undefined;
  isActive: boolean;
}) {
  console.log("ConversationItemDisplay props:", { 
    conversationId: conversation?.id,
    conversationType: conversation?.type, 
    currentUserId,
    hasConversation: !!conversation 
  });

  const { displayName, avatar } = useConversationDisplay(conversation, currentUserId);
  
  console.log("ConversationItemDisplay display data:", { displayName, avatar });

  return (
    <ChatItem
      id={conversation.id}
      avatar={avatar}
      name={displayName || "Unknown"}
      lastMsg={conversation.lastMessage?.content || "No messages yet"}
      time={conversation.lastMessage?.createdAt?.toString() || ""}
      unread={0}
      isActive={isActive}
    />
  );
}
