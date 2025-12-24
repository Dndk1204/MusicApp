"use client";

import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { GlitchText, CyberCard } from "@/components/CyberComponents";

const SongSection = ({ title, songs, moreLink }) => {
  const player = usePlayer();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  const onPlay = (id) => {
    if (!isAuthenticated) {
      openModal();
      return;
    }
    player.setId(id);
    player.setIds(songs.map((s) => s.id));

    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
  };

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

      {/* GRID HỆ THỐNG: Tự động lấp đầy 2 hàng dựa trên độ phân giải */}
      <div className="
        grid 
        grid-cols-2       /* Mobile: 2 cột (Hiện 3 bài + 1 Card) */
        sm:grid-cols-3    /* Tablet: 3 cột (Hiện 5 bài + 1 Card) */
        md:grid-cols-4    /* Laptop: 4 cột (Hiện 7 bài + 1 Card) */
        lg:grid-cols-5    /* Desktop: 5 cột (Hiện 9 bài + 1 Card) */
        xl:grid-cols-6    /* Wide: 6 cột (Hiện 11 bài + 1 Card) */
        2xl:grid-cols-8   /* Ultra Wide: 8 cột (Hiện 15 bài + 1 Card) */
        gap-3 md:gap-4
      ">
        
        {songs.map((item, index) => (
          <div 
            key={item.id}
            className={`
              /* Logic ẩn/hiện bài hát để grid luôn đẹp */
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

        {/* THẺ XEM THÊM (Luôn nằm ở ô cuối cùng của hàng thứ 2) */}
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

export default SongSection;