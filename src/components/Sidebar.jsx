"use client";

import { useEffect, useState } from "react";
import { Library, Plus, ListMusic, Loader2 } from "lucide-react"; 
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
<<<<<<< HEAD
=======
import Navbar from "./Navbar"; 
>>>>>>> 85da9e480c3e40d01a8efd2d1fe902ce2abe7176
import CreatePlaylistModal from "./CreatePlaylistModal";

const Sidebar = ({ children }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- LOGIC FETCH DATA (Giữ nguyên) ---
  const fetchPlaylists = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error("Playlist Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  useEffect(() => {
    let mounted = true;
    const initData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
            fetchPlaylists(session.user.id);
        } else if (mounted) {
            setLoading(false);
        }
    };
    initData();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            fetchPlaylists(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            setPlaylists([]);
        }
    });

    return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
    };
  }, []);

  const handleNewPlaylist = async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!name || !user) return;
      await supabase.from("playlists").insert({ name, user_id: user.id });
      fetchPlaylists(user.id);
    } catch (err) { alert(err.message); }
>>>>>>> 85da9e480c3e40d01a8efd2d1fe902ce2abe7176
    setShowAddModal(false);
  };

  return (
<<<<<<< HEAD
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
=======
    // CONTAINER TỔNG: Full màn hình, không cuộn
    <div className="relative h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* 1. NAVBAR (FIXED) - GIẢM CAO TỪ 80px -> 64px */}
      <div className="fixed top-0 left-0 w-full h-[64px] z-[999]">
         <Navbar />
      </div>

      {/* 2. BODY LAYOUT */}
      <div className="flex h-full w-full">
        
        {/* --- SIDEBAR TRÁI --- */}
        {/* GIẢM RỘNG TỪ 260px -> 210px */}
        {/* PT TỪ 90px -> 74px (để né Navbar 64px + margin) */}
        <div className="hidden md:flex flex-col w-[210px] h-full pt-[74px] pb-4 ml-4 z-40 shrink-0">
            
            {/* KHỐI KÍNH CỦA SIDEBAR */}
            <div className="
                flex flex-col h-full w-full
                bg-white/60 dark:bg-black/60 
                backdrop-blur-3xl 
                border border-neutral-200 dark:border-white/5 
                rounded-2xl 
                p-3 gap-y-3 /* Giảm padding từ 4 -> 3 */
                shadow-sm dark:shadow-none
                transition-all duration-500 ease-out 
                hover:bg-white/90 dark:hover:bg-black/90
                hover:border-emerald-500/30
                hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]
            ">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 pl-2 pb-2 border-b border-neutral-200 dark:border-white/5 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors duration-300">
                    <div className="flex items-center gap-x-2">
                        <Library size={18} /> {/* Giảm size icon */}
                        <p className="font-bold text-[10px] tracking-[0.2em] font-mono">LIBRARY</p> {/* Text nhỏ hơn */}
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="hover:text-emerald-500 p-1 transition"><Plus size={18} /></button>
                </div>
>>>>>>> 85da9e480c3e40d01a8efd2d1fe902ce2abe7176

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {loading ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-mono mt-4 pl-2"><Loader2 className="animate-spin" size={12}/> [LOADING]...</div>
                    ) : playlists.length === 0 ? (
                    <div className="flex flex-col items-center mt-10 gap-2 opacity-50"><ListMusic size={24}/><p className="text-[10px] italic font-mono">[EMPTY]</p></div>
                    ) : (
                    <ul className="flex flex-col gap-y-1 mt-1">
                        {playlists.map((pl) => (
                        <li key={pl.id}>
                            <Link href={`/playlist/${encodeURIComponent(pl.name)}`} className="group/item flex items-center gap-x-2 px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
                            <div className="w-7 h-7 rounded bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-black border border-neutral-300 dark:border-white/5 flex items-center justify-center group-hover/item:border-emerald-500/50 transition">
                                <ListMusic size={12} className="text-neutral-500 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400"/>
                            </div>
                            {/* Giảm text từ sm -> xs */}
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono truncate group-hover/item:text-black dark:group-hover/item:text-white w-28 transition-colors">{pl.name}</span>
                            </Link>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
            </div>
        </div>

        {/* --- NỘI DUNG CHÍNH (PHẢI) --- */}
        <main className="flex-1 h-full overflow-y-auto bg-transparent scroll-smooth relative">
           
           {/* --- [THE SPACER] --- */}
           {/* Giảm cục gạch kê xuống còn 64px */}
           <div className="w-full h-[64px] shrink-0 pointer-events-none" />

           {/* Nội dung thật sự: Giảm padding để rộng hơn */}
           <div className="p-4 pb-[100px]"> 
              {children}
           </div>
        </main>
      </div>

      {showAddModal && <CreatePlaylistModal onClose={() => setShowAddModal(false)} onCreate={handleNewPlaylist} />}
    </div>
  );
};

export default Sidebar;