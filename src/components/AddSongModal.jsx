"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Loader2, Search, X, Check, Music2, Plus, Disc, AlertCircle, CheckCircle2 } from "lucide-react";
// Import Cyber Components
import { GlitchText, HoloButton, GlitchButton } from "@/components/CyberComponents";

export default function AddSongModal({ playlistId, onClose, onAdded }) {
  const [allSongs, setAllSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [playlistSongIds, setPlaylistSongIds] = useState([]);

  /* ---------------- GET USER ------------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  /* ---------------- LOAD DATA ------------------- */
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // 1. Load All Songs from DB (Admin + User Uploads)
      const { data: songsData } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: true }); // Hoặc desc nếu muốn bài mới lên đầu

      if (songsData) {
        // Chuẩn hóa dữ liệu nếu cần thiết (ví dụ xử lý ảnh null)
        const normalizedSongs = songsData.map(s => ({
            ...s,
            title: s.title || "Unknown Title",
            author: s.author || "Unknown Artist",
            image_url: s.image_url || s.image_path || null // Fallback ảnh
        }));
        setAllSongs(normalizedSongs);
        setFilteredSongs(normalizedSongs);
      }

      // 2. Load Existing Songs in Playlist to disable them
      const { data: plData } = await supabase
        .from("playlist_songs")
        .select("song_id")
        .eq("playlist_id", playlistId);
      
      setPlaylistSongIds((plData || []).map((s) => s.song_id));

      setLoading(false);
    };

    initData();
  }, [playlistId]);

  /* ---------------- SEARCH ------------------- */
  useEffect(() => {
    const t = searchTerm.toLowerCase();
    setFilteredSongs(
      allSongs.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(t) ||
          (s.author || "").toLowerCase().includes(t)
      )
    );
  }, [searchTerm, allSongs]);

  /* ---------------- HANDLERS ------------------- */
  const toggleSelect = (songId) => {
    setSelectedIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleBulkAdd = async () => {
    if (!user) {
      setMessage({ type: "error", text: "ACCESS_DENIED: LOGIN_REQUIRED" });
      return;
    }

    if (selectedIds.length === 0) {
      setMessage({ type: "error", text: "NO_DATA_SELECTED" });
      return;
    }

    try {
      // Lọc bài hát hợp lệ và chưa có trong playlist
      // Logic: Chỉ lấy những ID có trong allSongs (đảm bảo tồn tại) và chưa có trong playlist hiện tại
      const validSongIds = selectedIds.filter(id => allSongs.find(s => s.id === id));
      const newSongIds = validSongIds.filter(id => !playlistSongIds.includes(id));

      if (newSongIds.length === 0) {
        setMessage({ type: "error", text: "ALL_TRACKS_ALREADY_EXIST" });
        return;
      }

      const rows = newSongIds.map((sid) => ({
        playlist_id: Number(playlistId),
        song_id: sid,
      }));

      const { error } = await supabase.from("playlist_songs").insert(rows);

      if (error) throw error;

      setMessage({ type: "success", text: `SUCCESS: ${newSongIds.length} TRACKS INJECTED` });
      if (onAdded) onAdded();
      setTimeout(onClose, 800);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "SYSTEM_ERROR: INSERT_FAILED" });
    }
  };

  /* ---------------- UI ------------------- */
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      
      {/* CARD CONTAINER (Manual Layout for strict flex control) */}
      <div className="
          w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden
          bg-white dark:bg-neutral-900 
          border border-neutral-300 dark:border-emerald-500/30 
          shadow-2xl dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none md:rounded-xl transition-all
      ">
         {/* Decoration Corners */}
         <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

         {/* === HEADER === */}
         <div className="bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 p-4 flex justify-between items-center relative shrink-0 z-20">
             <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
             <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-500 rotate-45 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                 <h1 className="text-lg font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="ADD_TRACKS_TO_PLAYLIST" />
                 </h1>
             </div>
             <button onClick={onClose} className="text-neutral-400 hover:text-red-500 dark:hover:text-white transition hover:rotate-90">
                 <X size={20} />
             </button>
         </div>

         {/* === BODY WRAPPER (Flex-1 + min-h-0) === */}
         <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-transparent relative">
            
            {/* Search Bar */}
            <div className="p-4 bg-white dark:bg-neutral-900/95 shrink-0 z-10 border-b border-neutral-100 dark:border-white/5 space-y-3">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-neutral-400 dark:text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="SEARCH_DATABASE_FOR_TRACKS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-neutral-900 dark:text-emerald-400 placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
                        autoFocus
                    />
                </div>

                {/* Alert Message */}
                {message && (
                    <div className={`p-2 rounded border text-[10px] font-mono flex items-center gap-2 animate-in slide-in-from-top-1
                        ${message.type === 'success' 
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-red-100 dark:bg-red-500/10 border-red-500 text-red-700 dark:text-red-400'}
                    `}>
                        {message.type === 'success' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                        {message.text}
                    </div>
                )}
            </div>

            {/* Song List (Scrollable) */}
            <div className={`
                flex-1 overflow-y-auto p-2 space-y-1
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-white/10
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/50
            `}>
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-500 py-10">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <span className="text-xs font-mono tracking-widest animate-pulse">FETCHING_RECORDS...</span>
                    </div>
                ) : filteredSongs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-600 font-mono text-xs py-10 opacity-70">
                        <Disc size={40} className="mb-2 opacity-50"/>
                        <p>[NO_MATCHING_TRACKS]</p>
                    </div>
                ) : (
                    filteredSongs.map((s) => {
                        const isInPlaylist = playlistSongIds.includes(s.id);
                        const isSelected = selectedIds.includes(s.id);
                        
                        return (
                            <label
                                key={s.id}
                                className={`
                                    group flex items-center gap-3 p-2 rounded-lg border transition-all duration-200 relative overflow-hidden
                                    ${isInPlaylist 
                                        ? "opacity-50 cursor-not-allowed border-transparent bg-neutral-50 dark:bg-white/5 grayscale" 
                                        : isSelected 
                                            ? "bg-emerald-500/10 border-emerald-500/30 cursor-pointer shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]"
                                            : "border-transparent hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                                    }
                                `}
                            >
                                {/* Scanline Effect */}
                                {!isInPlaylist && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
                                )}

                                <input 
                                    type="checkbox" 
                                    disabled={isInPlaylist}
                                    checked={isSelected || isInPlaylist} 
                                    onChange={() => toggleSelect(s.id)} 
                                    className="hidden" 
                                />

                                {/* Checkbox / Status Icon */}
                                <div className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                                    ${isInPlaylist
                                        ? "bg-neutral-300 dark:bg-white/10 border-neutral-400 dark:border-white/20"
                                        : isSelected 
                                            ? "bg-emerald-500 border-emerald-500 shadow-sm" 
                                            : "border-neutral-400 dark:border-neutral-600 bg-white dark:bg-black/40 group-hover:border-emerald-500"
                                    }
                                `}>
                                    {(isSelected || isInPlaylist) && <Check size={12} className={isInPlaylist ? "text-neutral-500 dark:text-neutral-400" : "text-white dark:text-black stroke-[3]"} />}
                                </div>

                                {/* Image */}
                                <div className="w-10 h-10 relative flex-shrink-0 rounded overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-200 dark:bg-black">
                                    {s.image_url ? (
                                        <Image src={s.image_url} fill alt={s.title} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music2 size={16} className="text-neutral-500 dark:text-neutral-600"/>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <span className={`font-mono text-sm truncate ${isSelected && !isInPlaylist ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-neutral-900 dark:text-neutral-300"}`}>
                                        {s.title || "UNKNOWN_TITLE"}
                                    </span>
                                    <span className="font-mono text-xs text-neutral-500 dark:text-neutral-500 truncate">
                                        {s.author || "UNKNOWN_ARTIST"}
                                    </span>
                                </div>

                                {/* Status/Duration */}
                                <span className="font-mono text-xs w-16 text-right">
                                    {isInPlaylist ? (
                                        <span className="text-neutral-400 dark:text-neutral-600 text-[9px] uppercase">ADDED</span>
                                    ) : (
                                        <span className="text-neutral-400 dark:text-neutral-600 group-hover:text-emerald-500 transition-colors">
                                            {formatDuration(s.duration)}
                                        </span>
                                    )}
                                </span>
                            </label>
                        );
                    })
                )}
            </div>
         </div>

         {/* === FOOTER (Fixed) === */}
         <div className="bg-neutral-50 dark:bg-white/5 border-t border-neutral-200 dark:border-white/10 p-4 flex justify-between items-center shrink-0 z-20">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">
                SELECTED: <span className="text-emerald-600 dark:text-emerald-500 font-bold text-base ml-1">{selectedIds.length}</span>
            </div>

            <div className="flex gap-3">
                <HoloButton
                    onClick={onClose}
                    className="text-xs px-4 py-2 border-neutral-300 dark:border-white/20 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                >
                    Cancel
                </HoloButton>
                
                <GlitchButton 
                    onClick={handleBulkAdd}
                    disabled={selectedIds.length === 0}
                    className={`
                        text-xs py-2 px-6
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-neutral-400 dark:disabled:text-neutral-600
                    `}
                >
                    CONFIRM_ADD
                </GlitchButton>
            </div>
         </div>

      </div>
    </div>
  );
}