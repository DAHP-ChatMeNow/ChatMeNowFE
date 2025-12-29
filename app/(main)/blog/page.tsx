"use client"

import { Image as ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

export default function BlogPage() {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <ScrollArea className="flex-1 w-full">
        <div className="w-full py-4 md:py-8 px-4 md:px-6 space-y-6">
          
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex gap-3 md:gap-4">
              <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Textarea 
                placeholder="Bạn đang nghĩ gì thế?" 
                className="flex-1 border-none bg-slate-50 rounded-xl resize-none focus-visible:ring-0 min-h-[80px] md:min-h-[100px] text-sm md:text-base p-3"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <Button variant="ghost" size="sm" className="text-slate-500 gap-2 h-9 md:h-10 px-2 md:px-4">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                <span className="text-xs md:text-sm">Ảnh/Video</span>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 px-4 md:px-8 rounded-full h-9 md:h-10 text-xs md:text-sm font-semibold text-white">
                Đăng bài
              </Button>
            </div>
          </div>

          {[1, 2].map((post) => (
            <div key={post} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-slate-100 font-bold text-slate-600">AN</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-slate-900 leading-none">Alex Nguyen</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">2 giờ trước</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>

              <div className="px-4 pb-3">
                <p className="text-sm md:text-base text-slate-800 leading-relaxed">
                  Giao diện Khám phá giờ đã hiển thị rộng rãi hơn trên Web! 🚀 #Responsive #NextJS
                </p>
              </div>

              <div className="bg-slate-100 aspect-video w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                  alt="Post content" 
                />
              </div>

              <div className="p-1 md:p-2 flex items-center justify-around border-t border-slate-50">
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 hover:text-red-500 text-xs md:text-sm h-10">
                  <Heart className="w-4 h-4 md:w-5 md:h-5" /> Thích
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 hover:text-blue-600 text-xs md:text-sm h-10">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" /> Bình luận
                </Button>
                <Button variant="ghost" className="flex-1 gap-2 text-slate-600 text-xs md:text-sm h-10">
                  <Share2 className="w-4 h-4 md:w-5 md:h-5" /> Chia sẻ
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}