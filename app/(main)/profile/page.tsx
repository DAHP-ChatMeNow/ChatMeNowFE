"use client"

import { Camera, ShieldCheck, Bell, Moon, Languages, LogOut, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as SwitchPrimitives from "@radix-ui/react-switch";

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full">
      <ScrollArea className="flex-1 w-full">
        <div className="w-full mx-auto py-6 md:py-10 px-4 md:px-6 space-y-8">
          
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative group cursor-pointer">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-md">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Camera className="text-white w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
            <h2 className="mt-4 md:mt-6 text-xl md:text-2xl font-bold text-slate-900">John Doe</h2>
            <p className="text-slate-500 text-sm">@johndoe_id</p>
            <button className="mt-6 px-8 py-2.5 bg-slate-900 text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-md">
              Chỉnh sửa hồ sơ
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cài đặt ứng dụng</h3>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <SettingItem icon={Bell} label="Thông báo" description="Âm thanh, tin nhắn đẩy" />
              <SettingItem icon={ShieldCheck} label="Quyền riêng tư" description="Mật khẩu, khóa ứng dụng" />
              
              <div className="flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Moon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-sm md:text-base text-slate-900">Chế độ tối (Dark Mode)</span>
                </div>
                <CustomSwitch />
              </div>
              
              <SettingItem icon={Languages} label="Ngôn ngữ" description="Tiếng Việt" />
            </div>
          </div>

          <button className="w-full p-4 md:p-5 flex items-center justify-center gap-3 text-red-500 font-bold bg-white hover:bg-red-50 rounded-2xl transition-all border border-red-100 shadow-sm">
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}

function SettingItem({ icon: Icon, label, description }: any) {
  return (
    <div className="flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 cursor-pointer transition-all border-b border-slate-50 last:border-0 group">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm md:text-base text-slate-900 leading-none">{label}</p>
          <p className="text-[11px] md:text-xs text-slate-400 mt-1.5">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
    </div>
  );
}

function CustomSwitch() {
    return (
        <SwitchPrimitives.Root className="w-[42px] h-[24px] bg-slate-200 rounded-full relative data-[state=checked]:bg-blue-600 outline-none cursor-pointer transition-colors">
            <SwitchPrimitives.Thumb className="block w-[18px] h-[18px] bg-white rounded-full transition-transform duration-100 translate-x-1 will-change-transform data-[state=checked]:translate-x-[20px]" />
        </SwitchPrimitives.Root>
    );
}