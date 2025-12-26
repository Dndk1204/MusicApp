"use client";

import React, { memo } from "react";
import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import { Play, Volume2 } from "lucide-react"; // Thêm Volume2 làm icon active
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer";

import { ScanlineOverlay, CyberCard } from "./CyberComponents";
import HoverImagePreview from "@/components/HoverImagePreview";
import LikeButton from "./LikeButton";

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SongItem = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);

  // Lấy thêm isPlaying để làm hiệu ứng động
  const isActive = usePlayer((state) => state.activeId === data.id);
  const isPlaying = usePlayer((state) => state.isPlaying); 
  const setSongData = usePlayer((state) => state.setSongData);
  const setId = usePlayer((state) => state.setId);

  const handlePlay = (e) => {
    e.stopPropagation();
    setSongData(data);
    if (onClick) {
        onClick(data.id);
    } else {
        setId(data.id);
    }
  };

  const sourceParam = data.user_id === 'jamendo_api' ? 'jamendo' : 'local';

  return (
    <CyberCard 
      className={`
        group relative p-0 
        bg-white dark:bg-neutral-900/40 
        border transition-all duration-500 cursor-pointer 
        flex flex-col gap-0 rounded-none overflow-hidden
        ${isActive 
          ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50' 
          : 'border-neutral-300 dark:border-white/10'}
        hover:border-emerald-500
      `}
    >
      <div onClick={handlePlay} className="w-full relative">
          
          {/* NHÃN NOW PLAYING - Chỉ hiện khi Active */}
          {isActive && (
            <div className="absolute top-2 left-2 z-30 bg-emerald-500 text-black text-[7px] font-black px-1.5 py-0.5 font-mono tracking-tighter animate-pulse shadow-lg">
              NOW_PLAYING
            </div>
          )}

          {/* ẢNH CONTAINER */}
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
                      className={`
                        object-cover transition-all duration-700 
                        group-hover/img:scale-110 
                        ${isActive ? 'grayscale-0 scale-105 blur-[1px]' : 'grayscale group-hover:grayscale-0 group-hover/img:blur-[2px]'}
                      `}
                      src={imagePath || '/images/music-placeholder.png'}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      alt="Song Cover"
                    />
                    
                    <ScanlineOverlay />
                    
                    {/* HIỆU ỨNG SÓNG NHẠC (VISUALIZER MINI) - Xuất hiện khi Active */}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 backdrop-blur-[1px]">
                         {[1, 2, 3, 4].map((bar) => (
                           <div 
                             key={bar}
                             className={`w-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] ${isPlaying ? 'animate-vhs-bar' : 'h-2'}`}
                             style={{ 
                               height: isPlaying ? '100%' : '8px',
                               animationDelay: `${bar * 0.1}s`,
                               maxHeight: '24px'
                             }}
                           />
                         ))}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300"></div>

                    {/* Nút Play hover (Chỉ hiện khi KHÔNG active) */}
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/img:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                          <div className="bg-emerald-500 text-black p-3 shadow-[0_0_20px_rgba(16,185,129,0.4)] transform scale-50 group-hover/img:scale-100 transition duration-300 border border-emerald-400">
                              <Play size={24} fill="black" className="ml-1" />
                          </div>
                      </div>
                    )}
                </div>
            </HoverImagePreview>
          </div>

          {/* THÔNG TIN */}
          <div className="p-3 flex flex-col gap-1 relative bg-white/50 dark:bg-black/20">
            {/* Góc trang trí Cyberpunk khi Active */}
            {isActive && <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500"></div>}

            <p className={`font-bold font-mono truncate w-full text-sm transition-colors ${isActive ? 'text-emerald-500' : 'text-neutral-900 dark:text-white group-hover:text-emerald-500'}`}>
                {isActive && <Volume2 size={12} className="inline mr-2 mb-1 animate-bounce" />}
                {data.title}
            </p>

            <div className="flex items-center justify-between w-full border-t border-dashed border-neutral-300 dark:border-white/10 pt-2 mt-1">
              <div className="flex items-center gap-2 truncate max-w-[60%]">
                <span className={`w-1 h-1 shrink-0 ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-neutral-400'}`}></span>
                <Link
                  href={`/artist/${encodeURIComponent(data.author)}?source=${sourceParam}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-[10px] font-mono tracking-wider hover:underline transition-colors truncate ${isActive ? 'text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                >
                  {data.author}
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <LikeButton songId={data.id} size={14} />
                <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-emerald-500/70' : 'text-neutral-400 dark:text-neutral-500'}`}>
                  {formatDuration(data.duration)}
                </span>
              </div>
            </div>
          </div>
      </div>
    </CyberCard>
  );
};

export default memo(SongItem);
