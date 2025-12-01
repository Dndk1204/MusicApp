"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Play, Plus, Pencil } from "lucide-react";
import AddSongModal from "./AddSongModal";
import EditPlaylistModal from "./EditPlaylistModal";
import DeletePlaylistModal from "./DeletePlaylistModal";

export default function PlaylistDetailClient({ playlistId, onPlaylistUpdated }) {
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const loadPlaylist = async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_songs (
            *,
            songs (*)
          )
        `)
        .eq("id", playlistId)
        .single();
      if (error) throw error;

      setPlaylist(data);
      setSongs(data.playlist_songs.map((ps) => ps.songs));
      if (onPlaylistUpdated) onPlaylistUpdated();
    } catch (err) {
      console.error("Playlist error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  if (loading) return <div className="p-10 text-white text-xl">Đang tải playlist...</div>;
  if (!playlist) return <div className="p-10 text-red-500 text-xl">Không tìm thấy playlist.</div>;

  return (
    <div className="text-white flex flex-col h-[calc(100vh-2rem)] p-8 gap-6">

      {/* HEADER */}
      <div className="flex gap-6 items-end">
        <img
          src={playlist.cover_url || "/default_playlist.png"}
          alt="Playlist Cover"
          className="w-56 h-56 rounded shadow-lg object-cover flex-shrink-0"
        />

        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            <p className="uppercase text-sm font-semibold text-gray-400">Playlist</p>
            <h1 className="text-5xl md:text-6xl font-bold mt-1 truncate">{playlist.name}</h1>
            <p className="text-gray-400 mt-2">
              {songs.length} bài hát • Tạo lúc {new Date(playlist.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setOpenAddModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition"
            >
              <Plus size={18} /> Thêm bài hát
            </button>

            <button
              onClick={() => setOpenEditModal(true)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
            >
              <Pencil size={16} /> Chỉnh sửa
            </button>
          </div>
        </div>

        {/* PLAY BUTTON */}
        <div>
          <button className="bg-green-500 hover:bg-green-400 transition p-5 rounded-full shadow-lg">
            <Play className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>

      {/* SONG LIST */}
      <div className="flex-1 overflow-y-auto mt-6">
        <div className="flex flex-col gap-2">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition cursor-pointer"
            >
              <span className="w-6 text-gray-400 text-right">{index + 1}</span>
              <img
                src={song.image_url || "/no-image.png"}
                className="w-14 h-14 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 flex flex-col justify-center">
                <p className="font-semibold truncate">{song.title}</p>
                <p className="text-gray-400 text-sm truncate">{song.author || "Không rõ"}</p>
              </div>
              <p className="text-gray-400 w-12 text-right">{formatDuration(song.duration)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      {openAddModal && (
        <AddSongModal
          playlistId={playlistId}
          onClose={() => setOpenAddModal(false)}
          onUpdated={loadPlaylist}
        />
      )}
      {openEditModal && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setOpenEditModal(false)}
          onUpdated={loadPlaylist}
          onDelete={() => setOpenDeleteModal(true)}
        />
      )}
      {openDeleteModal && (
        <DeletePlaylistModal
          playlist={playlist}
          onClose={() => setOpenDeleteModal(false)}
          onDeleted={() => (window.location.href = "/")}
        />
      )}
    </div>
  );
}

function formatDuration(sec) {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}
