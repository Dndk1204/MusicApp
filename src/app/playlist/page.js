"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Play, Edit2, Plus, Trash2, Clock, Music2, ArrowLeft } from "lucide-react";
import AddSongModal from "@/components/AddSongModal";
import EditPlaylistModal from "@/components/EditPlaylistModal";
import usePlayer from "@/hooks/usePlayer";
// IMPORT HOOK UI & COMPONENTS
import useUI from "@/hooks/useUI"; 
import { GlitchText, CyberCard, HoloButton, ScanlineOverlay, HorizontalGlitchText } from "@/components/CyberComponents";

// --- SKELETON LOADER COMPONENT ---
const PlaylistSkeleton = () => {
  return (
    <div className="w-full h-screen bg-neutral-100 dark:bg-black p-6 overflow-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-end gap-8 mb-10 mt-10">
            <div className="w-52 h-52 md:w-64 md:h-64 bg-neutral-300 dark:bg-white/10 shrink-0 border border-neutral-400 dark:border-white/20"></div>
            <div className="flex-1 w-full space-y-4 pb-2">
                <div className="h-4 w-32 bg-neutral-300 dark:bg-white/10"></div>
                <div className="h-12 w-3/4 bg-neutral-300 dark:bg-white/10"></div>
                <div className="h-4 w-1/2 bg-neutral-300 dark:bg-white/10"></div>
                <div className="h-4 w-48 bg-neutral-300 dark:bg-white/10 mt-auto"></div>
            </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-4 mb-10">
            <div className="h-10 w-32 bg-neutral-300 dark:bg-white/10"></div>
            <div className="h-10 w-32 bg-neutral-300 dark:bg-white/10"></div>
            <div className="h-10 w-32 bg-neutral-300 dark:bg-white/10"></div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-white/5">
                    <div className="w-8 h-8 bg-neutral-300 dark:bg-white/10"></div>
                    <div className="w-10 h-10 bg-neutral-300 dark:bg-white/10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 bg-neutral-300 dark:bg-white/10"></div>
                        <div className="h-3 w-24 bg-neutral-300 dark:bg-white/10"></div>
                    </div>
                    <div className="w-12 h-4 bg-neutral-300 dark:bg-white/10"></div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default function PlaylistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { alert, confirm } = useUI(); 
  const player = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  /* ==========================================================
      FETCH DATA
    ========================================================== */
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
        .select(`
          song_id,
          added_at,
          songs (id, title, author, image_url, song_url, duration)
        `)
        .eq("playlist_id", id)
        .order("added_at", { ascending: true });

      setSongs(songsData || []);
    } catch (err) {
      console.error("Error loading:", err);
      alert("Failed to load playlist data.", "error", "LOAD_ERROR");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  /* ==========================================================
      REALTIME UPDATES
    ========================================================== */
  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`playlist_room_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "playlist_songs", filter: `playlist_id=eq.${id}` }, () => loadData())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "playlists", filter: `id=eq.${id}` }, (payload) => setPlaylist((prev) => ({ ...prev, ...payload.new })))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]);

  /* ==========================================================
      HANDLERS
    ========================================================== */
  const formatDuration = (sec) => {
    if (!sec) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePlayPlaylist = () => {
    if (!songs.length) return;
    const ids = songs.map((item) => item.songs?.id).filter(Boolean).map(Number);
    const list = songs.map((i) => i.songs).filter(Boolean);
    const normalize = (s) => ({
      id: Number(s.id),
      title: s.title ?? "",
      author: s.author ?? "",
      image_url: s.image_url ?? null,
      song_url: s.song_url ?? null,
      duration: s.duration ? Number(s.duration) : 0,
      ...s,
    });
    player.setIds(ids);
    player.setId(ids[0]);
    // player.setSongData(normalize(list[0])); // Player hook thường tự handle việc này khi id thay đổi
  };

  const handleRemoveSong = async (songId) => {
    const isConfirmed = await confirm("Remove this track from playlist?", "REMOVE_TRACK");
    if (!isConfirmed) return;

    await supabase.from("playlist_songs").delete().eq("playlist_id", id).eq("song_id", songId);
    alert("Track removed.", "success", "UPDATED");
  };

  /* ==========================================================
      RENDERING
    ========================================================== */
  if (loading) {
    return <PlaylistSkeleton />;
  }

  if (!playlist) {
    return (
      <div className="w-full h-screen bg-neutral-100 dark:bg-black flex flex-col items-center justify-center gap-4 text-red-500 font-mono">
        <h1 className="text-4xl font-bold">ERROR 404</h1>
        <p className="tracking-widest">PLAYLIST_NOT_FOUND</p>
        <HoloButton className="px-4 hover:!bg-emerald-400 hover:!text-white" onClick={() => router.push('/')}>RETURN_HOME</HoloButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white p-6 pb-32 transition-colors duration-500 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-end gap-8 mb-10 relative z-10 animate-in slide-in-from-bottom-5 duration-700">
        
        {/* Cover Image Wrapper (CyberCard + Scanline) */}
        <CyberCard className="p-0 rounded-none shadow-2xl shadow-emerald-500/10 shrink-0 border border-neutral-300 dark:border-white/10">
            <div className="relative w-52 h-52 md:w-64 md:h-64 overflow-hidden group bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                {playlist.cover_url ? (
                    <Image
                        src={playlist.cover_url}
                        fill
                        alt="Playlist Cover"
                        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    />
                ) : (
                    <span className="text-6xl font-bold opacity-30 font-mono">{playlist.name?.[0]}</span>
                )}
                
                <ScanlineOverlay />
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
        </CyberCard>

        {/* Info */}
        <div className="flex flex-col gap-2 flex-1 pb-2 w-full">
          <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 animate-pulse rounded-none"></span>
              <p className="uppercase text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.3em]">
                PRIVATE_PLAYLIST
            </p>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black font-mono tracking-tight mb-2 uppercase break-words line-clamp-2">
            <HorizontalGlitchText text={playlist.name} />
          </h1>

          {playlist.description && (
            <p className="text-neutral-600 dark:text-neutral-400 italic font-mono text-sm max-w-2xl border-l-2 border-emerald-500/50 pl-3 mb-4">
              "{playlist.description}"
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest mt-auto">
            <span className="flex items-center gap-1"><Music2 size={14}/> {songs.length} TRACKS</span>
            <span>//</span>
            <span className="flex items-center gap-1"><Clock size={14}/> CREATED: {new Date(playlist.created_at).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (HoloButton) */}
      <div className="flex flex-wrap gap-4 mb-10 z-20 relative">
        <HoloButton 
            onClick={handlePlayPlaylist} 
            className="px-8 bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
        >
          <Play size={18} fill="currentColor" className="mr-2" /> PLAY_ALL
        </HoloButton>

        <HoloButton onClick={() => setShowAddSongModal(true)} className="px-6 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:border-cyan-400">
          <Plus size={18} className="mr-2" /> ADD_TRACK
        </HoloButton>

        <HoloButton onClick={() => setShowEditModal(true)} className="px-6 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:border-amber-400">
          <Edit2 size={18} className="mr-2" /> EDIT_INFO
        </HoloButton>
      </div>

      {/* SONG LIST TABLE (CyberCard) */}
      <CyberCard className="p-0 overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-none border-neutral-200 dark:border-white/10">
        <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
            <thead className="bg-neutral-200/50 dark:bg-black/40 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-widest border-b border-neutral-300 dark:border-white/10">
                <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Track_Title</th>
                <th className="p-4 hidden md:table-cell">Artist</th>
                <th className="p-4 text-right">Duration</th>
                <th className="p-4 w-16 text-center">Action</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                {songs.map((s, index) => {
                const song = s.songs;
                if (!song) return null;

                return (
                    <tr
                    key={song.id}
                    onClick={() => {
                        const ids = songs.map((item) => Number(item.songs?.id)).filter(Boolean);
                        const normalize = (s) => ({
                             id: Number(s.id),
                             title: s.title ?? "",
                             author: s.author ?? "",
                             image_url: s.image_url ?? null,
                             song_url: s.song_url ?? null,
                             duration: s.duration ? Number(s.duration) : 0,
                             ...s,
                        });
                        player.setIds(ids);
                        player.setId(Number(song.id));
                        // player.setSongData(normalize(song));
                    }}
                    // Sử dụng group/song để tránh conflict hover
                    className="group/song hover:bg-emerald-500/10 transition-colors duration-200 cursor-pointer"
                    >
                    <td className="p-4 text-center text-neutral-400 group-hover/song:text-emerald-500">
                        {index + 1}
                    </td>

                    <td className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-none border border-neutral-300 dark:border-white/10 group-hover/song:border-emerald-500 transition-colors bg-neutral-200 dark:bg-black">
                                <Image
                                src={song.image_url || "/default_song.jpg"}
                                fill
                                alt={song.title}
                                className="object-cover group-hover/song:scale-110 transition-transform duration-500 grayscale group-hover/song:grayscale-0"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/song:opacity-100 transition-opacity">
                                    <Play size={16} fill="white" className="text-white"/>
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-neutral-800 dark:text-white group-hover/song:text-emerald-500 transition-colors truncate max-w-[150px] md:max-w-xs uppercase">
                                    {song.title}
                                </span>
                                <span className="text-xs text-neutral-500 md:hidden truncate">{song.author}</span>
                            </div>
                        </div>
                    </td>

                    <td className="p-4 text-neutral-500 dark:text-neutral-400 group-hover/song:text-white transition-colors hidden md:table-cell">
                        {song.author}
                    </td>

                    <td className="p-4 text-right font-mono text-neutral-500 group-hover/song:text-emerald-500">
                        {formatDuration(song.duration)}
                    </td>

                    <td className="p-4 text-center">
                        <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.id); }}
                        className="
                             p-2 rounded-none hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-all 
                             group-hover/song:opacity-100 focus:opacity-100
                        "
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
                        <td colSpan="5" className="p-12 text-center text-neutral-400 italic font-mono border-t border-dashed border-neutral-300 dark:border-white/10">
                            [EMPTY_DATA] No tracks added yet.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </CyberCard>

      {/* MODALS */}
      {showAddSongModal && (
        <AddSongModal
          playlistId={playlist.id}
          onClose={() => setShowAddSongModal(false)}
          onAdded={() => { setShowAddSongModal(false); }}
        />
      )}

      {showEditModal && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => { setShowEditModal(false); }}
          onDeleted={() => router.push("/")}
        />
      )}
    </div>
  );
}