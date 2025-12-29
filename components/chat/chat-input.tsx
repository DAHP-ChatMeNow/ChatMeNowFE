"use client"

import { useState } from "react";
import { Plus, Image as ImageIcon, StickyNote, Mic, SendHorizontal, Paperclip, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      onSend(value);
      setValue("");
    }
  };

  return (
    <div className="p-4 border-t border-slate-100 bg-white">
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        {/* Nhóm nút chức năng bên trái */}
        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all hidden sm:block">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Ô nhập liệu */}
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Input 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nhập tin nhắn..." 
            className="w-full bg-slate-100/70 border-none h-11 rounded-2xl pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-slate-200"
          />
          <button 
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500"
          >
            <Smile className="w-5 h-5" />
          </button>
        </form>

        {/* Nút gửi hoặc nút Sticker */}
        {value.trim() ? (
          <button 
            onClick={() => handleSubmit()}
            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        ) : (
          <button className="p-2.5 text-slate-400 hover:text-blue-600 transition-all">
            <StickyNote className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}