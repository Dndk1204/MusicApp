"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import SongItem from "./SongItem";
import usePlayer from "@/hooks/usePlayer";
import useRealtimeSongs from "@/hooks/useRealtimeSongs";
import { Disc } from "lucide-react"; // Icon trang trí

const PageContent = ({ songs }) => {
  // --- 1. KHAI BÁO HOOKS ---
  const player = usePlayer();
  const hasSetIds = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PER_PAGE = 20; 

  const songMap = useMemo(() => {
    if (!songs) return {}; 
    const map = {};
    songs.forEach((song) => {
      map[song.id] = song;
    });
    return map;
  }, [songs]);

  useEffect(() => {
    if (songs && songs.length > 0 && !hasSetIds.current) {
      const songIds = songs.map((song) => song.id);
      player.setIds(songIds);
      if (typeof window !== "undefined") {
        window.__SONG_MAP__ = songMap;
      }
      hasSetIds.current = true;
    }
  }, [songs, player, songMap]);

  const liveSongs = useRealtimeSongs(songs || []);
  const totalPages = Math.max(1, Math.ceil((songs || []).length / PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  // --- 2. CHECK EMPTY ---
  if (!songs || songs.length === 0) {
    return (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 text-neutral-400 opacity-70">
            <Disc size={50} className="animate-spin-slow"/>
            <div className="text-sm font-mono tracking-widest uppercase border border-neutral-600 px-4 py-2 rounded">
                [SYSTEM_MESSAGE]: NO_SONGS_AVAILABLE
            </div>
        </div>
    );
  }

  // --- 3. LOGIC RENDER ---
  const onClick = (id) => {
    player.setId(id);
  };

  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const pageSongs = liveSongs.slice(start, end);

  const gotoPage = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(p);
    // Smooth scroll lên đầu danh sách (nếu cần)
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-6 mt-10 mb-4 font-mono">
        <button
          onClick={() => gotoPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            px-4 py-2 rounded-lg 
            bg-white/50 dark:bg-black/40 
            border border-neutral-300 dark:border-white/10
            text-neutral-800 dark:text-neutral-300 
            hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400
            disabled:opacity-30 disabled:cursor-not-allowed 
            transition-all duration-300
            shadow-sm backdrop-blur-sm
          "
        >
          {"< PREV"}
        </button>

        <span className="text-sm text-neutral-600 dark:text-neutral-400 tracking-widest">
            PAGE <span className="text-emerald-600 dark:text-emerald-500 font-bold">{currentPage}</span> / {totalPages}
        </span>

        <button
          onClick={() => gotoPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            px-4 py-2 rounded-lg 
            bg-white/50 dark:bg-black/40 
            border border-neutral-300 dark:border-white/10
            text-neutral-800 dark:text-neutral-300 
            hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400
            disabled:opacity-30 disabled:cursor-not-allowed 
            transition-all duration-300
            shadow-sm backdrop-blur-sm
          "
        >
          {"NEXT >"}
        </button>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
        {pageSongs.map((item) => (
          <SongItem key={item.id} onClick={onClick} data={item} />
        ))}
      </div>

      {renderPagination()}
    </div>
  );
};

export default PageContent;