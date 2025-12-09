"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUploadModal from "@/hooks/useUploadModal";
import useUI from "@/hooks/useUI";
import { X, UploadCloud, Lock, Globe, Loader2, Music, Image as ImageIcon, FileAudio } from "lucide-react";
// Import Cyber Components
import { GlitchText, HoloButton, GlitchButton, CyberCard } from "@/components/CyberComponents";

// Hàm xử lý tên file an toàn
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
  const { alert: showAlert } = useUI(); // Chỉ lấy alert, không cần ToastComponent riêng nếu useUI đã handle global
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Wrapper functions
  const success = (msg) => showAlert(msg, 'success', 'SUCCESS');
  const error = (msg) => showAlert(msg, 'error', 'ERROR');

  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isPublic, setIsPublic] = useState("true");
  const [songFile, setSongFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [songDuration, setSongDuration] = useState(0);

  // Reset form
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

  // Check Admin
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

      const uniqueID = crypto.randomUUID();
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

      // Get Public URLs
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

  // Function to extract audio duration
  const extractAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';

      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };

      audio.onerror = () => {
        resolve(0); // Return 0 if can't extract duration
      };

      audio.src = URL.createObjectURL(file);
    });
  };

  // Handle song file selection
  const handleSongFileChange = async (e) => {
    const file = e.target.files[0];
    setSongFile(file);

    if (file) {
      try {
        const duration = await extractAudioDuration(file);
        setSongDuration(Math.floor(duration)); // Store as integer seconds
      } catch (error) {
        console.error("Error extracting duration:", error);
        setSongDuration(0);
      }
    } else {
      setSongDuration(0);
    }
  };

  // Nếu modal không mở thì không render gì cả
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 font-sans animate-in fade-in duration-300">
      
      {/* CARD CONTAINER */}
      <CyberCard className="w-full max-w-lg p-0 overflow-hidden bg-neutral-900 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
        
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 p-5 flex justify-between items-center relative">
            <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div>
                <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2 uppercase tracking-widest">
                    <GlitchText text={isAdmin ? "ADMIN_UPLOAD" : "UPLOAD_MODULE"} />
                </h2>
                <p className="text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase mt-1">
                    {isAdmin ? ":: SYSTEM_OVERRIDE_ENABLED ::" : ":: USER_CONTRIBUTION ::"}
                </p>
            </div>

            <button onClick={onClose} className="text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300">
                <X size={24}/>
            </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 bg-black/40">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Inputs */}
                <div className="space-y-4">
                    <div className="group relative">
                        <label className="text-[10px] font-mono text-emerald-600 uppercase mb-1 block group-focus-within:animate-pulse">Track_Title</label>
                        <input 
                            disabled={isLoading} 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ENTER_TITLE..." 
                            className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none focus:bg-emerald-500/5 transition-all"
                            required
                        />
                    </div>
                    <div className="group relative">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase mb-1 block group-focus-within:text-emerald-500">Artist_Identity</label>
                        <input 
                            disabled={isLoading} 
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="ENTER_ARTIST..." 
                            className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none focus:bg-emerald-500/5 transition-all"
                            required
                        />
                    </div>
                </div>

                {/* File Uploads Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Audio Upload */}
                    <div className={`
                        relative p-4 rounded-xl border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-2 bg-black/30
                        ${songFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-700 hover:border-emerald-500/50 hover:bg-white/5'}
                    `}>
                        <div className={`p-3 rounded-full ${songFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-neutral-500 group-hover:text-emerald-400'}`}>
                            <FileAudio size={24} />
                        </div>
                        <span className="text-[10px] font-mono text-center truncate w-full px-2 text-neutral-400 group-hover:text-white">
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
                        relative p-4 rounded-xl border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-2 bg-black/30
                        ${imageFile ? 'border-pink-500 bg-pink-500/5' : 'border-neutral-700 hover:border-pink-500/50 hover:bg-white/5'}
                    `}>
                        <div className={`p-3 rounded-full ${imageFile ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-neutral-500 group-hover:text-pink-400'}`}>
                            <ImageIcon size={24} />
                        </div>
                        <span className="text-[10px] font-mono text-center truncate w-full px-2 text-neutral-400 group-hover:text-white">
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
                {/* Visibility Toggle (Non-Admin only) */}
                {!isAdmin && (
                    <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition-all ${isPublic === "true" ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-neutral-500 hover:text-white'}`}>
                            <input type="radio" value="true" checked={isPublic === "true"} onChange={(e) => setIsPublic(e.target.value)} className="hidden" />
                            <Globe size={14}/> <span className="text-[10px] font-mono uppercase">Public</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition-all ${isPublic === "false" ? 'bg-red-500/20 text-red-400 font-bold' : 'text-neutral-500 hover:text-white'}`}>
                            <input type="radio" value="false" checked={isPublic === "false"} onChange={(e) => setIsPublic(e.target.value)} className="hidden" />
                            <Lock size={14}/> <span className="text-[10px] font-mono uppercase">Private</span>
                        </label>
                    </div>
                )}

                {/* Submit Button */}
                <GlitchButton 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full py-4 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2 text-white"><Loader2 className="animate-spin" size={16}/> UPLOADING...</span>
                    ) : (
                        <span className="flex items-center gap-2 text-white"><UploadCloud size={16}/> INITIATE_UPLOAD</span>
                    )}
                </GlitchButton>

            </form>
        </div>
      </CyberCard>
    </div>
  );
}

export default UploadModal;
