"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import useLoadSongUrl from "@/hooks/useLoadSongUrl";
import PlayerContent from "./PlayerContent";
import { supabase } from "@/lib/supabaseClient";

const formatDuration = (seconds) => {
  if (!seconds) return "00:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" + sec : sec}`;
};

const Player = () => {
  const player = usePlayer();
  const [song, setSong] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  /* ------------------------------------------------------
     Reset player khi SIGNED_OUT
  ------------------------------------------------------ */
  useEffect(() => {
    setIsMounted(true);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        player.setId(null);
        player.setIds([]);
        setSong(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  /* ------------------------------------------------------
     Load bài hát từ Supabase trước — nếu thiếu mới gọi Jamendo
  ------------------------------------------------------ */
  useEffect(() => {
    if (!isMounted) return;

    const loadSongData = async () => {
      if (!player.activeId) {
        setSong(null);
        return;
      }

      try {
        /* ------------------------------------------------------
           1️⃣ Lấy bài hát từ Supabase
        ------------------------------------------------------ */
        const { data: dbSong } = await supabase
          .from("songs")
          .select("*")
          .eq("id", player.activeId)
          .single();

        if (dbSong) {
          // Nếu bài đã có URL → dùng luôn
          if (dbSong.song_url) {
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
        }

        /* ------------------------------------------------------
           2️⃣ Nếu không có trong Supabase → fetch bằng Jamendo ID
           YÊU CẦU: bảng songs có trường `external_id` = id Jamendo
        ------------------------------------------------------ */
        const jamendoId = dbSong?.external_id || player.activeId;

        const CLIENT_ID = "3501caaa";
        const res = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&id=${jamendoId}&audioformat=mp32`
        );
        const json = await res.json();

        if (!json.results || !json.results[0]) {
          console.warn("Không tìm thấy song trên Jamendo:", jamendoId);
          return;
        }

        const track = json.results[0];

        const recoveredSong = {
          id: dbSong?.id || jamendoId,
          title: track.name,
          author: track.artist_name,
          duration: track.duration,
          song_path: track.audio,
          image_path:
            track.image ||
            track.album_image ||
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
        };

        setSong(recoveredSong);

        /* ------------------------------------------------------
           3️⃣ Upsert lại vào Supabase để lần sau load nhanh hơn
        ------------------------------------------------------ */
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
      } catch (err) {
        console.error("Load song error:", err);
      }
    };

    loadSongData();
  }, [player.activeId, isMounted]);

  const songUrl = useLoadSongUrl(song);

  if (!isMounted) return null;

  if (!song || !songUrl || !player.activeId) {
    return (
      <div className="fixed bottom-0 w-full h-[68px] bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-neutral-200 dark:border-white/5 flex items-center justify-center z-50 transition-colors duration-300">
        <p className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">
          :: SYSTEM_READY_TO_PLAY ::
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 w-full h-[72px] bg-white/90 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-white/10 px-4 py-1 z-50 backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transition-all duration-500">
      <PlayerContent key={songUrl} song={song} songUrl={songUrl} />
    </div>
  );
};

export default Player;
