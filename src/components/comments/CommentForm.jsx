"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function CommentForm({ songId, currentUser, onSuccess }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !currentUser || sending) return;

    setSending(true);

    const { data, error } = await supabase
      .from("song_comments")
      .insert({
        song_id: songId,
        user_id: currentUser.id,
        content: content.trim(),
      })
      .select(`
      *,
      profiles (*)
    `)
      .single();

    if (!error) {
      onSuccess?.(data);
      setContent("");
    }

    setSending(false);
  };

  if (!currentUser) {
    return (
      <div className="w-full border border-dashed border-neutral-300 dark:border-white/10 p-3 text-center rounded-md">
        <p className="text-xs text-neutral-500 italic">Login to comment</p>
      </div>
    );
  }

  return (
    <div className="w-full border border-neutral-300 dark:border-white/10 rounded-md p-3 bg-white dark:bg-black/5 flex flex-col gap-2">
      {/* HEADER với nút toggle */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-emerald-700">
          :: Add a comment ::
        </span>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="p-1 text-neutral-500 hover:text-neutral-700 transition"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* TEXTAREA */}
      {!collapsed && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="
            w-full
            p-2
            text-xs
            bg-neutral-100 dark:bg-white/5
            border border-neutral-200 dark:border-white/10
            resize-none
            focus:outline-none
            focus:border-emerald-500
            transition-all
          "
        />
      )}

      {/* ACTION BAR */}
      {!collapsed && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={sending || !content.trim()}
            className="
              text-xs
              px-4 py-1.5
              border
              border-neutral-300 dark:border-white/10
              transition
              transform
              hover:scale-105
              hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {sending ? "Posting..." : "Post"}
          </button>
        </div>
      )}
    </div>
  );
}
