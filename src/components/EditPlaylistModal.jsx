"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Check, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import useUI from "@/hooks/useUI"; 
import { GlitchText, HoloButton, GlitchButton } from "@/components/CyberComponents";

export default function EditPlaylistModal({ playlist, onClose, onUpdated, onDeleted }) {
  const { alert, confirm } = useUI();
  
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(playlist.cover_url);
  const [loading, setLoading] = useState(false);

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
          .from("images/playlists")
          .upload(fileName, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        cover_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/playlists/${fileName}`;
      }

      const { error } = await supabase
        .from("playlists")
        .update({ name, description, cover_url })
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      
      {/* 1. CONTAINER CHÍNH (Thay thế CyberCard) */}
      <div className="
          w-full max-w-4xl flex flex-col relative overflow-hidden
          bg-white dark:bg-neutral-900 
          border border-neutral-300 dark:border-emerald-500/30 
          shadow-2xl dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none md:rounded-xl
      ">
        
        {/* --- DECORATION: 4 GÓC --- */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

        {/* 2. HEADER */}
        <div className="bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 p-4 flex justify-between items-center relative overflow-hidden shrink-0">
             {/* Decor Line */}
            <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rotate-45"></div>
                <h2 className="text-lg font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="EDIT_CONFIGURATION" />
                </h2>
            </div>
            
            <button onClick={onClose} className="text-neutral-400 hover:text-red-500 dark:hover:text-white transition hover:rotate-90 duration-300">
                <X size={20} />
            </button>
        </div>

        {/* 3. BODY */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 bg-white dark:bg-transparent">
            
            {/* LEFT: Image Upload */}
            <div className="flex flex-col gap-4 items-center shrink-0 md:w-1/3">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 group hover:border-emerald-500 transition-colors bg-neutral-100 dark:bg-black/50">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-2">
                            <ImageIcon size={40} />
                            <span className="text-xs font-mono uppercase">NO_SIGNAL</span>
                        </div>
                    )}
                    
                    {/* Overlay Upload */}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload size={32} className="text-emerald-500 mb-2" />
                        <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase">UPLOAD_IMAGE</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="text-[10px] text-neutral-500 font-mono text-center">
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
                            w-full rounded-md p-3 font-mono text-sm transition-all outline-none
                            /* Light Mode */
                            bg-neutral-100 border border-neutral-300 text-neutral-900 
                            focus:bg-white focus:border-emerald-500 focus:shadow-md
                            /* Dark Mode */
                            dark:bg-black/40 dark:border-white/10 dark:text-white 
                            dark:focus:bg-emerald-500/5 dark:focus:border-emerald-500
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
                            w-full flex-1 rounded-md p-3 font-mono text-sm transition-all outline-none resize-none min-h-[120px]
                            /* Light Mode */
                            bg-neutral-100 border border-neutral-300 text-neutral-900
                            focus:bg-white focus:border-emerald-500 focus:shadow-md
                            /* Dark Mode */
                            dark:bg-black/40 dark:border-white/10 dark:text-white
                            dark:focus:bg-emerald-500/5 dark:focus:border-emerald-500
                        "
                        placeholder="ENTER_METADATA..."
                    />
                </div>
            </div>
        </div>

        {/* 4. FOOTER */}
        <div className="bg-neutral-50 dark:bg-white/5 border-t border-neutral-200 dark:border-white/10 p-4 flex justify-between items-center shrink-0">
            <GlitchButton 
                onClick={handleDelete}
                disabled={loading}
                className="border-red-500/50 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white text-xs"
            >
                <div className="flex items-center gap-2">
                    <Trash2 size={14} /> PURGE_DATA
                </div>
            </GlitchButton>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded text-xs font-mono font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition uppercase"
                >
                    Cancel
                </button>
                <HoloButton 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="text-xs px-6 py-1 
                     !text-emerald-600 !dark:text-emerald-500
                     !border-emerald-600 !dark:border-emerald-500"
                >
                    {loading ? "PROCESSING..." : "SAVE_CHANGES"}
                </HoloButton>
            </div>
        </div>
      </div>
    </div>
  );
}