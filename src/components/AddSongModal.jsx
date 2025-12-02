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

  // Lấy tất cả bài hát
  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: true });
      setAllSongs(data || []);
      setFilteredSongs(data || []);
      setLoading(false);
    };
    fetchSongs();
  }, []);

  // Filter theo search
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredSongs(
      allSongs.filter((s) => {
        const title = s.title || "";
        const author = s.author || "";
        return title.toLowerCase().includes(term) || author.toLowerCase().includes(term);
      })
    );
  }, [searchTerm, allSongs]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    await supabase.from("playlist_songs").insert(
      selectedIds.map((songId) => ({ playlist_id: playlistId, song_id: songId }))
    );
    onAdded(); // load lại playlist & sidebar
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg w-[700px] max-h-[80vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 text-center">
          <h2 className="text-2xl font-bold">Thêm bài hát</h2>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Tìm kiếm bài hát..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
          />

          {loading ? (
            <div className="flex items-center gap-2 justify-center text-gray-400 mt-4">
              <Loader2 className="animate-spin" /> Đang tải…
            </div>
          ) : filteredSongs.length === 0 ? (
            <p className="text-gray-400 text-center mt-4">Không tìm thấy bài hát</p>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {filteredSongs.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="w-4 h-4 accent-green-500"
                  />
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <Image
                      src={s.image_url || "/default_song.jpg"}
                      fill
                      alt={s.title || "Unknown"}
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex flex-col truncate w-[300px]">
                    <span className="truncate">{s.title || "Unknown"}</span>
                    <span className="text-gray-400 text-sm truncate">{s.author || "Unknown"}</span>
                  </div>
                  <span className="ml-auto text-gray-400 text-sm w-[40px] text-right">
                    {s.duration ? `${Math.floor(s.duration / 60)}:${String(s.duration % 60).padStart(2, '0')}` : "--:--"}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
          >
            Thoát
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 transition"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}
