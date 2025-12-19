"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Library, Plus, ListMusic, Play, Trash2, 
  UploadCloud, User, Disc 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Components
import Navbar from "./Navbar";
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
const PlaylistSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-2 mt-2 px-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-x-3 p-2 rounded-none animate-pulse">
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-800 rounded-none shrink-0 border border-white/5"></div>
          <div className="flex-1 space-y-2">
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
const Sidebar = ({ children }) => {
  const router = useRouter();
  const { alert, confirm } = useUI();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();
  const player = usePlayer();
  const uploadModal = useUploadModal();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false); // Mặc định false để không hiện loading khi chưa đăng nhập
  const [showAddModal, setShowAddModal] = useState(false);

  const getFirstLetter = (name) => (name ? name.trim()[0].toUpperCase() : "?");

  // =========================
  //        Fetch data
  // =========================
  const fetchPlaylists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Nếu không có session (đã logout), reset state và thoát
      if (!session?.user) {
        setPlaylists([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("playlists")
        .select(`
          id, name, cover_url,
          playlist_songs ( song_id )
        `)
        .eq("user_id", session.user.id)
        .order("id", { ascending: true });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error("Playlist Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  //      Realtime & Auth
  // =========================
  useEffect(() => {
    let channel;

    const init = async () => {
      // TRƯỜNG HỢP LOGOUT: Xóa dữ liệu cũ ngay lập tức
      if (!isAuthenticated) {
        setPlaylists([]);
        setLoading(false);
        if (channel) supabase.removeChannel(channel);
        return;
      }

      // TRƯỜNG HỢP LOGIN: Fetch data và subcribe realtime
      await fetchPlaylists();

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      channel = supabase
        .channel(`rt-playlists-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "playlists", filter: `user_id=eq.${user.id}` },
          () => fetchPlaylists()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "playlist_songs" },
          () => fetchPlaylists()
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isAuthenticated]); // Chạy lại mỗi khi trạng thái đăng nhập thay đổi

  // =========================
  //      Create Playlist
  // =========================
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

  // =========================
  //      Delete Playlist
  // =========================
  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    const isConfirmed = await confirm(
      "CONFIRM_DELETION: THIS ACTION IS IRREVERSIBLE.", 
      "DELETE_DIRECTORY"
    );
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
      if (error) throw error;
      alert("DIRECTORY_PURGED", "success");
    } catch (err) {
      alert(err.message, "error");
    }
  };

  // =========================
  //      Play Playlist
  // =========================
  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openModal();
      return;
    }

    try {
      const { data: songsData, error } = await supabase
        .from("playlist_songs")
        .select(`
          song_id,
          songs ( id, title, author, image_url, song_url, duration )
        `)
        .eq("playlist_id", playlistId)
        .order("added_at", { ascending: true });

      if (error) throw error;
      const songs = songsData.map((item) => item.songs).filter(Boolean);

      if (!songs.length) {
        alert("DIRECTORY_EMPTY", "info");
        return;
      }

      const ids = songs.map((s) => Number(s.id));
      player.setIds(ids);
      player.setId(ids[0]);

    } catch (err) {
      console.error("Play playlist failed:", err);
      alert("PLAYBACK_ERROR", "error");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black">
      <UploadModal />
      <div className="fixed top-0 left-0 w-full h-[64px] z-[999]">
        <Navbar />
      </div>

      <div className="flex h-full w-full">
        {/* SIDEBAR */}
        <div className="hidden md:flex flex-col w-[220px] h-full pt-[74px] pb-4 ml-4 shrink-0 gap-y-3">
          
          {isAuthenticated && (
            <div className="bg-white/60 mt-6 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-none p-2 shadow-sm">
                <div className="flex items-center justify-between px-2 mb-2">
                   <div className="flex items-center gap-x-2 text-neutral-700 dark:text-neutral-400">
                      <Library size={16} />
                      <p className="font-bold text-[12px] tracking-[0.2em] font-mono">LIBRARY</p>
                   </div>
                   <CyberButton
                      onClick={uploadModal.onOpen}
                      className="flex items-center gap-1.5 !px-2 !py-1 rounded-none bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 !text-black dark:!text-emerald-400 dark:hover:!text-white hover:bg-emerald-500 hover:!text-white hover:border-emerald-500 transition-all duration-300 group"
                      title="Upload New Song"
                   >
                      <UploadCloud size={12} className="group-hover:animate-bounce " />
                      <span className="text-[10px] font-bold font-mono uppercase">Upload</span>
                   </CyberButton>
                </div>

                <div className="flex flex-col gap-1">
                   <button
                      onClick={() => router.push('/user/library')}
                      className="flex items-center gap-2 w-full p-1.5 rounded-none hover:!text-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group"
                   >
                      <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center group-hover:text-emerald-500 transition shadow-sm border border-neutral-300 dark:border-white/5">
                          <User size={13} />
                      </div>
                      <span className="text-[13px]">My Uploads</span>
                   </button>
                   <button
                      onClick={() => router.push('/tuned-tracks')}
                      className="flex items-center gap-2 w-full p-1.5 rounded-none hover:!text-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition text-xs text-neutral-900 dark:text-neutral-300 font-medium group"
                   >
                      <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center group-hover:text-emerald-500 transition shadow-sm border border-neutral-300 dark:border-white/5">
                          <Disc size={13} />
                      </div>
                      <span className="text-[13px]">Tuned Tracks</span>
                   </button>
                </div>
            </div>
          )}

          {/* PLAYLISTS SECTION */}
          <div className="flex flex-col flex-1 min-h-0 bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-none p-2 shadow-sm overflow-hidden mt-2">
            <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-400 px-2 pb-2 border-b border-neutral-200 dark:border-white/5">
              <p className="flex gap-2 items-center font-bold text-[12px] tracking-[0.2em] font-mono"><Disc size={13} /> PLAYLISTS</p>
              {isAuthenticated && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="hover:text-emerald-500 p-1 transition hover:bg-white/10 rounded-none border border-transparent hover:border-emerald-500/50"
                  title="Create Playlist"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mt-1">
              {loading ? (
                <PlaylistSkeleton />
              ) : playlists.length === 0 ? (
                <div className="flex flex-col items-center mt-6 gap-1 opacity-40">
                  <ListMusic size={20} />
                  <p className="text-[12px] italic font-mono">{isAuthenticated ? "[EMPTY]" : "[LOGIN_REQUIRED]"}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-y-0.5">
                  {playlists.map((pl) => (
                    <li key={pl.id}>
                      <div
                        onClick={() => router.push(`/playlist?id=${pl.id}`)}
                        className="group relative flex items-center gap-x-2 px-2 py-1.5 rounded-none hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer overflow-hidden border border-transparent hover:border-white/5"
                      >
                        <div className="relative group w-8 h-8 shrink-0 rounded-none overflow-hidden border border-neutral-300 dark:border-white/10 shadow-sm flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 cursor-none">
                             <HoverImagePreview 
                                src={pl.cover_url} 
                                alt={pl.name}
                                className="w-full h-full"
                                previewSize={160}
                                fallbackIcon="disc"
                             >
                                 <div className="w-full h-full relative flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
                                     {pl.cover_url ? (
                                        <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover transition-all duration-300 blur-[2px] group-hover:blur-none" />
                                     ) : (
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 font-mono transition-all duration-300 blur-[2px] group-hover:blur-none">
                                            {getFirstLetter(pl.name)}
                                        </span>
                                     )}
                                     <ScanlineOverlay />
                                 </div>
                             </HoverImagePreview>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="font-medium text-[13px] text-neutral-700 dark:text-neutral-300 truncate group-hover:text-emerald-500 transition-colors leading-tight font-mono">
                            {pl.name}
                          </p>
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate font-mono leading-tight">
                            {pl.playlist_songs?.length || 0} tracks
                          </p>
                        </div>

                        <div className="absolute right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                             <button
                                onClick={(e) => handlePlayPlaylist(e, pl.id)}
                                className="p-1 rounded-none bg-emerald-500 text-white hover:bg-emerald-400 transition"
                             >
                                <Play size={13} fill="currentColor" />
                             </button>
                             <button
                                onClick={(e) => handleDeletePlaylist(e, pl.id)}
                                className="p-1 rounded-none bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-red-500 transition border border-transparent hover:border-red-500/30"
                             >
                                <Trash2 size={13} />
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

        {/* MAIN CONTENT */}
        <main className="flex-1 h-full overflow-y-auto bg-transparent scroll-smooth relative">
          <div className="w-full h-[64px] shrink-0 pointer-events-none" />
          <div className="p-4 pb-[100px]">{children}</div>
        </main>
      </div>

      {showAddModal && (
        <CreatePlaylistModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleNewPlaylist}
        />
      )}
    </div>
  );
};

export default Sidebar;