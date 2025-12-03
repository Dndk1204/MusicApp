"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Play, Edit2, Plus, Trash2, Clock, Music2 } from "lucide-react";
import AddSongModal from "@/components/AddSongModal";
import EditPlaylistModal from "@/components/EditPlaylistModal";
import usePlayer from "@/hooks/usePlayer";
import { GlitchText, CyberCard, HoloButton, ScanlineOverlay } from "@/components/CyberComponents";
import useUI from "@/hooks/useUI"; 

// --- COMPONENT SKELETON RIÊNG CHO PLAYLIST (UPDATED) ---
const PlaylistSkeleton = () => (
  <div className="w-full h-full min-h-screen relative p-6 pb-32 overflow-hidden bg-neutral-900">
    {/* 1. Header Skeleton */}
    <div className="flex flex-col md:flex-row items-end gap-8 mb-10 animate-pulse relative z-10">
      {/* Cover Image Placeholder - Style CyberCard */}
      <div className="w-52 h-52 md:w-64 md:h-64 bg-white/5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent"></div>
          <Music2 size={48} className="text-white/10" />
      </div>
      
      {/* Text Info Placeholders */}
      <div className="flex-1 w-full space-y-4 pb-2">
        <div className="w-32 h-4 bg-emerald-500/20 rounded-full border border-emerald-500/20"></div> {/* Label */}
        <div className="w-3/4 h-12 md:h-16 bg-white/5 border-l-4 border-emerald-500/30 pl-4 flex items-center">
             <div className="w-full h-6 bg-white/10 rounded"></div>
        </div> {/* Title */}
        <div className="w-full max-w-lg h-4 bg-white/5 rounded"></div> {/* Desc */}
        <div className="flex gap-4 mt-4">
            <div className="w-20 h-4 bg-white/5 rounded"></div> {/* Stats */}
            <div className="w-32 h-4 bg-white/5 rounded"></div> {/* Date */}
        </div>
      </div>
    </div>

    {/* 2. Buttons Skeleton (HOLO STYLE) */}
    {/* Thay vì div rounded thường, ta tạo hình dáng giống HoloButton: Vuông vức, border mờ */}
    <div className="flex gap-4 mb-10 animate-pulse relative z-10">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-36 border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group">
                {/* Hiệu ứng quét sáng giả */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                {/* Text giả bên trong */}
                <div className="w-20 h-2 bg-emerald-500/20 skew-x-12"></div>
                {/* Decor góc */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-emerald-500/50"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-emerald-500/50"></div>
            </div>
        ))}
    </div>

    {/* 3. List Skeleton (Terminal Style) */}
    <div className="w-full rounded-xl border border-white/10 overflow-hidden bg-white/5 relative z-10">
        {/* Table Header */}
        <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-4 gap-4">
             <div className="w-8 h-2 bg-white/10"></div>
             <div className="w-32 h-2 bg-white/10"></div>
        </div>
        
        {/* Table Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center p-4 gap-4 border-b border-white/5 animate-pulse hover:bg-white/5 transition-colors">
                <div className="w-6 h-4 bg-white/5 text-center"></div> {/* Index */}
                
                <div className="flex-1 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-sm"></div> {/* Thumb vuông */}
                    <div className="space-y-2">
                        <div className="w-40 h-3 bg-white/10 rounded-sm"></div> {/* Title */}
                        <div className="w-24 h-2 bg-white/5 rounded-sm md:hidden"></div> {/* Artist Mobile */}
                    </div>
                </div>
                
                <div className="w-32 h-3 bg-white/5 rounded-sm hidden md:block"></div> {/* Artist */}
                <div className="w-12 h-3 bg-white/5 rounded-sm text-right"></div> {/* Duration */}
                <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center"></div> {/* Action Button Box */}
            </div>
        ))}
    </div>
  </div>
);

export default function PlaylistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const { alert, confirm } = useUI(); 

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

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      const { data: pl } = await supabase
      const { data: pl, error: plErr } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      setPlaylist(pl);

      const { data: songsData } = await supabase
      if (plErr || !pl) throw new Error("Playlist không tồn tại");
      setPlaylist(pl);

      const { data: songsData, error: songsErr } = await supabase
        .from("playlist_songs")
        .select(`
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
          songs (id, title, author, image_url, duration)
        `)
        .eq("playlist_id", id)
        .order("added_at", { ascending: true });

      if (songsErr) throw songsErr;
      setSongs(songsData || []);
    } catch (err) {
      console.error("Load error:", err.message);
      alert('Unable to fetch playlist data.', 'error', 'LOAD_ERROR');
      setPlaylist(null);
      setSongs([]);
    } finally {
      // Giữ skeleton ít nhất 500ms để tránh giật màn hình
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  /* ==========================================================
   * REMOVE SONG
   * ========================================================== */
  const handleRemoveSong = async (songId) => {
    const isConfirmed = await confirm(
      'WARNING: You are about to remove this track from the database. This action cannot be undone.',
      'SYSTEM_ALERT'
    );

    if (!isConfirmed) return;

    try {
      await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", id)
        .eq("song_id", songId);

      if (error) throw error;
      
      loadData();
      alert('Track removed from database successfully.', 'success', 'DELETED');

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
      console.error("Remove song error:", err.message);
      alert('Failed to remove track. Please try again.', 'error', 'ERROR');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // --- SỬ DỤNG SKELETON KHI LOADING ---
  if (loading) {
    return <PlaylistSkeleton />;
  }

  if (!playlist)
    return (
      <div className="text-center text-red-500 mt-20 font-mono">
        Playlist không tồn tại
      <div className="w-full h-screen bg-neutral-900 flex flex-col items-center justify-center text-red-500 gap-4">
        <h1 className="text-4xl font-mono font-bold">ERROR 404</h1>
        <p className="font-mono tracking-widest">PLAYLIST_NOT_FOUND</p>
        <HoloButton onClick={() => router.push('/')}>RETURN_HOME</HoloButton>
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
    <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white p-6 pb-32 transition-colors duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-end gap-8 mb-10 relative z-10 animate-in slide-in-from-bottom-5 duration-700">
        <CyberCard className="p-1 rounded-2xl shadow-2xl shadow-emerald-500/10">
            <div className="relative w-52 h-52 md:w-64 md:h-64 rounded-xl overflow-hidden group">
            <Image
                src={playlist.cover_url || "/default_playlist.png"}
                fill
                alt="Playlist Cover"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
        </CyberCard>

        <div className="flex flex-col gap-2 flex-1 pb-2">
          <div className="flex items-center gap-2 mb-1">
             <span className="w-2 h-2 bg-emerald-500 animate-pulse rounded-full"></span>
             <p className="uppercase text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.3em]">
                PRIVATE_PLAYLIST
            </p>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tight mb-2 uppercase">
            <GlitchText text={playlist.name} />
          </h1>
          {playlist.description && (
            <p className="text-neutral-600 dark:text-neutral-400 italic font-mono text-sm max-w-2xl border-l-2 border-emerald-500/50 pl-3 mb-4">
              "{playlist.description}"
            </p>
          )}

          <p className="text-gray-400 text-sm">
            {songs.length} bài hát • Tạo{" "}
            {playlist.created_at
              ? new Date(playlist.created_at).toLocaleDateString("vi-VN")
              : "--"}
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest mt-auto">
            <span className="flex items-center gap-1"><Music2 size={14}/> {songs.length} TRACKS</span>
            <span>//</span>
            <span className="flex items-center gap-1"><Clock size={14}/> CREATED: {new Date(playlist.created_at).toLocaleDateString("vi-VN")}</span>
          </div>
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
      <div className="flex flex-wrap gap-4 mb-10 z-20 relative">
  
        {/* 1. PLAY BUTTON: To nhất, padding rộng nhất */}
        <HoloButton 
          onClick={() => {}} 
          className="
            /* Spacing & Layout */
            px-9 py-1
            
            /* Colors */
            border-emerald-500/50 text-emerald-600 dark:text-emerald-400 
            bg-emerald-500/5 dark:bg-emerald-500/10
            
            /* Hover */
            hover:bg-emerald-500 hover:text-white hover:border-emerald-400
            hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]
          "
        >
          <Play size={20} fill="currentColor" className="mr-2" /> PLAY_ALL
        </HoloButton>

        {/* 2. ADD BUTTON: Padding vừa phải */}
        <HoloButton 
          onClick={() => setShowAddSongModal(true)}
          className="
            /* Spacing & Layout */
            px-6 py-1
            
            /* Colors */
            border-cyan-500/30 text-cyan-600 dark:text-cyan-400
            hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10
            
            /* Hover */
            hover:border-cyan-400 
            hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]
          "
        >
          <Plus size={18} className="mr-2" /> ADD_TRACK
        </HoloButton>

        {/* 3. EDIT BUTTON: Padding vừa phải */}
        <HoloButton 
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
          className="
            /* Spacing & Layout */
            px-6 py-1
            
            /* Colors */
            border-amber-500/30 text-amber-600 dark:text-amber-400
            hover:bg-amber-500/10 dark:hover:bg-amber-400/10
            
            /* Hover */
            hover:border-amber-400
            hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]
          "
        >
          <Edit2 size={18} className="mr-2" /> EDIT_INFO
        </HoloButton>

      </div>

      {/* LIST */}
      <CyberCard className="p-0 overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-xl border-neutral-200 dark:border-white/10">
        <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
            <thead className="bg-neutral-200/50 dark:bg-black/40 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-widest">
                <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Track_Title</th>
                <th className="p-4">Artist</th>
                <th className="p-4 text-right">Duration</th>
                <th className="p-4 w-16 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                {songs.map((s, index) => {
                const song = s.songs;
                if (!song) return null;
                return (
                    <tr key={song.id} className="group hover:bg-emerald-500/10 transition-colors duration-200">
                    <td className="p-4 text-center text-neutral-400 group-hover:text-emerald-500">{index + 1}</td>
                    <td className="p-4">
                        <div className="flex items-center gap-4 group/song">
                            <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded border border-neutral-300 dark:border-white/10 group-hover/song:border-emerald-500 transition-colors">
                                <Image 
                                    src={song.image_url || "/default_song.jpg"} 
                                    fill 
                                    alt={song.title} 
                                    className="object-cover group-hover/song:scale-110 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/song:opacity-100 transition-opacity">
                                    <Play size={16} fill="white" className="text-white"/>
                                </div>
                            </div>
                            <span className="font-bold text-neutral-800 dark:text-white group-hover/song:text-emerald-500 transition-colors truncate max-w-[200px] md:max-w-xs">
                                {song.title}
                            </span>
                        </div>
                    </td>
                    <td className="p-4 text-neutral-500 dark:text-neutral-400 group-hover:text-white transition-colors">{song.author}</td>
                    <td className="p-4 text-right font-mono text-neutral-500 group-hover:text-emerald-500">{formatDuration(song.duration)}</td>
                    <td className="p-4 text-center">
                        <button
                        onClick={() => handleRemoveSong(song.id)}
                        className="p-2 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-colors group-hover:opacity-100 focus:opacity-100"
                        title="Remove Track"
                        >
                        <Trash2 size={16} />
                        </button>
                    </td>
                    </tr>
                );
                })}
                {songs.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-neutral-400 italic">[EMPTY_DATA] No tracks added yet.</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </CyberCard>

      {/* ADD SONG MODAL */}
      {/* MODALS */}
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