"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { X, Search, Sliders, RotateCcw, Tag, User, Type, CircleUser } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
// Import NEW Cyber Components
import { GlitchText, GlitchButton, CyberButton } from "@/components/CyberComponents";

const AdvancedSearchModal = ({ onClose, currentSearch }) => {
  const router = useRouter();
  
  const [title, setTitle] = useState(currentSearch || "");
  const [artist, setArtist] = useState("");
  const [uploader, setUploader] = useState(""); // <-- STATE MỚI
  const [tag, setTag] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSearch = () => {
    const query = {};
    
    // Logic gộp Title
    if (title.trim()) query.title = title.trim();
    
    // Logic Artist
    if (artist.trim()) {
        // Nếu tiêu đề trống, tìm artist vào field title (tùy logic backend của bạn)
        // Hoặc gửi riêng query.artist nếu backend hỗ trợ
        if (!title.trim()) {
            query.title = artist.trim();
        } else {
            // Gộp vào chuỗi tìm kiếm chung
            query.title = `${title.trim()} ${artist.trim()}`;
        }
    }

    // Logic Uploader (User Name)
    if (uploader.trim()) {
        query.uploader = uploader.trim();
    }

    // Logic Tag
    if (tag) query.tag = tag;

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
    setUploader(""); // <-- RESET UPLOADER
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
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* MODAL CONTAINER (CYBER STYLE) */}
      <div 
        className="
          relative z-10 
          w-full max-w-md
          bg-white border-2 border-neutral-400 shadow-[0_0_50px_rgba(0,0,0,0.5)]
          dark:bg-black dark:border-white/20 dark:shadow-[0_0_50px_rgba(255,255,255,0.05)]
          flex flex-col 
          overflow-hidden
          animate-in zoom-in-95 duration-300
          rounded-none
        "
        onClick={(e) => e.stopPropagation()} 
      >
          {/* Decoration Corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 relative">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
              
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/20">
                      <Sliders size={16} className="text-emerald-600 dark:text-emerald-500"/>
                  </div>
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
          <div className="p-6 bg-neutral-50/50 dark:bg-black/80 space-y-5">
              
              {/* Input: Song Title */}
              <div className="space-y-2 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 font-bold group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors">
                      <Type size={12}/> Target_Keyword / Title
                  </label>
                  <input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      onKeyDown={handleKeyDown}
                      placeholder="ENTER_TRACK_NAME..."
                      autoFocus
                      className="
                        w-full p-3 text-sm font-mono outline-none transition-all rounded-none
                        bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                        focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                        
                        dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                        dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                      "
                  />
              </div>

              {/* Input: Artist */}
              <div className="space-y-2 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 font-bold group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors">
                      <User size={12}/> Artist_Identity
                  </label>
                  <input 
                      value={artist} 
                      onChange={(e) => setArtist(e.target.value)} 
                      onKeyDown={handleKeyDown}
                      placeholder="ENTER_ARTIST_NAME..."
                      className="
                        w-full p-3 text-sm font-mono outline-none transition-all rounded-none
                        bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                        focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                        
                        dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                        dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                      "
                  />
              </div>

              {/* Input: Uploader (NEW) */}
              <div className="space-y-2 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 font-bold group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors">
                      <CircleUser size={12}/> Uploader_Name / ID
                  </label>
                  <input 
                      value={uploader} 
                      onChange={(e) => setUploader(e.target.value)} 
                      onKeyDown={handleKeyDown}
                      placeholder="ENTER_UPLOADER_NAME..."
                      className="
                        w-full p-3 text-sm font-mono outline-none transition-all rounded-none
                        bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                        focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)]
                        
                        dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                        dark:focus:border-blue-500 dark:focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]
                      "
                  />
              </div>

              {/* Select: Genre */}
              <div className="space-y-2 group">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono text-neutral-500 dark:text-neutral-400 font-bold group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors">
                      <Tag size={12}/> Genre_Classification
                  </label>
                  <div className="relative">
                      <select 
                          value={tag} 
                          onChange={(e) => setTag(e.target.value)} 
                          onKeyDown={handleKeyDown}
                          className="
                            w-full p-3 text-sm font-mono outline-none appearance-none cursor-pointer rounded-none
                            bg-white border-2 border-neutral-300 text-neutral-900 
                            focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                            
                            dark:bg-black/40 dark:border-white/20 dark:text-white 
                            dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                          "
                      >
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
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                          <Sliders size={12} className="rotate-90"/>
                      </div>
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex gap-4 border-t border-neutral-300 dark:border-white/10 mt-2">
                  
                  {/* RESET BUTTON */}
                  <GlitchButton 
                      onClick={handleReset}
                      className="flex-1 py-3 text-[10px] rounded-none border-red-500 text-red-600 dark:text-red-400 dark:hover:!text-white"
                  >
                      <span className="flex items-center justify-center gap-2">
                         <RotateCcw size={14}/> SYSTEM_RESET
                      </span>
                  </GlitchButton>

                  {/* EXECUTE BUTTON */}
                  <CyberButton 
                      onClick={handleSearch} 
                      className="flex-[2] py-3 text-xs rounded-none"
                  >
                      <span className="flex items-center justify-center gap-2">
                          <Search size={16} strokeWidth={3}/> EXECUTE_SEARCH
                      </span>
                  </CyberButton>
              </div>

          </div>
      </div>
    </div>,
    document.body 
  );
};

export default AdvancedSearchModal;