"use client";

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUploadModal from "@/hooks/useUploadModal";
import useUI from "@/hooks/useUI";
import { X, UploadCloud, Lock, Globe, Loader2, Image as ImageIcon, FileAudio, Music, FileText } from "lucide-react";
import { GlitchText, CyberButton } from "@/components/CyberComponents";

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
  const [lyricFile, setLyricFile] = useState(null); 
  const [songDuration, setSongDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setAuthor("");
      setIsPublic("true");
      setSongFile(null);
      setImageFile(null);
      setLyricFile(null);
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
        error("Missing required fields (Song, Image, Title, Artist).");
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

      if (songError) throw new Error("Audio upload failed");

      // 2. Upload Image
      const imagePath = `image-${safeTitle}-${uniqueID}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('images')
        .upload(imagePath, imageFile, { cacheControl: '3600', upsert: false });

      if (imageError) throw new Error("Image upload failed");

      // 3. Upload Lyric
      let lyricUrl = null;
      if (lyricFile) {
        const fileExt = lyricFile.name.split('.').pop() || 'txt';
        const lyricPath = `lyric-${safeTitle}-${uniqueID}.${fileExt}`;
        const { data: lyricData, error: lyricError } = await supabase.storage
          .from('songs')
          .upload(lyricPath, lyricFile, { cacheControl: '3600', upsert: false });

        if (lyricError) throw new Error("Lyric upload failed");
        const { data: lyricUrlData } = supabase.storage.from('songs').getPublicUrl(lyricData.path);
        lyricUrl = lyricUrlData.publicUrl;
      }

      const { data: songUrlData } = supabase.storage.from('songs').getPublicUrl(songData.path);
      const { data: imageUrlData } = supabase.storage.from('images').getPublicUrl(imageData.path);

      // 4. Insert DB với cơ chế LOGIC MỚI
      const { error: dbError } = await supabase.from('songs').insert({
        user_id: user.id,
        title: title,
        author: author,
        image_url: imageUrlData.publicUrl,
        song_url: songUrlData.publicUrl,
        lyric_url: lyricUrl, 
        
        // --- LOGIC YÊU CẦU DUYỆT ---
        // Nếu là Admin thì duyệt ngay lập tức
        is_public: isAdmin ? (isPublic === 'true') : false,
        is_verified: isAdmin ? true : false,
        is_denied: false,
        
        // Gắn tín hiệu: Nếu bài mới tải lên bởi user thì action là 'upload'
        // Nếu user chọn private thì đánh dấu 'set_private' để khi admin duyệt
        // hệ thống giữ nguyên trạng thái private thay vì mặc định public
        pending_action: isAdmin ? null : (isPublic === 'false' ? 'set_private' : 'upload'), 
        
        play_count: 0,
        duration: songDuration
      });

      if (dbError) throw dbError;

      router.refresh();
      success(isAdmin ? "Data deployed to Core." : "Signal sent to moderation queue."); 
      
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
    <div className="fixed inset-0 z-[9999] flex justify-center items-center p-0 md:p-4 font-sans animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full h-full md:h-auto md:max-w-lg overflow-hidden relative bg-white dark:bg-black md:border-2 md:border-neutral-400 md:dark:border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(16,185,129,0.15)] rounded-none flex flex-col max-h-full md:max-h-[90vh]">
        <div className="p-4 md:p-5 flex justify-between items-center border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 shrink-0 sticky top-0 z-40">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            <div>
                <h2 className="text-lg md:text-xl font-bold font-mono flex items-center gap-2 uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text={isAdmin ? "ADMIN_UPLOAD" : "UPLOAD_MODULE"} />
                </h2>
                <p className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase mt-1 text-emerald-600 dark:text-emerald-500">
                    {isAdmin ? ":: SYSTEM_OVERRIDE_ENABLED ::" : ":: USER_CONTRIBUTION ::"}
                </p>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 transition hover:rotate-90 duration-300">
                <X size={24}/>
            </button>
        </div>

        <div className="p-4 md:p-6 lg:p-8 bg-neutral-50 dark:bg-black/80 overflow-y-auto custom-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-4">
                    <div className="group relative">
                        <label className="text-[10px] font-mono uppercase mb-1 block group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 text-neutral-600 dark:text-neutral-500 font-bold transition-colors">
                            <Music size={12} className="inline mr-1"/> Track_Title
                        </label>
                        <input disabled={isLoading} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ENTER_TITLE..." className="w-full p-3 text-sm font-mono transition-all outline-none rounded-none bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600 dark:focus:border-emerald-500" required />
                    </div>
                    <div className="group relative">
                        <label className="text-[10px] font-mono uppercase mb-1 block group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 text-neutral-600 dark:text-neutral-500 font-bold transition-colors">
                            <Music size={12} className="inline mr-1"/> Artist_Identity
                        </label>
                        <input disabled={isLoading} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ENTER_ARTIST..." className="w-full p-3 text-sm font-mono transition-all outline-none rounded-none bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600 dark:focus:border-emerald-500" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`relative p-3 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-row md:flex-col items-center justify-start md:justify-center gap-3 md:gap-1 h-16 md:h-auto ${songFile ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5' : 'border-neutral-300 bg-white dark:border-white/20 dark:bg-black/30'}`}>
                        <div className={`p-2 rounded-none border shrink-0 ${songFile ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600' : 'text-neutral-500'}`}><FileAudio size={20} /></div>
                        <span className="text-[10px] font-mono truncate w-full px-1 uppercase">{songFile ? songFile.name : "AUDIO FILE"}</span>
                        <input type="file" accept=".mp3,audio/*" disabled={isLoading} onChange={handleSongFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    </div>

                    <div className={`relative p-3 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-row md:flex-col items-center justify-start md:justify-center gap-3 md:gap-1 h-16 md:h-auto ${imageFile ? 'border-pink-500 bg-pink-500/10' : 'border-neutral-300 bg-white dark:border-white/20 dark:bg-black/30'}`}>
                        <div className={`p-2 rounded-none border shrink-0 ${imageFile ? 'border-pink-500 bg-pink-500/20 text-pink-600' : 'text-neutral-500'}`}><ImageIcon size={20} /></div>
                        <span className="text-[10px] font-mono truncate w-full px-1 uppercase">{imageFile ? imageFile.name : "COVER IMAGE"}</span>
                        <input type="file" accept="image/*" disabled={isLoading} onChange={(e) => setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" required />
                    </div>

                    <div className={`relative p-3 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-row md:flex-col items-center justify-start md:justify-center gap-3 md:gap-1 h-16 md:h-auto ${lyricFile ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-300 bg-white dark:border-white/20 dark:bg-black/30'}`}>
                        <div className={`p-2 rounded-none border shrink-0 ${lyricFile ? 'border-purple-500 bg-purple-500/20 text-purple-600' : 'text-neutral-500'}`}><FileText size={20} /></div>
                        <span className="text-[9px] font-mono truncate w-full px-1 uppercase">{lyricFile ? lyricFile.name : "LYRICS (.srt)"}</span>
                        <input type="file" accept=".srt,.txt" disabled={isLoading} onChange={(e) => setLyricFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                {/* Visibility Toggle */}
                {!isAdmin && (
                    <div className="flex p-1 rounded-none border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-black/40">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 md:p-2 rounded-none cursor-pointer transition-all border border-transparent ${isPublic === "true" ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border-emerald-500 shadow-sm' : 'text-neutral-500'}`}>
                            <input type="radio" value="true" checked={isPublic === "true"} onChange={(e) => setIsPublic(e.target.value)} className="hidden" />
                            <Globe size={14}/> <span className="text-[10px] font-mono uppercase">Public</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 md:p-2 rounded-none cursor-pointer transition-all border border-transparent ${isPublic === "false" ? 'bg-white dark:bg-red-500/20 text-red-700 dark:text-red-400 font-bold border-red-500 shadow-sm' : 'text-neutral-500'}`}>
                            <input type="radio" value="false" checked={isPublic === "false"} onChange={(e) => setIsPublic(e.target.value)} className="hidden" />
                            <Lock size={14}/> <span className="text-[10px] font-mono uppercase">Private</span>
                        </label>
                    </div>
                )}

                <CyberButton type="submit" disabled={isLoading} className="w-full py-4 text-xs tracking-widest disabled:opacity-50 border-emerald-500 bg-emerald-600 hover:bg-emerald-500 text-white mb-4 md:mb-0">
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