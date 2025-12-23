"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import { Play } from "lucide-react";
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer"; // 1. Import hook usePlayer

// Import Cyber Components
import { ScanlineOverlay, CyberCard } from "./CyberComponents";
// Import Hover Preview Component
import HoverImagePreview from "@/components/HoverImagePreview";

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SongItem = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);
  const player = usePlayer(); // 2. Khởi tạo player store

  // 3. Hàm xử lý khi click vào bài hát
  const handlePlay = () => {
    player.setSongData(data); // Đưa toàn bộ thông tin bài hát vào songData của store
    onClick(data.id);         // Gọi hàm phát nhạc chính (thường là setId)
  };

  const sourceParam = data.user_id === 'jamendo_api' ? 'jamendo' : 'local';

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
      {/* 4. Thay đổi onClick từ onClick(data.id) thành handlePlay */}
      <div onClick={handlePlay} className="w-full" data-song-json={JSON.stringify(data)}>
          
          {/* 1. ẢNH CONTAINER */}
          <div className="relative w-full aspect-square bg-neutral-200 dark:bg-neutral-800 overflow-hidden border-b border-neutral-300 dark:border-white/10 group/img">
            
            <HoverImagePreview
                src={imagePath || '/images/music-placeholder.png'}
                alt={data.title}
                audioSrc={data.song_url || data.song_path} 
                className="w-full h-full"
                previewSize={240}
            >
                <div className="relative w-full h-full">
                    <Image
                      className="
                        object-cover transition-all duration-700 
                        grayscale 
                        group-hover:grayscale-0 
                        group-hover/img:scale-110 
                        group-hover/img:blur-[2px]
                      "
                      src={imagePath || '/images/music-placeholder.png'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      alt="Image"
                    />
                    
                    <ScanlineOverlay />
                    
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                        <div className="bg-emerald-500 text-black p-3 shadow-[0_0_20px_rgba(16,185,129,0.4)] transform scale-50 group-hover/img:scale-100 transition duration-300 border border-emerald-400">
                            <Play size={24} fill="black" className="ml-1" />
                        </div>
                    </div>
                </div>
            </HoverImagePreview>

          </div>

          {/* 2. THÔNG TIN */}
          <div className="p-3 flex flex-col gap-1 relative bg-white/50 dark:bg-transparent">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <p className="font-bold font-mono truncate w-full text-sm text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                {data.title}
            </p>

            <div className="flex items-center justify-between w-full border-t border-dashed border-neutral-300 dark:border-white/10 pt-2 mt-1">
              <div className="flex items-center gap-2 truncate max-w-[70%]">
                <span className="w-1 h-1 bg-emerald-500 shrink-0"></span>
                <Link
                  href={`/artist/${encodeURIComponent(data.author)}?source=${sourceParam}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono tracking-wider hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors truncate"
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