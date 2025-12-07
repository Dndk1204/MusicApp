"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Music2, Loader2, Check, Disc, ArrowLeft, X } from "lucide-react";
// Import Cyber Components
import { GlitchText, HoloButton, GlitchButton } from "@/components/CyberComponents";

export default function AddToPlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const songId = searchParams.get("song_id");

  const [song, setSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  /* -------------------------------------------------------
      FETCH SONG
   ------------------------------------------------------- */
  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;

      const { data: dbSong } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .maybeSingle();

      if (dbSong) {
        setSong(dbSong);
        return;
      }

      const res = await fetch(`/api/get-song?id=${songId}`);
      const { song: apiSong } = await res.json();

      if (!apiSong) return;

      const { data: inserted } = await supabase
        .from("songs")
        .upsert({
          id: apiSong.id,
          title: apiSong.title,
          author: apiSong.author,
          duration: apiSong.duration,
          image_url: apiSong.image_path,
          song_url: apiSong.song_path,
        })
        .select()
        .single();

      setSong(inserted);
    };

    fetchSong();
  }, [songId]);

  /* -------------------------------------------------------
      FETCH PLAYLISTS
   ------------------------------------------------------- */
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;

      const { data } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      setPlaylists(data || []);
      setLoading(false);
    };

    fetchPlaylists();
  }, []);

  /* -------------------------------------------------------
      HANDLERS
   ------------------------------------------------------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleAddMulti = async () => {
    if (!song?.id) return;

    if (selected.length === 0) {
      setMessage({ type: "error", text: "NO_TARGET_SELECTED" });
      return;
    }

    setAdding(true);
    setMessage(null);

    try {
      // Lấy toàn bộ playlist_songs trùng bài hát
      const { data: existing } = await supabase
        .from("playlist_songs")
        .select("playlist_id")
        .in("playlist_id", selected)
        .eq("song_id", song.id);

      const existedPlaylists = existing?.map((e) => e.playlist_id) || [];
      const newPlaylists = selected.filter((pid) => !existedPlaylists.includes(pid));

      if (newPlaylists.length === 0) {
        setMessage({ type: "error", text: "TRACK_ALREADY_EXISTS_IN_SELECTION" });
        setAdding(false);
        return;
      }

      const rows = newPlaylists.map((pid) => ({
        playlist_id: pid,
        song_id: song.id,
        added_at: new Date(),
      }));

      const { error } = await supabase
        .from("playlist_songs")
        .insert(rows);

      if (error) {
        console.error(error);
        setMessage({ type: "error", text: "DATABASE_WRITE_ERROR" });
      } else {
        setMessage({
          type: "success",
          text: `DATA_INJECTED: ${newPlaylists.length} PLAYLISTS`,
        });
        setTimeout(() => router.back(), 800);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "SYSTEM_FAILURE" });
    }

    setAdding(false);
  };

  /* -------------------------------------------------------
      UI
   ------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      
      {/* CARD CONTAINER (Manual Layout for strict flex control) */}
      <div className="
          w-full max-w-xl h-[80vh] flex flex-col relative overflow-hidden
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
                 <Plus className="text-emerald-500 animate-pulse" size={24} />
                 <h1 className="text-lg font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="ADD_TO_PLAYLIST" />
                 </h1>
             </div>
             <button onClick={() => router.back()} className="text-neutral-400 hover:text-red-500 dark:hover:text-white transition hover:rotate-90">
                 <X size={20} />
             </button>
         </div>

         {/* === BODY (SCROLLABLE) === */}
         <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-transparent relative overflow-y-auto custom-scrollbar p-6">
            
            {/* 1. SONG INFO CARD */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                 {/* Scanline */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                 <div className="w-16 h-16 rounded-lg bg-neutral-300 dark:bg-neutral-800 overflow-hidden shrink-0 border border-neutral-300 dark:border-white/10 relative">
                    {song?.image_url ? (
                        <img src={song.image_url} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <Music2 size={24} className="text-neutral-500" />
                        </div>
                    )}
                 </div>

                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Target_Audio_File</p>
                    <div className="font-bold text-neutral-900 dark:text-white truncate font-mono text-lg">
                        {song?.title || "Unknown Song"}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono">
                        {song?.author || "Unknown Artist"}
                    </div>
                 </div>
            </div>

            {/* 2. MESSAGE BOX */}
            {message && (
                <div className={`mb-6 p-3 rounded-md text-xs font-mono border flex items-center gap-2 animate-in slide-in-from-top-2
                    ${message.type === "success" 
                        ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-400" 
                        : "bg-red-100 dark:bg-red-500/20 border-red-500 text-red-800 dark:text-red-400"
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                    {message.text}
                </div>
            )}

            {/* 3. PLAYLIST SELECTION */}
            <h2 className="font-bold font-mono text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                Select_Directory <span className="h-[1px] flex-1 bg-neutral-200 dark:bg-white/10"></span>
            </h2>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-500">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <span className="text-xs font-mono animate-pulse">LOADING_DIRECTORIES...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && playlists.length === 0 && (
                <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-white/10 rounded-lg">
                    <Disc size={32} className="mx-auto text-neutral-400 mb-2 opacity-50"/>
                    <p className="text-xs font-mono text-neutral-500">[NO_PLAYLISTS_FOUND]</p>
                </div>
            )}

            {/* List */}
            <div className="flex flex-col gap-2">
                {playlists.map((pl) => {
                    const isSelected = selected.includes(pl.id);
                    return (
                        <button
                            key={pl.id}
                            onClick={() => toggleSelect(pl.id)}
                            className={`
                                group flex justify-between items-center p-3 rounded-lg border transition-all duration-200
                                ${isSelected 
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 shadow-sm" 
                                    : "bg-white dark:bg-white/5 border-neutral-200 dark:border-white/5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-white/10"
                                }
                            `}
                        >
                            <span className={`text-sm font-mono ${isSelected ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {pl.name}
                            </span>

                            <div className={`
                                w-5 h-5 rounded border flex items-center justify-center transition-all
                                ${isSelected 
                                    ? "bg-emerald-500 border-emerald-500" 
                                    : "border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-black group-hover:border-emerald-500"
                                }
                            `}>
                                {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                            </div>
                        </button>
                    );
                })}
            </div>
         </div>

         {/* === FOOTER (Fixed) === */}
         <div className="bg-neutral-50 dark:bg-white/5 border-t border-neutral-200 dark:border-white/10 p-4 flex justify-between items-center shrink-0 z-20">
            <div className="text-[10px] font-mono text-neutral-500 uppercase">
                SELECTED: <span className="text-emerald-600 dark:text-emerald-500 font-bold text-base ml-1">{selected.length}</span>
            </div>

            <div className="flex gap-3">
                <HoloButton
                    onClick={() => router.back()}
                    className="text-xs px-4 py-2 border-neutral-300 dark:border-white/20 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                >
                    <ArrowLeft size={14} className="mr-1"/> Cancel
                </HoloButton>
                
                <GlitchButton 
                    onClick={handleAddMulti}
                    disabled={adding || selected.length === 0}
                    className={`
                        text-xs py-2 px-6
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-neutral-400 dark:disabled:text-neutral-600
                    `}
                >
                    {adding ? "INJECTING..." : "CONFIRM_ADD"}
                </GlitchButton>
            </div>
         </div>

      </div>
    </div>
  );
}