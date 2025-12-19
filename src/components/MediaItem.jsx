"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import Link from "next/link";
// Import Scanline để đồng bộ hiệu ứng (nếu muốn), hoặc chỉ dùng CSS thuần cho nhẹ
import { ScanlineOverlay } from "@/components/CyberComponents"; 

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const MediaItem = ({ data, onClick }) => {
  const imageUrl = useLoadImage(data);

  // Xác định nguồn dữ liệu để tạo link chính xác
  // Nếu data.user_id là 'jamendo_api' -> source=jamendo
  // Nếu data.user_id là UUID (từ DB) -> source=local
  const sourceParam = data.user_id === 'jamendo_api' ? 'jamendo' : 'local';

  return (
    <div 
      className="
        group
        flex items-center gap-x-3 
        w-full p-1.5 
        /* Cyber Style: Vuông vức, Border trong suốt mặc định */
        rounded-none 
        border border-transparent 
        
        /* Hover Effect */
        hover:bg-neutral-200/50 dark:hover:bg-white/5 
        hover:border-emerald-500/30
        transition-all duration-300
        cursor-default
      "
    >
      {/* 1. ẢNH BÌA (Vuông vức + Grayscale Effect) */}
      <Link 
        href="/now-playing" 
        className="
            relative min-h-[42px] min-w-[42px] overflow-hidden 
            border border-neutral-400 dark:border-white/20 
            group-hover:border-emerald-500 transition-colors
        "
      >
        <Image
          fill
          src={imageUrl || "/images/liked.png"}
          alt="Media Item"
          className="
            object-cover 
            grayscale group-hover:grayscale-0 
            transition-all duration-500
          "
        />
        {/* Lớp phủ Scanline nhẹ */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50"></div>
      </Link>

      <div className="flex flex-col gap-y-0.5 overflow-hidden">
        {/* 2. TÊN BÀI HÁT: Mono + Uppercase */}
        <Link 
            href="/now-playing"
            className="
                text-xs font-bold font-mono uppercase truncate cursor-pointer 
                text-neutral-900 dark:text-white 
                hover:text-emerald-600 dark:hover:text-emerald-500
                hover:underline decoration-emerald-500 underline-offset-2
                transition-colors
            "
        >
            {data.title}
        </Link>
        
        {/* 3. TÊN NGHỆ SĨ & THỜI GIAN */}
        <div className="flex items-center gap-2">
            <Link
                href={`/artist/${encodeURIComponent(data.author)}?source=${sourceParam}`} // THÊM PARAM SOURCE
                className="
                    text-[10px] font-mono truncate cursor-pointer 
                    text-neutral-500 dark:text-neutral-400
                    hover:text-neutral-900 dark:hover:text-white
                    transition-colors
                "
            >
                {data.author}
            </Link>

            {formatDuration(data.duration) && (
              <>
                <span className="text-[8px] text-neutral-300 dark:text-neutral-600">•</span>
                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono truncate">
                    {formatDuration(data.duration)}
                </span>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
 
export default MediaItem;