"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { LayoutGrid, X, ListMusic, Mic2, Sliders, MessageSquare } from "lucide-react";

const MobileRadialNav = ({ activeTab, setActiveTab }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [side, setSide] = useState("right"); // 'left' hoặc 'right' để biết đang ở cạnh nào
  const controls = useAnimation();

  // Khoảng cách từ tâm nút đến các icon
  const RADIUS = 90;
  // Khoảng cách an toàn từ lề màn hình
  const PADDING = 40;

  // Fix lỗi lệch: Dùng useEffect để đưa menu về vị trí mặc định ban đầu (ví dụ bên phải)
  useEffect(() => {
    const screenWidth = window.innerWidth;
    controls.set({ x: screenWidth - PADDING, y: window.innerHeight - 150 });
    setSide("right");
  }, [controls]);

  const handleDragEnd = (event, info) => {
    const screenWidth = window.innerWidth;
    const currentX = info.point.x;
    const threshold = screenWidth / 2;

    let targetX;
    if (currentX > threshold) {
      targetX = screenWidth - PADDING;
      setSide("right");
    } else {
      targetX = PADDING;
      setSide("left");
    }

    controls.start({
      x: targetX,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    });
  };

  // Hàm tính toán vị trí icon theo hình bán tròn
  // Nếu side = left: tỏa ra phía bên phải (góc -60 đến 60 độ)
  // Nếu side = right: tỏa ra phía bên trái (góc 120 đến 240 độ)
  const getTabPos = (index) => {
    const angles = side === "left" 
      ? [-60, -20, 20, 60] // Hướng sang phải
      : [120, 160, 200, 240]; // Hướng sang trái
    
    const angle = angles[index] * (Math.PI / 180); // Đổi sang Radian
    return {
      x: Math.cos(angle) * RADIUS,
      y: Math.sin(angle) * RADIUS
    };
  };

  const tabs = [
    { id: 'queue', icon: <ListMusic size={20}/>, label: 'QUEUE' },
    { id: 'lyrics', icon: <Mic2 size={20}/>, label: 'LYRICS' },
    { id: 'equalizer', icon: <Sliders size={20}/>, label: 'EQ' },
    { id: 'comments', icon: <MessageSquare size={20}/>, label: 'COMM' },
  ];

  return (
    // Xóa left-1/2 và translate-x-1/2, dùng fixed top-0 left-0 để khớp tọa độ drag
    <motion.div 
      drag
      dragMomentum={false}
      animate={controls}
      onDragEnd={handleDragEnd}
      className="lg:hidden fixed top-0 -left-7 z-[99999] touch-none"
      style={{ x: 0, y: 0 }} // Khởi tạo giá trị x, y
    >
      <div className="relative flex items-center justify-center">
        
        <AnimatePresence>
          {isExpanded && tabs.map((tab, index) => {
            const pos = getTabPos(index);
            return (
              <motion.button
                key={tab.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{ x: pos.x, y: pos.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsExpanded(false);
                }}
                className={`absolute w-11 h-11 flex flex-col items-center justify-center border-2 backdrop-blur-md ${
                  activeTab === tab.id 
                  ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.6)]' 
                  : 'bg-black/90 border-emerald-500/50 text-emerald-500'
                }`}
              >
                {tab.icon}
                <span className="text-[6px] font-mono font-bold mt-0.5">{tab.label}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative z-10 w-14 h-14 flex items-center justify-center border-2 transition-all duration-500 ${
            isExpanded 
            ? 'bg-red-500/20 border-red-500 text-red-500 rotate-90' 
            : 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
          }`}
        >
          {isExpanded ? <X size={28} /> : <LayoutGrid size={28} />}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MobileRadialNav;