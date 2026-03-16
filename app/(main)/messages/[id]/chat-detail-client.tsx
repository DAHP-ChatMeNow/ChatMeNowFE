"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { useParams } from "next/navigation";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useConversationDisplay,
} from "@/hooks/use-chat";
import { MessageSkeleton } from "@/components/skeletons/message-skeleton";
import { useAuthStore } from "@/store/use-auth-store";
import { useSocket } from "@/components/providers/socket-provider";
import { Message } from "@/types/message";
import { PresignedAvatar } from "@/components/ui/presigned-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { chatService, MessagesResponse } from "@/api/chat";

const getMessageSenderId = (message: Message): string | undefined => {
  if (typeof message.senderId === "string") {
    return message.senderId;
  }

  return message.senderId?._id || message.senderId?.id;
};

export default function ChatDetailClient() {
  const { id } = useParams();
  const conversationId = id as string;
  const user = useAuthStore((state) => state.user);

  // Fallback cho userId
  const currentUserId = user?.id || user?._id;

  // Lấy conversation và messages riêng biệt
  const { data: conversation } = useConversation(conversationId);
  const {
    data: messagesData,
    isLoading,
    error,
  } = useMessages(conversationId, {
    limit: 20,
  });
  const messages = messagesData?.messages || [];

  // Hook tập trung logic phân biệt private/group - tự động fetch partner nếu cần
  const {
    displayName: conversationName,
    avatar: conversationAvatar,
    isOnline: isOnlineStatus,
    statusText,
  } = useConversationDisplay(conversation, currentUserId);

  const { mutate: sendMessage } = useSendMessage();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasInitializedScrollRef = useRef(false);
  const beforeIdRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const isMountedRef = useRef(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const getMessageId = useCallback((message: Message): string | undefined => {
    return message.id || message._id;
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const oldestMessage = messages[0];
    beforeIdRef.current = oldestMessage
      ? getMessageId(oldestMessage) || null
      : null;

    const hasMoreFromApi =
      messagesData?.hasMore ?? messagesData?.pagination?.hasMore;
    if (typeof hasMoreFromApi === "boolean") {
      hasMoreRef.current = hasMoreFromApi;
    }

    const nextCursor =
      messagesData?.nextCursor ?? messagesData?.pagination?.nextCursor;
    if (hasMoreRef.current === false || nextCursor === null) {
      hasMoreRef.current = false;
    } else if (typeof nextCursor === "string" && nextCursor.length > 0) {
      hasMoreRef.current = true;
      beforeIdRef.current = nextCursor;
    } else if (typeof hasMoreFromApi !== "boolean") {
      hasMoreRef.current = messages.length >= 20;
    }
  }, [messages, messagesData, getMessageId]);

  useEffect(() => {
    hasMoreRef.current = true;
    isLoadingOlderRef.current = false;
    setIsLoadingOlder(false);
    beforeIdRef.current = null;
  }, [conversationId]);

  const loadOlderMessages = useCallback(async () => {
    const beforeId = beforeIdRef.current;
    if (
      !conversationId ||
      !beforeId ||
      !hasMoreRef.current ||
      isLoadingOlderRef.current
    ) {
      return;
    }

    const viewport = scrollRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);

    const previousHeight = viewport.scrollHeight;
    const previousTop = viewport.scrollTop;

    try {
      const response = await chatService.getMessages(conversationId, {
        limit: 20,
        beforeId,
      });

      const olderMessages = response.messages || [];
      if (olderMessages.length === 0) {
        hasMoreRef.current = false;
        queryClient.setQueryData<MessagesResponse>(
          ["messages", conversationId],
          (old) => {
            if (!old) return old;

            return {
              ...old,
              messages: old.messages || [],
              hasMore: false,
              nextCursor: null,
              pagination: {
                ...(old.pagination || {}),
                hasMore: false,
                nextCursor: null,
              },
            };
          },
        );
        return;
      }

      queryClient.setQueryData<MessagesResponse>(
        ["messages", conversationId],
        (old) => {
          const existing = old?.messages || [];
          const existingIds = new Set(
            existing
              .map((message) => getMessageId(message))
              .filter((id): id is string => Boolean(id)),
          );

          const prepend = olderMessages.filter((message) => {
            const id = getMessageId(message);
            return !!id && !existingIds.has(id);
          });

          return {
            ...(old || {}),
            messages: [...prepend, ...existing],
            hasMore: response.hasMore,
            nextCursor: response.nextCursor,
            pagination: {
              ...(response.pagination || {}),
              hasMore: response.hasMore ?? response.pagination?.hasMore,
              nextCursor:
                response.nextCursor ?? response.pagination?.nextCursor,
            },
          };
        },
      );

      const hasMoreFromApi = response.hasMore ?? response.pagination?.hasMore;
      const responseCursor =
        response.nextCursor ?? response.pagination?.nextCursor;
      if (hasMoreFromApi === false || responseCursor === null) {
        hasMoreRef.current = false;
      } else if (
        typeof responseCursor === "string" &&
        responseCursor.length > 0
      ) {
        hasMoreRef.current = true;
        beforeIdRef.current = responseCursor;
      } else {
        const oldestLoaded = olderMessages[0];
        const oldestLoadedId = oldestLoaded ? getMessageId(oldestLoaded) : null;
        beforeIdRef.current = oldestLoadedId || null;
        hasMoreRef.current = olderMessages.length >= 20;
      }

      requestAnimationFrame(() => {
        const currentViewport =
          scrollRef.current?.querySelector<HTMLDivElement>(
            "[data-radix-scroll-area-viewport]",
          );
        if (!currentViewport) return;

        const heightDelta = currentViewport.scrollHeight - previousHeight;
        currentViewport.scrollTop = previousTop + heightDelta;
      });
    } finally {
      isLoadingOlderRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingOlder(false);
      }
    }
  }, [conversationId, queryClient, getMessageId]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    const handleScroll = () => {
      if (viewport.scrollTop <= 40) {
        void loadOlderMessages();
      }

      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < 120;
    };

    handleScroll();
    viewport.addEventListener("scroll", handleScroll);

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [conversationId, loadOlderMessages]);

  useEffect(() => {
    hasInitializedScrollRef.current = false;
    shouldAutoScrollRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport || messages.length === 0) return;

    const behavior = hasInitializedScrollRef.current ? "smooth" : "auto";

    if (shouldAutoScrollRef.current || !hasInitializedScrollRef.current) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      hasInitializedScrollRef.current = true;
      shouldAutoScrollRef.current = true;
    }
  }, [messages]);

  useEffect(() => {
    if (!socket.current || !conversationId) return;

    socket.current.emit("joinConversation", conversationId);

    return () => {
      socket.current?.emit("leaveConversation", conversationId);
    };
  }, [isConnected, conversationId, socket]);

  useEffect(() => {
    if (!socket.current || !conversationId) return;

    const handleUserTyping = ({
      userId,
      displayName,
    }: {
      userId: string;
      displayName: string;
    }) => {
      if (userId !== user?.id) {
        setTypingUsers((prev) => {
          if (!prev.includes(displayName)) return [...prev, displayName];
          return prev;
        });
      }
    };

    const handleUserStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== userId));
    };

    socket.current.on("userTyping", handleUserTyping);
    socket.current.on("userStopTyping", handleUserStopTyping);

    return () => {
      socket.current?.off("userTyping", handleUserTyping);
      socket.current?.off("userStopTyping", handleUserStopTyping);
    };
  }, [isConnected, conversationId, user]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    sendMessage({
      conversationId,
      content: text,
      type: "text",
    });
  };

  const handleTyping = () => {
    if (socket.current && conversationId) {
      socket.current.emit("typing", {
        conversationId,
        userId: user?.id,
        displayName: user?.displayName,
      });
    }
  };

  const handleStopTyping = () => {
    if (socket.current && conversationId) {
      socket.current.emit("stopTyping", { conversationId, userId: user?.id });
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full min-h-0 overflow-hidden bg-white">
      <ChatHeader
        name={conversationName}
        isOnline={isOnlineStatus}
        avatar={conversationAvatar}
        statusText={statusText}
      />

      <ScrollArea
        className="flex-1 min-h-0 bg-gradient-to-b from-white to-slate-50/40"
        ref={scrollRef}
      >
        <div className="w-full max-w-[1240px] px-3 py-4 md:px-6 md:py-6 xl:px-10 mx-auto">
          <div className="flex flex-col w-full gap-3.5 pb-4">
            {isLoading ? (
              <MessageSkeleton />
            ) : error ? (
              <div className="py-8 text-center text-slate-500">
                Không thể tải tin nhắn
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {isLoadingOlder && hasMoreRef.current && (
                  <div className="text-xs text-center text-slate-400">
                    Đang tải tin nhắn cũ...
                  </div>
                )}
                {messages.map((msg: Message) => {
                  const messageSenderId = getMessageSenderId(msg);
                  const isMe = messageSenderId === currentUserId;

                  const senderInfo =
                    typeof msg.senderId === "object" && msg.senderId !== null
                      ? msg.senderId
                      : undefined;

                  const senderDisplayName = isMe
                    ? user?.displayName || "You"
                    : senderInfo?.displayName ||
                      (conversation?.type === "private"
                        ? conversationName || "User"
                        : "User");

                  const senderAvatarKey = isMe
                    ? user?.avatar
                    : senderInfo?.avatar ||
                      (conversation?.type === "private"
                        ? conversationAvatar
                        : undefined);

                  return (
                    <div
                      key={msg.id || msg._id}
                      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <PresignedAvatar
                          avatarKey={senderAvatarKey}
                          displayName={senderDisplayName}
                          className="w-8 h-8 shrink-0 self-end"
                        />
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-[14px] md:text-[15px] shadow-sm max-w-[84%] md:max-w-[70%] xl:max-w-[64%] ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                        <div
                          className={`text-[10px] mt-1 text-right ${
                            isMe ? "text-blue-100" : "text-slate-400"
                          }`}
                          suppressHydrationWarning
                        >
                          {msg.status === "sending"
                            ? "Đang gửi..."
                            : msg.status === "failed"
                              ? "Gửi thất bại"
                              : new Date(msg.createdAt).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                        </div>
                      </div>
                      {isMe && (
                        <PresignedAvatar
                          avatarKey={senderAvatarKey}
                          displayName={senderDisplayName}
                          className="w-8 h-8 shrink-0 self-end"
                        />
                      )}
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2.5 rounded-2xl text-[14px] bg-slate-200 text-slate-600">
                      {typingUsers[0]} đang soạn tin...
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-slate-500">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <ChatInput
        onSend={handleSendMessage}
        disabled={!conversationId}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
}
