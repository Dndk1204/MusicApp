"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";

// --- FILE: MainLayout.jsx ---
export default function MainLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      {/* 1. NAVBAR (Giữ nguyên) */}
      <div className="fixed top-0 left-0 w-full h-[64px] z-[3000]">
        <Navbar onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
      </div>

      {/* 2. SIDEBAR WRAPPER (Giữ nguyên) */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)}
      >
        {children}
      </Sidebar>

      {/* 3. PLAYER (ĐÃ SỬA) */}
      {/* Xóa class 'fixed bottom-0' ở đây để component Player tự quản lý vị trí của nó */}
      <div className="fixed bottom-0 left-0 w-full z-[4000] overflow-visible">
        <Player />
      </div>
    </>
  );
}