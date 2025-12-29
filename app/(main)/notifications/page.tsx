"use client"

import { Bell, UserPlus, MessageSquare, Heart, Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const NOTIFICATIONS = [
  { id: 1, type: 'friend_request', user: 'Lê Bảo', content: 'đã gửi cho bạn lời mời kết bạn.', time: '2 phút trước', read: false },
  { id: 2, type: 'like', user: 'Minh Anh', content: 'đã thả tim tin nhắn của bạn.', time: '1 giờ trước', read: true },
  { id: 3, type: 'mention', user: 'Team Alpha', content: 'đã nhắc đến bạn trong một tin nhắn.', time: '3 giờ trước', read: true },
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col h-full bg-white w-full">
      <header className="h-[70px] border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 bg-white z-10 w-full">
        <h1 className="text-xl font-bold text-slate-900">Thông báo</h1>
        <Button variant="ghost" size="sm" className="text-blue-600 font-medium">Đánh dấu đã đọc tất cả</Button>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="w-full p-4 md:p-8 space-y-2">
          {NOTIFICATIONS.map((noti) => (
            <div 
              key={noti.id} 
              className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${noti.read ? 'hover:bg-slate-50' : 'bg-blue-50/40 border border-blue-100 shadow-sm'}`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 border border-white shadow-sm">
                  <AvatarFallback className="bg-slate-100 font-bold">UN</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white ${noti.type === 'friend_request' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  {noti.type === 'friend_request' ? <UserPlus className="w-3 h-3 text-white" /> : <Heart className="w-3 h-3 text-white" />}
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <p className="text-[14.5px] text-slate-900 leading-tight">
                  <span className="font-bold">{noti.user}</span> {noti.content}
                </p>
                <p className="text-[12px] text-slate-400 font-medium">{noti.time}</p>
                {noti.type === 'friend_request' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 px-4 rounded-lg">Chấp nhận</Button>
                    <Button size="sm" variant="outline" className="h-8 px-4 rounded-lg">Từ chối</Button>
                  </div>
                )}
              </div>
              {!noti.read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-2" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}