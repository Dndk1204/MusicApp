"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";

export default function MainLayout({ children }) {
  // State quản lý việc hiện Sidebar trên mobile
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      {/* 1. NAVBAR SECTION (Cố định chiều cao, z-index cao nhất) */}
      <header className="fixed h-[64px] shrink-0 w-full !z-[9999] shadow-md">
        {/* Truyền hàm toggle xuống Navbar để gắn vào nút Menu Hamburger */}
        <Navbar onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      </header>

      {/* 2. MAIN LAYOUT (Sidebar + Page Content) */}
      <div className="flex flex-1 overflow-hidden w-full relative">
        
        {/* --- DESKTOP SIDEBAR (Ẩn trên mobile, hiện trên desktop) --- */}
        <div className="hidden md:block !mt-[64px]">
          <Sidebar />
        </div>

        {/* --- MOBILE SIDEBAR (Overlay - Chỉ hiện khi được bật) --- */}
        {isMobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-[9998]">
                {/* Lớp nền tối (Bấm vào đây để đóng menu) */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
                
                {/* Sidebar container */}
                <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-neutral-100 dark:bg-black border-r border-neutral-200 dark:border-white/10 pt-[64px] animate-in slide-in-from-left duration-300 shadow-2xl">
                    <Sidebar className="w-full h-full" />
                </div>
            </div>
        )}

        {/* --- MAIN CONTENT --- */}
        <main id="main-content" className="flex-1 min-h-full w-full overflow-y-auto relative scroll-smooth bg-transparent">
          <div className="min-h-full w-full p-4 pb-[160px] !mt-[64px]">
            {children}
          </div>
        </main>
      </div>

      {/* 3. PLAYER (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 w-full z-[9998]">
        <Player />
      </div>
    </>
  );
}