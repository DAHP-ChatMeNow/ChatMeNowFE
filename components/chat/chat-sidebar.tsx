"use client"
import { Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatItem } from "./chat-item";
import { useParams } from "next/navigation"; // Hook lấy ID từ URL

const MOCK_DATA = [
  { id: "1", name: "Mom", lastMsg: "Typing...", time: "Now", unread: 0 },
  { id: "2", name: "Team Alpha", lastMsg: "Meeting at 5? Don't forget!", time: "10:42 AM", unread: 2 },
  { id: "3", name: "John Doe", lastMsg: "You: Sent a photo 📷", time: "10:30 AM", unread: 0 },
];

export function ChatSidebar() {
  const params = useParams();
  const currentId = params.id as string;

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
        <div className="flex flex-col gap-1 pb-4">
          {MOCK_DATA.map((chat) => (
            <ChatItem 
              key={chat.id} 
              {...chat} 
              isActive={currentId === chat.id}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}