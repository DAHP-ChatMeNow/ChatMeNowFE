"use client"

import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-50/30 overflow-hidden relative">
      
      <aside className="hidden md:flex w-[70px] lg:w-[80px] shrink-0 border-r border-slate-100 flex-col items-center py-6 bg-white z-50">
        <Sidebar mode="desktop" />
      </aside>

      
      <main className="flex-1 min-w-0 h-full flex flex-col relative">
        
        
        

        
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
          
          <div className="max-w-[1440px] mx-auto h-full w-full px-4 md:px-6">
            {children}
          </div>
        </div>

        
        <nav className="md:hidden h-[65px] border-t border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-around shrink-0 z-50">
          <Sidebar mode="mobile" />
        </nav>
      </main>
    </div>
  );
}