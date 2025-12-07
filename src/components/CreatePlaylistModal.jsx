"use client";

import { useState } from "react";
import { X, ListPlus, FolderPlus } from "lucide-react";
// Import Cyber Components nếu có, hoặc style trực tiếp
import { GlitchText } from "@/components/CyberComponents";

const CreatePlaylistModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  // Xử lý khi nhấn Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Backdrop (Làm tối nền sau) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container (Glassmorphism Style) */}
      <div className="
        relative z-10 w-full max-w-sm overflow-hidden
        
        /* === Light Mode Glass === */
        bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl
        
        /* === Dark Mode Cyber Glass === */
        dark:bg-neutral-900/70 dark:backdrop-blur-2xl dark:border-emerald-500/20 dark:shadow-[0_0_60px_rgba(16,185,129,0.15)]
        
        /* Shape & Animation */
        rounded-none md:rounded-2xl 
        animate-in zoom-in-95 slide-in-from-bottom-5 duration-300
      ">
        
        {/* Decoration Corners (Neon Accents) */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500/50 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/50 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/50 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500/50 pointer-events-none z-30"></div>

        {/* Header Section */}
        <div className="p-6 text-center relative border-b border-neutral-200/30 dark:border-white/5">
            {/* Top Glow Line */}
            <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            
            {/* Icon */}
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 
                bg-gradient-to-br from-neutral-100 to-white border border-white/50 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]
                dark:from-neutral-800 dark:to-neutral-900/50 dark:border-white/5 dark:shadow-none
            ">
                <FolderPlus size={26} className="text-emerald-600 dark:text-emerald-500 drop-shadow-sm animate-pulse" />
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white uppercase text-shadow-sm">
                <GlitchText text="NEW_PLAYLIST" />
            </h2>
            
            {/* Subtitle */}
            <p className="text-[9px] font-mono tracking-[0.3em] uppercase mt-2 opacity-80 text-emerald-700 dark:text-emerald-400">
                :: INITIALIZE_DATABASE_ENTRY ::
            </p>

            {/* Close Button */}
            <button 
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition hover:rotate-90 duration-300 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full" 
                onClick={onClose}
            >
                <X size={18} />
            </button>
        </div>

        {/* Body Section */}
        <div className="p-8 pt-6">
            {/* Input Field */}
            <div className="flex flex-col gap-2 mb-8 group">
                <label className="text-[10px] font-mono uppercase tracking-widest ml-1 font-bold text-neutral-500 dark:text-neutral-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors">
                  Playlist Name
                </label>
                
                <div className="relative">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        placeholder="Ex: Coding Vibes..."
                        className="
                          w-full p-3 pl-4 rounded-none md:rounded-lg text-sm font-mono outline-none transition-all z-10 relative
                          
                          /* Light Input */
                          bg-neutral-100/50 border border-neutral-300/50 text-neutral-900 placeholder-neutral-400
                          focus:bg-white focus:border-emerald-500/60 focus:shadow-[0_2px_15px_rgba(16,185,129,0.1)]
                          
                          /* Dark Input */
                          dark:bg-black/40 dark:border-white/10 dark:text-white dark:placeholder-neutral-600
                          dark:focus:bg-black/60 dark:focus:border-emerald-500/50 dark:focus:shadow-[0_0_20px_rgba(16,185,129,0.15)]
                        "
                    />
                    {/* Input bottom glow bar */}
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-emerald-500 transition-all duration-500 group-focus-within:w-full"></div>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="
                  w-full font-bold font-mono py-3.5 rounded-none md:rounded-lg transition-all active:scale-[0.98] relative overflow-hidden group
                  
                  /* Button Style */
                  bg-emerald-500 hover:bg-emerald-400 
                  dark:bg-emerald-600 dark:hover:bg-emerald-500
                  text-white dark:text-black uppercase tracking-widest text-xs border border-emerald-400/50
                  
                  /* Shadows & Glows */
                  shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)]
                  
                  /* Disabled State */
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-emerald-500 dark:disabled:hover:bg-emerald-600
                "
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    <FolderPlus size={16} className="group-hover:rotate-12 transition-transform"/>
                    [ CREATE_FOLDER ]
                </span>
                {/* Button Scanline Effect */}
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 dark:via-black/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
            </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePlaylistModal;