"use client";

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUploadModal from "@/hooks/useUploadModal";
import useUI from "@/hooks/useUI";
import { X, UploadCloud, Lock, Globe, Loader2, Image as ImageIcon, FileAudio, Music, FileType } from "lucide-react";
// Import Cyber Components
import { GlitchText, CyberButton, CyberCard } from "@/components/CyberComponents";

// Function to handle safe filenames
const sanitizeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
};

const UploadModal = () => {
  const { isOpen, onClose } = useUploadModal();
  const { alert: showAlert } = useUI();
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const success = (msg) => showAlert(msg, 'success', 'SUCCESS');
  const error = (msg) => showAlert(msg, 'error', 'ERROR');

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isPublic, setIsPublic] = useState("true");
  const [songFile, setSongFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [songDuration, setSongDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setAuthor("");
      setIsPublic("true");
      setSongFile(null);
      setImageFile(null);
      setSongDuration(0);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getSession();
        if (user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (data?.role === 'admin') setIsAdmin(true);
        }
    };
    if(isOpen) checkUser();
  }, [isOpen]);

  // Extract duration helper
  const extractAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleSongFileChange = async (e) => {
    const file = e.target.files[0];
    setSongFile(file);

    if (file) {
      try {
        const duration = await extractAudioDuration(file);
        setSongDuration(Math.floor(duration));
      } catch (error) {
        console.error("Error extracting duration:", error);
        setSongDuration(0);
      }
    } else {
      setSongDuration(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      if (!songFile || !imageFile || !title || !author) {
        error("Missing required fields or files.");
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        error("Login required for this action.");
        setIsLoading(false);
        return;
      }

      const uniqueID = uuidv4();
      const safeTitle = sanitizeString(title);

      // 1. Upload MP3
      const songPath = `song-${safeTitle}-${uniqueID}`;
      const { data: songData, error: songError } = await supabase.storage
        .from('songs')
        .upload(songPath, songFile, { cacheControl: '3600', upsert: false });
      
      if (songError) throw new Error("Audio upload failed: " + songError.message);

      // 2. Upload Image
      const imagePath = `image-${safeTitle}-${uniqueID}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('images')
        .upload(imagePath, imageFile, { cacheControl: '3600', upsert: false });
      
      if (imageError) throw new Error("Image upload failed: " + imageError.message);

      const { data: songUrlData } = supabase.storage.from('songs').getPublicUrl(songData.path);
      const { data: imageUrlData } = supabase.storage.from('images').getPublicUrl(imageData.path);

      // 3. Insert DB
      const { error: dbError } = await supabase.from('songs').insert({
        user_id: user.id,
        title: title,
        author: author,
        image_url: imageUrlData.publicUrl,
        song_url: songUrlData.publicUrl,
        is_public: isAdmin ? true : (isPublic === 'true'),
        play_count: 0,
        duration: songDuration
      });

      if (dbError) throw dbError;

      router.refresh();
      success("Upload completed successfully!"); 
      
      setTimeout(() => {
          onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      error("System Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 font-sans animate-in fade-in duration-300">
      
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm" onClick={onClose} />

      {/* CARD CONTAINER (CYBER STYLE) */}
      <div className="
          w-full max-w-lg overflow-hidden relative
          bg-white dark:bg-black 
          border-2 border-neutral-400 dark:border-white/20 
          shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none
      ">
        {/* Decoration Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

        {/* Header */}
        <div className="p-5 flex justify-between items-center relative border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div>
                <h2 className="text-xl font-bold font-mono flex items-center gap-2 uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text={isAdmin ? "ADMIN_UPLOAD" : "UPLOAD_MODULE"} />
                </h2>
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase mt-1 text-emerald-600 dark:text-emerald-500">
                    {isAdmin ? ":: SYSTEM_OVERRIDE_ENABLED ::" : ":: USER_CONTRIBUTION ::"}
                </p>
            </div>

            <button onClick={onClose} className="text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 transition hover:rotate-90 duration-300">
                <X size={24}/>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 bg-neutral-50 dark:bg-black/80">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Inputs */}
                <div className="space-y-4">
                    <div className="group relative">
                        <label className="text-[10px] font-mono uppercase mb-1 block group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 text-neutral-600 dark:text-neutral-500 font-bold transition-colors">
                            <Music size={12} className="inline mr-1"/> Track_Title
                        </label>
                        <input 
                            disabled={isLoading} 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ENTER_TITLE..." 
                            className="
                                w-full p-3 text-sm font-mono transition-all outline-none rounded-none
                                bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                                focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                                
                                dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                                dark:focus:border-emerald-500 dark:focus:bg-emerald-500/5
                            "
                            required
                        />
                    </div>
                    <div className="group relative">
                        <label className="text-[10px] font-mono uppercase mb-1 block group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 text-neutral-600 dark:text-neutral-500 font-bold transition-colors">
                            <FileType size={12} className="inline mr-1"/> Artist_Identity
                        </label>
                        <input 
                            disabled={isLoading} 
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="ENTER_ARTIST..." 
                            className="
                                w-full p-3 text-sm font-mono transition-all outline-none rounded-none
                                bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                                focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                                
                                dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                                dark:focus:border-emerald-500 dark:focus:bg-emerald-500/5
                            "
                            required
                        />
                    </div>
                </div>

                {/* File Uploads Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Audio Upload */}
                    <div className={`
                        relative p-4 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-2
                        ${songFile 
                            ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5' 
                            : 'border-neutral-300 bg-white hover:bg-neutral-50 hover:border-emerald-500/50 dark:border-white/20 dark:bg-black/30 dark:hover:bg-white/5'}
                    `}>
                        <div className={`p-3 rounded-none border ${songFile ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-neutral-300 bg-neutral-100 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 group-hover:text-emerald-500 group-hover:border-emerald-500'}`}>
                            <FileAudio size={24} />
                        </div>
                        <span className={`text-[10px] font-mono text-center truncate w-full px-2 uppercase ${songFile ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {songFile ? songFile.name : "SELECT_AUDIO_FILE"}
                        </span>
                        <input
                            type="file"
                            accept=".mp3,audio/*"
                            disabled={isLoading}
                            onChange={handleSongFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div className={`
                        relative p-4 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-2
                        ${imageFile 
                            ? 'border-pink-500 bg-pink-500/10 dark:bg-pink-500/5' 
                            : 'border-neutral-300 bg-white hover:bg-neutral-50 hover:border-pink-500/50 dark:border-white/20 dark:bg-black/30 dark:hover:bg-white/5'}
                    `}>
                        <div className={`p-3 rounded-none border ${imageFile ? 'border-pink-500 bg-pink-500/20 text-pink-600 dark:text-pink-400' : 'border-neutral-300 bg-neutral-100 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 group-hover:text-pink-500 group-hover:border-pink-500'}`}>
                            <ImageIcon size={24} />
                        </div>
                        <span className={`text-[10px] font-mono text-center truncate w-full px-2 uppercase ${imageFile ? 'text-pink-700 dark:text-pink-400 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {imageFile ? imageFile.name : "SELECT_COVER_ART"}
                        </span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            disabled={isLoading} 
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            required
                        />
                    </div>
                </div>

                {/* Visibility Toggle */}
                {!isAdmin && (
                    <div className="flex p-1 rounded-none border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-black/40">
                        <label className={`
                            flex-1 flex items-center justify-center gap-2 p-2 rounded-none cursor-pointer transition-all border border-transparent
                            ${isPublic === "true" 
                                ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border-emerald-500 shadow-sm' 
                                : 'text-neutral-500 hover:text-black dark:hover:text-white'}
                        `}>
                            <input type="radio" value="true" checked={isPublic === "true"} onChange={(e) => setIsPublic(e.target.value)} className="hidden" />
                            <Globe size={14}/> <span className="text-[10px] font-mono uppercase">Public</span>
                        </label>
                        <label className={`
                            flex-1 flex items-center justify-center gap-2 p-2 rounded-none cursor-pointer transition-all border border-transparent
                            ${isPublic === "false" 
                                ? 'bg-white dark:bg-red-500/20 text-red-700 dark:text-red-400 font-bold border-red-500 shadow-sm' 
                                : 'text-neutral-500 hover:text-black dark:hover:text-white'}
                        `}>
                            <input type="radio" value="false" checked={isPublic === "false"} onChange={(e) => setIsPublic(e.target.value)} className="hidden" />
                            <Lock size={14}/> <span className="text-[10px] font-mono uppercase">Private</span>
                        </label>
                    </div>
                )}

                {/* Submit Button */}
                <CyberButton 
                    type="submit" 
                    disabled={isLoading} 
                    className="
                        w-full py-4 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed rounded-none
                        border-emerald-500 bg-emerald-600 hover:bg-emerald-500 text-white
                    "
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> PROCESSING_DATA...</span>
                    ) : (
                        <span className="flex items-center justify-center gap-2"><UploadCloud size={16}/> INITIATE_UPLOAD</span>
                    )}
                </CyberButton>

            </form>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;