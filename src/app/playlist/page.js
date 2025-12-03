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
   * PLAY PLAYLIST — dành cho Fetch API
   * ========================================================== */
  const handlePlayPlaylist = () => {
    if (!songs.length) return;

    // Lấy danh sách ID (ép về number để tránh mismatch bigint/string)
    const ids = songs
      .map((item) => item.songs?.id)
      .filter((x) => x !== undefined && x !== null)
      .map((x) => Number(x));

    // danh sách bài đầy đủ
    const list = songs
      .map((item) => item.songs)
      .filter((x) => x);

    if (ids.length === 0 || list.length === 0) return;

    // Chuẩn hoá object song gửi vào player (đảm bảo các field Player cần)
    const normalize = (s) => ({
      id: Number(s.id),
      title: s.title ?? "",
      author: s.author ?? "",
      image_url: s.image_url ?? s.image_path ?? null,
      song_url: s.song_url ?? s.song_path ?? null,
      duration: s.duration !== null && s.duration !== undefined ? Number(s.duration) : 0,
      // giữ nguyên các field khác nếu cần
      ...s,
    });

    // Set queue (number ids)
    player.setIds(ids);

    // Set bài đầu tiên (number)
    player.setId(ids[0]);

    // Gửi dữ liệu bài đầu tiên đã normalize
    player.setSongData(normalize(list[0]));

    console.log("▶ PLAY PLAYLIST IDs:", ids);
  };

  /* ==========================================================
   * FORMAT TIME
   * ========================================================== */
  const formatDuration = (sec) => {
    if (!sec && sec !== 0) return "--:--";
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
      console.error("Load error:", err);
      setPlaylist(null);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  /* ==========================================================
   * REMOVE SONG
   * ========================================================== */
  const handleRemoveSong = async (songId) => {
    try {
      await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", id)
        .eq("song_id", songId);

      loadData();
    } catch (err) {
      console.error("Remove error:", err);
      alert("Không thể xoá bài hát!");
    }
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
        <div className="relative w-48 h-48">
          <Image
            src={playlist.cover_url || "/default_playlist.png"}
            fill
            alt="Playlist Cover"
            className="object-cover rounded-lg shadow-lg"
          />
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
            {playlist.created_at
              ? new Date(playlist.created_at).toLocaleDateString("vi-VN")
              : "--"}
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

      {/* SONG TABLE */}
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

              // chuẩn hoá dữ liệu bài hát (gồm song_url và duration kiểu number)
              const normalized = {
                id: Number(song.id),
                title: song.title,
                author: song.author,
                image_url: song.image_url ?? null,
                song_url: song.song_url ?? null,
                duration:
                  song.duration !== null && song.duration !== undefined
                    ? Number(song.duration)
                    : 0,
                ...song,
              };

              return (
                <tr
                  key={song.id}
                  onClick={() => {
                    // danh sách toàn bộ ID trong playlist (số)
                    const ids = songs
                      .map((item) => item.songs?.id)
                      .filter((x) => x !== undefined && x !== null)
                      .map((x) => Number(x));

                    player.setIds(ids); // set queue
                    player.setId(Number(song.id)); // set bài đang phát
                    player.setSongData(normalized); // gửi toàn bộ dữ liệu chuẩn hoá

                    console.log("▶ PLAY SONG:", normalized);
                  }}
                  className="hover:bg-white/10 transition cursor-pointer"
                >
                  <td className="p-2">{index + 1}</td>

                  {/* Title + Image */}
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
                      {formatDuration(
                        song.duration !== null && song.duration !== undefined
                          ? Number(song.duration)
                          : 0
                      )}
                    </span>

                    <button
                      onClick={(e) => {
                        // ngăn row onClick (play) khi nhấn delete
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
            loadData();
            setShowAddSongModal(false);
          }}
        />
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            loadData();
            setShowEditModal(false);
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

            <p className="text-gray-300 mb-6">
              Bạn chắc chắn muốn xoá bài hát này khỏi playlist?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmDelete({ show: false, songId: null })
                }
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition"
              >
                Hủy
              </button>

              <button
                onClick={async () => {
                  await handleRemoveSong(confirmDelete.songId);
                  setConfirmDelete({ show: false, songId: null });
                }}
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
