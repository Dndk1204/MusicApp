"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

export default function SongComments({ songId }) {
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const commentsEndRef = useRef(null);

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
    if (!songId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("song_comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        is_deleted,
        is_edited,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("song_id", songId)
      .order("created_at", { ascending: true });

    if (!error) setComments(data || []);
    setLoading(false);
  }, [songId]);

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

  /* 🔄 Auto-scroll xuống cuối khi comment thay đổi */
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uniqueComments.length]);

  return (
    <div className="flex flex-col w-full h-full gap-4 ">
      {/* Form luôn cố định trên cùng */}
      <CommentForm
        songId={songId}
        currentUser={currentUser}
        onSuccess={fetchComments}
      />

      {/* Loading / Empty */}
      {loading && (
        <p className="text-xs text-neutral-400 animate-pulse">
          Loading comments...
        </p>
      )}
      {!loading && uniqueComments.length === 0 && (
        <p className="text-xs text-neutral-500 italic">No comments yet.</p>
      )}

      {/* Danh sách comment scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2 m-2">
        {uniqueComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}
