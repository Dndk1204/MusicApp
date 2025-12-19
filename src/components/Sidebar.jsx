"use client";

import { useEffect, useState, useRef } from "react"; 
import { useRouter } from "next/navigation";
import { 
  Library, Plus, ListMusic, Play, Trash2, UploadCloud, 
  User, Disc, ChevronLeft, ChevronRight 
} from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";

// Components
import CreatePlaylistModal from "./CreatePlaylistModal";
import { useAuth } from "@/components/AuthWrapper";

// Hooks
import useUI from "@/hooks/useUI";
import usePlayer from "@/hooks/usePlayer";
import useUploadModal from "@/hooks/useUploadModal";
import { useModal } from "@/context/ModalContext";
import { CyberButton, ScanlineOverlay } from "@/components/CyberComponents"; 
import HoverImagePreview from "@/components/HoverImagePreview";

// =========================
//    Skeleton Loader (Giữ nguyên)
// =========================
const PlaylistSkeleton = ({ collapsed }) => {
  return (
    <div className="flex flex-col gap-y-2 mt-2 px-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`flex items-center gap-x-3 p-2 rounded-none animate-pulse ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-800 rounded-none shrink-0 border border-white/5"></div>
          {!collapsed && (
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
              <div className="h-2 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// =========================
//      Sidebar Component
// =========================
const Sidebar = ({ className = "" }) => { 
  const router = useRouter();
  const { alert, confirm } = useUI();
  const { isAuthenticated } = useAuth(); 
  const { openModal } = useModal();
  const player = usePlayer();
  const uploadModal = useUploadModal();

  // State
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // --- STATE COLLAPSE ---
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // --- LOGIC AUTH & REALTIME ---
  useEffect(() => {
    const initAuth = async () => {
        const { data } = await supabase.auth.getSession();
        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);
        setAuthReady(true);
        
        if (!currentUser) {
            setLoading(false);
        }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchPlaylists(session.user.id);
        setupRealtime(session.user.id);
      } else {
        setUser(null);
        setPlaylists([]);
        setLoading(false); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getFirstLetter = (name) => {
    if (!name) return "?";
    return name.trim()[0].toUpperCase();
  };

  const fetchPlaylists = async (uid) => {
    setLoading(true);

    if (!uid) {
        setPlaylists([]);
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
        .from("playlists")
        .select(`
          id, name, cover_url,
          playlist_songs ( song_id )
        `)
        .eq("user_id", uid)
        .order("id", { ascending: true });

    if (!error) setPlaylists(data || []);
    setLoading(false);
  };

  const channelRef = useRef(null);

  const setupRealtime = async (userId) => {
    if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
    }

    channelRef.current = supabase
        .channel(`rt-playlists-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "playlists", filter: `user_id=eq.${userId}` }, () => fetchPlaylists(userId))
        .on("postgres_changes", { event: "*", schema: "public", table: "playlist_songs" }, () => fetchPlaylists(userId))
        .subscribe();
  };

  useEffect(() => {
      return () => { 
          if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
          }
      };
  }, []);

  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;
      const { error } = await supabase.from("playlists").insert({ name, user_id: user.id });
      if (error) throw error;
      alert("DIRECTORY_CREATED", "success");
    } catch (err) {
      alert(err.message, "error");
    }
    setShowAddModal(false);
  };

  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    const isConfirmed = await confirm("CONFIRM_DELETION: THIS ACTION IS IRREVERSIBLE.", "DELETE_DIRECTORY");
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
      if (error) throw error;
      router.refresh();
      alert("DIRECTORY_PURGED", "success");
    } catch (err) {
      alert(err.message, "error");
    }
  };

  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!isAuthenticated) { openModal(); return; }
    try {
      const { data: songsData, error } = await supabase
        .from("playlist_songs")
        .select(`song_id, songs (id, title, author, image_url, song_url, duration)`)
        .eq("playlist_id", playlistId)
        .order("added_at", { ascending: true });

      if (error) throw error;
      const songs = songsData.map((item) => item.songs).filter(Boolean);
      if (!songs.length) { alert("DIRECTORY_EMPTY", "info"); return; }

      const normalize = (s) => ({
        id: Number(s.id),
        title: s.title ?? "",
        author: s.author ?? "",
        image_url: s.image_url ?? null,
        song_url: s.song_url ?? null,
        duration: s.duration ? Number(s.duration) : 0,
        ...s,
      });

      const ids = songs.map((s) => Number(s.id));
      if (typeof window !== 'undefined') {
            const songMap = {};
            songs.forEach(s => songMap[s.id] = normalize(s));
            window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
      }
      player.setIds(ids);
      player.setId(ids[0]);
    } catch (err) {
      console.error("Play playlist failed:", err);
      alert("PLAYBACK_ERROR", "error");
    }
  };

  return (
    <>
      <div 
        className={`
          flex flex-col h-full pb-4 ml-0 md:ml-4 shrink-0 gap-y-3 relative group/sidebar
          transition-all duration-300 ease-in-out z-[50]
          ${isCollapsed ? "w-[72px]" : "w-[220px]"}
          ${className} 
        `}
      >
        
        {/* ========================================================
            NÚT TOGGLE COLLAPSE (CHỈ HIỆN TRÊN DESKTOP: hidden md:flex)
           ======================================================== */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
                hidden md:flex
                absolute -right-4 top-1/2 -translate-y-1/2 z-[100]
                w-8 h-14 rounded-none 
                bg-white dark:bg-neutral-900 
                border border-neutral-300 dark:border-neutral-600
                items-center justify-center 
                shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.5)]
                text-neutral-500 hover:text-emerald-500 dark:text-neutral-400 dark:hover:text-emerald-400
                transition-all duration-200 cursor-pointer
                opacity-0 group-hover/sidebar:opacity-100 scale-90 group-hover/sidebar:scale-100
                hover:!scale-110 hover:!opacity-100
            `}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
             {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>


        {/* PHẦN 1: USER LIBRARY & UPLOAD */}
        {user && (
          <div className="bg-white/60 mt-0 md:mt-6 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-none p-2 shadow-sm">
              <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} px-2 mb-2 transition-all`}>
                 <div className="flex items-center gap-x-2 text-neutral-700 dark:text-neutral-400">
                    <Library size={16} />
                    {!isCollapsed && <p className="font-bold text-[12px] tracking-[0.2em] font-mono whitespace-nowrap">LIBRARY</p>}
                 </div>

                 <CyberButton
                    onClick={uploadModal.onOpen}
                    className={`
                        flex items-center gap-1.5 rounded-none
                        bg-emerald-500/10 dark:bg-emerald-500/20
                        border border-emerald-500/30
                        !text-black dark:!text-emerald-400 dark:hover:!text-white
                        hover:bg-emerald-500 hover:!text-white hover:border-emerald-500
                        hover:shadow-[0_0_10px_rgba(16,185,129,0.4)]
                        transition-all duration-300 group
                        ${isCollapsed ? '!p-1.5 justify-center w-full' : '!px-2 !py-1'}
                    `}
                    title="Upload New Song"
                 >
                    <UploadCloud size={12} className="group-hover:animate-bounce" />
                    {!isCollapsed && <span className="text-[10px] font-bold font-mono uppercase">Upload</span>}
                 </CyberButton>
              </div>

              <div className="flex flex-col gap-1">
                 <button onClick={() => router.push('/user/library')} className={`flex items-center gap-2 w-full p-1.5 rounded-none hover:!text-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group ${isCollapsed ? 'justify-center' : ''}`} title="My Uploads">
                    <div className="w-8 h-8 shrink-0 rounded-none bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center group-hover:text-emerald-500 transition shadow-sm border border-neutral-300 dark:border-white/5"><User size={13} /></div>
                    {!isCollapsed && <span className="text-[13px] whitespace-nowrap">My Uploads</span>}
                 </button>

                 <button onClick={() => router.push('/tuned-tracks')} className={`flex items-center gap-2 w-full p-1.5 rounded-none hover:!text-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group ${isCollapsed ? 'justify-center' : ''}`} title="Tuned Tracks">
                    <div className="w-8 h-8 shrink-0 rounded-none bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center group-hover:text-emerald-500 transition shadow-sm border border-neutral-300 dark:border-white/5"><Disc size={13} /></div>
                    {!isCollapsed && <span className="text-[13px] whitespace-nowrap">Tuned Tracks</span>}
                 </button>
              </div>
          </div>
        )}

        {/* PHẦN 2: PLAYLISTS */}
        <div className="flex flex-col flex-1 min-h-0 bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-none p-2 shadow-sm overflow-hidden mt-2">
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} text-neutral-700 dark:text-neutral-400 px-2 pb-2 border-b border-neutral-200 dark:border-white/5 transition-all`}>
            {isCollapsed ? (<Disc size={16} className="text-neutral-500" />) : (<p className="flex gap-2 items-center font-bold text-[12px] tracking-[0.2em] font-mono whitespace-nowrap"><Disc size={13} /> PLAYLISTS</p>)}
            {user && (<button onClick={() => setShowAddModal(true)} className="hover:text-emerald-500 p-1 transition hover:bg-white/10 rounded-none border border-transparent hover:border-emerald-500/50" title="Create Playlist"><Plus size={16} /></button>)}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mt-1">
            {loading ? (
              <PlaylistSkeleton collapsed={isCollapsed} />
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center mt-6 gap-1 opacity-40">
                <ListMusic size={20} />
                {!isCollapsed && <p className="text-[12px] italic font-mono">[EMPTY]</p>}
              </div>
            ) : (
              <ul className="flex flex-col gap-y-0.5">
                {playlists.map((pl) => (
                  <li key={pl.id}>
                    <div onClick={() => router.push(`/playlist?id=${pl.id}`)} className={`group relative flex items-center gap-x-2 px-2 py-1.5 rounded-none hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer overflow-hidden border border-transparent hover:border-white/5 ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? pl.name : ""}>
                      <div className="relative group w-8 h-8 shrink-0 rounded-none overflow-hidden border border-neutral-300 dark:border-white/10 shadow-sm flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 cursor-none">
                           <HoverImagePreview src={pl.cover_url} alt={pl.name} className="w-full h-full" previewSize={160} fallbackIcon="disc">
                               <div className="w-full h-full relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
                                   {pl.cover_url ? (<img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover transition-all duration-300 blur-[2px] group-hover:blur-none group-hover:scale-100" />) : (<span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-mono transition-all duration-300 blur-[2px] group-hover:blur-none">{getFirstLetter(pl.name)}</span>)}
                                   <ScanlineOverlay />
                               </div>
                           </HoverImagePreview>
                      </div>

                      {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
                                <p className="font-medium text-xs !text-[13px] text-neutral-700 dark:text-neutral-300 truncate group-hover:text-emerald-500 transition-colors leading-tight font-mono">{pl.name}</p>
                                <p className="text-[13px] text-neutral-400 dark:text-neutral-500 truncate font-mono leading-tight">{pl.playlist_songs?.length || 0} tracks</p>
                            </div>
                            <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                                <button onClick={(e) => handlePlayPlaylist(e, pl.id)} className="p-1 rounded-none bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 transition shadow-sm" title="Play"><Play size={13} fill="currentColor" /></button>
                                <button onClick={(e) => handleDeletePlaylist(e, pl.id)} className="p-1 rounded-none bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition shadow-sm border border-transparent hover:border-red-500/30" title="Delete"><Trash2 size={13} /></button>
                            </div>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showAddModal && <CreatePlaylistModal onClose={() => setShowAddModal(false)} onCreate={handleNewPlaylist} />}
    </>
  );
};

export default Sidebar;