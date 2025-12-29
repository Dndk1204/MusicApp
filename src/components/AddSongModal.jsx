"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Loader2, Search, X, Check, Music2, Disc, AlertCircle, CheckCircle2, ListPlus } from "lucide-react";
import { GlitchText, GlitchButton, CyberButton, ScanlineOverlay } from "@/components/CyberComponents";
import HoverImagePreview from "@/components/HoverImagePreview";

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
        .order("created_at", { ascending: true });

      if (songsData) {
        const normalizedSongs = songsData.map(s => ({
            ...s,
            title: s.title || "Unknown Title",
            author: s.author || "Unknown Artist",
            image_url: s.image_url || s.image_path || null 
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

  /* ---------------- UI (CYBER BRUTALISM) ------------------- */
  return (
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-0 md:p-4 animate-in fade-in duration-300">
      
      {/* CARD CONTAINER (Manual Layout for strict flex control) */}
      <div className="
          w-full h-full md:h-[85vh] md:max-w-2xl flex flex-col relative overflow-hidden
          bg-white dark:bg-black 
          md:border-2 md:border-neutral-400 md:dark:border-white/20 
          shadow-[0_0_40px_rgba(0,0,0,0.5)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]
          rounded-none
      ">
         {/* Decoration Corners (Hidden on Mobile) */}
         <div className="hidden md:block absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="hidden md:block absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="hidden md:block absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="hidden md:block absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

         {/* === HEADER === */}
         <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-4 md:p-5 flex justify-between items-center relative shrink-0 z-20">
             {/* Gradient Line */}
             <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
             
             <div className="flex items-center gap-3">
                 <ListPlus className="text-emerald-600 dark:text-emerald-500" size={20}/>
                 <h1 className="text-lg md:text-xl font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="INJECT_TRACKS" />
                 </h1>
             </div>
             <button onClick={onClose} className="text-neutral-500 hover:!text-red-500 dark:hover:text-white transition hover:rotate-90 p-2">
                 <X size={24} />
             </button>
         </div>

         {/* === BODY WRAPPER === */}
         <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/50 dark:bg-black/80 relative">
            
            {/* Search Bar */}
            <div className="p-4 bg-white dark:bg-black shrink-0 z-10 border-b border-neutral-200 dark:border-white/10 space-y-3">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-neutral-400 dark:text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="SEARCH_DATABASE_FOR_TRACKS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-none py-3 pl-10 pr-4 text-sm font-mono text-neutral-900 dark:text-emerald-400 placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-all"
                        autoFocus
                    />
                </div>

                {/* Alert Message */}
                {message && (
                    <div className={`p-3 rounded-none border text-[10px] font-mono flex items-center gap-2 animate-in slide-in-from-top-1
                        ${message.type === 'success' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'}
                    `}>
                        {message.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                        <span className="uppercase tracking-wide font-bold">{message.text}</span>
                    </div>
                )}
            </div>

            {/* Song List (Scrollable) */}
            <div className={`
                flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar
                bg-neutral-100 dark:bg-black
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
                                    group flex items-center gap-3 p-2 md:p-3 border transition-all duration-200 relative overflow-hidden cursor-pointer
                                    ${isInPlaylist 
                                        ? "opacity-50 cursor-not-allowed border-transparent bg-neutral-200/50 dark:bg-white/5 grayscale" 
                                        : isSelected 
                                            ? "bg-emerald-500/10 border-emerald-500 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]"
                                            : "border-transparent bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-white/20"
                                    }
                                `}
                            >
                                {/* Scanline Effect on Hover */}
                                {!isInPlaylist && (
                                    <div className="absolute inset-0 bg-emerald-500/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 pointer-events-none"></div>
                                )}

                                <input 
                                    type="checkbox" 
                                    disabled={isInPlaylist}
                                    checked={isSelected || isInPlaylist} 
                                    onChange={() => toggleSelect(s.id)} 
                                    className="hidden" 
                                />

                                {/* Checkbox Square */}
                                <div className={`
                                    w-5 h-5 border flex items-center justify-center transition-all shrink-0 rounded-none
                                    ${isInPlaylist
                                        ? "bg-neutral-300 dark:bg-white/10 border-neutral-400 dark:border-white/20"
                                        : isSelected 
                                            ? "bg-emerald-500 border-emerald-500" 
                                            : "border-neutral-400 dark:border-neutral-600 bg-white dark:bg-black group-hover:border-emerald-500"
                                    }
                                `}>
                                    {(isSelected || isInPlaylist) && <Check size={14} className={isInPlaylist ? "text-neutral-500 dark:text-neutral-400" : "text-white dark:text-black stroke-[3]"} />}
                                </div>

                                {/* Image with Hover Preview */}
                                <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0 border border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-black cursor-none">
                                    <HoverImagePreview
                                        src={s.image_url}
                                        alt={s.title}
                                        audioSrc={s.song_url || s.song_path} // Preview Audio
                                        className="w-full h-full"
                                        previewSize={160}
                                        fallbackIcon="disc"
                                    >
                                        <div className="w-full h-full relative">
                                            {s.image_url ? (
                                                <Image src={s.image_url} fill alt={s.title} className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Music2 size={16} className="text-neutral-500 dark:text-neutral-600"/>
                                                </div>
                                            )}
                                            <ScanlineOverlay />
                                        </div>
                                    </HoverImagePreview>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                    <span className={`font-mono text-xs md:text-sm truncate uppercase ${isSelected && !isInPlaylist ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-neutral-900 dark:text-neutral-300"}`}>
                                        {s.title || "UNKNOWN_TITLE"}
                                    </span>
                                    <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500 truncate uppercase tracking-wide">
                                        {s.author || "UNKNOWN_ARTIST"}
                                    </span>
                                </div>

                                {/* Duration / Status */}
                                <span className="font-mono text-[10px] md:text-xs w-14 text-right shrink-0">
                                    {isInPlaylist ? (
                                        <span className="text-neutral-400 dark:text-neutral-600 text-[9px] uppercase border border-neutral-300 dark:border-white/10 px-1">ADDED</span>
                                    ) : (
                                        <span className="text-neutral-500 dark:text-neutral-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
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
         <div className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-300 dark:border-white/10 p-4 flex justify-between items-center shrink-0 z-20">
            <div className="text-[10px] font-mono text-neutral-500 uppercase flex flex-col">
                <span>SELECTION_COUNT:</span>
                <span className="text-emerald-600 dark:text-emerald-500 font-bold text-lg leading-none">{selectedIds.length}</span>
            </div>

            <div className="flex gap-3">
                <GlitchButton
                    onClick={onClose}
                    className="text-[10px] md:text-xs px-4 md:px-6 py-3 border-red-400 dark:border-red/20 text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-white"
                >
                    ABORT
                </GlitchButton>
                
                <CyberButton 
                    onClick={handleBulkAdd}
                    disabled={selectedIds.length === 0}
                    className="text-[10px] md:text-xs py-3 px-6 md:px-8 rounded-none"
                >
                    CONFIRM_INJECTION
                </CyberButton>
            </div>
         </div>

      </div>
    </div>
  );
}