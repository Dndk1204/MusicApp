"use client";

import React, { memo, useCallback } from "react";
import SongItem from "@/components/SongItem";
import usePlayer from "@/hooks/usePlayer";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";

const SongGrid = ({ songs }) => {
  const setId = usePlayer((state) => state.setId);
  const setIds = usePlayer((state) => state.setIds);
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  const onPlay = useCallback((id) => {
    if (!isAuthenticated) {
      openModal();
      return;
    }

    setId(id);
    setIds(songs.map((s) => s.id));

    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
  }, [isAuthenticated, openModal, setId, setIds, songs]);

  if (!songs || songs.length === 0) return null;

  return (
    <div className="
      grid 
      grid-cols-2          /* 2 bài trên 1 hàng ở Mobile */
      sm:grid-cols-3       /* 3 bài ở Tablet nhỏ */
      md:grid-cols-4       /* 4 bài ở Tablet lớn */
      lg:grid-cols-5       /* 5 bài ở Laptop */
      xl:grid-cols-6       /* 6 bài ở Desktop lớn */
      !gap-2 md:gap-6       /* Khoảng cách giữa các bài */
      animate-in fade-in slide-in-from-bottom-4 duration-500
    ">
      {songs.map((item) => (
        <div key={item.id} className="w-full">
          <SongItem 
            onClick={onPlay} 
            data={item} 
          />
        </div>
      ))}
    </div>
  );
};

export default memo(SongGrid);