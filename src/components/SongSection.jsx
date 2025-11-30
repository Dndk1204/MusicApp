"use client";

import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import Link from "next/link"; 
import { ArrowRight } from "lucide-react"; 

const SongSection = ({ title, songs, moreLink }) => {
  const player = usePlayer();

  const onPlay = (id) => {
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
    <div className="mb-8"> {/* Giảm mb-12 -> mb-8 */}
      
      {title && (
        <div className="flex items-center justify-between mb-3"> {/* Giảm mb-4 -> mb-3 */}
           <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div> {/* Giảm h-6 -> h-5 */}
              {/* Giảm text-xl -> text-lg */}
              <h2 className="text-lg font-bold font-mono tracking-tighter text-neutral-800 dark:text-white uppercase">
                  {title}
              </h2>
           </div>
           
           {moreLink && (
               <Link href={moreLink} className="text-[10px] font-mono text-neutral-500 hover:text-emerald-500 transition hidden sm:block">
                   VIEW_ALL {'>'}
               </Link>
           )}
        </div>
      )}

      {/* Grid bài hát: Đồng bộ với trang chủ (lên tới 10 cột) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
        
        {songs.map((item) => (
          <SongItem 
            key={item.id} 
            onClick={onPlay} 
            data={item} 
          />
        ))}

        {/* Thẻ Xem Thêm (Thu nhỏ lại) */}
        {moreLink && (
            <Link href={moreLink} className="
                group relative flex flex-col items-center justify-center 
                rounded-md overflow-hidden cursor-pointer transition-all duration-300 p-2
                bg-neutral-200/30 dark:bg-neutral-900/40
                border border-white/60 dark:border-white/5
                backdrop-blur-xl
                shadow-sm dark:shadow-none
                hover:bg-white/60 dark:hover:bg-neutral-800/60
                hover:border-emerald-500/50
                hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.2)]
                hover:-translate-y-1
            ">
                <div className="w-full aspect-square rounded-md bg-neutral-300/50 dark:bg-white/5 flex flex-col items-center justify-center gap-2 transition-colors group-hover:bg-emerald-500/20">
                    <div className="p-2 rounded-full bg-white dark:bg-black group-hover:scale-110 transition duration-300 border border-neutral-200 dark:border-white/10 group-hover:border-emerald-500">
                        <ArrowRight size={18} className="text-neutral-600 dark:text-white group-hover:text-emerald-500"/> {/* Size 24 -> 18 */}
                    </div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-neutral-600 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        VIEW_ALL
                    </span>
                </div>
            </Link>
        )}

      </div>
    </div>
  );
};

export default SongSection;