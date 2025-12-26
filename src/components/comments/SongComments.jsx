"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

export default function SongComments({ songId }) {
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Loại bỏ duplicate comment
  const uniqueComments = Array.from(new Map(comments.map(c => [c.id, c])).values());

  /* 🔐 Current user */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user ?? null);
    });
  }, []);

  /* 📥 Fetch comments + profiles */
  const fetchComments = useCallback(async () => {
    if (!songId || !currentUser) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("song_comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        is_edited,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        ),
        comment_hides (
          is_hidden
        )
      `)
      .eq("song_id", songId)
      .eq("comment_hides.user_id", currentUser.id)
      .order("created_at", { ascending: true });

    if (!error) {
      setComments(data || []);
    }

    setLoading(false);
  }, [songId, currentUser]);

  /* 🔔 Realtime subscription */
  useEffect(() => {
    fetchComments();
    if (!songId) return;

    const channel = supabase
      .channel(`comments-${songId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "song_comments",
          filter: `song_id=eq.${songId}`,
        },
        (payload) => {
          const newComment = payload.new;
          const oldComment = payload.old;

          setComments((prev) => {
            switch (payload.eventType) {
              case "INSERT":
                return [...prev, newComment];
              case "UPDATE":
                return prev.map((c) =>
                  c.id === newComment.id ? { ...c, ...newComment, profiles: c.profiles } : c
                );
              case "DELETE":
                return prev.filter((c) => c.id !== oldComment.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [songId, fetchComments]);

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {/* COMMENT LIST */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-2">
        {loading && (
          <p className="text-xs text-neutral-400 animate-pulse">
            Loading comments...
          </p>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-xs text-neutral-500 italic text-center py-6">
            No comments yet.
          </p>
        )}

        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={currentUser}
            onHide={(id) =>
              setComments(prev => prev.filter(c => c.id !== id))
            }
          />
        ))}
      </div>

      {/* COMMENT FORM — SÁT ĐÁY */}
      <div className="shrink-0 pt-2">
        <CommentForm
          songId={songId}
          currentUser={currentUser}
          onSuccess={fetchComments}
        />
      </div>
    </div>
  );
}
