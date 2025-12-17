"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import Link from "next/link";
import { ScanlineOverlay } from "@/components/CyberComponents"; 
import HoverImagePreview from "@/components/HoverImagePreview"; 

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const MediaItem = ({ data, onClick }) => {
  // --- 1. THÊM ĐOẠN KIỂM TRA NÀY ĐỂ FIX LỖI ---
  if (!data) {
    return null;
  }
  // ---------------------------------------------

  // Sau khi đảm bảo data không null mới được gọi hook và truy cập thuộc tính
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const imageUrl = useLoadImage(data);
  
  const previewUrl = data.song_url || data.song_path || data.streaming?.mp3;

  return (
    <div 
      // Chỉ stringify khi data chắc chắn tồn tại
      data-song-json={data ? JSON.stringify(data) : ""} 
      className="
        group
        flex items-center gap-x-3 
        w-full p-1.5 
        rounded-none 
        border border-transparent 
        hover:bg-neutral-200/50 dark:hover:bg-white/5 
        hover:border-emerald-500/30
        transition-all duration-300
        cursor-default
      "
      onClick={onClick} 
    >
      {/* 1. ẢNH BÌA */}
      <div className="relative min-h-[42px] min-w-[42px] w-[42px] h-[42px] shrink-0">
          <HoverImagePreview 
              src={imageUrl || "/images/liked.png"} 
              alt={data.title || "Song"} // Thêm fallback cho title
              audioSrc={previewUrl} 
              className="w-full h-full cursor-pointer"
              previewSize={200}
              fallbackIcon="disc"
          >
              <Link 
                href="/now-playing" 
                className="
                    block w-full h-full relative overflow-hidden 
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
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50"></div>
              </Link>
          </HoverImagePreview>
      </div>

      <div className="flex flex-col gap-y-0.5 overflow-hidden">
        {/* 2. TÊN BÀI HÁT */}
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
                href={`/artist/${encodeURIComponent(data.author || "Unknown")}`}
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