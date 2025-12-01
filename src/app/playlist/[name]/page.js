"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Play, Edit3 } from "lucide-react";
import EditPlaylistModal from "@/components/EditPlaylistModal";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";

const PlaylistPage = () => {
  const params = useParams();
  const playlistName = decodeURIComponent(params.name);

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // --- Load playlist & songs ---
  const loadPlaylist = async () => {
    setLoading(true);
    try {
      const { data: playlistData, error: plError } = await supabase
        .from("playlists")
        .select("*")
        .eq("name", playlistName)
        .single();
      if (plError || !playlistData) throw new Error("Playlist không tồn tại");

      setPlaylist(playlistData);

      const { data: playlistSongs, error: psError } = await supabase
        .from("playlist_songs")
        .select("*, songs(*)")
        .eq("playlist_id", playlistData.id)
        .order("added_at", { ascending: true });
      if (psError) throw psError;

      setSongs(playlistSongs.map((ps) => ps.songs));
    } catch (err) {
      console.error(err.message);
      setPlaylist(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistName]);

  if (loading)
    return <p className="text-white p-4 text-center">Đang tải...</p>;
  if (!playlist)
    return <p className="text-white p-4 text-center">Playlist không tồn tại</p>;

  return (
    <div className="p-6 text-white">
      {/* --- Header Playlist --- */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
        {/* Ảnh bìa */}
        <div className="w-48 h-48 bg-gradient-to-br from-neutral-500 to-#171717-800 flex items-center justify-center text-4xl font-bold rounded shadow-lg">
          {playlist.image_url ? (
            <img
              src={`${playlist.image_url}?t=${Date.now()}`} // tránh cache
              alt={playlist.name}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            playlist.name[0].toUpperCase()
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <p className="text-sm uppercase text-green-500 font-semibold">Playlist</p>
          <h1 className="text-4xl font-bold">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-neutral-400 mt-2">{playlist.description}</p>
          )}
          <p className="text-neutral-400 mt-2">{songs.length} bài hát</p>

          <div className="flex items-center gap-4 mt-4">
            {/* Phát tất cả */}
            <button className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full flex items-center gap-x-2 transition">
              <Play size={20} />
              Phát tất cả
            </button>

            {/* Thêm bài hát */}
            <button
              className="bg-neutral-700 hover:bg-neutral-600 px-6 py-2 rounded-full flex items-center gap-x-2 transition"
              onClick={() => setShowAdd(true)}
            >
              Thêm bài hát
            </button>

            {/* Chỉnh sửa playlist */}
            <button
              className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full flex items-center gap-x-2 transition"
              onClick={() => setShowEdit(true)}
            >
              <Edit3 size={20} />
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      {/* --- Danh sách bài hát --- */}
      {songs.length === 0 ? (
        <p className="text-neutral-400 text-center">Playlist trống</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead className="text-neutral-400 text-sm uppercase border-b border-neutral-700">
              <tr>
                <th className="pl-4 w-10">#</th>
                <th>Tiêu đề</th>
                <th className="w-32 text-right">Thời lượng</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song, idx) => (
                <tr
                  key={song.id}
                  className="hover:bg-neutral-800 transition cursor-pointer rounded-md"
                >
                  <td className="pl-4 py-2">{idx + 1}</td>
                  <td className="flex items-center gap-x-4 py-2">
                    <img
                      src={song.image_url || "/placeholder.png"}
                      alt={song.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{song.title}</span>
                      <span className="text-neutral-500 text-sm">{song.genre_id || ""}</span>
                    </div>
                  </td>
                  <td className="text-right py-2">{song.duration || "00:00"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Popup chỉnh sửa playlist --- */}
      {showEdit && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setShowEdit(false)}
          onUpdated={loadPlaylist} // <- gọi refresh page khi xóa/cập nhật
        />
      )}

      {showAdd && (
        <AddToPlaylistModal
          playlistId={playlist.id}
          onClose={() => setShowAdd(false)}
          onUpdated={loadPlaylist} // <- refresh page sau khi thêm bài hát
        />
      )}
    </div>
  );
};

export default PlaylistPage;
