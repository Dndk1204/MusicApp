"use client";

import { useState } from "react";
import { X, ListPlus, FolderPlus } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300
      /* Overlay Background: Light (Xám nhạt) / Dark (Đen đậm) */
      bg-neutral-200/60 dark:bg-black/80 backdrop-blur-sm
    ">
      
      {/* Modal Container: Glass Style */}
      <div className="
        w-full max-w-sm relative rounded-2xl p-8 
        shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.6)]
        
        /* --- GLASS EFFECT --- */
        /* Light: Trắng đục + Viền xám */
        bg-white/80 border border-neutral-200
        
        /* Dark: Đen mờ + Viền trắng mờ */
        dark:bg-neutral-900/80 dark:border-white/10
        
        backdrop-blur-2xl
        transition-colors duration-300
      ">
        
        {/* Close Button */}
        <button 
            className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition hover:rotate-90 duration-300" 
            onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
            {/* Icon Circle */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3
              bg-neutral-100 border border-neutral-200
              dark:bg-white/5 dark:border-white/10
            ">
                <ListPlus size={24} className="text-emerald-600 dark:text-emerald-500" />
            </div>
            
            <h2 className="text-xl font-bold font-mono tracking-tighter
              text-neutral-800 dark:text-white
            ">
                NEW_PLAYLIST
            </h2>
            
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase mt-1 opacity-80
              text-emerald-600 dark:text-emerald-500
            ">
                :: INITIALIZE_DATABASE ::
            </p>
        </div>

        {/* Input Field */}
        <div className="flex flex-col gap-2 mb-6">
            <label className="text-[10px] font-mono uppercase tracking-widest ml-1
              text-neutral-500 dark:text-neutral-400
            ">
              Playlist Name
            </label>
            
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="Ex: Coding Vibes..."
                className="
                  w-full rounded-lg px-4 py-3 text-sm font-mono outline-none transition
                  
                  /* Light Mode Input */
                  bg-neutral-50 border border-neutral-300 text-neutral-900 placeholder-neutral-400
                  
                  /* Dark Mode Input */
                  dark:bg-black/40 dark:border-white/10 dark:text-white dark:placeholder-neutral-600
                  
                  /* Focus State (Chung) */
                  focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                "
            />
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="
            w-full font-bold font-mono py-3 rounded-lg transition active:scale-[0.98]
            
            bg-emerald-500 hover:bg-emerald-400 
            text-white dark:text-black
            
            shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_5px_20px_rgba(16,185,129,0.5)]
            
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          "
        >
          [CREATE_FOLDER]
        </button>

      </div>
    </div>
  );
};

export default CreatePlaylistModal;