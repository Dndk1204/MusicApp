"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Check, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import useUI from "@/hooks/useUI"; 
import { GlitchText, HoloButton, GlitchButton, CyberButton, NeonButton } from "@/components/CyberComponents";
import { Loader2 } from "lucide-react";

export default function EditPlaylistModal({ playlist, onClose, onUpdated, onDeleted }) {
  const { alert, confirm } = useUI();
  
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(playlist.cover_url);
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState(playlist.visibility ?? 1);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      let cover_url = playlist.cover_url;

      if (file) {
        const ext = file.name.split(".").pop();
        const fileName = `playlist_${playlist.id}_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("images") // Sửa lại bucket name cho đúng nếu cần (thường là 'images' hoặc 'playlist-covers')
          .upload(`playlists/${fileName}`, file, { upsert: true }); // Thêm folder playlists/ để gọn
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("images").getPublicUrl(`playlists/${fileName}`);
        cover_url = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("playlists")
        .update({ name, description, cover_url, visibility})
        .eq("id", playlist.id);
        
      if (error) throw error;

      alert("Playlist configuration updated.", "success", "UPDATE_SUCCESS");
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message, "error", "UPDATE_FAILED");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm(
        "WARNING: This will permanently delete the playlist and all its associations. Continue?", 
        "DELETE_CONFIRMATION"
    );

    if (!isConfirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("playlists").delete().eq("id", playlist.id);
      if (error) throw error;
      
      alert("Playlist deleted from database.", "success", "DELETION_COMPLETE");
      onDeleted?.(); 
      onClose(); 
    } catch (err) {
      alert(err.message, "error", "DELETE_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      
      {/* 1. CONTAINER CHÍNH (CYBER BRUTALISM) */}
      <div className="
          w-full max-w-4xl flex flex-col relative overflow-hidden
          bg-white dark:bg-black
          border-2 border-neutral-400 dark:border-white/20
          shadow-[0_0_40px_rgba(0,0,0,0.5)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]
          rounded-none
      ">
        
        {/* --- DECORATION: 4 GÓC --- */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

        {/* 2. HEADER */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-5 flex justify-between items-center relative overflow-hidden shrink-0 z-20">
            {/* Decor Line */}
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rotate-45 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="EDIT_CONFIGURATION" />
                </h2>
            </div>
            
            <button onClick={onClose} className="text-neutral-500 hover:!text-red-500 dark:hover:text-white transition hover:rotate-90 duration-300">
                <X size={24} />
            </button>
        </div>

        {/* 3. BODY */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 bg-neutral-50/50 dark:bg-black/80 relative z-10 min-h-0 overflow-y-auto">
            
            {/* LEFT: Image Upload */}
            <div className="flex flex-col gap-4 items-center shrink-0 md:w-1/3">
                <div className="relative w-full aspect-square overflow-hidden border-2 border-dashed border-neutral-400 dark:border-white/20 group hover:border-emerald-500 transition-colors bg-white dark:bg-black rounded-none">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-2">
                            <ImageIcon size={40} />
                            <span className="text-xs font-mono uppercase">NO_SIGNAL</span>
                        </div>
                    )}
                    
                    {/* Overlay Upload */}
                    <label className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload size={32} className="text-emerald-500 mb-2 animate-bounce" />
                        <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase">UPLOAD_IMAGE</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="text-[10px] text-neutral-500 font-mono text-center border-t border-neutral-300 dark:border-white/10 pt-2 w-full">
                    SUPPORTED FORMATS: JPG, PNG, WEBP<br/>MAX SIZE: 5MB
                </p>
            </div>

            {/* RIGHT: Inputs */}
            <div className="flex-1 flex flex-col gap-5">
                <div className="group">
                    <label className="text-xs font-mono text-emerald-600 dark:text-emerald-500 font-bold uppercase mb-2 block group-focus-within:animate-pulse">
                        PLAYLIST_DESIGNATION
                    </label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="
                            w-full p-3 font-mono text-sm transition-all outline-none rounded-none
                            /* Light Mode */
                            bg-white border border-neutral-400 text-neutral-900 
                            focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                            /* Dark Mode */
                            dark:bg-white/5 dark:border-white/10 dark:text-white 
                            dark:focus:bg-black dark:focus:border-emerald-500
                        "
                        placeholder="ENTER_NAME..."
                    />
                </div>

                <div className="group flex-1 flex flex-col">
                    <label className="text-xs font-mono text-neutral-500 dark:text-neutral-400 font-bold uppercase mb-2 block group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500">
                        DATA_DESCRIPTION
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="
                            w-full flex-1 p-3 font-mono text-sm transition-all outline-none resize-none min-h-[150px] rounded-none
                            /* Light Mode */
                            bg-white border border-neutral-400 text-neutral-900
                            focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]
                            /* Dark Mode */
                            dark:bg-white/5 dark:border-white/10 dark:text-white
                            dark:focus:bg-black dark:focus:border-emerald-500
                        "
                        placeholder="ENTER_METADATA..."
                    />
                </div>

                <label className="text-xs font-mono font-bold uppercase mb-2 text-neutral-500 dark:text-neutral-400">
                    ACCESS_VISIBILITY
                </label>
                <CyberButton
                    onClick={() => setVisibility(visibility === 1 ? 0 : 1)}
                    className={`
                    w-full px-4 py-3 font-mono text-sm font-bold rounded-none border 
                    transition-all duration-200
                    ${visibility === 1 
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                        : "bg-neutral-800 border-neutral-500 text-neutral-300 dark:bg-black dark:border-white/20"
                    }
                    `}
                >
                    {visibility === 1 ? "PUBLIC_MODE" : "PRIVATE_MODE"}
                </CyberButton>
            </div>
        </div>

        {/* 4. FOOTER */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-300 dark:border-white/10 p-5 flex justify-between items-center shrink-0 z-20">
            <GlitchButton 
                onClick={handleDelete}
                disabled={loading}
                className="border-red-500 text-red-600 dark:text-red-500 bg-red-500/10 hover:!text-white text-xs px-6 py-2 rounded-none"
            >
                <div className="flex items-center gap-2">
                    <Trash2 size={14} /> PURGE_DATA
                </div>
            </GlitchButton>

            <div className="flex gap-4">
                <NeonButton
                    onClick={onClose}
                    className="px-6 py-2 border border-neutral-400 dark:border-white/20 text-xs font-mono font-bold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition uppercase hover:bg-neutral-200 dark:hover:bg-white/10 rounded-none"
                >
                    ABORT
                </NeonButton>
                
                <CyberButton 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="text-xs px-8 py-2 rounded-none"
                >
                    {loading ? <Loader2 className="animate-spin" size={14}/> : <Check size={14}/>} SAVE_CHANGES
                </CyberButton>
            </div>
        </div>
      </div>
    </div>
  );
}