"use client";

import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import { useEffect } from "react";

const SongSection = ({ title, songs }) => {
  const player = usePlayer();

  // Logic phát nhạc
  const onPlay = (id) => {
    player.setId(id);
    // Cập nhật list phát cho player (chỉ phát trong section này)
    player.setIds(songs.map((s) => s.id));
    
    // Cập nhật map toàn cục để Player hiển thị thông tin
    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
  };

  if (!songs || songs.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Tiêu đề mục */}
      <div className="flex items-center gap-2 mb-4">
         <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
         <h2 className="text-xl font-bold font-mono tracking-tighter text-neutral-800 dark:text-white uppercase">
            {title}
         </h2>
      </div>

      {/* Grid bài hát */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {songs.map((item) => (
          <SongItem 
            key={item.id} 
            onClick={onPlay} 
            data={item} 
          />
        ))}
      </div>
    </div>
  );
};

export default SongSection;