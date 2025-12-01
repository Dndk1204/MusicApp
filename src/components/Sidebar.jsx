"use client";

import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { Home, Search, Library, Plus } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import CreatePlaylistModal from "./CreatePlaylistModal";

const Sidebar = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const routes = useMemo(
    () => [
      { icon: Home, label: "Trang chủ", active: pathname !== "/search", href: "/" },
      { icon: Search, label: "Tìm kiếm", active: pathname === "/search", href: "/search" },
    ],
    [pathname]
  );

  const loadPlaylists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data, error } = await supabase
        .from("playlists")
        .select(`id,name,cover_url,description,playlist_songs(count)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setPlaylists(
          data.map((x) => ({ ...x, songCount: x.playlist_songs[0]?.count || 0 }))
        );
      }
    } catch (err) {
      console.error("Sidebar load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleNewPlaylist = async (name) => {
    if (!name || !user) return;

    await supabase.from("playlists").insert({
      name,
      user_id: user.id,
      cover_url: null,
      description: "",
    });

    loadPlaylists();
    setShowAddModal(false);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2">

        {/* Menu trên */}
        <div className="bg-neutral-900 rounded-lg h-fit w-full p-4 flex flex-col gap-y-4">
          {routes.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-x-4 text-md font-medium hover:text-white transition ${
                item.active ? "text-white" : "text-neutral-400"
              }`}
            >
              <item.icon size={26} />
              <p className="truncate">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Thư viện */}
        <div className="bg-neutral-900 rounded-lg h-full w-full overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-x-2 text-white">
              <Library size={26} />
              <p className="font-medium">Thư viện của tôi</p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded-full bg-green-500 hover:opacity-80"
            >
              <Plus size={18} />
            </button>
          </div>

          {loading ? (
            <p className="text-neutral-500 text-sm">Đang tải playlist...</p>
          ) : playlists.length === 0 ? (
            <p className="text-neutral-500 text-sm">Chưa có playlist nào</p>
          ) : (
            <ul className="flex flex-col gap-y-3">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <Link
                    href={`/playlist/${pl.id}`}
                    className="flex items-center gap-x-3 hover:bg-neutral-800 p-2 rounded-md transition"
                  >
                    <img
                      src={pl.cover_url || "/default-cover.png"}
                      className="w-12 h-12 rounded-md object-cover"
                      alt="cover"
                    />
                    <div className="flex flex-col">
                      <p className="text-white font-medium truncate">{pl.name}</p>
                      <p className="text-neutral-400 text-sm">{pl.songCount} bài hát</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="h-full flex-1 overflow-y-auto py-2 pr-2 pb-[100px]">
        <div className="bg-neutral-900 rounded-lg h-full">{children}</div>
      </main>

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
