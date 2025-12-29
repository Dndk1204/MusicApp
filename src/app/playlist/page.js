"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { 
  Play, Edit2, Plus, Trash2, Clock, Music2, 
  Ban, Shuffle, Globe, Lock, ArrowLeft 
} from "lucide-react";
import AddSongModal from "@/components/AddSongModal";
import EditPlaylistModal from "@/components/EditPlaylistModal";
import usePlayer from "@/hooks/usePlayer";
// IMPORT HOOK UI & COMPONENTS
import useUI from "@/hooks/useUI";
import { CyberCard, HoloButton, ScanlineOverlay, HorizontalGlitchText } from "@/components/CyberComponents";
// IMPORT AUTH & MODAL
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
// IMPORT HOVER PREVIEW
import HoverImagePreview from "@/components/HoverImagePreview"; 

// --- SKELETON LOADER COMPONENT (Giữ nguyên) ---
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
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user?.id || null);
    });
  }, []);

  const isOwner = currentUser && playlist?.user_id === currentUser;

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
        console.log("Check visibility:", pl.visibility);
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

  const syncSongMap = () => {
     if (typeof window !== 'undefined') {
        const songMap = {};
        songs.forEach(item => { if(item.songs) songMap[item.songs.id] = item.songs });
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
  }

  // Handle Play Normal
  const handlePlayPlaylist = () => {
    if (!songs.length) return;
    if (!isAuthenticated) { openModal(); return; }

    syncSongMap();
    const ids = songs.map((item) => item.songs?.id).filter(Boolean).map(Number);
    
    player.setIsShuffle(false); 
    player.setIds(ids);
    player.setId(ids[0]);
  };

  // --- LOGIC SHUFFLE PLAY ---
  const handleShufflePlay = () => {
    if (!songs.length) return;
    if (!isAuthenticated) { openModal(); return; }

    syncSongMap();
    const ids = songs.map((item) => item.songs?.id).filter(Boolean).map(Number);
    
    // Random 1 bài để bắt đầu
    const randomIndex = Math.floor(Math.random() * ids.length);
    const randomId = ids[randomIndex];

    player.setIsShuffle(true); 
    player.setIds(ids);
    player.setId(randomId);
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
    <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white p-4 md:p-6 pb-32 transition-colors duration-500 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* --- NÚT QUAY LẠI --- */}
      <button 
        onClick={() => router.back()} 
        className="
            relative z-20 mb-6 group flex items-center gap-2 px-3 py-3
            backdrop-blur-md
            border border-neutral-300 dark:border-white/10 
            hover:border-emerald-500 dark:hover:border-emerald-500
            hover:!text-white hover:bg-emerald-500
            transition-all duration-300 rounded-none
            uppercase text-[10px] font-bold tracking-[0.2em] font-mono
        "
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* HEADER SECTION (Responsive: Flex-Col trên Mobile) */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-10 relative z-10 animate-in slide-in-from-bottom-5 duration-700">
        
        {/* Cover Image Wrapper */}
        <CyberCard className="p-0 rounded-none shadow-2xl shadow-emerald-500/10 shrink-0 border border-neutral-300 dark:border-white/10">
            {/* HOVER PREVIEW CHO PLAYLIST COVER */}
            <div className="relative w-48 h-48 md:w-64 md:h-64 overflow-hidden group bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center cursor-none">
                <HoverImagePreview 
                    src={playlist.cover_url} 
                    alt="Playlist Cover" 
                    className="w-full h-full"
                    previewSize={300}
                    fallbackIcon="disc"
                >
                    <div className="w-full h-full relative">
                        {playlist.cover_url ? (
                            <Image
                                src={playlist.cover_url}
                                fill
                                alt="Playlist Cover"
                                className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                            />
                        ) : (
                            <span className="text-6xl font-bold opacity-30 font-mono flex items-center justify-center h-full w-full">{playlist.name?.[0]}</span>
                        )}
                        <ScanlineOverlay />
                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                </HoverImagePreview>
            </div>
        </CyberCard>

        {/* Info */}
        <div className="flex flex-col gap-2 flex-1 pb-2 w-full items-center md:items-start text-center md:text-left">
          {/* --- INDICATOR PUBLIC / PRIVATE --- */}
          <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
             <button
                disabled={!isOwner} 
                onClick={async () => {
                    if (!isOwner) return;
                    
                    // 1. Lấy trạng thái hiện tại (Dùng cột 'visibility')
                    const currentStatus = !!playlist.visibility; 
                    const newStatus = !currentStatus;

                    // 2. Optimistic Update
                    setPlaylist(prev => ({ ...prev, visibility: newStatus }));

                    // 3. Gửi request lên Server (Sửa tên cột thành 'visibility')
                    const { error } = await supabase
                        .from('playlists')
                        .update({ visibility: newStatus ? 1 : 0 }) // <--- SỬA DÒNG NÀY
                        .eq('id', playlist.id); 

                    if (error) {
                        console.error("Lỗi update:", error);
                        alert(`Failed: ${error.message}`, "error");
                        // Revert lại nếu lỗi
                        setPlaylist(prev => ({ ...prev, visibility: currentStatus }));
                    } else {
                        alert(`Playlist is now ${newStatus ? 'Public' : 'Private'}`, "success");
                    }
                }}
                className={`
                    group flex items-center gap-2 px-3 py-1 border transition-all duration-300
                    ${isOwner ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'}
                    ${playlist.visibility ? 'border-blue-500/50 bg-blue-500/5' : 'border-red-500/50 bg-red-500/5'}
                `}
                title={isOwner ? "Click to change Privacy" : "Privacy Status"}
             >
                 {/* Kiểm tra theo playlist.visibility */}
                 {playlist.visibility ? (
                     <>
                        <Globe size={14} className="text-blue-500 animate-pulse"/>
                        <p className="uppercase text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tracking-[0.2em]">
                            PUBLIC_DATA
                        </p>
                     </>
                 ) : (
                     <>
                        <Lock size={14} className="text-red-500 animate-pulse"/>
                        <p className="uppercase text-xs font-mono font-bold text-red-600 dark:text-red-400 tracking-[0.2em]">
                            PRIVATE_ENCRYPTED
                        </p>
                     </>
                 )}
                 
                 {isOwner && (
                     <Edit2 size={10} className="text-neutral-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors ml-1 group-hover:opacity-100" />
                 )}
             </button>
          </div>
          
          <h1 className="text-2xl md:text-5xl font-black font-mono tracking-tight mb-2 uppercase break-words line-clamp-2 w-full">
            <HorizontalGlitchText text={playlist.name} />
          </h1>

          {playlist.description && (
            <p className="text-neutral-600 dark:text-neutral-400 italic font-mono text-xs md:text-sm max-w-2xl border-l-2 border-emerald-500/50 pl-3 mb-4 text-left">
              "{playlist.description}"
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] md:text-xs font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest mt-auto">
            <span className="flex items-center gap-1"><Music2 size={14}/> {songs.length} TRACKS</span>
            <span>//</span>
            <span className="flex items-center gap-1"><Clock size={14}/> CREATED: {new Date(playlist.created_at).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (Flex Wrap cho Mobile) */}
      <div className="flex flex-wrap gap-3 md:gap-4 mb-10 z-20 relative justify-center md:justify-start">
          
          {/* NÚT PLAY */}
          <HoloButton 
              onClick={handlePlayPlaylist} 
              className="px-4 py-0.5 md:px-8 md:py-1 bg-emerald-500/10 !border-emerald-500/50 dark:hover:!bg-emerald-500/20 !text-emerald-600 dark:!text-emerald-400 hover:!bg-emerald-500 hover:!text-white dark:hover:!text-white flex-1 md:flex-none justify-center"
          >
              {/* Thêm shrink-0 */}
              <div className="hidden md:block">
                <Play size={14} fill="currentColor" className="mr-1 shrink-0" />
              </div> 
              <span className="text-[8px] md:text-xs whitespace-nowrap">PLAY_ALL</span>
          </HoloButton>

          {/* NÚT SHUFFLE */}
          <HoloButton 
              onClick={handleShufflePlay} 
              className="px-4 py-0.5 md:px-8 md:py-1 bg-purple-500/10 !border-purple-500/30 text-purple-600 dark:!text-purple-400 hover:bg-purple-500 hover:!text-white flex-1 md:flex-none justify-center"
          >
              {/* Thêm shrink-0 */}
              <div className="hidden md:block">
                <Shuffle size={14} className="mr-1 shrink-0" />
              </div>
              <span className="text-[8px] md:text-xs whitespace-nowrap">SHUFFLE</span>
          </HoloButton>

          {/* NÚT ADD TRACK */}
          {isOwner && (
              <HoloButton onClick={() => setShowAddSongModal(true)} className="px-4 py-0.5 md:px-8 md:py-1 !border-cyan-500/30 dark:hover:!text-white hover:!text-white !text-cyan-600 hover:!bg-cyan-500 dark:hover:!bg-cyan-500/10 dark:!text-cyan-400 flex-1 md:flex-none justify-center">
                  {/* Thêm shrink-0 */}
                  <div className="hidden md:block">
                    <Plus size={14} className="mr-1 shrink-0" />
                  </div>
                  <span className="text-[8px] md:text-xs whitespace-nowrap">ADD_TRACK</span>
              </HoloButton>
          )}

          {/* NÚT EDIT */}
          {isOwner && (
              <HoloButton onClick={() => setShowEditModal(true)} className="px-5 py-1 md:px-8 md:py-1.5 !border-amber-500/30 dark:hover:!text-white hover:!text-white !text-amber-600 hover:!bg-amber-500 dark:hover:!bg-amber-500/10 dark:!text-amber-400 flex-1 md:flex-none justify-center">
                  {/* Thêm shrink-0 */}
                  <div className="hidden md:block">
                    <Edit2 size={14} className="mr-1 shrink-0" />
                  </div>
                  <span className="text-[8px] md:text-xs whitespace-nowrap">EDIT</span>
              </HoloButton>
          )}
      </div>

      {/* SONG LIST TABLE (Responsive: Overflow-x-auto) */}
      <CyberCard className="p-0 overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-none border-neutral-200 dark:border-white/10">
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-sm min-w-[350px]">
            <thead className="bg-neutral-200/50 dark:bg-black/40 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-widest border-b border-neutral-300 dark:border-white/10">
                <tr>
                <th className="p-4 w-10 md:w-12 text-center">#</th>
                <th className="p-4">Track_Title</th>
                <th className="p-4 hidden md:table-cell">Artist</th>
                <th className="p-4 text-right">Dur.</th>
                <th className="p-4 w-12 md:w-16 text-center">Act</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                {songs.map((s, index) => {
                const song = s.songs;
                if (!song) return null;

                return (
                    <tr
                    key={song.id}
                    data-song-json={JSON.stringify(song)} 
                    onClick={() => {
                        if (!isAuthenticated) {
                          openModal();
                          return;
                        }
                        const ids = songs.map((item) => Number(item.songs?.id)).filter(Boolean);
                        player.setIsShuffle(false); // Reset shuffle khi click từng bài
                        player.setIds(ids);
                        player.setId(Number(song.id));
                    }}
                    className="group/song hover:bg-emerald-500/10 transition-colors duration-200 cursor-pointer"
                    >
                    <td className="p-4 text-center text-neutral-400 group-hover/song:text-emerald-500 text-xs md:text-sm">
                        {index + 1}
                    </td>

                    <td className="p-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* HOVER PREVIEW CHO SONG LIST */}
                            <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-none border border-neutral-300 dark:border-white/10 group-hover/song:border-emerald-500 transition-colors bg-neutral-200 dark:bg-black cursor-none">
                                <HoverImagePreview
                                    src={song.image_url || "/default_song.jpg"}
                                    alt={song.title}
                                    audioSrc={song.song_url} 
                                    className="w-full h-full"
                                    previewSize={200}
                                    fallbackIcon="disc"
                                >
                                    <div className="w-full h-full relative flex items-center justify-center">
                                        {song.image_url ? (
                                            <Image
                                                src={song.image_url}
                                                fill
                                                alt={song.title}
                                                className="object-cover group-hover/song:scale-110 transition-transform duration-500 grayscale group-hover/song:grayscale-0"
                                            />
                                        ) : (
                                            <Music2 size={16} className="text-neutral-400" />
                                        )}
                                        
                                        {/* Play Icon Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/song:opacity-100 transition-opacity">
                                            <Play size={16} fill="white" className="text-white"/>
                                        </div>
                                        <ScanlineOverlay />
                                    </div>
                                </HoverImagePreview>
                            </div>

                            <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-bold text-neutral-800 dark:text-white group-hover/song:text-emerald-500 transition-colors truncate max-w-[140px] md:max-w-xs uppercase text-xs md:text-sm">
                                    {song.title}
                                </span>
                                <span className="text-[10px] md:text-xs text-neutral-500 md:hidden truncate max-w-[120px]">{song.author}</span>
                            </div>
                        </div>
                    </td>

                    <td className="p-4 text-neutral-500 dark:text-neutral-400 group-hover/song:text-white transition-colors hidden md:table-cell text-sm">
                        {song.author}
                    </td>

                    <td className="p-4 text-right font-mono text-neutral-500 group-hover/song:text-emerald-500 text-xs md:text-sm">
                        {formatDuration(song.duration)}
                    </td>

                    <td className="p-4 text-center">
                      {isOwner ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSong(song.id);
                          }}
                          className="p-2 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 transition-all"
                          title="Remove Track"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div
                          className="p-2 disabled text-neutral-600 dark:text-neutral-500 opacity-60 cursor-not-allowed"
                          title="You cannot remove songs from someone else's playlist"
                          aria-disabled="true"
                        >
                          <Ban size={16} className="disabled cursor-not-allowed pointer-events-none" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
                })}
                
                {songs.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-12 text-center text-neutral-400 italic font-mono border-t border-dashed border-neutral-300 dark:border-white/10 text-xs md:text-sm">
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
          onUpdated={() => { setShowEditModal(false); loadData();}}
          onDeleted={() => router.push("/")}
        />
      )}
    </div>
  );
}