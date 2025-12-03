"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Loader2, Search, X, Check, Music2, Plus } from "lucide-react";
// Chỉ import các component nhỏ, KHÔNG dùng CyberCard cho container chính nữa
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

  /* ---------------- LOAD ALL SONGS ------------------- */
  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error) {
        setAllSongs(data || []);
        setFilteredSongs(data || []);
      }

      setLoading(false);
    };
    loadSongs();
  }, []);

  /* ---------------- GET SONGS IN PLAYLIST ------------------- */
  useEffect(() => {
    const loadPlaylistSongs = async () => {
      const { data } = await supabase
        .from("playlist_songs")
        .select("song_id")
        .eq("playlist_id", playlistId);

      setPlaylistSongIds((data || []).map((s) => s.song_id));
    };
    loadPlaylistSongs();
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

  /* ---------------- SELECT SONG ------------------- */
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
  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from("playlist_songs").insert(
      selectedIds.map((songId) => ({ playlist_id: playlistId, song_id: songId }))
    );

    if (!error) {
        onAdded(); 
        onClose();
    } else {
        console.error(error);
    }
  };

  const getSongImage = (s) =>
    s.image_url || s.image || s.image_path || "/default-song.png";

  /* ---------------- ADD SONGS ------------------- */
  const handleBulkAdd = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Bạn chưa đăng nhập!" });
      return;
    }

    if (selectedIds.length === 0) {
      setMessage({ type: "error", text: "Hãy chọn ít nhất một bài hát!" });
      return;
    }

    try {
      let validSongIds = [];

      /*  
        selectedIds là song.id, VÌ VẬY KHÔNG CẦN fetch API get-song
      
        → Ta chỉ cần đảm bảo song tồn tại (nó đã có trong allSongs)
        → Không dùng external_id nữa vì bạn đang chọn bài trong DB
      */

      for (const id of selectedIds) {
        const exists = allSongs.find((s) => s.id === id);
        if (!exists) continue; // tránh lỗi edge-case

        validSongIds.push(id);
      }

      /* ------ Bỏ các bài đã có trong playlist ------ */
      const newSongIds = validSongIds.filter(
        (id) => !playlistSongIds.includes(id)
      );

      if (newSongIds.length === 0) {
        setMessage({
          type: "error",
          text: "Tất cả bài hát đã tồn tại trong playlist!",
        });
        return;
      }

      /* ------ Insert playlist_songs ------ */
      const rows = newSongIds.map((sid) => ({
        playlist_id: Number(playlistId),
        song_id: sid,
      }));

      const { error } = await supabase.from("playlist_songs").insert(rows);

      if (error) {
        console.error(error);
        setMessage({ type: "error", text: "Không thể thêm bài hát!" });
        return;
      }

      setMessage({ type: "success", text: "Đã thêm bài hát!" });

      if (onAdded) onAdded();
      setTimeout(onClose, 500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Lỗi không xác định!" });
    }
  };

  /* ---------------- UI ------------------- */
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-xl w-[650px] max-h-[80vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Thêm bài hát</h2>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">

          <input
            placeholder="🔍 Tìm kiếm bài hát theo tên hoặc tác giả…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-800 text-white outline-none border border-neutral-700 focus:border-green-500"
          />

          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center items-center gap-2 text-gray-400">
              <Loader2 className="animate-spin" />
              Đang tải…
            </div>
          ) : filteredSongs.length === 0 ? (
            <p className="text-gray-400 text-center">Không có bài hát</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSongs.map((s) => {
                const isInPlaylist = playlistSongIds.includes(s.id);

                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-white/5 transition ${
                      isInPlaylist ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isInPlaylist}
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 accent-green-500"
                    />

                    <div className="w-12 h-12 relative shrink-0">
                      <Image
                        src={getSongImage(s)}
                        alt={s.title}
                        fill
                        className="rounded object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex flex-col truncate w-[260px]">
                      <span className="truncate">{s.title}</span>
                      <span className="text-gray-400 text-sm truncate">
                        {s.author}
                      </span>
                    </div>

                    <span className="ml-auto text-gray-400 text-sm w-[50px] text-right">
                      {formatDuration(s.duration)}
                    </span>
                  </label>
                );
              })}
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      
      {/* THAY THẾ CYBERCARD BẰNG DIV THỦ CÔNG
          Để đảm bảo cấu trúc Flexbox hoạt động 100% từ ngoài vào trong 
      */}
      <div className="
          w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden
          bg-white dark:bg-neutral-900 
          border border-neutral-300 dark:border-emerald-500/30 
          shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none hover:scale-[1.01] transition-transform duration-300
      ">
        
        {/* --- DECORATION: 4 GÓC (Tái tạo style CyberCard) --- */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 pointer-events-none z-30"></div>

        {/* === 1. HEADER (Fixed) === */}
        <div className="bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 p-4 flex justify-between items-center relative shrink-0 z-20">
            {/* Decor Line */}
            <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rotate-45 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <h2 className="text-lg font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="INJECT_AUDIO_DATA" />
                </h2>
            </div>
            
            <button onClick={onClose} className="text-neutral-400 hover:text-red-500 dark:hover:text-white transition hover:rotate-90 duration-300">
                <X size={20} />
            </button>
        </div>

        {/* === 2. BODY WRAPPER (Flex-1 + min-h-0) === */}
        {/* min-h-0 là chìa khóa để cho phép con bên trong cuộn được trong Flexbox */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-transparent relative">
          
          {/* Search Bar (Dính trên đầu Body) */}
          <div className="p-4 bg-white dark:bg-neutral-900/95 shrink-0 z-10 border-b border-neutral-100 dark:border-white/5">
            <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-neutral-400 dark:text-neutral-500 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="SEARCH_DATABASE..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-neutral-900 dark:text-emerald-400 placeholder-neutral-500 dark:placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
                    autoFocus
                />
            </div>
          </div>

          {/* === LIST SONG (Cuộn tại đây) === */}
          <div className={`
              flex-1 overflow-y-auto p-2 space-y-1
              
              /* Custom Scrollbar Colors */
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-neutral-100 dark:[&::-webkit-scrollbar-track]:bg-black/20
              [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-emerald-500/20
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/50
          `}>
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-500 py-10">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                    <span className="text-xs font-mono tracking-widest animate-pulse">ACCESSING_SERVER...</span>
                </div>
            ) : filteredSongs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-600 font-mono text-xs py-10">
                    <p>[NO_MATCHING_RECORDS_FOUND]</p>
                </div>
            ) : (
                filteredSongs.map((s) => {
                    const isSelected = selectedIds.includes(s.id);
                    return (
                        <label
                            key={s.id}
                            className={`
                                group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all duration-200 relative overflow-hidden
                                ${isSelected 
                                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]" 
                                    : "border-transparent hover:bg-neutral-100 dark:hover:bg-white/5"
                                }
                            `}
                        >
                            {/* Scanline Effect khi hover item */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>

                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)} className="hidden" />
                            
                            <div className={`
                                w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0
                                ${isSelected 
                                    ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                    : "border-neutral-400 dark:border-neutral-600 bg-white dark:bg-black/40 group-hover:border-neutral-600 dark:group-hover:border-neutral-400"
                                }
                            `}>
                                {isSelected && <Check size={12} className="text-white dark:text-black stroke-[3]" />}
                            </div>

                            <div className="w-10 h-10 relative flex-shrink-0 rounded overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-200 dark:bg-black">
                                {s.image_url ? (
                                    <Image src={s.image_url} fill alt={s.title} className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Music2 size={16} className="text-neutral-500 dark:text-neutral-600"/>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col">
                                <span className={`font-mono text-sm truncate ${isSelected ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-neutral-900 dark:text-neutral-300"}`}>
                                    {s.title || "UNKNOWN_TITLE"}
                                </span>
                                <span className="font-mono text-xs text-neutral-500 dark:text-neutral-500 truncate">
                                    {s.author || "UNKNOWN_ARTIST"}
                                </span>
                            </div>

                            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-600 w-12 text-right group-hover:text-emerald-500 transition-colors">
                                {s.duration ? `${Math.floor(s.duration / 60)}:${String(s.duration % 60).padStart(2, '0')}` : "--:--"}
                            </span>
                        </label>
                    );
                })
            )}
          </div>
        </div>

        {/* === 3. FOOTER (Fixed Bottom - shrink-0) === */}
        {/* Nằm ngoài Body Wrapper nên không bao giờ bị đẩy xuống */}
        <div className="p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black/60 backdrop-blur-md flex justify-between items-center shrink-0 z-20">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                SELECTED: <span className="text-emerald-600 dark:text-emerald-500 font-bold text-base ml-1">{selectedIds.length}</span>
            </span>

            <div className="flex gap-3">
                <HoloButton
                    onClick={onClose}
                    className="text-xs px-4 py-2 border-neutral-300 dark:border-white/20 text-neutral-500 dark:text-neutral-400 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400"
                >
                    Cancel
                </HoloButton>
                
                <GlitchButton 
                    onClick={handleAdd}
                    disabled={selectedIds.length === 0}
                    className={`
                        text-xs py-2 px-6 text-emerald-600 dark:text-emerald-500
                        border-emerald-600 dark:border-emerald-500
                        disabled:opacity-50 
                        disabled:cursor-not-allowed 
                        disabled:bg-transparent 
                        disabled:hover:bg-transparent 
                        disabled:text-emerald-600 dark:disabled:text-emerald-500
                        disabled:border-emerald-600 dark:disabled:border-emerald-500
                    `}
                >
                   {selectedIds.length > 0 ? "CONFIRM_INJECTION" : "SELECT_TRACKS"}
                </GlitchButton>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600 transition"
          >
            Thoát
          </button>

          <button
            onClick={handleBulkAdd}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 transition"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}