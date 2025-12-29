"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import HoverImagePreview from "@/components/HoverImagePreview";
import { CyberButton, ScanlineOverlay } from "@/components/CyberComponents";
import { Send, Loader2 } from "lucide-react"; // Thêm icon để tối ưu mobile

export default function CommentForm({ songId, onSuccess }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [content]);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user ?? null;
      setUser(authUser);
      if (authUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setProfile(profileData);
      }
    };
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || !user || sending) return;
    setSending(true);
    const { data, error } = await supabase
      .from("song_comments")
      .insert({
        song_id: songId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`*, profiles (*)`)
      .single();

    if (!error) {
      onSuccess?.(data);
      setContent("");
    }
    setSending(false);
  };

  if (!user) {
    return (
      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-center py-4 border border-dashed border-neutral-300 dark:border-white/10 opacity-60">
        [AUTH_REQUIRED] Login to transmit data
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 md:gap-4 w-full max-w-4xl mx-auto p-1 translate-y-16 sm:translate-y-10 md:translate-y-14 lg:!translate-y-0">
      {/* AVATAR - Thu nhỏ trên mobile */}
      <div className="shrink-0 mt-1">
        <HoverImagePreview
          src={profile?.avatar_url}
          alt={profile?.full_name || "User"}
          className="w-8 h-8 md:w-10 md:h-10 rounded-none border border-emerald-500/30"
          previewSize={160}
          fallbackIcon="user"
        >
          <div className="relative group w-8 h-8 md:w-10 md:h-10 border border-neutral-300 dark:border-white/10 overflow-hidden">
            <img
              src={profile?.avatar_url || "/avatar-default.png"}
              alt="avatar"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
            <ScanlineOverlay />
          </div>
        </HoverImagePreview>
      </div>

      {/* COMMENT BOX - CYBER STYLE */}
      <div className="flex-1 flex flex-col gap-2">
        <div
          className={`
            relative flex items-end gap-2
            bg-white/50 dark:bg-black/40 
            backdrop-blur-md
            border ${content.trim() ? 'border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-neutral-300 dark:border-white/10'}
            p-2 md:px-3 md:py-2
            transition-all duration-300
            focus-within:border-emerald-500
          `}
        >
          {/* Label trang trí kiểu Terminal */}
          <div className="absolute -top-2 left-2 bg-emerald-500 text-[8px] font-mono font-bold text-black px-1 uppercase tracking-tighter">
            Input_Log
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            className="
              flex-1
              text-xs md:text-sm
              font-mono
              bg-transparent
              resize-none
              focus:outline-none
              text-neutral-800 dark:text-emerald-50
              placeholder:text-neutral-400 dark:placeholder:text-emerald-900/50
              overflow-y-auto
              max-h-[120px] md:max-h-[160px]
              py-1
            "
          />

          {/* NÚT POST - Tối ưu icon cho mobile, text cho desktop */}
          <CyberButton
            onClick={handleSubmit}
            disabled={sending || !content.trim()}
            className={`
              shrink-0
              flex items-center justify-center
              w-10 h-10 md:w-auto md:h-auto
              md:px-4 md:py-2
              rounded-none
              bg-emerald-500 text-black
              disabled:bg-neutral-800 disabled:text-neutral-500
              transition-all duration-300
            `}
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">POST</span>
                <Send size={16} className="md:hidden" />
              </>
            )}
          </CyberButton>
        </div>
        
        {/* Sub-info trang trí */}
        <div className="flex justify-between items-center px-1">
            <span className="text-[7px] font-mono text-neutral-400 dark:text-emerald-500/40 uppercase">
                Encryption: AES-256_ACTIVE
            </span>
            <span className="text-[7px] font-mono text-neutral-400 dark:text-emerald-500/40 uppercase">
                {content.length} chars
            </span>
        </div>
      </div>
    </div>
  );
}