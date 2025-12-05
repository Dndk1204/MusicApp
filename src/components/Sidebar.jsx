"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus, ListMusic, Play, Trash2, UploadCloud, User, Music } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Components
import Navbar from "./Navbar";
import CreatePlaylistModal from "./CreatePlaylistModal";
import UploadModal from "@/components/UploadModal"; // Từ Sidebar 1

// Hooks
import useUI from "@/hooks/useUI";
import usePlayer from "@/hooks/usePlayer"; // Từ Sidebar 2
import useUploadModal from "@/hooks/useUploadModal"; // Từ Sidebar 1

// =========================
//    Skeleton Loader
// =========================
const PlaylistSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-2 mt-2 px-1">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-x-3 p-2 rounded-md animate-pulse">
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-800 rounded-md shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
            <div className="h-2 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
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
  
  // Hooks
  const player = usePlayer();
  const uploadModal = useUploadModal(); // Hook mở modal upload

  // State
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Helper: Lấy chữ cái đầu làm ảnh bìa mặc định
  const getFirstLetter = (name) => {
    if (!name) return "?";
    return name.trim()[0].toUpperCase();
  };

  // =========================
  //         Fetch data
  // =========================
  const fetchPlaylists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

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
  //      Realtime Setup
  // =========================
  useEffect(() => {
    let ch1 = null;
    let ch2 = null;

    const init = async () => {
      await fetchPlaylists();

      // Lấy user hiện tại
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Realtime playlists (Thêm/Xóa Playlist)
      ch1 = supabase
        .channel("rt-playlists")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "playlists",
            filter: `user_id=eq.${user.id}`
          },
          fetchPlaylists
        )
        .subscribe();

      // Realtime playlist_songs (Khi thêm bài vào playlist thì cập nhật số lượng)
      ch2 = supabase
        .channel("rt-playlist-songs")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "playlist_songs"
          },
          fetchPlaylists
        )
        .subscribe();
    };

    init();

    // Lắng nghe sự kiện LOGIN/LOGOUT để reset dữ liệu
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setLoading(true);
        fetchPlaylists();
      }
      if (event === "SIGNED_OUT") {
        setPlaylists([]);
      }
    });

    return () => {
      if (ch1) supabase.removeChannel(ch1);
      if (ch2) supabase.removeChannel(ch2);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // =========================
  //      Create Playlist
  // =========================
  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;
      
      const { error } = await supabase.from("playlists").insert({ name, user_id: user.id });
      if (error) throw error;

      alert("Playlist created successfully!", "success", "SUCCESS");
    } catch (err) {
      alert(err.message, "error", "CREATION_FAILED");
    }
    setShowAddModal(false);
  };

  // =========================
  //      Delete Playlist
  // =========================
  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();

    const isConfirmed = await confirm(
      "Are you sure you want to delete this playlist? This action cannot be undone.", 
      "DELETE_CONFIRMATION"
    );

    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
      if (error) throw error;
      
      router.refresh();
      alert("Playlist deleted.", "success", "DELETED");
      
    } catch (err) {
      alert(err.message, "error", "DELETE_FAILED");
    }
  };

  // =========================
  //      Play Playlist
  // =========================
  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();

    try {
      // 1. Lấy toàn bộ bài hát trong playlist
      const { data: songsData, error } = await supabase
        .from("playlist_songs")
        .select(`
          song_id,
          songs (
            id, title, author, image_url, song_url, duration
          )
        `)
        .eq("playlist_id", playlistId)
        .order("added_at", { ascending: true });

      if (error) throw error;

      // 2. Lọc và chuẩn hóa dữ liệu
      const songs = songsData
        .map((item) => item.songs)
        .filter(Boolean);

      if (!songs.length) {
        alert("This playlist is empty.", "info", "EMPTY");
        return;
      }

      const normalize = (s) => ({
        id: Number(s.id),
        title: s.title ?? "",
        author: s.author ?? "",
        image_url: s.image_url ?? null,
        song_url: s.song_url ?? null,
        duration: s.duration ? Number(s.duration) : 0,
        ...s,
      });

      // 3. Đẩy vào Player
      const ids = songs.map((s) => Number(s.id));
      player.setIds(ids);
      player.setId(ids[0]);
      player.setSongData(normalize(songs[0]));

    } catch (err) {
      console.error("Play playlist failed:", err);
      alert("Could not play playlist.", "error", "ERROR");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black">
      
      {/* Modal Upload (từ Sidebar 1) */}
      <UploadModal />

      <div className="fixed top-0 left-0 w-full h-[64px] z-[999]">
        <Navbar />
      </div>

      <div className="flex h-full w-full">
        {/* SIDEBAR */}
        <div className="hidden md:flex flex-col w-[240px] h-full pt-[74px] pb-4 ml-4 shrink-0 gap-y-3">

          {/* PHẦN 1: USER LIBRARY & UPLOAD (TỪ SIDEBAR 1) */}
          <div className="bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-2xl p-3 shadow-sm">
             <div className="flex items-center gap-x-2 mb-3 pl-2 text-neutral-700 dark:text-neutral-400">
                <Music size={20} />
                <p className="font-bold text-[10px] tracking-[0.2em] font-mono">YOUR MUSIC</p>
             </div>

             <div className="flex flex-col gap-2">
                {/* Nút Vào Thư Viện */}
                <button
                    onClick={() => router.push('/user/library')}
                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/10 transition text-sm text-neutral-700 dark:text-neutral-300 font-medium group"
                >
                    <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center group-hover:text-emerald-500 transition">
                        <User size={16} />
                    </div>
                    <span>My Uploads</span>
                </button>

                {/* Nút Upload Nhạc */}
                <button
                    onClick={uploadModal.onOpen} // Mở modal upload
                    className="flex items-center gap-3 w-full p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/50 transition text-sm text-emerald-600 dark:text-emerald-400 font-medium group"
                >
                    <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition">
                        <UploadCloud size={16} />
                    </div>
                    <span>Upload Song</span>
                </button>
             </div>
          </div>

          {/* PHẦN 2: PLAYLISTS (TỪ SIDEBAR 2 - Giao diện đẹp hơn) */}
          <div className="flex flex-col flex-1 min-h-0 bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-2xl p-3 shadow-sm overflow-hidden">

            {/* Header Library */}
            <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-400 pl-2 pb-2 border-b border-neutral-200 dark:border-white/5">
              <div className="flex items-center gap-x-2">
                <Library size={20} />
                <p className="font-bold text-[10px] tracking-[0.2em] font-mono">PLAYLISTS</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="hover:text-emerald-500 p-1 transition"
                title="Create Playlist"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Playlist List */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                <PlaylistSkeleton />
              ) : playlists.length === 0 ? (
                <div className="flex flex-col items-center mt-10 gap-2 opacity-50">
                  <ListMusic size={24} />
                  <p className="text-[10px] italic font-mono">[EMPTY]</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-y-1 mt-1">
                  {playlists.map((pl) => (
                    <li key={pl.id}>
                      <div
                        onClick={() => router.push(`/playlist?id=${pl.id}`)}
                        className="
                          group relative flex items-center gap-x-3 px-2 py-2 rounded-lg
                          hover:bg-neutral-200/50 dark:hover:bg-white/10
                          transition-all duration-200 cursor-pointer overflow-hidden
                        "
                      >
                        {/* Cover Image */}
                        <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden border border-neutral-300 dark:border-white/10 shadow-sm flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                             {pl.cover_url ? (
                                <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                    {getFirstLetter(pl.name)}
                                </span>
                             )}

                            {/* Overlay Play Icon */}
                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center backdrop-blur-[1px]">
                                <Play size={16} className="text-white fill-white" />
                            </div>
                        </div>

                        {/* Playlist Name and Song Count */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-neutral-700 dark:text-neutral-300 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {pl.name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono">
                            {pl.playlist_songs?.length || 0} songs
                          </p>
                        </div>

                        {/* Action Buttons (Slide in on hover) */}
                        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                             <button
                                onClick={(e) => handlePlayPlaylist(e, pl.id)}
                                className="p-1.5 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 hover:scale-110 transition"
                                title="Play Playlist"
                             >
                                <Play size={12} fill="currentColor" />
                             </button>

                             <button
                                onClick={(e) => handleDeletePlaylist(e, pl.id)}
                                className="p-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                title="Delete Playlist"
                             >
                                <Trash2 size={12} />
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