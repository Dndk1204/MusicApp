"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import PlayerContent from "./PlayerContent";
import { supabase } from "@/lib/supabaseClient";

const Player = () => {
  const player = usePlayer();
  const [song, setSong] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // --- Reset player khi vào trang ---
  useEffect(() => {
    // Không reset ID ngay lập tức để tránh mất nhạc nếu refresh nhẹ
    // Chỉ reset playing state
    player.setIsPlaying(false); 
    setIsMounted(true);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        player.reset();
        setSong(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // --- Load bài hát ---
  useEffect(() => {
    if (!isMounted) return;

    const loadSongData = async () => {
      if (!player.activeId) {
        setSong(null);
        return;
      }

      try {
        // 1. Tìm trong Supabase
        const { data: dbSong } = await supabase
          .from("songs")
          .select("*")
          .eq("id", player.activeId)
          .single();

        if (dbSong && dbSong.song_url) {
            setSong({
              id: dbSong.id,
              title: dbSong.title,
              author: dbSong.author,
              duration: dbSong.duration,
              song_path: dbSong.song_url,
              image_path: dbSong.image_url,
            });
            return;
        }

        // 2. Fallback Jamendo
        const jamendoId = dbSong?.external_id || player.activeId;
        const CLIENT_ID = "3501caaa";
        const res = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&id=${jamendoId}&audioformat=mp31`
        );
        const json = await res.json();

        if (json.results && json.results[0]) {
            const track = json.results[0];
            const recoveredSong = {
                id: dbSong?.id || jamendoId,
                title: track.name,
                author: track.artist_name,
                duration: track.duration,
                song_path: track.audio,
                image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
            };
            setSong(recoveredSong);

            // Upsert lại để cache
            if (dbSong) {
                await supabase.from("songs").upsert({
                    id: dbSong.id,
                    title: recoveredSong.title,
                    author: recoveredSong.author,
                    duration: recoveredSong.duration,
                    song_url: recoveredSong.song_path,
                    image_url: recoveredSong.image_path,
                    external_id: jamendoId,
                });
            }
        }
      } catch (err) {
        console.error("Load song error:", err);
      }
    };

    loadSongData();
  }, [player.activeId, isMounted]);

  const songUrl = useLoadSongUrl(song);

  // --- QUAN TRỌNG: Logic Auto Play ---
  // Khi có URL mới, tự động báo player phát
  useEffect(() => {
      if (songUrl && player.activeId) {
         // Không cần setPlaying(true) ở đây nữa, 
         // hãy để PlayerContent tự quyết định trong onPlay của Howler
         // để tránh conflict state.
      } 
  }, [songUrl, player.activeId]);


  if (!isMounted) return null;

  // --- LOGIC HIỂN THỊ UI MỚI (FIX LỖI MẤT SESSION) ---
  // Chỉ ẩn player khi THỰC SỰ không có bài nào trong hàng đợi (activeId = null)
  // Nếu activeId có, nhưng song/songUrl chưa load xong -> Vẫn render khung Player (nhưng loading)
  // Điều này giữ cho component không bị unmount -> giữ audio session sống.
  
  if (!player.activeId) {
    return (
      <div className="
        fixed bottom-0 w-full h-[60px] 
        bg-white/80 dark:bg-black/80 backdrop-blur-md 
        border-t border-neutral-300 dark:border-white/10 
        flex items-center justify-center 
        z-50 transition-colors duration-300
      ">
        <p className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px] tracking-[0.2em] uppercase animate-pulse flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none"></span>
           :: SYSTEM_READY_TO_PLAY ::
        </p>
      </div>
    );
  }

  return (
    <div className="
        fixed bottom-0 w-full h-[80px] 
        bg-white/95 dark:bg-black/90 backdrop-blur-xl 
        border-t-2 border-neutral-300 dark:border-emerald-500/30 
        px-4 py-2 z-50 
        shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_30px_rgba(16,185,129,0.1)] 
        transition-all duration-500
    ">
      <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
      
      {/* ⚠️ QUAN TRỌNG NHẤT: BỎ KEY={SONGURL} 
          Việc này giúp PlayerContent KHÔNG BỊ UNMOUNT khi đổi bài.
          Nó chỉ update props -> giữ Audio Element sống -> Chuyển bài mượt khi tắt màn hình.
      */}
      <PlayerContent 
        key="global-player-content" 
        song={song} 
        songUrl={songUrl} 
      />
    </div>
  );
};

export default Player;