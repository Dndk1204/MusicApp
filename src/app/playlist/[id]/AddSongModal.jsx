"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X } from "lucide-react";

export default function AddSongModal({ playlistId, onClose, onUpdated }) {
  const [songs, setSongs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .ilike("title", `%${search}%`);
      if (error) throw error;
      setSongs(data || []);
    } catch (err) {
      console.error("Load songs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, [search]);

  const toggleSelect = (songId) => {
    if (selected.includes(songId)) {
      setSelected(selected.filter((id) => id !== songId));
    } else {
      setSelected([...selected, songId]);
    }
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    try {
      await supabase.from("playlist_songs").insert(
        selected.map((songId) => ({ playlist_id: playlistId, song_id: songId }))
      );
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Lỗi thêm bài hát:", err.message);
      alert("Không thể thêm bài hát!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-neutral-900 w-[700px] h-[600px] rounded-2xl p-6 flex flex-col border border-neutral-700">
        <div className="flex justify-center relative">
          <h2 className="text-2xl font-semibold text-center mb-4">Thêm bài hát vào Playlist</h2>
          <button onClick={onClose} className="absolute right-0 top-0 text-neutral-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Tìm kiếm bài hát..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 rounded-lg bg-neutral-800 border border-neutral-700 mb-4"
        />

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-white">Đang tải...</p>
          ) : songs.length === 0 ? (
            <p className="text-white">Không tìm thấy bài hát.</p>
          ) : (
            <ul className="space-y-2">
              {songs.map((song) => (
                <li key={song.id} className="flex items-center gap-4 p-2 bg-neutral-800 rounded hover:bg-neutral-700">
                  <img src={song.image_url || "/no-image.png"} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{song.title}</p>
                    <p className="text-neutral-400 text-sm">{song.author}</p>
                  </div>
                  <div className="text-neutral-400 text-sm">{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2,"0")}</div>
                  <input type="checkbox" checked={selected.includes(song.id)} onChange={() => toggleSelect(song.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg">Thoát</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg">Thêm</button>
        </div>
      </div>
    </div>
  );
}
