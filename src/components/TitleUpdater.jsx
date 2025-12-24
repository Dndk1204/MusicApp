"use client";

import { useEffect, useRef } from "react";
import usePlayer from "@/hooks/usePlayer";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const TitleUpdater = () => {
  const { songData, isPlaying, activeId, setSongData } = usePlayer();
  const supabaseClient = useSupabaseClient();
  const scrollInterval = useRef(null);

  useEffect(() => {
    // 1. Logic tự động lấy dữ liệu bài hát mới nếu ID và Data không khớp
    const syncSongData = async () => {
      if (activeId && (!songData || songData.id !== activeId)) {
        const { data, error } = await supabaseClient
          .from('songs')
          .select('*')
          .eq('id', activeId)
          .single();

        if (!error && data) {
          setSongData(data); // Cập nhật lại store để TitleUpdater chạy lại với data mới
        }
      }
    };

    syncSongData();

    // 2. Logic xử lý chạy chữ (Marquee)
    if (scrollInterval.current) clearInterval(scrollInterval.current);

    if (activeId && songData && songData.id === activeId) {
      const songTitle = (songData.title || songData.name || "NULL").toUpperCase();
      const songAuthor = (songData.author || "VOID").toUpperCase();
      const statusIcon = isPlaying ? "PLAYING" : "PAUSED";
      
      let fullText = ` [${statusIcon}] ${songTitle} // ${songAuthor} ------------ `;
      
      scrollInterval.current = setInterval(() => {
        fullText = fullText.substring(1) + fullText.substring(0, 1);
        document.title = fullText;
      }, 150);

    } else if (activeId && (!songData || songData.id !== activeId)) {
      // Trạng thái đang tải dữ liệu bài hát tiếp theo
      document.title = "◢ LOADING_NEXT_TRACK... // VOID_SYSTEM";
    } else {
      document.title = "V O I D // SYSTEM_OFFLINE";
    }

    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [songData, isPlaying, activeId, supabaseClient, setSongData]);

  return null;
};

export default TitleUpdater;