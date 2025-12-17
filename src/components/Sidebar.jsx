"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus, ListMusic, Play, Trash2, UploadCloud, User, Disc, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import CreatePlaylistModal from "./CreatePlaylistModal";
import UploadModal from "@/components/UploadModal";
import { useAuth } from "@/components/AuthWrapper";
import useUI from "@/hooks/useUI";
import usePlayer from "@/hooks/usePlayer";
import useUploadModal from "@/hooks/useUploadModal";
import { useModal } from "@/context/ModalContext";
import { CyberButton, ScanlineOverlay } from "@/components/CyberComponents"; 
import HoverImagePreview from "@/components/HoverImagePreview";

const PlaylistSkeleton = () => (
    <div className="flex flex-col gap-y-2 mt-2 px-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-x-3 p-2 animate-pulse">
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-800 shrink-0 border border-white/5"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-neutral-300 dark:bg-neutral-800"></div>
            <div className="h-2 w-1/2 bg-neutral-300 dark:bg-neutral-800"></div>
          </div>
        </div>
      ))}
    </div>
);

const Sidebar = () => {
  const router = useRouter();
  const { alert, confirm } = useUI();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();
  const player = usePlayer();
  const uploadModal = useUploadModal();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getFirstLetter = (name) => name ? name.trim()[0].toUpperCase() : "?";

  const fetchPlaylists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("playlists").select(`id, name, cover_url, playlist_songs(song_id)`).eq("user_id", session.user.id).order("id", { ascending: true });
      setPlaylists(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPlaylists();
    const channel = supabase.channel("sidebar_rt").on("postgres_changes", { event: "*", schema: "public", table: "playlists" }, fetchPlaylists).subscribe();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if(event === "SIGNED_IN") { setLoading(true); fetchPlaylists(); }
        if(event === "SIGNED_OUT") setPlaylists([]);
    });
    return () => { supabase.removeChannel(channel); authListener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
  let channel;

  const init = async () => {
    await fetchPlaylists();

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    channel = supabase
      .channel(`rt-playlists-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlists",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPlaylists();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist_songs",
        },
        () => {
          fetchPlaylists();
        }
      )
      .subscribe();
  };

  init();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}, []);

  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;
      const { error } = await supabase.from("playlists").insert({ name, user_id: user.id });
      if (error) throw error;
      alert("DIRECTORY_CREATED", "success");
    } catch (err) { alert(err.message, "error"); }
    setShowAddModal(false);
  };

  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (await confirm("DELETE THIS PLAYLIST?", "CONFIRM")) {
        await supabase.from("playlists").delete().eq("id", playlistId);
        alert("DELETED", "success");
    }
  };

  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!isAuthenticated) { openModal(); return; }
    const { data } = await supabase.from("playlist_songs").select(`songs(*)`).eq("playlist_id", playlistId).order("added_at", { ascending: true });
    const songs = data?.map(i => i.songs).filter(Boolean) || [];
    if(songs.length) {
        player.setIds(songs.map(s => s.id));
        player.setId(songs[0].id);
    } else {
        alert("EMPTY_PLAYLIST", "info");
    }
  };

  return (
    <div className={`relative h-full transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-0 ml-0' : 'w-[240px] ml-4'}`}>
        {/* NỘI DUNG SIDEBAR */}
        <div className={`flex flex-col h-full pb-4 gap-y-3 pt-6 min-w-[220px] transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* LIBRARY */}
            {isAuthenticated && (
                <div className="bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 p-2 shadow-sm rounded-none">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <div className="flex items-center gap-x-2 text-neutral-700 dark:text-neutral-400">
                            <Library size={16} />
                            <p className="font-bold text-[12px] tracking-[0.2em] font-mono">LIBRARY</p>
                        </div>
                        <CyberButton onClick={uploadModal.onOpen} className="!px-2 !py-1 text-[10px] hover:!text-white"><UploadCloud size={12} />Upload</CyberButton>
                    </div>
                    <button onClick={() => router.push('/user/library')} className="flex items-center gap-2 w-full p-1.5 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group">
                        <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center group-hover:!text-emerald-500 transition shadow-sm border border-neutral-300 dark:border-white/5"><User size={13} /></div>
                        <span className="group-hover:!text-emerald-500 trasition">My Uploads</span>
                    </button>
                </div>
            )}

            {/* PLAYLISTS */}
            <div className="flex flex-col flex-1 min-h-0 bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 p-2 shadow-sm overflow-hidden mt-2 rounded-none">
                <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-400 px-2 pb-2 border-b border-neutral-200 dark:border-white/5">
                    <p className="flex gap-2 items-center font-bold text-[12px] tracking-[0.2em] font-mono"><Disc size={13} /> PLAYLISTS</p>
                    {isAuthenticated && <button onClick={() => setShowAddModal(true)} className="hover:text-emerald-500 p-1"><Plus size={16} /></button>}
                </div>
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mt-1">
                    {loading ? <PlaylistSkeleton /> : playlists.length === 0 ? (
                        <div className="flex flex-col items-center mt-6 gap-1 opacity-40"><ListMusic size={20} /><p className="text-[12px] italic font-mono">[EMPTY]</p></div>
                    ) : (
                        <ul className="flex flex-col gap-y-0.5">
                            {playlists.map((pl) => (
                                <li key={pl.id}>
                                    <div onClick={() => router.push(`/playlist?id=${pl.id}`)} className="group relative flex items-center gap-x-2 px-2 py-1.5 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition cursor-pointer border border-transparent hover:border-white/5">
                                        <div className="relative w-8 h-8 shrink-0 border-neutral-300 dark:border-white/10 grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:blur-0 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 transition-all blur-[0.75px] duration-500">
                                            <HoverImagePreview src={pl.cover_url} alt={pl.name} className="w-full h-full" previewSize={160} fallbackIcon="disc">
                                                {pl.cover_url ? <img src={pl.cover_url} className="w-full h-full object-cover" /> : <span className="text-xs font-bold flex h-full !items-center !justify-center text-neutral-500">{getFirstLetter(pl.name)}</span>}
                                                <ScanlineOverlay />
                                            </HoverImagePreview>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="font-medium text-[13px] truncate group-hover:text-emerald-500">{pl.name}</p>
                                            <p className="text-[10px] text-neutral-500 truncate">{pl.playlist_songs?.length || 0} tracks</p>
                                        </div>
                                        {/* --- NÚT ACTION VỚI ANIMATION FADE-IN --- */}
                                        <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 ease-out">
                                            <button 
                                                onClick={(e) => handlePlayPlaylist(e, pl.id)} 
                                                className="p-1 bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-110 transition-all shadow-md" 
                                                title="Play"
                                            >
                                                <Play size={10} fill="currentColor" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeletePlaylist(e, pl.id)} 
                                                className="p-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-transparent hover:border-red-500/30" 
                                                title="Delete"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>

        {/* BUTTON COLLAPSE */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
                absolute z-50 top-1/2 -translate-y-1/2
                w-5 h-16 flex items-center justify-center
                bg-white dark:bg-black 
                border border-neutral-400 dark:border-white/20
                text-neutral-500 dark:text-neutral-400
                hover:text-emerald-600 dark:hover:text-emerald-400
                hover:border-emerald-500 dark:hover:border-emerald-500
                hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]
                transition-all duration-300 ease-out
                rounded-none cursor-pointer
                group
                ${isCollapsed ? 'left-0 border-l-0' : 'left-[240px] border-l-0'}
            `}
            title={isCollapsed ? "EXPAND_SIDEBAR" : "COLLAPSE_SIDEBAR"}
        >
            <div className="absolute left-0.5 top-1 bottom-1 w-[2px] bg-neutral-200 dark:bg-white/10 group-hover:bg-emerald-500/50 transition-colors"></div>
            {isCollapsed ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>

        {showAddModal && <CreatePlaylistModal onClose={() => setShowAddModal(false)} onCreate={handleNewPlaylist} />}
    </div>
  );
};

export default Sidebar;