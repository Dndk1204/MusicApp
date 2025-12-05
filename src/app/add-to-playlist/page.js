"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Music2, Loader2, CheckCircle, Circle } from "lucide-react";

export default function AddToPlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const songId = searchParams.get("song_id");

  const [song, setSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  /* -------------------------------------------------------
     FETCH SONG
  ------------------------------------------------------- */
  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;

      const { data: dbSong } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .maybeSingle();

      if (dbSong) {
        setSong(dbSong);
        return;
      }

      const res = await fetch(`/api/get-song?id=${songId}`);
      const { song: apiSong } = await res.json();

      if (!apiSong) return;

      const { data: inserted } = await supabase
        .from("songs")
        .upsert({
          id: apiSong.id,
          title: apiSong.title,
          author: apiSong.author,
          duration: apiSong.duration,
          image_url: apiSong.image_path,
          song_url: apiSong.song_path,
        })
        .select()
        .single();

      setSong(inserted);
    };

    fetchSong();
  }, [songId]);

  /* -------------------------------------------------------
     FETCH PLAYLISTS
  ------------------------------------------------------- */
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;

      const { data } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      setPlaylists(data || []);
      setLoading(false);
    };

    fetchPlaylists();
  }, []);

  /* -------------------------------------------------------
     HANDLE SELECT
  ------------------------------------------------------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  /* -------------------------------------------------------
     BULK ADD
  ------------------------------------------------------- */
  const handleAddMulti = async () => {
    if (!song?.id) return;

    if (selected.length === 0) {
      setMessage({ type: "error", text: "Bạn chưa chọn playlist nào." });
      return;
    }

    setAdding(true);
    setMessage(null);

    const rows = selected.map((pid) => ({
      playlist_id: pid,
      song_id: song.id,
      added_at: new Date(),
    }));

    const { error } = await supabase
      .from("playlist_songs")
      .insert(rows);

    if (error) {
      console.error(error);
      setMessage({ type: "error", text: "Không thể thêm bài hát!" });
    } else {
      setMessage({ type: "success", text: "Đã thêm vào playlist!" });
      setTimeout(() => router.back(), 500);
    }

    setAdding(false);
  };

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="p-6 max-w-xl mx-auto animate-in fade-in duration-500">
      
      <h1 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Plus className="text-emerald-500" />
        Thêm bài hát vào playlist
      </h1>

      {/* SONG CARD */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/70 dark:bg-white/10 border border-neutral-300 dark:border-neutral-700 shadow-sm">
        <div className="w-16 h-16 rounded-lg bg-neutral-300 dark:bg-neutral-700 overflow-hidden">
          {song?.image_url ? (
            <img src={song.image_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={32} className="text-neutral-600" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">
            {song?.title || "Unknown Song"}
          </div>
          <div className="text-sm text-neutral-500 truncate">
            {song?.author || "Unknown Artist"}
          </div>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm border ${
            message.type === "success"
              ? "bg-emerald-100 text-emerald-700 border-emerald-400"
              : "bg-red-100 text-red-700 border-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <h2 className="font-medium mb-3 text-neutral-700 dark:text-neutral-300">
        Chọn playlist:
      </h2>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 size={18} className="animate-spin" />
          Đang tải playlist...
        </div>
      )}

      {/* EMPTY */}
      {!loading && playlists.length === 0 && (
        <div className="text-neutral-500 text-sm">
          Bạn chưa có playlist nào.
        </div>
      )}

      {/* PLAYLIST LIST */}
      <div className="flex flex-col gap-2">
        {playlists.map((pl) => {
          const isSelected = selected.includes(pl.id);

          return (
            <button
              key={pl.id}
              onClick={() => toggleSelect(pl.id)}
              className="flex justify-between items-center p-3 rounded-lg border bg-white/60 dark:bg-white/5 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <span className="text-sm">{pl.name}</span>

              {isSelected ? (
                <CheckCircle size={20} className="text-emerald-500" />
              ) : (
                <Circle size={20} className="text-neutral-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={handleAddMulti}
        disabled={adding}
        className="mt-6 w-full py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
      >
        {adding ? "Đang thêm..." : "Thêm vào playlist đã chọn"}
      </button>

      <button
        onClick={() => router.back()}
        className="mt-4 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
      >
        ← Quay lại
      </button>
    </div>
  );
}
