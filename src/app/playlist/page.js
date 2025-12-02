"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Play, Edit2, Plus, Trash2 } from "lucide-react";
import AddSongModal from "@/components/AddSongModal";
import EditPlaylistModal from "@/components/EditPlaylistModal";

export default function PlaylistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, songId: null });

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Load playlist and songs
  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch playlist
      const { data: pl, error: plErr } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (plErr || !pl) throw new Error("Playlist không tồn tại");

      setPlaylist(pl);

      // Fetch songs
      const { data: songsData, error: songsErr } = await supabase
        .from("playlist_songs")
        .select(
          `
          song_id,
          added_at,
          songs (
            id,
            title,
            author,
            image_url,
            duration
          )
        `
        )
        .eq("playlist_id", id)
        .order("added_at", { ascending: true });

      if (songsErr) throw songsErr;

      setSongs(songsData || []);
    } catch (err) {
      console.error("Load error:", err.message);
      setPlaylist(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", id)
        .eq("song_id", songId);

      if (error) throw error;

      loadData();
    } catch (err) {
      console.error("Remove song error:", err.message);
      alert("Không thể xoá bài hát!");
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 text-sm font-mono mt-20 justify-center">
        <Loader2 className="animate-spin" size={20} /> Đang tải playlist…
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-red-500 mt-20 font-mono text-center">
        Playlist không tồn tại
      </div>
    );
  }

  return (
    <div className="text-white px-8 py-6">

      {/* ===== HEADER ===== */}
      <div className="flex items-end gap-6">
        <div className="relative w-48 h-48">
          <Image
            src={playlist.cover_url || "/default_playlist.png"}
            fill
            alt="Playlist Cover"
            sizes="192px"
            className="object-cover rounded-lg shadow-lg"
          />
        </div>

        <div className="flex flex-col justify-end">
          <p className="uppercase text-sm font-semibold text-green-500 tracking-widest mb-1">
            Playlist
          </p>
          <h1 className="text-5xl font-bold mb-2">{playlist.name}</h1>

          {playlist.description && (
            <p className="text-gray-300 italic mb-2 max-w-xl">
              {playlist.description}
            </p>
          )}

          <p className="text-gray-400 text-sm">
            {songs.length} bài hát • Tạo lúc{" "}
            {new Date(playlist.created_at).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* ===== BUTTONS ===== */}
      <div className="flex gap-3 mt-6">
        <button className="flex items-center gap-2 bg-[#018a8d] hover:bg-[#02676a] text-black font-bold px-6 py-2 rounded-full transition">
          <Play size={20} /> Play
        </button>

        <button
          onClick={() => setShowAddSongModal(true)}
          className="flex items-center gap-2 bg-[#10b67f] hover:bg-[#0d925e] text-black font-bold px-6 py-2 rounded-full transition"
        >
          <Plus size={20} />
        </button>

        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 bg-[#03b0b2] hover:bg-[#029193] text-black font-bold px-6 py-2 rounded-full transition"
        >
          <Edit2 size={20} />
        </button>
      </div>

      {/* ===== SONG LIST ===== */}
      <div className="mt-8">
        <table className="w-full text-left">
          <thead className="text-gray-400 uppercase text-xs border-b border-gray-700">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Title</th>
              <th className="p-2">Author</th>
              <th className="p-2 text-right">Duration</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {songs.map((s, index) => {
              const song = s.songs; // tránh lặp code và null safety

              if (!song) return null;

              return (
                <tr
                  key={song.id}
                  className="hover:bg-white/10 transition"
                >
                  <td className="p-2">{index + 1}</td>

                  <td className="p-2 flex items-center gap-3">
                    <div className="w-10 h-10 relative">
                      <Image
                        src={song.image_url || "/default_song.jpg"}
                        fill
                        alt={song.title}
                        sizes="40px"
                        className="object-cover rounded"
                      />
                    </div>
                    <span className="font-medium">{song.title}</span>
                  </td>

                  <td className="p-2 text-gray-300">{song.author}</td>

                  <td className="p-2 text-right flex justify-end items-center gap-4 pr-4">
                    <span className="text-gray-300 min-w-[50px] text-right block">
                      {formatDuration(song.duration)}
                    </span>

                    <button
                      onClick={() =>
                        setConfirmDelete({ show: true, songId: song.id })
                      }
                      className="
                        p-2 rounded-full transition shadow 
                        text-[#f87171] hover:text-white 
                        bg-white/5 hover:bg-red-600
                      "
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== MODALS ===== */}
      {showAddSongModal && (
        <AddSongModal
          playlistId={playlist.id}
          onClose={() => setShowAddSongModal(false)}
          onAdded={loadData}
        />
      )}

      {showEditModal && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setShowEditModal(false)}
          onUpdated={loadData}
          onDeleted={() => router.push("/")}
        />
      )}

      {confirmDelete.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] p-6 rounded-xl shadow-xl w-[360px] border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-3">Xoá bài hát?</h2>

            <p className="text-gray-300 mb-6">
              Bạn có chắc chắn muốn xoá bài hát này khỏi playlist không?
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition"
                onClick={() =>
                  setConfirmDelete({ show: false, songId: null })
                }
              >
                Hủy
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                onClick={async () => {
                  await handleRemoveSong(confirmDelete.songId);
                  setConfirmDelete({ show: false, songId: null });
                }}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
