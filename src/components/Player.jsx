"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";

import PlayerContent from "./PlayerContent";

const Player = () => {
  const player = usePlayer();
  const [song, setSong] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && player.activeId && window.__SONG_MAP__) {
      const songData = window.__SONG_MAP__[player.activeId];
      setSong(songData || null);
    } else {
      setSong(null);
    }
  }, [player.activeId]);

  const songUrl = useLoadSongUrl(song);

  if (!song || !songUrl || !player.activeId) {
    return (
      // Light: bg-white/80 | Dark: glass mặc định (đã chỉnh ở bước trước là trong suốt)
      <div className="fixed bottom-0 w-full h-[80px] bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-neutral-200 dark:border-white/5 flex items-center justify-center z-50 transition-colors duration-300">
         <p className="text-neutral-500 dark:text-neutral-400 font-mono text-xs tracking-widest uppercase animate-pulse">
            :: SYSTEM_READY_TO_PLAY ::
         </p>
      </div>
    );
  }

  return (
    // Light: Nền trắng đục + Shadow | Dark: Glass đen + Shadow
    <div className="fixed bottom-0 w-full h-[90px] bg-white/90 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-white/10 px-4 py-2 z-50 backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transition-all duration-500">
      <PlayerContent key={songUrl} song={song} songUrl={songUrl} />
    </div>
  );
}

export default Player;