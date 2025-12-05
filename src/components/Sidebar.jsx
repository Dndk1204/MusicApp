"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus, ListMusic, Play, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "./Navbar";
import CreatePlaylistModal from "./CreatePlaylistModal";
import useUI from "@/hooks/useUI";

import usePlayer from "@/hooks/usePlayer";

// =========================
//     Skeleton Loader
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

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const player = usePlayer();

  // Lấy chữ cái đầu làm ảnh bìa mặc định
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
  //       Realtime Setup
  // =========================
  useEffect(() => {
    let ch1 = null;
    let ch2 = null;
    let authListener = null;

    const setupSubscriptions = async (userId) => {
      // Cleanup existing channels
      if (ch1) supabase.removeChannel(ch1);
      if (ch2) supabase.removeChannel(ch2);

      // Realtime playlists
      ch1 = supabase
        .channel(`rt-playlists-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "playlists",
            filter: `user_id=eq.${userId}`
          },
          fetchPlaylists
        )
        .subscribe();

      // Realtime playlist_songs
      ch2 = supabase
        .channel(`rt-playlist-songs-${userId}`)
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

    const init = async () => {
      // Luôn fetch 1 lần để đảm bảo có dữ liệu
      await fetchPlaylists();

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        setupSubscriptions(user.id);
      }

      // Listen for auth state changes
      authListener = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user;
        if (event === 'SIGNED_IN' && user) {
          // User signed in, setup subscriptions
          fetchPlaylists(); // Fetch immediately after login
          setupSubscriptions(user.id);
        } else if (event === 'SIGNED_OUT') {
          // User signed out, cleanup
          if (ch1) supabase.removeChannel(ch1);
          if (ch2) supabase.removeChannel(ch2);
          ch1 = null;
          ch2 = null;
          setPlaylists([]);
        }
      });
    };

    init();

    return () => {
      if (authListener) authListener?.unsubscribe();
      if (ch1) supabase.removeChannel(ch1);
      if (ch2) supabase.removeChannel(ch2);
    };
  }, []);


  // =========================
  //      Create Playlist
  // =========================
  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;

      const { error } = await supabase
        .from("playlists")
        .insert({ name, user_id: user.id });

      if (error) throw error;

      alert("Playlist created successfully!", "success", "SUCCESS");
    } catch (err) {
      alert(err.message, "error", "CREATION_FAILED");
    }
    setShowAddModal(false);
  };

  // =========================
  //     Delete Playlist
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

      alert("Playlist deleted.", "success", "DELETED");
      router.refresh();
    } catch (err) {
      alert(err.message, "error", "DELETE_FAILED");
    }
  };

  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();

    try {
      // Lấy toàn bộ bài hát trong playlist
      const { data: songsData, error } = await supabase
        .from("playlist_songs")
        .select(`
          song_id,
          songs (
            id,
            title,
            author,
            image_url,
            song_url,
            duration
          )
        `)
        .eq("playlist_id", playlistId)
        .order("added_at", { ascending: true });

      if (error) throw error;

      const songs = songsData
        .map((item) => item.songs)
        .filter(Boolean);

      if (!songs.length) return;

      // Normalize giống PlaylistPage
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

      player.setIds(ids);
      player.setId(ids[0]);
      player.setSongData(normalize(songs[0]));

    } catch (err) {
      console.error("Play playlist failed:", err);
    }
  };

  // =========================
  //          Render
  // =========================
  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black">
      <div className="fixed top-0 left-0 w-full h-[64px] z-[999]">
        <Navbar />
      </div>

      <div className="flex h-full w-full">
        
        {/* SIDEBAR */}
        <div className="hidden md:flex flex-col w-[220px] h-full pt-[74px] pb-4 ml-4 shrink-0">
          <div className="flex flex-col h-full w-full bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-2xl p-3 gap-y-3 shadow-sm">
            
            {/* Header */}
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
                        {/* Cover */}
                        <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden border border-neutral-300 dark:border-white/10 shadow-sm flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                          {pl.cover_url ? (
                            <img
                              src={pl.cover_url}
                              alt={pl.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                              {getFirstLetter(pl.name)}
                            </span>
                          )}

                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md backdrop-blur-[1px]">
                            <Play size={16} className="text-white fill-white" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 font-mono truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {pl.name}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                            {pl.playlist_songs?.length || 0} bài hát
                          </span>
                        </div>

                        {/* Buttons */}
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

        {/* Main content */}
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
