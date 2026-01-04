"use client";

import { Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatItem } from "./chat-item";
import { useParams } from "next/navigation";
import { useConversations } from "@/hooks/use-chat";
import { ChatListSkeleton } from "@/components/skeletons/chat-list-skeleton";

export function ChatSidebar() {
  const params = useParams();
  const currentId = params.id as string;
  const { data: conversationsData, isLoading, error } = useConversations();
  const conversations = conversationsData?.conversations || [];

  return (
    <aside className="w-[350px] border-r border-slate-100 flex flex-col h-full bg-white shrink-0">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h1>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Edit className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search messages..." className="pl-9 bg-slate-100/50 border-none h-10" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="px-4 pb-4">
            <ChatListSkeleton />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Không thể tải danh sách hội thoại
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="flex flex-col gap-1 pb-4">
            {conversations.map((chat) => (
              <ChatItem
                key={chat.id}
                id={chat.id}
                name={chat.name || "Unknown"}
                lastMsg={chat.lastMessage?.content || "No messages yet"}
                time={chat.lastMessage?.createdAt?.toString() || ""}
                unread={0}
                isActive={currentId === chat.id}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Chưa có hội thoại nào
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}