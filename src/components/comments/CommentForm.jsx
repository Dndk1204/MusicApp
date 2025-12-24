"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import HoverImagePreview from "@/components/HoverImagePreview";

export default function CommentForm({ songId, onSuccess }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // =========================
  // GET AUTH USER + PROFILE
  // =========================
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // =========================
  // SUBMIT COMMENT
  // =========================
  const handleSubmit = async () => {
    if (!content.trim() || !user || sending) return;

    setSending(true);

    const { data, error } = await supabase
      .from("song_comments")
      .insert({
        song_id: songId,
        user_id: user.id, // ✅ đúng auth user id
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

  // =========================
  // NOT LOGIN
  // =========================
  if (!user) {
    return (
      <div className="text-xs text-neutral-500 italic text-center py-2">
        Login to comment
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start w-full">
      {/* AVATAR */}
      <HoverImagePreview
        src={profile?.avatar_url} 
        alt={profile?.full_name || "User"}
        className="w-8 h-8 rounded-sm shrink-0"
        previewSize={160}
        fallbackIcon="user"
      >
        <div className="relative group w-8 h-8">
          <img
            src={profile?.avatar_url || "/avatar-default.png"}
            alt="avatar"
            className="
              w-8 h-8
              rounded-full
              object-cover
              grayscale
              group-hover:grayscale-0
              transition-all
              duration-300
            "
          />
        </div>
      </HoverImagePreview>
      {/* COMMENT BOX */}
      <div className="flex-1">
        <div
          className="
            bg-emerald-50 dark:bg-emerald-500/10
            border border-emerald-200 dark:border-emerald-500/20
            rounded-2xl
            px-4 py-2
            flex flex-col
            focus-within:ring-1
            focus-within:ring-emerald-500
          "
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows={1}
            className="
              w-full
              text-sm
              bg-transparent
              resize-none
              focus:outline-none
              text-emerald-900 dark:text-emerald-100
              placeholder:text-emerald-400
            "
          />

          {/* POST BUTTON */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={sending || !content.trim()}
              className="
                text-xs
                font-medium
                px-4 py-1.5
                rounded-full
                bg-emerald-500
                text-white
                hover:bg-emerald-600
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {sending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
