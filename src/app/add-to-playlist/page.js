"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Music2, Loader2, Check, Disc, ArrowLeft, X, ListPlus } from "lucide-react";
// Import Hook & Cyber Components
import useLoadImage from "@/hooks/useLoadImage"; 
import { GlitchText, HoloButton, GlitchButton, CyberButton } from "@/components/CyberComponents";

export default function AddToPlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Nhận song từ params
  const songParam = searchParams.get("song"); 
  const songId = searchParams.get("song_id");

  const [song, setSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  /* -------------------------------------------------------
      XỬ LÝ ẢNH (ROBUST IMAGE LOGIC)
   ------------------------------------------------------- */
  // 1. Thử dùng Hook chuẩn
  const hookImage = useLoadImage(song);

  // 2. Logic Fallback (Nếu Hook tạch thì tự tính toán)
  let displayImage = hookImage;

  if (!displayImage && song) {
      // Trường hợp 1: Link API trực tiếp (bắt đầu bằng http)
      if (song.image_url?.startsWith('http')) displayImage = song.image_url;
      else if (song.image_path?.startsWith('http')) displayImage = song.image_path;
      else if (song.final_image?.startsWith('http')) displayImage = song.final_image;
      
      // Trường hợp 2: Là Path của Supabase nhưng Hook chưa load kịp hoặc lỗi
      else if (song.image_path || song.image_url) {
          const path = song.image_path || song.image_url;
          // Tự lấy public url thủ công (Hard fix)
          const { data } = supabase.storage.from('images').getPublicUrl(path);
          if (data) displayImage = data.publicUrl;
      }
  }

  /* -------------------------------------------------------
      FETCH SONG
   ------------------------------------------------------- */
  useEffect(() => {
    const fetchSong = async () => {
      // 1. Ưu tiên lấy từ URL params
      if (songParam) {
          try {
              const parsedSong = JSON.parse(decodeURIComponent(songParam));
              setSong(parsedSong);
              return;
          } catch (e) { console.error("Parse song param error", e); }
      }

      if (!songId) return;

      // 2. Tìm trong DB
      const { data: dbSong } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .maybeSingle();

      if (dbSong) {
        // Map lại trường image_path để khớp với Hook useLoadImage (thường hook này tìm image_path)
        setSong({
            ...dbSong,
            image_path: dbSong.image_url || dbSong.image_path // Đảm bảo có image_path
        });
        return;
      }

      // 3. Gọi API nếu chưa có
      try {
          const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=3501caaa&format=jsonpretty&id=${songId}`);
          const data = await res.json();
          
          if (data.results && data.results[0]) {
              const track = data.results[0];
              const apiSong = {
                  id: track.id,
                  title: track.name,
                  author: track.artist_name,
                  duration: track.duration,
                  // Lưu cả 2 trường để chắc chắn
                  image_url: track.image || track.album_image, 
                  image_path: track.image || track.album_image, 
                  song_url: track.audio,
              };
              setSong(apiSong);

              // Lưu vào DB
              await supabase.from("songs").upsert({
                  id: apiSong.id,
                  title: apiSong.title,
                  author: apiSong.author,
                  duration: apiSong.duration,
                  image_url: apiSong.image_url,
                  song_url: apiSong.song_url,
                  external_id: track.id.toString()
              });
          } else {
              setMessage({ type: "error", text: "SONG_NOT_FOUND_API" });
          }
      } catch (err) {
          console.error("Fetch API Error:", err);
          setMessage({ type: "error", text: "API_CONNECTION_FAILED" });
      }
    };

    fetchSong();
  }, [songId, songParam]);

  /* -------------------------------------------------------
      FETCH PLAYLISTS
   ------------------------------------------------------- */
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
          setLoading(false);
          return;
      }

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
    if (!song?.id && !song?.title) return;

    if (selected.length === 0) {
      setMessage({ type: "error", text: "NO_TARGET_SELECTED" });
      return;
    }

    setAdding(true);
    setMessage(null);

    try {
      const { error: upsertError } = await supabase
        .from("songs")
        .upsert({
            id: song.id,
            title: song.title,
            author: song.author,
            duration: song.duration,
            image_url: song.image_url || song.image_path,
            song_url: song.song_url || song.song_path,
        }, { onConflict: 'id', ignoreDuplicates: true });

      if (upsertError) throw upsertError;

      const { data: existing } = await supabase
        .from("playlist_songs")
        .select("playlist_id")
        .in("playlist_id", selected)
        .eq("song_id", song.id);

      const existedPlaylists = existing?.map((e) => e.playlist_id) || [];
      const newPlaylists = selected.filter((pid) => !existedPlaylists.includes(pid));

      if (newPlaylists.length === 0) {
        setMessage({ type: "error", text: "TRACK_ALREADY_EXISTS" });
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
        setMessage({ type: "error", text: "DB_WRITE_ERROR" });
      } else {
        setMessage({
          type: "success",
          text: `SUCCESS: INJECTED TO ${newPlaylists.length} PLAYLISTS`,
        });
        setTimeout(() => router.back(), 800);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "SYSTEM_FAILURE: " + err.message });
    }

    setAdding(false);
  };

  /* -------------------------------------------------------
      UI (CYBER BRUTALISM)
   ------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      
      {/* CARD CONTAINER */}
      <div className="
          w-full max-w-xl h-[80vh] flex flex-col relative overflow-hidden
          bg-white dark:bg-black 
          border-2 border-neutral-400 dark:border-white/20 
          shadow-[0_0_40px_rgba(0,0,0,0.5)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]
          rounded-none
      ">
         {/* Decoration Corners */}
         <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
         <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

         {/* === HEADER === */}
         <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-5 flex justify-between items-center relative shrink-0 z-20">
             <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
             
             <div className="flex items-center gap-3">
                 <ListPlus className="text-emerald-600 dark:text-emerald-500" size={20}/>
                 <h1 className="text-xl font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="ADD_TO_PLAYLIST" />
                 </h1>
             </div>
             <button onClick={() => router.back()} className="text-neutral-500 hover:!text-red-500 transition hover:rotate-90">
                 <X size={24} />
             </button>
         </div>

         {/* === BODY (SCROLLABLE) === */}
         <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/50 dark:bg-black/80 relative overflow-y-auto custom-scrollbar p-6">
            
            {/* 1. SONG INFO CARD */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 shadow-md relative overflow-hidden group">
                 <div className="absolute inset-0 bg-emerald-500/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 pointer-events-none"></div>

                 <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-800 shrink-0 border border-neutral-400 dark:border-white/20 relative flex items-center justify-center overflow-hidden">
                    
                    {/* --- HIỂN THỊ ẢNH (Sử dụng biến displayImage đã tính toán) --- */}
                    {displayImage ? (
                        <img 
                            src={displayImage} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                            alt="Cover" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                        />
                    ) : (
                        <Music2 size={24} className="text-neutral-500 relative z-10" />
                    )}

                    {/* Fallback Icon nếu ảnh lỗi hoặc đang load */}
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                        <Music2 size={24} className="text-neutral-500" />
                    </div>

                 </div>

                 <div className="flex-1 min-w-0 z-10">
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1 border-b border-emerald-500/30 w-fit pb-0.5">Target_Audio_File</p>
                    <div className="font-bold text-neutral-900 dark:text-white truncate font-mono text-lg uppercase">
                        {song?.title || "Unknown Song"}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono uppercase tracking-wide">
                        {song?.author || "Unknown Artist"}
                    </div>
                 </div>
            </div>

            {/* 2. MESSAGE BOX */}
            {message && (
                <div className={`mb-6 p-3 rounded-none text-xs font-mono border flex items-center gap-2 animate-in slide-in-from-top-2
                    ${message.type === "success" 
                        ? "bg-emerald-100 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800 dark:text-emerald-400" 
                        : "bg-red-100 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-400"
                    }`}
                >
                    <div className={`w-2 h-2 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="font-bold uppercase">{message.text}</span>
                </div>
            )}

            {/* 3. PLAYLIST SELECTION */}
            <h2 className="font-bold font-mono text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                Select_Directory <span className="h-[1px] flex-1 bg-neutral-300 dark:bg-white/10"></span>
            </h2>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-500">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <span className="text-xs font-mono tracking-widest animate-pulse">LOADING_DIRECTORIES...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && playlists.length === 0 && (
                <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-white/10">
                    <Disc size={32} className="mx-auto text-neutral-400 mb-2 opacity-50"/>
                    <p className="text-xs font-mono text-neutral-500 uppercase">[NO_PLAYLISTS_FOUND]</p>
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
                                group flex justify-between items-center p-3 border transition-all duration-200 relative overflow-hidden
                                ${isSelected 
                                    ? "bg-emerald-500/10 border-emerald-500 shadow-sm" 
                                    : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-white/10 hover:border-emerald-500/50"
                                }
                            `}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 transition-transform duration-200 ${isSelected ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}></div>

                            <span className={`text-sm font-mono pl-2 ${isSelected ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {pl.name}
                            </span>

                            <div className={`
                                w-5 h-5 border flex items-center justify-center transition-all
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

         {/* === FOOTER === */}
         <div className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-300 dark:border-white/10 p-4 flex justify-between items-center shrink-0 z-20">
            <div className="text-[10px] font-mono text-neutral-500 uppercase flex flex-col">
                <span>TARGETS:</span>
                <span className="text-emerald-600 dark:text-emerald-500 font-bold text-lg leading-none">{selected.length}</span>
            </div>

            <div className="flex gap-3">
                <GlitchButton
                    onClick={() => router.back()}
                    className="text-xs px-4 py-2 border-red-400 dark:border-red-400/20 text-red-600 dark:text-red-400 hover:text-black dark:hover:!text-white"
                >
                  ABORT
                </GlitchButton>
                
                <CyberButton 
                    onClick={handleAddMulti}
                    disabled={adding || selected.length === 0}
                    className="text-xs py-2 px-6 rounded-none"
                >
                    {adding ? "INJECTING..." : "CONFIRM_ADD"}
                </CyberButton>
            </div>
         </div>

      </div>
    </div>
  );
}