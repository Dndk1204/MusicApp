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

export default function CommentItem({
  comment,
  currentUser,
  onRemoved,
}) {
  const profile = comment.profiles;

  /* Quyền */
  const isOwner = comment.user_id === currentUser?.id;
  const isAdmin = currentUser?.user_metadata?.role === "admin";
  const isUploader = currentUser?.id === comment.songs?.user_id;

  const canDelete = isOwner || isAdmin || isUploader;
  const canEdit = isOwner; // chỉ owner được edit

  /* state */
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => setText(comment.content), [comment.content]);

  /* Close menu khi click ngoài */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* DELETE comment */
  const deleteComment = async () => {
    setConfirm(null);
    setLoading(true);

    const { error } = await supabase
      .from("song_comments")
      .update({ is_deleted: true, updated_at: new Date() })
      .eq("id", comment.id);

    setLoading(false);
    if (!error) onRemoved?.(comment.id); // xóa khỏi UI ngay lập tức
  };

  /* SAVE EDIT */
  const saveEdit = async () => {
    setConfirm(null);
    setLoading(true);

    await supabase
      .from("song_comments")
      .update({ content: text, is_edited: true, updated_at: new Date() })
      .eq("id", comment.id);

    setLoading(false);
    setEditing(false);
  };

  return (
    <>
      {!comment.is_deleted && (
        <div
          className={`group flex gap-3 p-3 text-xs border rounded
            ${isOwner
              ? "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-500/5"
              : "border-neutral-200 dark:border-white/10"
            }`}
        >
          {/* AVATAR */}
          <HoverImagePreview
            src={profile?.avatar_url}
            alt={profile?.full_name || "User"}
            className="w-8 h-8 rounded-sm shrink-0"
            previewSize={120}
            fallbackIcon="user"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="w-full h-full object-cover filter grayscale transition-all duration-300
                  group-hover:grayscale-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-neutral-500 filter grayscale transition-all duration-300 group-hover:grayscale-0">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </HoverImagePreview>

          {/* CONTENT */}
          <div className="flex-1 min-w-0">
            {/* HEADER */}
            <div className="flex justify-between gap-2">
              <div>
                <div className="flex items-center gap-1 max-w-full">
                  <p className="font-bold truncate">
                    {isOwner ? "You" : profile?.full_name || "User"}
                  </p>

                  {profile?.role === "admin" && (
                    <span className="
                      text-[9px]
                      px-1.5 py-0.5
                      rounded
                      font-semibold
                      bg-red-500/10
                      text-red-600
                      border border-red-500/30
                      shrink-0
                    ">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-400">
                  {timeAgo(comment.created_at)}
                  {comment.is_edited && " · edited"}
                </span>
              </div>

              {/* MENU */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpenMenu((v) => !v)}
                  className="px-2 text-neutral-400 hover:text-neutral-700"
                >
                  ⋯
                </button>

                {openMenu && (
                  <div className="absolute right-0 top-5 z-20 bg-white dark:bg-black border rounded shadow text-[11px] min-w-[130px]">
                    {/* Edit/Delete */}
                    {canEdit || canDelete ? (
                      <>
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
                        {canDelete && (
                          <button
                            onClick={() =>
                              setConfirm({
                                message: isOwner
                                  ? "Delete your comment?"
                                  : "Delete this comment?",
                                onConfirm: deleteComment,
                              })
                            }
                            className="block w-full px-3 py-1 text-left text-red-500 hover:bg-neutral-100 dark:hover:bg-white/10"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setOpenMenu(false)}
                        className="block w-full px-3 py-2 text-left text-neutral-400 cursor-not-allowed"
                      >
                        Coming soon
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BODY */}
            {editing ? (
              <div className="mt-2">
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
              <p className="mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-lg shadow-xl w-[300px] max-w-full text-sm">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {confirm.onConfirm ? "Are you sure?" : "Notice"}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{confirm.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              {confirm.onConfirm && (
                <button
                  onClick={confirm.onConfirm}
                  className="px-3 py-1 rounded text-white font-semibold bg-red-500 hover:bg-red-600 transition"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
