"use client";

import React, { memo, useCallback } from "react"; // 1. Thêm memo và useCallback
import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { GlitchText, CyberCard } from "@/components/CyberComponents";

const SongSection = ({ title, songs, moreLink }) => {
  // 2. CÁCH 2: CHỈ LẤY CÁC HÀM CẦN THIẾT
  // Chúng ta không lấy 'activeId' ở đây vì bản thân SongSection không dùng nó để hiển thị.
  // Việc loại bỏ activeId giúp Section này KHÔNG re-render khi bài hát thay đổi.
  const setId = usePlayer((state) => state.setId);
  const setIds = usePlayer((state) => state.setIds);
  
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  // 3. Sử dụng useCallback để hàm không bị tạo lại mỗi khi render
  const onPlay = useCallback((id) => {
    if (!isAuthenticated) {
      openModal();
      return;
    }

    // Sửa lỗi: Gọi trực tiếp hàm từ selector
    setId(id);
    setIds(songs.map((s) => s.id));

    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
  }, [isAuthenticated, openModal, setId, setIds, songs]);

  if (!songs || songs.length === 0) return null;

  return (
    <div className="mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION HEADER */}
      {title && (
        <div className="flex items-center justify-between mb-3 md:mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
              <h2 className="text-base md:text-lg font-bold font-mono tracking-tighter text-neutral-900 dark:text-white uppercase flex items-center gap-2 truncate">
                  <GlitchText text={title} />
              </h2>
           </div>
           
           {moreLink && (
               <Link href={moreLink} className="group flex items-center gap-1 text-[9px] md:text-[10px] font-mono font-bold tracking-widest text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase shrink-0">
                   <span className="hidden xs:inline">VIEW_ALL</span> 
                   <span className="xs:hidden">ALL</span>
                   <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform"/>
               </Link>
           )}
        </div>
      )}

      {/* GRID HỆ THỐNG */}
      <div className="
        grid 
        grid-cols-2 
        sm:grid-cols-3 
        md:grid-cols-4 
        lg:grid-cols-5 
        xl:grid-cols-6 
        2xl:grid-cols-8 
        gap-3 md:gap-4
      ">
        {songs.map((item, index) => (
          <div 
            key={item.id}
            data-song-json={JSON.stringify(item)}
            className={`
              ${index < 3 ? "block" : "hidden"}
              ${index >= 3 && index < 5 ? "sm:block" : ""}
              ${index >= 5 && index < 7 ? "md:block" : ""}
              ${index >= 7 && index < 9 ? "lg:block" : ""}
              ${index >= 9 && index < 11 ? "xl:block" : ""}
              ${index >= 11 && index < 15 ? "2xl:block" : ""}
            `}
          >
            <SongItem 
              onClick={onPlay} 
              data={item} 
            />
          </div>
        ))}

        {/* THẺ XEM THÊM */}
        {moreLink && (
            <Link href={moreLink} className="block relative h-full min-h-[160px] md:min-h-[200px]"> 
                <CyberCard 
                    className="
                        group w-full h-full p-0
                        bg-neutral-200/50 dark:bg-white/5 
                        border border-dashed border-neutral-400 dark:border-white/20 
                        hover:border-emerald-500 hover:border-solid hover:bg-emerald-500/10 
                        transition-all duration-300 cursor-pointer rounded-none
                        relative flex flex-col items-center justify-center
                    "
                >
                    <div className="flex flex-col items-center justify-center p-4 z-10 w-full h-full">
                        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-neutral-400 dark:border-white/20 bg-white dark:bg-black group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors duration-300 relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            <ArrowRight size={18} className="text-neutral-600 dark:text-white group-hover:text-emerald-500 group-hover:translate-x-1 transition-transform duration-300 md:scale-110"/>
                        </div>
                        
                        <span className="mt-2 md:mt-3 text-[9px] md:text-[10px] font-mono font-bold tracking-[0.2em] text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 uppercase text-center">
                            VIEW_ARCHIVE
                        </span>
                    </div>
                </CyberCard>
            </Link>
        )}
      </div>
    </div>
  );
};

export default memo(SongSection);