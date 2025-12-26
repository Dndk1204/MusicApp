"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import HoverImagePreview from "@/components/HoverImagePreview";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [label, value] of units) {
    const count = Math.floor(seconds / value);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function CommentItem({ comment, currentUser, onHide }) {
  const profile = comment.profiles;

  /* ===== PERMISSIONS ===== */
  const isOwner = comment.user_id === currentUser?.id;
  const isAdmin = currentUser?.user_metadata?.role === "admin";
  const isUploader = currentUser?.id === comment.songs?.user_id;

  const canDelete = isOwner || isAdmin || isUploader;
  const canEdit = isOwner;
  const canHide = !!currentUser && !isOwner;

  /* ===== STATE ===== */
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content);
  const [openMenu, setOpenMenu] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const menuRef = useRef(null);

  /* ===== HIDE / UNHIDE UI STATE (🔥 QUAN TRỌNG) ===== */
  const serverHidden = comment.comment_hides?.[0]?.is_hidden === true;
  const [isCollapsed, setIsCollapsed] = useState(serverHidden);

  /* sync khi realtime / refetch */
  useEffect(() => {
    setIsCollapsed(serverHidden);
  }, [serverHidden]);

  useEffect(() => setText(comment.content), [comment.content]);

  /* close menu on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ===== DELETE ===== */
  const deleteComment = async (id) => {
    const { error } = await supabase.from("song_comments").delete().eq("id", id);
    if (error) {
      console.error("Delete comment failed:", error);
      return false;
    }
    
    // Update UI ngay lập tức
    onHide?.(id);
    
    return true;
  };

  /* ===== HIDE (OPTIMISTIC UI) ===== */
  const hideCommentForMe = async (id) => {
    setIsCollapsed(true); // ✅ UI trước

    const { error } = await supabase.from("comment_hides").upsert(
      {
        comment_id: id,
        user_id: currentUser.id,
        is_hidden: true,
      },
      { onConflict: "comment_id,user_id" }
    );

    if (error) {
      console.error("Hide comment failed:", error);
      setIsCollapsed(false); // rollback UI
    }
  };

  /* ===== UNHIDE (OPTIMISTIC UI) ===== */
  const unhideComment = async (id) => {
    setIsCollapsed(false); // ✅ UI trước

    const { error } = await supabase
      .from("comment_hides")
      .update({ is_hidden: false })
      .eq("comment_id", id)
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("Unhide comment failed:", error);
      setIsCollapsed(true); // rollback
    }
  };

  /* ===== SAVE EDIT ===== */
  const saveEdit = async () => {
    await supabase
      .from("song_comments")
      .update({
        content: text,
        is_edited: true,
        updated_at: new Date(),
      })
      .eq("id", comment.id);

    setEditing(false);
  };

  if (comment.is_deleted) return null;

  return (
    <>
      <div
        className={`group flex gap-3 border rounded transition-all duration-200
          ${isCollapsed ? "p-2 opacity-60 bg-neutral-50 dark:bg-white/5" : "p-3"}
          ${
            isOwner
              ? "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-500/5"
              : "border-neutral-200 dark:border-white/10"
          }
        `}
      >
        {/* AVATAR */}
        <HoverImagePreview
          src={profile?.avatar_url}
          alt={profile?.full_name || "User"}
          previewSize={160}
          fallbackIcon="user"
          className={`shrink-0 rounded-full
            ${isCollapsed ? "w-6 h-6 opacity-60" : "w-9 h-9"}
          `}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover rounded-sm"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 bg-neutral-200 rounded-full">
              {profile?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </HoverImagePreview>

        {/* MAIN */}
        <div className="flex-1 min-w-0">
          {/* HEADER ROW */}
          <div className="flex items-start justify-between gap-2">
            {/* NAME + TIME */}
            <div className="min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {isOwner ? "You" : profile?.full_name || "User"}
                </p>

                {profile?.role === "admin" && (
                  <span
                    className="
                      text-[9px]
                      px-1.5
                      py-0.5
                      rounded
                      font-semibold
                      bg-red-500/10
                      text-red-600
                      border border-red-500/30
                      shrink-0
                    "
                  >
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[10px] italic text-neutral-400">
                {timeAgo(comment.created_at)}
                {comment.is_edited && " · edited"}
              </p>
            </div>

            {/* MENU */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setOpenMenu((v) => !v)}
                className="px-2 text-neutral-400 hover:text-neutral-700"
              >
                ⋯
              </button>

              {openMenu && (
                <div className="absolute right-0 top-5 z-20 bg-white dark:bg-black border rounded shadow text-[11px] min-w-[130px]">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditing(true);
                        setOpenMenu(false);
                      }}
                      className="block w-full px-3 py-1 text-left hover:bg-neutral-100 dark:hover:bg-white/10"
                    >
                      Edit
                    </button>
                  )}

                  {canHide && !isCollapsed && (
                    <button
                      onClick={() => {
                        hideCommentForMe(comment.id);
                        setOpenMenu(false);
                      }}
                      className="block w-full px-3 py-1 text-left text-yellow-600 hover:bg-neutral-100 dark:hover:bg-white/10"
                    >
                      Hide
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() =>
                        setConfirm({
                          message: "Delete this comment?",
                          onConfirm: async () => {
                            const ok = await deleteComment(comment.id);
                            return ok;
                          },
                        })
                      }
                      className="block w-full px-3 py-1 text-left text-red-500 hover:bg-neutral-100 dark:hover:bg-white/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BODY */}
          <div className="mt-2">
            {isCollapsed ? (
              <div className="flex items-center gap-2 text-[11px] italic text-neutral-400">
                <span>Comment is hidden</span>
                <button
                  onClick={() => unhideComment(comment.id)}
                  className="text-emerald-500 hover:underline"
                >
                  Unhide
                </button>
              </div>
            ) : editing ? (
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="w-full p-2 text-xs border rounded bg-white dark:bg-black"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="text-[10px] text-neutral-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="text-[10px] text-emerald-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}
          </div>

          {confirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-xl w-[300px] text-sm">
                <h3 className="font-semibold mb-2">Are you sure?</h3>
                <p className="mb-4">{confirm.message}</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirm(null)}
                    className="px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm.onConfirm();
                      if (ok) setConfirm(null);
                    }}
                    className="px-3 py-1 rounded bg-red-500 text-white"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
