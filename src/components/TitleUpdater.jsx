"use client";

import { useEffect, useRef } from "react";
import usePlayer from "@/hooks/usePlayer";

const TitleUpdater = () => {
  const { songData, isPlaying, activeId } = usePlayer();
  const scrollInterval = useRef(null);

  useEffect(() => {
    // Xóa interval cũ nếu có
    if (scrollInterval.current) clearInterval(scrollInterval.current);

    if (activeId && songData) {
      const songTitle = (songData.title || songData.name || "NULL").toUpperCase();
      const songAuthor = (songData.author || "VOID").toUpperCase();
      const statusIcon = isPlaying ? "PLAYING" : "PAUSED";
      
      let fullText = ` [${statusIcon}] ${songTitle} // ${songAuthor} ------------ `;
      
      // Hiệu ứng chạy chữ
      scrollInterval.current = setInterval(() => {
        fullText = fullText.substring(1) + fullText.substring(0, 1);
        document.title = fullText;
      }, 150); // Tốc độ chạy chữ (300ms)

    } else {
      document.title = "V O I D // SYSTEM_OFFLINE";
    }

    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [songData, isPlaying, activeId]);

  return null;
};

export default TitleUpdater;