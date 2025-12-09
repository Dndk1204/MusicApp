"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import { Play } from "lucide-react";
import Link from "next/link";
// Import Cyber Components
import { ScanlineOverlay, CyberCard } from "./CyberComponents";

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SongItem = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);

  return (
    <CyberCard 
      className="
        group relative p-0 
        bg-white dark:bg-neutral-900/40 
        border border-neutral-300 dark:border-white/10 
        hover:border-emerald-500 dark:hover:border-emerald-500
        transition-all cursor-pointer 
        flex flex-col gap-0
        rounded-none
        overflow-hidden
      "
    >
      <div onClick={() => onClick(data.id)} className="w-full">
          
          {/* 1. ẢNH CONTAINER */}
          {/* Thêm class group/img để xử lý hover riêng cho vùng ảnh */}
          <div className="relative w-full aspect-square bg-neutral-200 dark:bg-neutral-800 overflow-hidden border-b border-neutral-300 dark:border-white/10 group/img">
            <Image
              className="
                object-cover transition-all duration-700 
                
                /* Mặc định: Trắng đen */
                grayscale 
                
                /* Hover vào THẺ (group): Trở về màu gốc */
                group-hover:grayscale-0 
                
                /* Hover vào ẢNH (group/img): Phóng to + Mờ */
                group-hover/img:scale-110 
                group-hover/img:blur-[2px]
              "
              src={imagePath || '/images/music-placeholder.png'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt="Image"
            />
            
            {/* Scanline Overlay (Luôn hiện) */}
            <ScanlineOverlay />
            
            {/* Hover Tint (Chỉ hiện khi hover vào ảnh) */}
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>

            {/* Play Button Overlay (Chỉ hiện khi hover vào ảnh) */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                <div className="bg-emerald-500 text-black p-3 shadow-[0_0_20px_rgba(16,185,129,0.4)] transform scale-50 group-hover/img:scale-100 transition duration-300 border border-emerald-400">
                    <Play size={24} fill="black" className="ml-1" />
                </div>
            </div>
          </div>

          {/* 2. THÔNG TIN (Tech Info Style) */}
          <div className="p-3 flex flex-col gap-1 relative bg-white/50 dark:bg-transparent">
            {/* Decor Corner */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <p className="font-bold font-mono truncate w-full text-sm text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors uppercase">
                {data.title}
            </p>

            <div className="flex items-center justify-between w-full border-t border-dashed border-neutral-300 dark:border-white/10 pt-2 mt-1">
              <div className="flex items-center gap-2 truncate max-w-[70%]">
                <span className="w-1 h-1 bg-emerald-500 shrink-0"></span>
                <Link
                  href={`/artist/${encodeURIComponent(data.author)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors truncate"
                >
                  {data.author}
                </Link>
              </div>
              
              {formatDuration(data.duration) && (
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
                    {formatDuration(data.duration)}
                </span>
              )}
            </div>
          </div>

      </div>
    </CyberCard>
  );
};

export default SongItem;