"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import PlayerContent from "./PlayerContent";

const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

const Player = () => {
  const player = usePlayer();
  const [song, setSong] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadSongData = async () => {
        if (!player.activeId) {
            setSong(null);
            return;
        }

        if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
            const songData = window.__SONG_MAP__[player.activeId];
            setSong(songData);
            return;
        }

        console.log("Re-fetching song info for ID:", player.activeId);
        try {
            const CLIENT_ID = '3501caaa'; 
            const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${player.activeId}&include=musicinfo+lyrics&audioformat=mp32`);
            const data = await res.json();

            if (data.results && data.results[0]) {
                const track = data.results[0];
                const recoveredSong = {
                    id: track.id,
                    title: track.name,
                    author: track.artist_name,
                    song_path: track.audio,
                    image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                    duration: formatDuration(track.duration),
                    lyrics: track.musicinfo?.lyrics || null,
                    user_id: 'jamendo_api'
                };
                
                setSong(recoveredSong);
                
                if (typeof window !== 'undefined') {
                    window.__SONG_MAP__ = { ...window.__SONG_MAP__, [recoveredSong.id]: recoveredSong };
                }
            }
        } catch (error) {
            console.error("Error recovering song:", error);
        }
    };

    loadSongData();
  }, [player.activeId, isMounted]);

  const songUrl = useLoadSongUrl(song);

  if (!isMounted) return null;

  if (!song || !songUrl || !player.activeId) {
    // Giảm chiều cao thanh chờ từ 80px -> 68px
    return (
      <div className="fixed bottom-0 w-full h-[68px] bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-neutral-200 dark:border-white/5 flex items-center justify-center z-50 transition-colors duration-300">
         <p className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">
            :: SYSTEM_READY_TO_PLAY ::
         </p>
      </div>
    );
  }

  // Giảm chiều cao thanh player chính từ 90px -> 72px
  return (
    <div className="fixed bottom-0 w-full h-[72px] bg-white/90 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-white/10 px-4 py-1 z-50 backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transition-all duration-500">
      <PlayerContent key={songUrl} song={song} songUrl={songUrl} />
    </div>
  );
}

export default Player;