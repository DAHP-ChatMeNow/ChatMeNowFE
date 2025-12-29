"use client"

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useParams } from "next/navigation";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const isChatting = !!params.id; 

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      <aside className={`
        ${isChatting ? "hidden" : "flex"} 
        md:flex w-full md:w-[350px] lg:w-[400px] shrink-0 border-r border-slate-100 flex-col h-full
      `}>
        <ChatSidebar />
      </aside>

      <section className={`
        ${!isChatting ? "hidden" : "flex"} 
        md:flex flex-1 h-full relative bg-slate-50/20
      `}>
        {children}
      </section>
    </div>
  );
}