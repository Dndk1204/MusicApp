"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Play, Edit2, Plus, Trash2 } from "lucide-react";
import AddSongModal from "@/components/AddSongModal";
import EditPlaylistModal from "@/components/EditPlaylistModal";
import usePlayer from "@/hooks/usePlayer";

export default function PlaylistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    songId: null,
  });

  const player = usePlayer();

  /* ==========================================================
   * HÀM LẤY CHỮ CÁI ĐẦU
   * ========================================================== */
  const getFirstLetter = (name) => {
    if (!name) return "?";
    return name.trim()[0].toUpperCase();
  };

  /* ==========================================================
   * PLAY PLAYLIST
   * ========================================================== */
  const handlePlayPlaylist = () => {
    if (!songs.length) return;

    const ids = songs
      .map((item) => item.songs?.id)
      .filter(Boolean)
      .map((x) => Number(x));

    const list = songs.map((i) => i.songs).filter(Boolean);

    const normalize = (s) => ({
      id: Number(s.id),
      title: s.title ?? "",
      author: s.author ?? "",
      image_url: s.image_url ?? s.image_path ?? null,
      song_url: s.song_url ?? s.song_path ?? null,
      duration: s.duration ? Number(s.duration) : 0,
      ...s,
    });

    player.setIds(ids);
    player.setId(ids[0]);
    player.setSongData(normalize(list[0]));
  };

  /* ==========================================================
   * FORMAT TIME
   * ========================================================== */
  const formatDuration = (sec) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ==========================================================
   * LOAD PLAYLIST + SONGS
   * ========================================================== */
  const loadData = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const { data: pl } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      setPlaylist(pl);

      const { data: songsData } = await supabase
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
            song_url,
            duration
          )
        `
        )
        .eq("playlist_id", id)
        .order("added_at", { ascending: true });

      setSongs(songsData || []);
    } catch (err) {
      console.error("Error loading:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
   * FETCH LẦN ĐẦU
   * ========================================================== */
  useEffect(() => {
    loadData();
  }, [id]);

  /* ==========================================================
   * REALTIME: playlist_songs (add/remove)
   * ========================================================== */
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`playlist_songs_changes_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist_songs",
          filter: `playlist_id=eq.${id}`,
        },
        () => {
          console.log("🔄 Realtime: playlist_songs updated");
          loadData();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  /* ==========================================================
   * REALTIME: playlists (update name/description/cover)
   * ========================================================== */
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`playlist_info_changes_${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "playlists",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("🔄 Realtime: playlist info updated", payload);
          setPlaylist((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  /* ==========================================================
   * REMOVE SONG
   * ========================================================== */
  const handleRemoveSong = async (songId) => {
    await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", id)
      .eq("song_id", songId);

    setConfirmDelete({ show: false, songId: null });
  };

  /* ==========================================================
   * LOADING UI
   * ========================================================== */
  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 text-neutral-400 mt-20 font-mono text-sm">
        <Loader2 size={20} className="animate-spin" /> Đang tải playlist…
      </div>
    );

  if (!playlist)
    return (
      <div className="text-center text-red-500 mt-20 font-mono">
        Playlist không tồn tại
      </div>
    );

  /* ==========================================================
   * MAIN UI
   * ========================================================== */
  return (
    <div className="text-white px-8 py-6">
      {/* HEADER */}
      <div className="flex items-end gap-6">
        <div className="relative w-48 h-48 rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-neutral-800">
          {playlist.cover_url ? (
            <Image
              src={playlist.cover_url}
              fill
              alt="Playlist Cover"
              className="object-cover"
            />
          ) : (
            <span className="text-7xl font-bold opacity-80">
              {getFirstLetter(playlist.name)}
            </span>
          )}
        </div>

        <div>
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
            {songs.length} bài hát • Tạo{" "}
            {new Date(playlist.created_at).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handlePlayPlaylist}
          className="flex items-center gap-2 bg-[#018a8d] hover:bg-[#02676a] text-black font-bold px-6 py-2 rounded-full transition"
        >
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
          className="flex items-center gap-2 bg-[#03b0b2] hover:bg-[#029193] text-black px-6 py-2 rounded-full font-bold transition"
        >
          <Edit2 size={20} />
        </button>
      </div>

      {/* SONG LIST */}
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
              const song = s.songs;
              if (!song) return null;

              const normalized = {
                id: Number(song.id),
                title: song.title,
                author: song.author,
                image_url: song.image_url,
                song_url: song.song_url,
                duration: Number(song.duration || 0),
              };

              return (
                <tr
                  key={song.id}
                  onClick={() => {
                    const ids = songs
                      .map((item) => item.songs?.id)
                      .filter(Boolean)
                      .map((x) => Number(x));

                    player.setIds(ids);
                    player.setId(Number(song.id));
                    player.setSongData(normalized);
                  }}
                  className="hover:bg-white/10 transition cursor-pointer"
                >
                  <td className="p-2">{index + 1}</td>

                  <td className="p-2 flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <Image
                        src={song.image_url || "/default_song.jpg"}
                        alt={song.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <span className="font-medium">{song.title}</span>
                  </td>

                  <td className="p-2 text-gray-300">{song.author}</td>

                  <td className="p-2 pr-4 flex items-center justify-end gap-4">
                    <span className="text-gray-300 min-w-[50px] text-right">
                      {formatDuration(song.duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ show: true, songId: song.id });
                      }}
                      className="p-2 rounded-full text-[#f87171] bg-white/5 transition hover:bg-red-600 hover:text-white"
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

      {/* ADD SONG MODAL */}
      {showAddSongModal && (
        <AddSongModal
          playlistId={playlist.id}
          onClose={() => setShowAddSongModal(false)}
          onAdded={() => {
            setShowAddSongModal(false);
            // không reload, realtime tự cập nhật
          }}
        />
      )}

      {/* EDIT PLAYLIST MODAL */}
      {showEditModal && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            // realtime cập nhật playlist info
          }}
          onDeleted={() => router.push("/")}
        />
      )}

      {/* DELETE CONFIRM */}
      {confirmDelete.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] p-6 rounded-xl w-[360px] shadow border border-white/10">
            <h2 className="text-xl font-semibold mb-3 text-white">
              Xoá bài hát?
            </h2>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() =>
                  setConfirmDelete({ show: false, songId: null })
                }
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition"
              >
                Hủy
              </button>

              <button
                onClick={() => handleRemoveSong(confirmDelete.songId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
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
