"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Music2, Loader2, ArrowLeft, Disc } from "lucide-react";
import useUI from "@/hooks/useUI"; // Import hook UI
import { CyberCard, GlitchText, HoloButton } from "@/components/CyberComponents";

export default function AddToPlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alert } = useUI(); // Lấy hàm alert từ UI hook

  const songId = searchParams.get("song_id");
  // --- Nhận object bài hát từ URL ---
  const raw = searchParams.get("song");
  let song = null;
  try {
    if (raw) song = JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.error("Cannot decode song object", e);
  }

  const [song, setSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  /* -------------------------------------------------------
     FETCH SONG
  ------------------------------------------------------- */
  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;

      // 1. Fetch từ database
      const { data: dbSong, error } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .maybeSingle();

      if (dbSong) {
        setSong(dbSong);
        return;
      }

      if (error) console.warn("Song not found in DB → calling API...");

      // 2. Fetch API custom /api/get-song
      const res = await fetch(`/api/get-song?id=${songId}`);
      const { song: apiSong } = await res.json(); // 🟩 SỬA CHỖ NÀY

      if (!apiSong) {
        console.error("API returned no song!");
        return;
      }

      // 3. upsert vào Supabase (map đúng field từ API)
      const { data: inserted, error: insertErr } = await supabase
        .from("songs")
        .upsert({
          id: apiSong.id,
          title: apiSong.title,
          author: apiSong.author,
          duration: apiSong.duration,
          image_url: apiSong.image_path, // 🟩 SỬA CHỖ NÀY
          song_url: apiSong.song_path,   // 🟩 SỬA CHỖ NÀY
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Cannot insert song:", insertErr);
        return;
      }

      setSong(inserted);
    };

    fetchSong();
  }, [songId]);

  /* -------------------------------------------------------
     FETCH PLAYLISTS
  ------------------------------------------------------- */
  // --- Fetch playlists ---
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, cover_url") // Lấy thêm cover_url để hiển thị đẹp hơn
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (!error) setPlaylists(data);
      setLoading(false);
    };

    fetchPlaylists();
  }, []);

  /* -------------------------------------------------------
     ADD SONG TO PLAYLIST
  ------------------------------------------------------- */
  const handleAdd = async (playlistId) => {
    if (!song || !song.id) {
      alert("Song not loaded!");
      return;
    if (!song || !song.title) {
        alert("Invalid song data provided.", "error", "DATA_CORRUPTED");
        return;
    }

    setAdding(true);

    const { error: playlistError } = await supabase
      .from("playlist_songs")
      .insert({
        playlist_id: playlistId,
        song_id: song.id,
        added_at: new Date(),
      });

    if (playlistError) {
      console.error("playlist err:", playlistError);
      setMessage({ type: "error", text: "Không thể thêm bài vào playlist!" });
    } else {
      setMessage({ type: "success", text: "Đã thêm vào playlist!" });
      router.back();
    }

    setAdding(false);
  };

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Plus size={20} className="text-emerald-500" />
        Thêm bài hát vào playlist
      </h1>

      {/* Song Info */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/60 dark:bg-white/10 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <div className="w-14 h-14 bg-neutral-300 dark:bg-neutral-700 rounded-lg overflow-hidden flex items-center justify-center">
          {song?.image_url ? (
            <img src={song.image_url} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <Music2 size={28} className="text-neutral-600" />
          )}
        </div>

        <div>
          <div className="font-semibold text-neutral-800 dark:text-neutral-200">
            {song?.title || "Unknown Song"}
          </div>
          <div className="text-sm text-neutral-500">
            {song?.author || "Unknown Artist"}
          </div>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-red-100 text-red-700 border-red-300"
          }`}
        >
          {message.text}
    // 1. Insert song vào bảng songs
    const { data: insertedSong, error: songError } = await supabase
        .from("songs")
        .upsert({
            title: song.title,
            author: song.author || song.artist || "Unknown",
            image_url: song.image || song.thumbnail || song.cover || null,
            duration: Number(song.duration) || 0
        })
        .select()
        .single();

        if (songError) {
            console.error("Lỗi insert vào songs:", songError);
            alert("Database write failed: Cannot save song.", "error", "WRITE_ERROR");
            setAdding(false);
            return;
        }

        // 2. Insert vào playlist_songs
        const { error: playlistError } = await supabase
            .from("playlist_songs")
            .insert({
                playlist_id: playlistId,
                song_id: insertedSong.id,
                added_at: new Date(),
            });

        if (playlistError) {
            // Check lỗi trùng lặp (nếu bạn có set unique constraint)
            if (playlistError.code === '23505') {
                 alert("This track is already in the playlist.", "info", "DUPLICATE_ENTRY");
            } else {
                 alert("Failed to link song to playlist.", "error", "LINK_ERROR");
            }
        } else {
            alert(`Added "${song.title}" to playlist successfully.`, "success", "OPERATION_COMPLETE");
            // Tùy chọn: Quay lại trang trước sau khi thêm thành công
            // router.back(); 
        }

        setAdding(false);
    };

  return (
    <div className="h-full bg-neutral-100 dark:bg-black p-6 mt-5 flex items-center justify-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <CyberCard className="w-full max-w-2xl relative z-10 p-5 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-emerald-500/30">
        
        {/* HEADER */}
        <div className="mb-8 border-b border-neutral-200 dark:border-white/10 pb-4">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-emerald-500 transition mb-2"
            >
                <ArrowLeft size={14}/> ABORT_TRANSACTION
            </button>
            <h1 className="text-2xl font-bold font-mono uppercase flex items-center gap-2">
                <Plus size={24} className="text-emerald-500" />
                <GlitchText text="ADD_TO_DATABASE" />
            </h1>
        </div>

        {/* SONG INFO CARD */}
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="w-16 h-16 bg-black rounded-lg overflow-hidden border border-white/10 shrink-0 relative group">
                {song?.image_url ? (
                    <img src={song.image_url} alt="cover" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <Music2 size={24} className="text-neutral-500" />
                    </div>
                )}
                {/* Rolling Disc Animation */}
                <div className="absolute top-1 right-1 animate-spin-slow">
                    <Disc size={12} className="text-white/50" />
                </div>
            </div>

            <div className="overflow-hidden">
                <div className="font-bold text-neutral-900 dark:text-white font-mono truncate">{song?.title || "UNKNOWN_TRACK"}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono truncate">{song?.author || "UNKNOWN_ARTIST"}</div>
            </div>
        </div>

      {/* PLAYLIST LIST */}
      <h2 className="text-md font-medium mb-3 text-neutral-700 dark:text-neutral-300">
        Chọn playlist:
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 size={18} className="animate-spin" />
          Đang tải playlist...
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-neutral-500 text-sm">Bạn chưa có playlist nào.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleAdd(pl.id)}
              disabled={adding}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/60 dark:bg-white/5 hover:bg-emerald-500 hover:text-white transition"
            >
              <span>{pl.name}</span>
              <Plus size={18} />
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="mt-8 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
      >
        ← Quay lại
      </button>
        {/* PLAYLIST SELECTION */}
        <div className="space-y-3">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-widest">Select_Target_Playlist</h2>
                {adding && <span className="text-xs font-mono text-emerald-500 animate-pulse">PROCESSING...</span>}
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-neutral-500">
                        <Loader2 size={24} className="animate-spin text-emerald-500" />
                        <span className="text-xs font-mono">LOADING_DIRECTORIES...</span>
                    </div>
                ) : playlists.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-neutral-300 dark:border-white/10 rounded-lg">
                        <p className="text-sm font-mono text-neutral-500">[NO_DIRECTORIES_FOUND]</p>
                    </div>
                ) : (
                    playlists.map((pl) => (
                        <button
                            key={pl.id}
                            onClick={() => handleAdd(pl.id)}
                            disabled={adding}
                            // 1. ĐỔI TÊN GROUP: group -> group/item
                            className="w-full group/item relative overflow-hidden p-3 rounded-lg border border-neutral-300 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-300 text-left flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center overflow-hidden">
                                        {pl.cover_url ? <img src={pl.cover_url} className="w-full h-full object-cover" /> : <Music2 size={14} className="text-neutral-500"/>}
                                </div>
                                {/* 2. CẬP NHẬT HOVER TEXT: group-hover -> group-hover/item */}
                                <span className="font-mono text-sm font-bold text-neutral-700 dark:text-neutral-300 group-hover/item:text-emerald-500 transition-colors">
                                    {pl.name}
                                </span>
                            </div>
                            
                            {/* 3. CẬP NHẬT HOVER ICON: group-hover -> group-hover/item */}
                            <Plus size={16} className="text-neutral-400 group-hover/item:text-emerald-500 transition-transform group-hover/item:rotate-90" />
                            
                            {/* 4. CẬP NHẬT HOVER SCANLINE: group-hover -> group-hover/item */}
                            <div className="absolute inset-0 bg-emerald-500/5 translate-x-[-100%] group-hover/item:translate-x-0 transition-transform duration-500 skew-x-12 pointer-events-none"></div>
                        </button>
                    ))
                )}
            </div>
        </div>
      </CyberCard>
    </div>
  );
}
