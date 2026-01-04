"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, Image as ImageIcon, StickyNote, Mic, SendHorizontal, Paperclip, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export function ChatInput({ onSend, disabled, onTyping, onStopTyping }: ChatInputProps) {
  const [value, setValue] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
      setValue("");
      if (onStopTyping) onStopTyping();
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);

    if (onTyping) onTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onStopTyping) onStopTyping();
    }, 2000);
  }, [onTyping, onStopTyping]);

  return (
    <div className="p-4 border-t border-slate-100 bg-white">
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-1">
          <button 
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button 
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all hidden sm:block disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Input
            value={value}
            onChange={handleChange}
            placeholder="Nhập tin nhắn..."
            disabled={disabled}
            className="w-full bg-slate-100/70 border-none h-11 rounded-2xl pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500 disabled:opacity-50"
          >
            <Smile className="w-5 h-5" />
          </button>
        </form>

        {value.trim() ? (
          <button
            onClick={() => handleSubmit()}
            disabled={disabled}
            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        ) : (
          <button 
            disabled={disabled}
            className="p-2.5 text-slate-400 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StickyNote className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}