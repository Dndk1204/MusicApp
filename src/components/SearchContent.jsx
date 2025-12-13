"use client";

import { Play, ChevronDown, Mic2, Disc } from "lucide-react";
import usePlayer from "@/hooks/usePlayer";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
import { useEffect, useState } from "react";
import Link from "next/link";
// Import Cyber Components
import { HoloButton, ScanlineOverlay, CyberCard } from "@/components/CyberComponents";
// Import Hover Preview
import HoverImagePreview from "@/components/HoverImagePreview"; 

// Helper Format Time
const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SearchContent = ({ songs }) => {
  const player = usePlayer();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  // --- PAGINATION STATE ---
  const BATCH_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
      setVisibleCount(BATCH_SIZE);
  }, [songs]);

  useEffect(() => {
      const songMap = {};
      songs.forEach(song => songMap[song.id] = song);
      if (typeof window !== "undefined") {
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
      }
  }, [songs]);

  const handlePlay = (id) => {
    if (!isAuthenticated) {
      openModal();
      return;
    }
    player.setId(id);
    player.setIds(songs.map((song) => song.id));
  };

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + BATCH_SIZE);
  };

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-10 opacity-50 gap-2">
        <Disc size={40} className="text-neutral-400"/>
        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">[DATABASE_EMPTY]</p>
      </div>
    );
  }

  const visibleSongs = songs.slice(0, visibleCount);
  const hasMore = visibleCount < songs.length;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        
      {/* GRID SONGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleSongs.map((song, idx) => (
          <CyberCard 
            key={song.id}
            // data-song-json ở đây có thể bị CyberCard nuốt mất, nên ta thêm vào bên trong (xem dưới)
            className="
                group relative p-0 
                bg-white dark:bg-neutral-900/40 
                border border-neutral-300 dark:border-white/10 
                hover:border-emerald-500 dark:hover:border-emerald-500
                transition-all cursor-pointer 
                flex flex-col gap-0
                rounded-none
            "
          >
             {/* 1. ẢNH CONTAINER - THÊM DATA VÀO ĐÂY */}
             <div 
                data-song-json={JSON.stringify(song)} // <--- THÊM VÀO ĐÂY (Vùng ảnh)
                onClick={() => handlePlay(song.id)} 
                className="relative w-full aspect-square bg-neutral-200 dark:bg-neutral-800 overflow-hidden border-b border-neutral-300 dark:border-white/10 group/img"
             >
                <HoverImagePreview
                    src={song.image_url || song.image_path || '/images/music-placeholder.png'}
                    alt={song.title}
                    audioSrc={song.song_url || song.song_path}
                    className="w-full h-full relative"
                    previewSize={240}
                >
                    <div className="w-full h-full relative">
                        <img
                          src={song.image_url || song.image_path || '/images/music-placeholder.png'}
                          alt={song.title}
                          className="
                            w-full h-full object-cover transition-all duration-700 
                            grayscale group-hover:grayscale-0 
                            group-hover/img:scale-110 
                            group-hover/img:blur-[2px]
                          "
                        />
                        <ScanlineOverlay />
                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity"></div>

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all duration-300 backdrop-blur-none group-hover/img:backdrop-blur-[2px] bg-black/20">
                            <div className="bg-emerald-500 text-black p-3 shadow-[0_0_20px_rgba(16,185,129,0.4)] transform scale-50 group-hover/img:scale-100 transition duration-300 border border-emerald-400">
                              <Play size={24} fill="black" className="ml-1"/>
                            </div>
                        </div>

                        <span className="absolute top-2 right-2 text-[40px] font-black font-mono text-white/10 pointer-events-none leading-none z-10">
                            {idx + 1 < 10 ? `0${idx+1}` : idx+1}
                        </span>
                    </div>
                </HoverImagePreview>
             </div>

             {/* 2. INFO SECTION - THÊM DATA VÀO ĐÂY NỮA */}
             <div 
                data-song-json={JSON.stringify(song)} // <--- THÊM VÀO ĐÂY (Vùng thông tin)
                className="p-3 flex flex-col gap-1 relative bg-white/50 dark:bg-black/20"
             >
                <h3 className="font-bold text-neutral-900 dark:text-white font-mono truncate text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition">
                  {song.title}
                </h3>
                
                <div className="flex items-center justify-between w-full border-t border-dashed border-neutral-300 dark:border-white/10 pt-2 mt-1">
                   <div className="flex items-center gap-2 truncate max-w-[70%]">
                     <div className="w-1 h-1 bg-emerald-500 shrink-0"></div>
                     <Link
                       href={`/artist/${encodeURIComponent(song.author)}`}
                       onClick={(e) => e.stopPropagation()} 
                       className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors truncate"
                     >
                        {song.author}
                     </Link>
                   </div>
                   
                   <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0">
                       {formatDuration(song.duration)}
                   </span>
                </div>
             </div>
          </CyberCard>
        ))}
      </div>

      {hasMore && (
          <div className="flex justify-center mt-10 pt-6 border-t border-dashed border-neutral-300 dark:border-white/10">
              <HoloButton 
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-8 py-2 text-xs border-neutral-400 dark:border-white/20 text-neutral-600 dark:text-neutral-300"
              >
                  LOAD_MORE_RESULTS <ChevronDown size={14}/>
              </HoloButton>
          </div>
      )}
    </div>
  );
};

export default SearchContent;