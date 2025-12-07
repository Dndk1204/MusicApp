"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { X, Search, Sliders, RotateCcw, Tag, User, Type, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
// Import Cyber Components
import { GlitchText, GlitchButton } from "@/components/CyberComponents";

const AdvancedSearchModal = ({ onClose, currentSearch }) => {
  const router = useRouter();
  
  // State
  const [title, setTitle] = useState(currentSearch || "");
  const [artist, setArtist] = useState("");
  const [tag, setTag] = useState("");
  const [mounted, setMounted] = useState(false);

  // Mount & Lock Scroll
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handlers
  const handleSearch = () => {
    const query = {};
    if (title.trim()) query.title = title.trim();
    if (tag) query.tag = tag;
    
    if (artist.trim() && !title.trim()) {
        query.title = artist.trim();
    } else if (artist.trim() && title.trim()) {
        query.title = `${title.trim()} ${artist.trim()}`;
    }

    const url = qs.stringifyUrl({ 
        url: '/search', 
        query: query 
    }, { skipEmptyString: true, skipNull: true });

    router.push(url);
    onClose();
  };

  const handleReset = () => {
    setTitle("");
    setArtist("");
    setTag("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div 
        className="
          relative z-10 
          w-full max-w-md
          /* Light Mode Colors */
          bg-white border-neutral-300 shadow-2xl
          /* Dark Mode Colors */
          dark:bg-neutral-900 dark:border-emerald-500/30 dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          
          border rounded-none md:rounded-xl
          flex flex-col 
          overflow-hidden
          animate-in zoom-in-95 duration-300
        "
        onClick={(e) => e.stopPropagation()} 
      >
          {/* Decoration Corners (Chỉ hiện ở Dark Mode hoặc giữ màu xanh ở cả 2 mode) */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 pointer-events-none z-30"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 pointer-events-none z-30"></div>

          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 relative">
              {/* Decor Line */}
              <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
              
              <div className="flex items-center gap-3">
                  <Sliders size={20} className="text-emerald-600 dark:text-emerald-500 animate-pulse"/>
                  <h2 className="text-lg font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                      <GlitchText text="ADVANCED_FILTER" />
                  </h2>
              </div>
              
              <button 
                  onClick={onClose} 
                  className="text-neutral-500 hover:text-red-500 transition hover:rotate-90 duration-300"
              >
                  <X size={20} />
              </button>
          </div>

          {/* BODY */}
          <div className="p-6 bg-white dark:bg-black/40 space-y-5">
              
              {/* Input: Song Title */}
              <div className="space-y-1.5 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-emerald-700 dark:text-emerald-600 font-bold group-focus-within:text-emerald-500 transition-colors">
                      <Type size={12}/> Target_Keyword / Title
                  </label>
                  <input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      onKeyDown={handleKeyDown}
                      placeholder="ENTER_TRACK_NAME..."
                      autoFocus
                      className="
                        w-full p-3 rounded text-sm font-mono transition-all shadow-inner outline-none
                        /* Light Mode */
                        bg-neutral-100 border border-neutral-300 text-neutral-900 placeholder-neutral-500
                        focus:border-emerald-500 focus:bg-white
                        /* Dark Mode */
                        dark:bg-black/50 dark:border-white/10 dark:text-white dark:placeholder-neutral-600
                        dark:focus:border-emerald-500 dark:focus:bg-emerald-500/5
                      "
                  />
              </div>

              {/* Input: Artist */}
              <div className="space-y-1.5 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-neutral-600 dark:text-neutral-500 font-bold group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors">
                      <User size={12}/> Artist_Identity
                  </label>
                  <input 
                      value={artist} 
                      onChange={(e) => setArtist(e.target.value)} 
                      onKeyDown={handleKeyDown}
                      placeholder="ENTER_ARTIST_NAME..."
                      className="
                        w-full p-3 rounded text-sm font-mono transition-all shadow-inner outline-none
                        /* Light Mode */
                        bg-neutral-100 border border-neutral-300 text-neutral-900 placeholder-neutral-500
                        focus:border-emerald-500 focus:bg-white
                        /* Dark Mode */
                        dark:bg-black/50 dark:border-white/10 dark:text-white dark:placeholder-neutral-600
                        dark:focus:border-emerald-500 dark:focus:bg-emerald-500/5
                      "
                  />
              </div>

              {/* Select: Genre */}
              <div className="space-y-1.5 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-neutral-600 dark:text-neutral-500 font-bold group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors">
                      <Tag size={12}/> Genre_Classification
                  </label>
                  <div className="relative">
                      <select 
                          value={tag} 
                          onChange={(e) => setTag(e.target.value)} 
                          onKeyDown={handleKeyDown}
                          className="
                            w-full p-3 rounded text-sm font-mono transition-all shadow-inner outline-none appearance-none cursor-pointer
                            /* Light Mode */
                            bg-neutral-100 border border-neutral-300 text-neutral-900 
                            focus:border-emerald-500 focus:bg-white
                            /* Dark Mode */
                            dark:bg-black/50 dark:border-white/10 dark:text-white 
                            dark:focus:border-emerald-500 dark:focus:bg-emerald-500/5
                          "
                      >
                          {/* Options có màu nền riêng để tránh bị trong suốt */}
                          <option value="" className="bg-white text-neutral-500 dark:bg-neutral-900 dark:text-gray-400">[ALL_GENRES]</option>
                          <option value="pop" className="bg-white text-black dark:bg-neutral-900 dark:text-white">POP</option>
                          <option value="rock" className="bg-white text-black dark:bg-neutral-900 dark:text-white">ROCK</option>
                          <option value="electronic" className="bg-white text-black dark:bg-neutral-900 dark:text-white">ELECTRONIC</option>
                          <option value="hiphop" className="bg-white text-black dark:bg-neutral-900 dark:text-white">HIPHOP</option>
                          <option value="jazz" className="bg-white text-black dark:bg-neutral-900 dark:text-white">JAZZ</option>
                          <option value="indie" className="bg-white text-black dark:bg-neutral-900 dark:text-white">INDIE</option>
                          <option value="classical" className="bg-white text-black dark:bg-neutral-900 dark:text-white">CLASSICAL</option>
                          <option value="soundtrack" className="bg-white text-black dark:bg-neutral-900 dark:text-white">SOUNDTRACK</option>
                      </select>
                      {/* Custom Arrow */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                          <Sliders size={12} className="rotate-90"/>
                      </div>
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-3">
                  
                  {/* RESET BUTTON -> GLITCH STYLE (RED) */}
                  <GlitchButton 
                      onClick={handleReset}
                      className="flex-1 py-3 text-[10px]"
                  >
                      <span className="flex items-center gap-2">
                         <RotateCcw size={14}/> SYSTEM_RESET
                      </span>
                  </GlitchButton>

                  {/* EXECUTE BUTTON -> SOLID GREEN STYLE */}
                  <button 
                      onClick={handleSearch} 
                      className="
                        flex-[2] py-3 rounded-none md:rounded-sm
                        bg-emerald-500 hover:bg-emerald-400 
                        text-white dark:text-black font-bold font-mono text-xs uppercase tracking-widest
                        flex items-center justify-center gap-2
                        shadow-[0_0_20px_rgba(16,185,129,0.4)]
                        hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]
                        transition-all duration-200 active:scale-95
                        border border-emerald-600 dark:border-emerald-400
                      "
                  >
                      <Search size={16} strokeWidth={3}/> EXECUTE
                      <ArrowRight size={16} />
                  </button>
              </div>

          </div>
      </div>
    </div>,
    document.body 
  );
};

export default AdvancedSearchModal;