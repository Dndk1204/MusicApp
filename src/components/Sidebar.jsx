"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus, ListMusic, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "./Navbar";
import CreatePlaylistModal from "./CreatePlaylistModal";

const Sidebar = ({ children }) => {
  const router = useRouter();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data, error } = await supabase
        .from("playlists")
        .select(`
          id,
          name,
          cover_url,
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
    fetchPlaylists();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") fetchPlaylists();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleNewPlaylist = async (name) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!name || !user) return;

      await supabase.from("playlists").insert({
        name,
        user_id: user.id,
      });

      fetchPlaylists();
    } catch (err) {
      alert(err.message);
    }

    setShowAddModal(false);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black">
      <div className="fixed top-0 left-0 w-full h-[64px] z-[999]">
        <Navbar />
      </div>

      <div className="flex h-full w-full">
        <div className="hidden md:flex flex-col w-[210px] h-full pt-[74px] pb-4 ml-4 shrink-0">
          <div className="flex flex-col h-full w-full bg-white/60 dark:bg-black/60 backdrop-blur-3xl border border-neutral-200 dark:border-white/5 rounded-2xl p-3 gap-y-3 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 pl-2 pb-2 border-b border-neutral-200 dark:border-white/5">
              <div className="flex items-center gap-x-2">
                <Library size={18} />
                <p className="font-bold text-[10px] tracking-[0.2em] font-mono">LIBRARY</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="hover:text-emerald-500 p-1 transition"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-mono mt-4 pl-2">
                  <Loader2 className="animate-spin" size={12} /> [LOADING]...
                </div>
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
                        className="group/item flex items-center gap-x-2 px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                      >
                        <img
                          src={pl.cover_url || "/default_playlist.png"}
                          alt={pl.name}
                          className="w-7 h-7 rounded object-cover flex-shrink-0 border border-neutral-300 dark:border-white/5"
                        />

                        <div className="flex flex-col flex-1">
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono truncate">
                            {pl.name}
                          </span>

                          <span className="text-[9px] text-gray-400 font-mono">
                            {pl.playlist_songs?.length || 0} bài hát
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

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