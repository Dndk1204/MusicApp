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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      
      {/* Modal Container: Glass Style */}
      <div className="bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.6)]">
        
        {/* Close Button */}
        <button 
            className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition hover:rotate-90 duration-300" 
            onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                <ListPlus size={24} className="text-emerald-500" />
            </div>
            <h2 className="text-white text-xl font-bold font-mono tracking-tighter">
                NEW_PLAYLIST
            </h2>
            <p className="text-[10px] text-emerald-500 font-mono tracking-[0.3em] uppercase mt-1 opacity-80">
                :: INITIALIZE_DATABASE ::
            </p>
        </div>

        {/* Input Field */}
        <div className="flex flex-col gap-2 mb-6">
            <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest ml-1">Playlist Name</label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="Ex: Coding Vibes..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition placeholder-neutral-600"
            />
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-emerald-500 text-black font-bold font-mono py-3 rounded-lg hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          [CREATE_FOLDER]
        </button>

      </div>
    </div>
  );
};

export default CreatePlaylistModal;