"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, FileText, Save, Loader2 } from "lucide-react";
import { GlitchText, CyberButton } from "@/components/CyberComponents";
import useUI from "@/hooks/useUI";

const LyricsEditModal = ({ isOpen, onClose, song, onUpdate }) => {
  const [lyrics, setLyrics] = useState("");
  const [lyricsFile, setLyricsFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { alert } = useUI(); 

  useEffect(() => {
    if (song && isOpen) {
      setLyrics("");
      setLyricsFile(null);
      // If song has existing lyrics URL, we could load it, but for now we'll just allow uploading new ones
    }
  }, [song, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLyricsFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLyrics(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Login required for this action.");
      }

      let lyricUrl = null;

      if (lyricsFile) {
        const fileExt = lyricsFile.name.split('.').pop() || 'txt';
        const safeTitle = song.title.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
        const uniqueID = crypto.randomUUID();
        const lyricPath = `lyric-${safeTitle}-${uniqueID}.${fileExt}`;

        const { data: lyricData, error: lyricError } = await supabase.storage
          .from('songs')
          .upload(lyricPath, lyricsFile, { cacheControl: '3600', upsert: false });

        if (lyricError) {
          // Handle case where Supabase returns HTML instead of JSON for storage errors
          const errorMessage = lyricError.message;
          if (errorMessage.includes('<html>') || errorMessage.includes('Unexpected token')) {
            throw new Error("Lyrics upload failed: Storage bucket 'songs' may not exist or you don't have permission to upload. Please contact an administrator.");
          }
          throw new Error("Lyrics upload failed: " + errorMessage);
        }

        const { data: lyricUrlData } = supabase.storage.from('songs').getPublicUrl(lyricData.path);
        lyricUrl = lyricUrlData.publicUrl;
      }

      // Update the song with the new lyric URL
      const { error: updateError } = await supabase
        .from('songs')
        .update({ lyric_url: lyricUrl })
        .eq('id', song.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Call the onUpdate callback to refresh the parent component
      if (onUpdate) {
        onUpdate();
      }

      onClose();

    } catch (err) {
      console.error(err);
      alert("System Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 font-sans animate-in fade-in duration-300">

      {/* BACKDROP */}
      <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm" onClick={onClose} />

      {/* CARD CONTAINER */}
      <div className="
          w-full max-w-lg overflow-hidden relative
          bg-white dark:bg-black
          border-2 border-neutral-400 dark:border-white/20
          shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none
          max-h-[100vh] overflow-y-auto custom-scrollbar
      ">
        {/* Decoration Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-purple-600 dark:border-purple-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-purple-600 dark:border-purple-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-purple-600 dark:border-purple-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-purple-600 dark:border-purple-500 pointer-events-none z-30"></div>

        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 sticky top-0 z-40">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

            <div>
                <h2 className="text-xl font-bold font-mono flex items-center gap-2 uppercase tracking-widest text-neutral-900 dark:text-white">
                    <GlitchText text="LYRICS_EDITOR" />
                </h2>
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase mt-1 text-purple-600 dark:text-purple-500">
                    :: EDIT_MODE_ENABLED ::
                </p>
            </div>

            <button onClick={onClose} className="text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-500 transition hover:rotate-90 duration-300">
                <X size={24}/>
            </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 bg-neutral-50 dark:bg-black/80">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* Song Info Display */}
                <div className="p-4 bg-neutral-100 dark:bg-neutral-900/50 border border-neutral-300 dark:border-white/10">
                    <h3 className="text-sm font-bold font-mono text-neutral-900 dark:text-white uppercase tracking-wider">
                        {song.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-1">
                        by {song.author}
                    </p>
                </div>

                {/* Lyrics Upload */}
                <div className="space-y-4">
                    <div className="group relative">
                        <label className="text-[10px] font-mono uppercase mb-2 block group-focus-within:text-purple-600 dark:group-focus-within:text-purple-500 text-neutral-600 dark:text-neutral-500 font-bold transition-colors">
                            <FileText size={12} className="inline mr-1"/> LYRICS_FILE (.srt, .txt)
                        </label>

                        <div className={`
                            relative p-4 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-2
                            ${lyricsFile
                                ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/5'
                                : 'border-neutral-300 bg-white hover:bg-neutral-50 hover:border-purple-500/50 dark:border-white/20 dark:bg-black/30 dark:hover:bg-white/5'}
                        `}>
                            <div className={`p-3 rounded-none border ${lyricsFile ? 'border-purple-500 bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'border-neutral-300 bg-neutral-100 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 group-hover:text-purple-500 group-hover:border-purple-500'}`}>
                                <FileText size={24} />
                            </div>
                            <span className={`text-sm font-mono text-center uppercase ${lyricsFile ? 'text-purple-700 dark:text-purple-400 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                {lyricsFile ? lyricsFile.name : "UPLOAD_LYRICS"}
                            </span>
                            <input
                                type="file"
                                accept=".srt,.txt"
                                disabled={isLoading}
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {lyrics && (
                        <div className="mt-4">
                            <label className="text-[10px] font-mono uppercase mb-2 block text-neutral-600 dark:text-neutral-500 font-bold">
                                PREVIEW
                            </label>
                            <div className="p-4 bg-black/20 border border-neutral-300 dark:border-white/10 max-h-48 overflow-y-auto">
                                <pre className="text-xs font-mono text-neutral-900 dark:text-white whitespace-pre-wrap">
                                    {lyrics}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <CyberButton
                    type="submit"
                    disabled={isLoading || !lyricsFile}
                    className="
                        w-full py-4 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed rounded-none
                        border-purple-500 bg-purple-600 hover:bg-purple-500 text-white hover:!text-white
                    "
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> PROCESSING_LYRICS...</span>
                    ) : (
                        <span className="flex items-center justify-center gap-2"><Save size={16}/> SAVE_LYRICS</span>
                    )}
                </CyberButton>

            </form>
        </div>
      </div>
    </div>
  );
};

export default LyricsEditModal;
