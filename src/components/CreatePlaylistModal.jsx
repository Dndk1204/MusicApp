"use client";

import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
// Import Cyber Components
import { GlitchText, CyberButton, HoloButton, GlitchButton } from "@/components/CyberComponents";

const CreatePlaylistModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container (Cyber Brutalism) */}
      <div className="
        relative z-10 w-[95%] md:w-full max-w-sm overflow-hidden
        bg-white dark:bg-black 
        border-2 border-neutral-400 dark:border-white/20 
        shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(255,255,255,0.05)]
        rounded-none
      ">
        
        {/* Decoration Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

        {/* Header Section */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-5 md:p-6 text-center relative">
            {/* Top Glow Line */}
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            {/* Icon */}
            <div className="w-12 h-12 mx-auto flex items-center justify-center mb-3 bg-neutral-200 dark:bg-white/5 border border-neutral-400 dark:border-white/20 rounded-none shadow-inner">
                <FolderPlus size={24} className="text-emerald-600 dark:text-emerald-500" />
            </div>
            
            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                <GlitchText text="NEW_PLAYLIST" />
            </h2>
            
            {/* Subtitle */}
            <p className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase mt-1 opacity-70 text-neutral-500 dark:text-emerald-400/80">
                :: INITIALIZE_DB_ENTRY ::
            </p>

            {/* Close Button */}
            <button 
                className="absolute top-2 right-2 p-2 text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300" 
                onClick={onClose}
            >
                <X size={20} />
            </button>
        </div>

        {/* Body Section */}
        <div className="p-6 md:p-8 pt-6 bg-neutral-50/50 dark:bg-black/80">
            {/* Input Field */}
            <div className="flex flex-col gap-2 mb-8 group">
                <label className="text-[10px] font-mono uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors">
                  Playlist Designation
                </label>
                
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder="ENTER_NAME..."
                    className="
                      w-full p-3 rounded-none outline-none transition-all font-mono
                      text-base md:text-sm /* Text base trên mobile để tránh IOS auto zoom */
                      bg-white border-2 border-neutral-400 text-neutral-900 placeholder-neutral-400
                      focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                      
                      dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                      dark:focus:border-emerald-500 dark:focus:shadow-[0_0_20px_rgba(16,185,129,0.15)]
                    "
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <GlitchButton 
                    onClick={onClose}
                    className="flex-1 py-3 text-xs !border-red-500 !text-red-500 dark:!border-red-400/70 dark:!text-red-400 hover:!text-red-500 dark:hover:!text-white"
                >
                    ABORT
                </GlitchButton>
                
                <CyberButton
                    onClick={handleCreate}
                    disabled={!name.trim()}
                    className="flex-1 py-3 text-xs"
                >
                    CREATE
                </CyberButton>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CreatePlaylistModal;