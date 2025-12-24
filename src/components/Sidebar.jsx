"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Library, Plus, ListMusic, Play, Trash2, 
  UploadCloud, User, Disc, ChevronLeft, ChevronRight, X 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Components
import CreatePlaylistModal from "./CreatePlaylistModal";
import UploadModal from "@/components/UploadModal";
import { useAuth } from "@/components/AuthWrapper";

// Hooks
import useUI from "@/hooks/useUI";
import usePlayer from "@/hooks/usePlayer";
import useUploadModal from "@/hooks/useUploadModal";
import { useModal } from "@/context/ModalContext";
import { CyberButton, ScanlineOverlay } from "@/components/CyberComponents"; 
import HoverImagePreview from "@/components/HoverImagePreview";

// =========================
//    Skeleton Loader
// =========================
const PlaylistSkeleton = ({ collapsed }) => {
  return (
    <div className="flex flex-col gap-y-2 mt-2 px-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`flex items-center gap-x-3 p-2 rounded-none animate-pulse ${collapsed ? 'justify-center md:justify-center' : ''}`}>
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-800 rounded-none shrink-0 border border-white/5"></div>
          <div className={`flex-1 space-y-2 ${collapsed ? 'hidden md:hidden' : 'block'}`}>
              <div className="h-3 w-3/4 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
              <div className="h-2 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =========================
//      Sidebar Component
// =========================
const Sidebar = ({ children, className = "", isOpen = false, onClose = () => {} }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { alert, confirm } = useUI();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();
  const player = usePlayer();
  const uploadModal = useUploadModal();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); 

  const [user, setUser] = useState(null);
  const [isProfileCompleted, setIsProfileCompleted] = useState(true); 
  const channelRef = useRef(null);

  const checkAccess = (callback) => {
    if (!isAuthenticated) {
      openModal(); // Mở AuthModal nếu chưa login
      return;
    }
    if (!isProfileCompleted) {
      alert("SYS ERR: Please finish your infomation (INITIALIZATION) to use this feature.", "error");
      router.push("/complete-profile");
      return;
    }
    callback(); // Nếu ổn thì cho phép thực hiện hành động
  };

  const getFirstLetter = (name) => (name ? name.trim()[0].toUpperCase() : "?");

  // --- FETCH DATA & REALTIME ---
  const fetchPlaylists = async (uid) => {
    setLoading(true);
    if (!uid) { setPlaylists([]); setLoading(false); return; }
    const { data, error } = await supabase.from("playlists").select(`id, name, cover_url, playlist_songs ( song_id )`).eq("user_id", uid).order("id", { ascending: true });
    if (!error) setPlaylists(data || []);
    setLoading(false);
  };

  const setupRealtime = async (userId) => {
    if (channelRef.current) { await supabase.removeChannel(channelRef.current); channelRef.current = null; }
    channelRef.current = supabase.channel(`rt-playlists-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "playlists", filter: `user_id=eq.${userId}` }, () => fetchPlaylists(userId))
        .on("postgres_changes", { event: "*", schema: "public", table: "playlist_songs" }, () => fetchPlaylists(userId))
        .subscribe();
  };

  const fetchProfileStatus = async (uid) => {
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_completed")
      .eq("id", uid)
      .single();
    setIsProfileCompleted(!!data?.is_completed);
  };

  useEffect(() => {
    const initAuth = async () => {
        const { data } = await supabase.auth.getSession();
        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) { fetchPlaylists(currentUser.id); fetchProfileStatus(currentUser.id); setupRealtime(currentUser.id); } else { setLoading(false); }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); fetchPlaylists(session.user.id); fetchProfileStatus(session.user.id); setupRealtime(session.user.id); } 
      else { setUser(null); setIsProfileCompleted(true); setPlaylists([]); setLoading(false); if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } }
    });
    return () => { subscription.unsubscribe(); if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, []);

  useEffect(() => { onClose(); }, [router]);

  const handleUploadOpen = () => {
    checkAccess(() => uploadModal.onOpen());
  };

  const handleNewPlaylistClick = () => {
    checkAccess(() => setShowAddModal(true));
  };

  const handleNavigate = (path) => {
    checkAccess(() => router.push(path));
  };

  // --- ACTIONS ---
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
    const isConfirmed = await confirm("CONFIRM_DELETION: THIS ACTION IS IRREVERSIBLE.", "DELETE_DIRECTORY");
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
      if (error) throw error;
      alert("DIRECTORY_PURGED", "success");
    } catch (err) { alert(err.message, "error"); }
  };

  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!isAuthenticated) { openModal(); return; }
    try {
      const { data: songsData, error } = await supabase.from("playlist_songs").select(`song_id, songs ( id, title, author, image_url, song_url, duration )`).eq("playlist_id", playlistId).order("added_at", { ascending: true });
      if (error) throw error;
      const songs = songsData.map((item) => item.songs).filter(Boolean);
      if (!songs.length) { alert("DIRECTORY_EMPTY", "info"); return; }
      const normalize = (s) => ({ id: Number(s.id), title: s.title ?? "", author: s.author ?? "", image_url: s.image_url ?? null, song_url: s.song_url ?? null, duration: s.duration ? Number(s.duration) : 0, ...s, });
      if (typeof window !== 'undefined') { const songMap = {}; songs.forEach(s => songMap[s.id] = normalize(s)); window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap }; }
      const ids = songs.map((s) => Number(s.id));
      player.setIds(ids); player.setId(ids[0]);
    } catch (err) { console.error("Play playlist failed:", err); alert("PLAYBACK_ERROR", "error"); }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black flex">
      <UploadModal />
      
      {/* --- MOBILE OVERLAY --- */}
      <div 
        className={`
            md:hidden fixed inset-0 bg-black/80 z-[2000] backdrop-blur-sm transition-opacity duration-300
            ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* --- SIDEBAR CONTAINER --- */}
      <div 
        className={`
            /* CHUNG */
            flex flex-col bg-white dark:bg-black border-r border-neutral-300 dark:border-white/10
            transition-all duration-300 ease-in-out shrink-0
            
            /* QUAN TRỌNG: Để visible để nút bấm thò ra ngoài không bị cắt */
            overflow-visible

            /* MOBILE */
            fixed top-0 left-0 z-[2001] w-[280px] h-full
            pt-[20px] pb-4
            ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}

            /* DESKTOP */
            md:relative md:translate-x-0 md:flex md:z-20 md:shadow-none
            md:pt-[80px] md:ml-4 md:bg-transparent md:border-none
            ${isCollapsed ? "md:w-[72px]" : "md:w-[240px]"}
            
            ${className}
        `}
      >
        {/* Nút đóng Sidebar trên Mobile (X) */}
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 text-neutral-500 hover:text-white"><X size={24} /></button>

        {/* ============================================================== */}
        {/* NÚT THU GỌN SIDEBAR (DESKTOP) - ĐÃ FIX VÙNG BẤM + OVERFLOW */}
        {/* ============================================================== */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
                hidden md:flex
                /* Vùng bấm (Hit Area): Rộng hơn, nằm hẳn ra ngoài, Z-index cực cao */
                absolute -right-6 top-1/2 -translate-y-1/2 z-[9999]
                w-10 h-24 
                items-center justify-center 
                cursor-pointer group outline-none
            `}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {/* Phần hiển thị (Visual Part) */}
            <div className={`
                w-6 h-14 
                bg-white dark:bg-neutral-900 
                border border-neutral-300 dark:border-neutral-600
                flex items-center justify-center
                shadow-[0_0_15px_rgba(0,0,0,0.2)] 
                text-neutral-500 group-hover:text-emerald-500 dark:text-neutral-400 dark:group-hover:text-emerald-400
                transition-all duration-200
                group-hover:scale-110
            `}>
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </div>
        </button>

        {/* --- PART 1: LIBRARY & ACTIONS --- */}
        {isAuthenticated && (
            <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md border border-neutral-200 dark:border-white/5 p-2 shadow-sm mx-4 md:mx-0 mt-12 md:mt-0">
                <div className={`flex items-center ${isCollapsed ? 'md:justify-center md:flex-col md:gap-2' : 'justify-between'} justify-between px-2 mb-2 transition-all`}>
                    <div className="flex items-center gap-x-2 text-neutral-700 dark:text-neutral-400">
                        <Library size={16} />
                        <p className={`font-bold text-[12px] tracking-[0.2em] font-mono whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>LIBRARY</p>
                    </div>
                    
                    <CyberButton
                        onClick={handleUploadOpen}
                        className={`
                            flex items-center gap-1.5 rounded-none
                            bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30
                            dark:!text-emerald-400 dark:hover:!text-white
                            hover:bg-emerald-500 hover:!text-white hover:border-emerald-500
                            transition-all duration-300 group
                            ${isCollapsed ? 'md:!p-1.5 md:justify-center md:w-full' : '!px-2 !py-1'}
                        `}
                        title="Upload"
                    >
                        <UploadCloud size={12} className="group-hover:animate-bounce" />
                        <span className={`text-[10px] font-bold font-mono uppercase ${isCollapsed ? 'md:hidden' : 'block'}`}>Upload</span>
                    </CyberButton>
                </div>

                <div className="flex flex-col gap-1">
                    <button onClick={() => handleNavigate('/user/library')} className={`flex items-center gap-2 w-full p-1.5 rounded-none hover:!text-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group ${isCollapsed ? 'md:justify-center' : ''}`}>
                        <div className="w-8 h-8 shrink-0 rounded-none bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border border-neutral-300 dark:border-white/5 group-hover:text-emerald-500 transition"><User size={13} /></div>
                        <span className={`text-[13px] whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>My Uploads</span>
                    </button>

                    <button onClick={() => handleNavigate('/tuned-tracks')} className={`flex items-center gap-2 w-full p-1.5 rounded-none hover:!text-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group ${isCollapsed ? 'md:justify-center' : ''}`}>
                        <div className="w-8 h-8 shrink-0 rounded-none bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border border-neutral-300 dark:border-white/5 group-hover:text-emerald-500 transition"><Disc size={13} /></div>
                        <span className={`text-[13px] whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Tuned Tracks</span>
                    </button>
                </div>
            </div>
        )}

        {/* --- PART 2: PLAYLISTS --- */}
        {/* LƯU Ý: overflow-hidden được đặt ở đây chứ không phải ở thẻ cha ngoài cùng */}
        <div className="flex flex-col flex-1 min-h-0 bg-white/60 dark:bg-black/60 backdrop-blur-md border border-neutral-200 dark:border-white/5 p-2 shadow-sm overflow-hidden mt-2 mx-4 md:mx-0 mb-4">
            <div className={`flex items-center ${isCollapsed ? 'md:justify-center md:flex-col md:gap-2' : 'justify-between'} justify-between text-neutral-700 dark:text-neutral-400 px-2 pb-2 border-b border-neutral-200 dark:border-white/5 transition-all`}>
                <div className="flex items-center gap-2">
                    <Disc size={16} />
                    <p className={`font-bold text-[12px] tracking-[0.2em] font-mono whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>PLAYLISTS</p>
                </div>
                {isAuthenticated && (
                    <button onClick={handleNewPlaylistClick} className="hover:text-emerald-500 p-1 transition hover:bg-white/10 rounded-none border border-transparent hover:border-emerald-500/50"><Plus size={16} /></button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mt-1">
                {loading ? <PlaylistSkeleton collapsed={isCollapsed} /> : playlists.length === 0 ? (
                    <div className="flex flex-col items-center mt-6 gap-1 opacity-40">
                        <ListMusic size={20} />
                        <p className={`text-[12px] italic font-mono ${isCollapsed ? 'md:hidden' : 'block'}`}>{isAuthenticated ? "[EMPTY]" : "[LOGIN]"}</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-y-0.5">
                        {playlists.map((pl) => (
                            <li key={pl.id}>
                                <div onClick={() => router.push(`/playlist?id=${pl.id}`)} className={`group relative flex items-center gap-x-2 px-2 py-1.5 rounded-none hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer border border-transparent hover:border-white/5 ${isCollapsed ? 'md:justify-center' : ''}`}>
                                    <div className="relative w-8 h-8 shrink-0 rounded-none overflow-hidden border border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                                        <HoverImagePreview src={pl.cover_url} alt={pl.name} className="w-full h-full" previewSize={160} fallbackIcon="disc">
                                            <div className="w-full h-full relative flex items-center justify-center !grayscale group-hover:!grayscale-0 blur-[1px] group-hover:blur-0 transition-all duration-500">
                                                {pl.cover_url ? (<img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover" />) : (<span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{getFirstLetter(pl.name)}</span>)}
                                                <ScanlineOverlay />
                                            </div>
                                        </HoverImagePreview>
                                    </div>
                                    
                                    <div className={`flex-1 min-w-0 flex flex-col justify-center ${isCollapsed ? 'md:hidden' : 'flex'}`}>
                                        <p className="font-medium text-[13px] text-neutral-700 dark:text-neutral-300 truncate group-hover:text-emerald-500 transition-colors font-mono">{pl.name}</p>
                                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate font-mono">{pl.playlist_songs?.length || 0} tracks</p>
                                    </div>
                                    
                                    <div className={`absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 ${isCollapsed ? 'md:hidden' : 'flex'}`}>
                                        <button onClick={(e) => handlePlayPlaylist(e, pl.id)} className="p-1 bg-emerald-500 text-white hover:scale-105 transition"><Play size={13} fill="currentColor" /></button>
                                        <button onClick={(e) => handleDeletePlaylist(e, pl.id)} className="p-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-red-500"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 h-full overflow-y-auto bg-transparent scroll-smooth relative w-full">
        <div className="w-full h-[64px] shrink-0 pointer-events-none" />
        <div className="p-4 pb-[100px] w-full">
            {children}
        </div>
      </main>

      {showAddModal && <CreatePlaylistModal onClose={() => setShowAddModal(false)} onCreate={handleNewPlaylist} />}
    </div>
  );
};

export default Sidebar;