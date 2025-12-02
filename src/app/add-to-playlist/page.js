"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Music2, Loader2 } from "lucide-react";

export default function AddToPlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Nhận object bài hát từ URL ---
  const raw = searchParams.get("song");

  let song = null;
  try {
    if (raw) song = JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.error("Cannot decode song object", e);
  }

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  // --- Fetch playlists của user ---
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) return;

      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (!error) setPlaylists(data);
      setLoading(false);
    };

    fetchPlaylists();
  }, []);

  // --- HÀM ADD SONG ---
  const handleAdd = async (playlistId) => {
    if (!song || !song.title) {
        alert("Song object invalid!");
        return;
    }

    setAdding(true);
    setMessage(null);

    // 1. Insert song vào bảng songs (KHÔNG gửi id)
    const { data: insertedSong, error: songError } = await supabase
        .from("songs")
        .upsert({
            title: song.title,
            author: song.author || song.artist || "Unknown",
            image_url: song.image || song.thumbnail || song.cover || null,
            duration: Number(song.duration) || 0
        })
        .select()
        .single();

        if (songError) {
            console.error("Lỗi insert vào songs:", songError);
            setMessage({ type: "error", text: "Không thể lưu bài hát!" });
            setAdding(false);
            return;
        }

        // 2. Insert vào playlist_songs
        const { error: playlistError } = await supabase
            .from("playlist_songs")
            .insert({
                playlist_id: playlistId,
                song_id: insertedSong.id,
                added_at: new Date(),
            });

        if (playlistError) {
            console.error("playlist err:", playlistError);
            setMessage({ type: "error", text: "Không thể thêm bài vào playlist!" });
        } else {
            setMessage({ type: "success", text: "Đã thêm vào playlist!" });
        }

        setAdding(false);
    };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Plus size={20} className="text-emerald-500" />
        Thêm bài hát vào playlist
      </h1>

      {/* Hiển thị thông tin bài hát */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/60 dark:bg-white/10 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <div className="w-14 h-14 bg-neutral-300 dark:bg-neutral-700 rounded-lg overflow-hidden flex items-center justify-center">
          {song?.image_url ? (
            <img src={song.image_url} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <Music2 size={28} className="text-neutral-600" />
          )}
        </div>

        <div>
          <div className="font-semibold text-neutral-800 dark:text-neutral-200">{song?.title || "Unknown Song"}</div>
          <div className="text-sm text-neutral-500">{song?.author || "Unknown Artist"}</div>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-red-100 text-red-700 border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* DANH SÁCH PLAYLIST */}
      <h2 className="text-md font-medium mb-3 text-neutral-700 dark:text-neutral-300">Chọn playlist:</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 size={18} className="animate-spin" />
          Đang tải playlist...
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-neutral-500 text-sm">Bạn chưa có playlist nào.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleAdd(pl.id)}
              disabled={adding}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/60 dark:bg-white/5 hover:bg-emerald-500 hover:text-white transition"
            >
              <span>{pl.name}</span>
              <Plus size={18} />
            </button>
          ))}
        </div>
      )}

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="mt-8 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
      >
        ← Quay lại
      </button>
    </div>
  );
}