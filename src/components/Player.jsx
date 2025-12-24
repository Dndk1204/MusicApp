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

  /* ------------------------------------------------------
      1. INITIALIZE & AUTH LISTENER
      Reset player khi component mount hoặc user đăng xuất
  ------------------------------------------------------ */
  useEffect(() => {
    setIsMounted(true);

    // Reset player khi F5 trang (để tránh trạng thái không đồng bộ)
    player.setId(null);
    player.setIds([]);
    player.setIsPlaying(false);
    setSong(null);

    // Lắng nghe sự kiện đăng xuất để dọn dẹp
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        player.setId(null);
        player.setIds([]);
        player.setIsPlaying(false);
        setSong(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  /* ------------------------------------------------------
      2. FETCH SONG DATA
      Ưu tiên lấy từ Supabase DB -> Nếu thiếu mới gọi API /get-song (để tránh duplicate calls)
  ------------------------------------------------------ */
  useEffect(() => {
    if (!isMounted) return;

    const loadSongData = async () => {
      // Nếu không có activeId (chưa chọn bài), reset song và dừng phát
      if (!player.activeId) {
        setSong(null);
        player.setIsPlaying(false);
        return;
      }

      // Prevent duplicate API calls for same song ID
      const currentActiveId = player.activeId;

      try {
        // A. Thử lấy bài hát từ Database (Supabase)
        const { data: dbSong } = await supabase
          .from("songs")
          .select("*")
          .eq("id", currentActiveId)
          .single();

        // Nếu có trong DB và đã có URL -> Dùng luôn (Nhanh nhất)
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

        // B. Nếu không có hoặc thiếu URL -> Gọi API route /get-song (thay vì gọi trực tiếp)
        console.log(`[Player] Fetching song from API: ${currentActiveId}`);

        const res = await fetch(`/api/get-song?id=${currentActiveId}`);
        const data = await res.json();

        if (!res.ok || !data.song) {
          console.warn(`[Player] Song not found: ${currentActiveId}`, data.error);
          return;
        }

        const apiSong = data.song;
// Tạo object bài hát chuẩn hóa
        const recoveredSong = {
          id: apiSong.id,
          title: apiSong.title,
          author: apiSong.author,
          duration: apiSong.duration,
          song_path: apiSong.song_path,
          image_path: apiSong.image_path,
          lyrics: apiSong.lyrics,
        };

        // Double-check activeId hasn't changed during API call
        if (player.activeId === currentActiveId) {
          setSong(recoveredSong);
        }

        // C. Lưu ngược lại vào DB để lần sau load nhanh hơn (Cache)
        await supabase.from("songs").upsert({
            id: recoveredSong.id,
            title: recoveredSong.title,
            author: recoveredSong.author,
            duration: recoveredSong.duration,
            song_url: recoveredSong.song_path,
            image_url: recoveredSong.image_path,
            external_id: currentActiveId === recoveredSong.id ? null : currentActiveId,
        });

      } catch (err) {
        console.error("[Player] Load song error:", err);
      }
    };

    loadSongData();
  }, [player.activeId, isMounted]);

  // Hook lấy URL thực tế để phát (xử lý signed URL nếu cần)
  const songUrl = useLoadSongUrl(song);

  /* ------------------------------------------------------
      3. SYNC PLAYING STATE
      Tự động set isPlaying = true khi có bài hát để các component khác (HoverPreview) biết mà dừng lại
  ------------------------------------------------------ */
  useEffect(() => {
      if (songUrl && player.activeId) {
          player.setIsPlaying(true);
      } else {
          player.setIsPlaying(false);
      }
  }, [songUrl, player.activeId]);


  if (!isMounted) return null;

  /* ------------------------------------------------------
      4. RENDER UI (ĐÃ FIX TRÀN VIỀN MOBILE)
  ------------------------------------------------------ */

  // Trường hợp 1: Chưa có bài hát nào được chọn (Empty State)
  if (!song || !songUrl || !player.activeId) {
    return (
      <div className="
        fixed bottom-0 left-0 w-full h-[60px] 
        bg-white/80 dark:bg-black/80 backdrop-blur-md 
        border-t border-neutral-300 dark:border-white/10 
        flex items-center justify-center 
        z-[5000] transition-colors duration-300
        box-border overflow-visible
      ">
        <p className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px] tracking-[0.2em] uppercase animate-pulse flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none"></span>
           :: SYSTEM_READY_TO_PLAY ::
        </p>
      </div>
    );
  }

  // Trường hợp 2: Player đang hoạt động
  return (
    <div className="
        fixed bottom-0 left-0 w-full 
        md:h-[80px] h-auto
        bg-white/95 dark:bg-black/90 backdrop-blur-xl
        border-t-2 border-neutral-300 dark:border-emerald-500/30
        z-[5000]
shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_30px_rgba(16,185,129,0.1)]
        transition-all duration-500
        box-border overflow-visible
    ">
      {/* Decor Line (Top Accent) */}
      <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 z-[51]"></div>
      
      <div className="w-full h-full relative">
        <PlayerContent key={`${songUrl}-${player.playTrigger}`} song={song} songUrl={songUrl} />
      </div>
    </div>
  );
};

export default Player;