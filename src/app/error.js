"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Home, AlertTriangle, Terminal } from "lucide-react";
import { ScanlineOverlay, VerticalGlitchText } from "@/components/CyberComponents";
import Link from "next/link";

export default function Error({ error, reset }) {
  const [isRebooting, setIsRebooting] = useState(false);

  useEffect(() => {
    console.error("SYSTEM_FAILURE:", error);
  }, [error]);

  const handleReset = () => {
    setIsRebooting(true);
    // Tăng thời gian chờ lên 600ms để người dùng kịp thấy hiệu ứng tắt màn hình
    setTimeout(() => {
      reset();
    }, 600);
  };

  return (
    <div className="h-[33.1rem] min-h-full w-full flex items-center justify-center bg-black relative overflow-hidden">
      
      {/* 1. HIỆU ỨNG TIA SÁNG TRẮNG KHI TẮT */}
      {isRebooting && <div className="animate-flash-line white-flash" />}

      {/* --- MỚI: HIỆU ỨNG NỀN FULL MÀN HÌNH (ĐƯA RA NGOÀI) --- */}
    {!isRebooting && (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Hạt nhiễu toàn màn hình */}
        <div className="noise-container"></div>
        {/* Quét dòng toàn màn hình */}
        <ScanlineOverlay className="opacity-20" />
    </div>
    )}

      {/* 2. CONTAINER CHỨA NỘI DUNG - SẼ CO LẠI KHI REBOOT */}
      <div className={`
        relative z-30 flex flex-col items-center max-w-md w-full text-center p-4 transition-all
        ${isRebooting ? 'animate-tv-off' : ''}
      `}>

        {/* ERROR ICON */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20"></div>
          <div className="relative z-10 bg-black border border-red-500/50 p-5">
             <AlertTriangle size={48} className="text-red-500" />
          </div>
        </div>

        <h2 className="text-3xl md:text-5xl font-black font-mono tracking-tighter text-white uppercase mb-2">
          <VerticalGlitchText text="CRITICAL_ERR" />
        </h2>
        
        <p className="text-emerald-500/60 font-mono text-[10px] tracking-[0.4em] uppercase mb-8">
          :: Signal_Lost // Node_Destroyed ::
        </p>

        {/* LOG BOX */}
        <div className="w-full bg-red-900/10 border border-red-500/30 p-4 mb-8 text-left font-mono backdrop-blur-md">
           <div className="flex items-center gap-2 mb-2 border-b border-red-500/20 pb-2">
              <Terminal size={14} className="text-red-500" />
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Core_Dump</span>
           </div>
           <p className="text-[11px] text-red-400/80 break-all leading-relaxed italic">
              {error.message || "Unexpected core exception."}
           </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-black font-mono font-bold py-4 hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <RotateCcw size={18} />
            REBOOT
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 border border-white/10 bg-white/5 font-mono font-bold py-4 hover:bg-white/10 transition-all text-white/70"
          >
            <Home size={18} />
            EXIT
          </Link>
        </div>
      </div>

      {/* GRADIENT NỀN CỐ ĐỊNH */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-gradient-to-tr from-red-600 via-transparent to-emerald-500 z-10"></div>
    </div>
  );
}