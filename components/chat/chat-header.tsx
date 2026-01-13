"use client"

import { ChevronLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ChatHeader({ name, isOnline, avatar }: { name: string, isOnline: boolean, avatar?: string }) {
  const router = useRouter();

  return (
    <div className="h-[65px] md:h-[75px] border-b border-slate-100 flex items-center justify-between px-4 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={() => router.push('/messages')} 
          className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>

        <div className="relative">
          <Avatar className="h-10 w-10 md:h-11 md:w-11">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
        </div>

        <div className="flex flex-col">
          <h2 className="font-bold text-slate-900 text-sm md:text-base leading-tight">{name}</h2>
          <p className="text-[11px] md:text-[12px] text-slate-400 font-medium">
            {isOnline ? "Đang hoạt động" : "Vừa truy cập"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <button className="p-2 text-slate-400 hover:text-blue-600"><Phone className="w-5 h-5" /></button>
        <button className="p-2 text-slate-400 hover:text-blue-600"><Video className="w-5 h-5" /></button>
        <button className="p-2 text-slate-400"><MoreVertical className="w-5 h-5" /></button>
      </div>
    </div>
  );
}