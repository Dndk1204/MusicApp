"use client";

import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { Library, Plus, ListMusic, Loader2 } from "lucide-react"; 
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "./Navbar"; 
import CreatePlaylistModal from "./CreatePlaylistModal";

const Sidebar = ({ children }) => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // 1. Load User & Playlists
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        setUser(user);

        const { data: playlistsData, error } = await supabase
          .from("playlists")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setPlaylists(playlistsData || []);
      } catch (err) {
        console.error("Sidebar load error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 2. Xử lý tạo Playlist mới
  const handleNewPlaylist = async (name) => {
    if (!name || !user) return;
    try {
      const { error } = await supabase.from("playlists").insert({ name, user_id: user.id });
      if (error) throw error;

      const { data: playlistsData } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      setPlaylists(playlistsData || []);
    } catch (err) {
      alert("System Error: " + err.message);
    }
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- SIDEBAR MODULE --- */}
        <div className="
            hidden md:flex flex-col 
            w-[260px] 
            h-[calc(100vh-80px-90px-32px)]
            mt-4 ml-4 
            
            /* --- STYLE NỀN THEME MỚI --- */
            /* Light: Trắng đục (bg-white/60) | Dark: Đen mờ (bg-black/60) */
            bg-white/60 dark:bg-black/60
            backdrop-blur-3xl 
            /* Viền: Light (xám nhạt) | Dark (trắng mờ) */
            border border-neutral-200 dark:border-white/5
            rounded-2xl 
            p-4 gap-y-4 shrink-0 z-40
            shadow-sm dark:shadow-none

            /* --- HIỆU ỨNG HOVER --- */
            transition-all duration-500 ease-out
            /* Hover: Light (Trắng đặc hơn) | Dark (Đen đặc hơn) */
            hover:bg-white/90 dark:hover:bg-black/90
            hover:border-emerald-500/30
            hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]
        ">
          
          {/* Header Sidebar */}
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 pl-2 pb-2 border-b border-neutral-200 dark:border-white/5 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors duration-300">
             <div className="flex items-center gap-x-2">
                <Library size={20} />
                <p className="font-bold text-xs tracking-[0.2em] font-mono">LIBRARY</p>
             </div>
             <button
               onClick={() => setShowAddModal(true)}
               className="text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition hover:scale-110 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
               title="Create New Playlist"
             >
               <Plus size={20} />
             </button>
          </div>

          {/* List Playlist */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
               <div className="flex items-center gap-2 text-neutral-500 text-xs font-mono mt-4 pl-2">
                  <Loader2 className="animate-spin" size={14}/> [LOADING]...
               </div>
            ) : playlists.length === 0 ? (
               <div className="flex flex-col items-center mt-10 gap-2 opacity-50">
                  <ListMusic size={30} className="text-neutral-400 dark:text-neutral-600"/>
                  <p className="text-neutral-400 dark:text-neutral-500 text-[10px] italic font-mono">
                    [EMPTY_DATABASE]
                  </p>
               </div>
            ) : (
               <ul className="flex flex-col gap-y-1 mt-2">
                 {playlists.map((pl) => (
                   <li key={pl.id}>
                     <Link
                       href={`/playlist/${encodeURIComponent(pl.name)}`} 
                       // Hover item: Light (bg-black/5) | Dark (bg-white/5)
                       className="group/item flex items-center gap-x-3 px-2 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                     >
                       <div className="w-8 h-8 rounded bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-black border border-neutral-300 dark:border-white/5 flex items-center justify-center group-hover/item:border-emerald-500/50 transition">
                          <ListMusic size={14} className="text-neutral-500 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400"/>
                       </div>
                       <span className="text-sm text-neutral-600 dark:text-neutral-400 font-mono truncate group-hover/item:text-black dark:group-hover/item:text-white w-32 transition-colors">
                         {pl.name}
                       </span>
                     </Link>
                   </li>
                 ))}
               </ul>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="h-full flex-1 overflow-y-auto bg-transparent scroll-smooth">
           <div className="p-6 pb-[120px]"> 
              {children}
           </div>
        </main>
      </div>

      {/* Modal */}
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