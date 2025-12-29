"use client"

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { useParams } from "next/navigation";

export default function ChatDetailPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState([
    { id: 1, sender: "other", text: "Chào con, cuối tuần này có về không?", time: "10:23 AM" },
    { id: 2, sender: "me", text: "Con đang bận dự án, chắc tuần sau ạ!", time: "10:25 AM" }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender: "me", text, time: "Just now" }]);
  };

  return (
    <div className="flex flex-col h-full bg-white relative w-full overflow-hidden">
      <ChatHeader name={id === "1" ? "Mom" : "Friend"} isOnline={id === "1"} />
      
      <ScrollArea className="flex-1 p-3 md:p-6 bg-slate-50/30" ref={scrollRef}>
        <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto pb-4"> 
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2.5 rounded-2xl text-[14px] md:text-[15px] shadow-sm max-w-[85%] md:max-w-[70%] lg:max-w-[60%] ${
                msg.sender === "me" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
              }`}>
                {msg.text}
                <div className={`text-[10px] mt-1 text-right ${msg.sender === "me" ? "text-blue-100" : "text-slate-400"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}