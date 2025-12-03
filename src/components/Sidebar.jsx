"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus, ListMusic, Play, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "./Navbar";
import CreatePlaylistModal from "./CreatePlaylistModal";
import useUI from "@/hooks/useUI";

// --- COMPONENT SKELETON ---
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

const Sidebar = ({ children }) => {
  const router = useRouter();
  const { alert, confirm } = useUI();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Hàm tải dữ liệu
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
      console.error("Playlist Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Tải dữ liệu lần đầu
    fetchPlaylists();

    // 2. Lắng nghe đăng nhập/đăng xuất
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setLoading(true); // Reset loading khi đổi user
        fetchPlaylists();
      }
    });

    // 3. --- REALTIME SUBSCRIPTION (PHẦN MỚI) ---
    // Lắng nghe mọi thay đổi (INSERT, UPDATE, DELETE) trên bảng 'playlists'
    const channel = supabase
      .channel('realtime-playlists')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlists' },
        (payload) => {
          console.log('Realtime change received:', payload);
          // Khi có thay đổi, tải lại danh sách ngay lập tức
          fetchPlaylists();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;
      
      const { error } = await supabase.from("playlists").insert({ name, user_id: user.id });
      if (error) throw error;

      // Không cần gọi fetchPlaylists() ở đây nữa vì Realtime sẽ tự bắt sự kiện INSERT
      alert("Playlist created successfully!", "success", "SUCCESS");
    } catch (err) {
      alert(err.message, "error", "CREATION_FAILED");
    }
    setShowAddModal(false);
  };

  const handlePlayPlaylist = (e, playlistId) => {
    e.stopPropagation();
    console.log("Play playlist:", playlistId);
    alert("Playing playlist...", "info", "PLAYER");
  };

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
      
      // Không cần gọi fetchPlaylists() vì Realtime sẽ tự bắt sự kiện DELETE
      router.refresh();
      alert("Playlist deleted.", "success", "DELETED");
      
    } catch (err) {
      alert(err.message, "error", "DELETE_FAILED");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black">
      <div className="fixed top-0 left-0 w-full h-[64px] z-[999]">
        <Navbar />
      </div>

      <div className="flex h-full w-full">
        {/* SIDEBAR */}
        <div className="hidden md:flex flex-col w-[220px] h-full pt-[74px] pb-4 ml-4 shrink-0">
          <div className="flex flex-col h-full w-full bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-2xl p-3 gap-y-3 shadow-sm">
            
            {/* Header Library */}
            <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-400 pl-2 pb-2 border-b border-neutral-200 dark:border-white/5">
              <div className="flex items-center gap-x-2">
                <Library size={20} />
                <p className="font-bold text-[10px] tracking-[0.2em] font-mono">LIBRARY</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="hover:text-emerald-500 p-1 transition"
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
                        <div className="relative w-10 h-10 shrink-0">
                            <img
                                src={pl.cover_url || "/default_playlist.png"}
                                alt={pl.name}
                                className="w-full h-full rounded-md object-cover border border-neutral-300 dark:border-white/10 shadow-sm"
                            />
                            {/* Overlay Play Icon */}
                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md backdrop-blur-[1px]">
                                <Play size={16} className="text-white fill-white" />
                            </div>
                        </div>

                        {/* Info Text */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 font-mono truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {pl.name}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                            {pl.playlist_songs?.length || 0} bài hát
                          </span>
                        </div>

                        {/* Hover Buttons */}
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