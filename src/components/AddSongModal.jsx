"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function AddSongModal({ playlistId, onClose, onAdded }) {
  const [allSongs, setAllSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [playlistSongIds, setPlaylistSongIds] = useState([]);

  /* ---------------- GET USER ------------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  /* ---------------- LOAD ALL SONGS ------------------- */
  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error) {
        setAllSongs(data || []);
        setFilteredSongs(data || []);
      }

      setLoading(false);
    };
    loadSongs();
  }, []);

  /* ---------------- GET SONGS IN PLAYLIST ------------------- */
  useEffect(() => {
    const loadPlaylistSongs = async () => {
      const { data } = await supabase
        .from("playlist_songs")
        .select("song_id")
        .eq("playlist_id", playlistId);

      setPlaylistSongIds((data || []).map((s) => s.song_id));
    };
    loadPlaylistSongs();
  }, [playlistId]);

  /* ---------------- SEARCH ------------------- */
  useEffect(() => {
    const t = searchTerm.toLowerCase();
    setFilteredSongs(
      allSongs.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(t) ||
          (s.author || "").toLowerCase().includes(t)
      )
    );
  }, [searchTerm, allSongs]);

  /* ---------------- SELECT SONG ------------------- */
  const toggleSelect = (songId) => {
    setSelectedIds((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getSongImage = (s) =>
    s.image_url || s.image || s.image_path || "/default-song.png";

  /* ---------------- ADD SONGS ------------------- */
  const handleBulkAdd = async () => {
    if (!user) {
      setMessage({ type: "error", text: "Bạn chưa đăng nhập!" });
      return;
    }

    if (selectedIds.length === 0) {
      setMessage({ type: "error", text: "Hãy chọn ít nhất một bài hát!" });
      return;
    }

    try {
      let validSongIds = [];

      /*  
        selectedIds là song.id, VÌ VẬY KHÔNG CẦN fetch API get-song
      
        → Ta chỉ cần đảm bảo song tồn tại (nó đã có trong allSongs)
        → Không dùng external_id nữa vì bạn đang chọn bài trong DB
      */

      for (const id of selectedIds) {
        const exists = allSongs.find((s) => s.id === id);
        if (!exists) continue; // tránh lỗi edge-case

        validSongIds.push(id);
      }

      /* ------ Bỏ các bài đã có trong playlist ------ */
      const newSongIds = validSongIds.filter(
        (id) => !playlistSongIds.includes(id)
      );

      if (newSongIds.length === 0) {
        setMessage({
          type: "error",
          text: "Tất cả bài hát đã tồn tại trong playlist!",
        });
        return;
      }

      /* ------ Insert playlist_songs ------ */
      const rows = newSongIds.map((sid) => ({
        playlist_id: Number(playlistId),
        song_id: sid,
      }));

      const { error } = await supabase.from("playlist_songs").insert(rows);

      if (error) {
        console.error(error);
        setMessage({ type: "error", text: "Không thể thêm bài hát!" });
        return;
      }

      setMessage({ type: "success", text: "Đã thêm bài hát!" });

      if (onAdded) onAdded();
      setTimeout(onClose, 500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Lỗi không xác định!" });
    }
  };

  /* ---------------- UI ------------------- */
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-xl w-[650px] max-h-[80vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Thêm bài hát</h2>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">

          <input
            placeholder="🔍 Tìm kiếm bài hát theo tên hoặc tác giả…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-800 text-white outline-none border border-neutral-700 focus:border-green-500"
          />

          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center items-center gap-2 text-gray-400">
              <Loader2 className="animate-spin" />
              Đang tải…
            </div>
          ) : filteredSongs.length === 0 ? (
            <p className="text-gray-400 text-center">Không có bài hát</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSongs.map((s) => {
                const isInPlaylist = playlistSongIds.includes(s.id);

                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-white/5 transition ${
                      isInPlaylist ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isInPlaylist}
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 accent-green-500"
                    />

                    <div className="w-12 h-12 relative shrink-0">
                      <Image
                        src={getSongImage(s)}
                        alt={s.title}
                        fill
                        className="rounded object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex flex-col truncate w-[260px]">
                      <span className="truncate">{s.title}</span>
                      <span className="text-gray-400 text-sm truncate">
                        {s.author}
                      </span>
                    </div>

                    <span className="ml-auto text-gray-400 text-sm w-[50px] text-right">
                      {formatDuration(s.duration)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600 transition"
          >
            Thoát
          </button>

          <button
            onClick={handleBulkAdd}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 transition"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}