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

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: true });
      setAllSongs(data || []);
      setFilteredSongs(data || []);
      setLoading(false);
    };
    fetchSongs();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredSongs(
      allSongs.filter((s) => {
        const title = s.title || "";
        const author = s.author || "";
        return title.toLowerCase().includes(term) || author.toLowerCase().includes(term);
      })
    );
  }, [searchTerm, allSongs]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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

  return (
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

      </div>
    </div>
  );
}