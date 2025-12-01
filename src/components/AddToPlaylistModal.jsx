"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const AddToPlaylistModal = ({ playlistId, onClose, onUpdated }) => {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load tất cả bài hát (hoặc filter theo search)
  const loadSongs = async (query = "") => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .ilike("title", `%${query}%`)
        .order("title", { ascending: true });
      if (error) throw error;
      setSongs(data);
    } catch (err) {
      console.error("Lấy danh sách bài hát lỗi:", err.message);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    loadSongs(value);
  };

  const toggleSelect = (songId) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) newSet.delete(songId);
      else newSet.add(songId);
      return newSet;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return alert("Chưa chọn bài hát nào");
    setLoading(true);
    try {
      const inserts = Array.from(selected).map((song_id) => ({
        playlist_id: playlistId,
        song_id,
      }));
      const { error } = await supabase.from("playlist_songs").insert(inserts);
      if (error) throw error;
      alert("Đã thêm bài hát!");
      onClose();
      if (onUpdated) onUpdated(); // refresh danh sách bài hát
    } catch (err) {
      console.error("Thêm bài hát lỗi:", err.message);
      alert("Thêm thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl h-[600px] p-6 relative text-white flex flex-col">
        {/* Tên popup */}
        <h2 className="text-2xl font-bold text-center mb-6">Thêm bài hát vào Playlist</h2>

        {/* Thanh search */}
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm theo tên bài hát..."
          className="w-full p-2 rounded bg-neutral-800 text-white mb-4"
        />

        {/* Danh sách bài hát */}
        <div className="flex-1 overflow-y-auto border border-neutral-700 rounded p-2">
          {songs.length === 0 ? (
            <p className="text-neutral-400 text-center">Không tìm thấy bài hát</p>
          ) : (
            songs.map((song) => (
              <div
                key={song.id}
                className={`flex items-center gap-4 py-2 px-2 rounded cursor-pointer transition
                  ${selected.has(song.id) ? "bg-green-600/30" : "hover:bg-neutral-800"}`}
                onClick={() => toggleSelect(song.id)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(song.id)}
                  readOnly
                  className="w-5 h-5 cursor-pointer accent-green-500"
                />
                <img
                  src={song.image_url || "/placeholder.png"}
                  alt={song.title}
                  className="w-12 h-12 object-cover rounded"
                />
                <span className="flex-1">{song.title}</span>
              </div>
            ))
          )}
        </div>

        {/* Nút dưới cùng */}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="bg-neutral-700 hover:bg-neutral-600 px-6 py-2 rounded-full transition"
          >
            Thoát
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || selected.size === 0}
            className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Thêm bài hát
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
