"use client"

import { UserPlus, Users2, Bookmark, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ContactsPage() {
  return (
    <div className="flex flex-col h-full bg-white w-full">
      <header className="h-[60px] md:h-[70px] border-b border-slate-100 flex items-center px-4 md:px-6 sticky top-0 bg-white z-10 shrink-0">
        <h1 className="text-lg md:text-xl font-bold">Danh bạ</h1>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="w-full p-4 md:p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 font-sans">
            {[{ label: "Lời mời kết bạn", color: "text-orange-500", bg: "bg-orange-50" }, { label: "Danh sách nhóm", color: "text-blue-500", bg: "bg-blue-50" }, { label: "Tags & Cloud", color: "text-purple-500", bg: "bg-purple-50" }].map((cat) => (
              <div key={cat.label} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all">
                <div className={`p-3 rounded-lg ${cat.bg} ${cat.color}`}><UserPlus className="w-5 h-5" /></div>
                <p className="font-semibold text-sm">{cat.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Bạn bè (48)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                  <Avatar><AvatarFallback className="bg-slate-100 font-bold">AN</AvatarFallback></Avatar>
                  <div><p className="font-semibold text-sm">Alex Nguyen {i}</p><p className="text-xs text-slate-400">Gần đây</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}