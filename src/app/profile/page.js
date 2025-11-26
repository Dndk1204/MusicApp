"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ListMusic, User, Play, Loader2 } from "lucide-react";
import Link from "next/link"; // <--- 1. IMPORT LINK

// --- 2. SỬA PLAYLIST CARD: Bọc bằng Link ---
const PlaylistCard = ({ playlist }) => (
  <Link href={`/playlist/${encodeURIComponent(playlist.name)}`}>
    <div className="group relative bg-neutral-100/50 dark:bg-black/40 border border-neutral-200 dark:border-white/5 p-4 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/10 transition cursor-pointer overflow-hidden h-full">
       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0 z-10">
          <div className="bg-emerald-500 p-3 rounded-full shadow-lg hover:scale-105 transition">
              <Play size={20} fill="black" className="text-black ml-1"/>
          </div>
       </div>
       <div className="w-full aspect-square bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-800 dark:to-neutral-900 rounded-lg mb-4 flex items-center justify-center shadow-md">
          <ListMusic size={40} className="text-neutral-500 dark:text-neutral-600"/>
       </div>
       <h3 className="font-bold text-neutral-800 dark:text-white font-mono truncate">{playlist.name}</h3>
       <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">By You</p>
    </div>
  </Link>
);

// Component ArtistCard (Giữ nguyên)
const ArtistCard = ({ name }) => (
  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition cursor-pointer group border border-transparent hover:border-neutral-200 dark:hover:border-white/5">
     <div className="w-16 h-16 rounded-full bg-neutral-300 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
        <User size={30} className="text-neutral-500"/>
     </div>
     <div className="flex-1">
        <h3 className="font-bold text-neutral-800 dark:text-white font-mono group-hover:text-emerald-500 transition">{name}</h3>
        <p className="text-xs text-neutral-500 font-mono">Nghệ sĩ</p>
     </div>
     <button className="px-4 py-1 rounded-full border border-neutral-300 dark:border-white/20 text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-500 transition">
        Followed
     </button>
  </div>
);

const ProfilePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState('playlists');

  useEffect(() => {
    const getData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/'); 
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Lấy Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        setProfile(profileData);

        // Lấy Playlist
        const { data: playlistData } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        setPlaylists(playlistData || []);

      } catch (error) {
        console.error("Lỗi tải profile:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [router]);

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-x-2 text-emerald-600 dark:text-emerald-500 font-mono animate-pulse">
            <Loader2 className="animate-spin" /> LOADING_PROFILE_DATA...
        </div>
    </div>
  );

  if (!user) return null; 

  return (
    <div className="w-full h-full p-6 pb-[120px] overflow-y-auto">
      
      {/* HEADER PROFILE */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pb-8 border-b border-neutral-200 dark:border-white/10">
         <div className="w-40 h-40 rounded-full shadow-2xl overflow-hidden border-4 border-white dark:border-neutral-800 bg-neutral-200 dark:bg-black">
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover"/>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <User size={60} className="text-neutral-400"/>
                </div>
            )}
         </div>

         <div className="flex-1 mb-2">
            <p className="text-xs font-mono text-emerald-500 tracking-widest uppercase mb-2">:: PERSONAL_PROFILE ::</p>
            <h1 className="text-4xl md:text-6xl font-bold font-mono text-neutral-800 dark:text-white mb-4 tracking-tighter">
                {profile?.full_name || "Unknown User"}
            </h1>
            <div className="flex items-center gap-4 text-sm font-mono text-neutral-600 dark:text-neutral-400">
                <span>{playlists.length} Public Playlists</span>
                <span className="w-1 h-1 rounded-full bg-neutral-400"></span>
                <span>{user?.email}</span>
            </div>
         </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-6 mb-6">
         <button 
            onClick={() => setActiveTab('playlists')}
            className={`pb-2 text-sm font-bold font-mono transition border-b-2 ${activeTab === 'playlists' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-neutral-800 dark:hover:text-white'}`}
         >
            PLAYLISTS
         </button>
         <button 
            onClick={() => setActiveTab('artists')}
            className={`pb-2 text-sm font-bold font-mono transition border-b-2 ${activeTab === 'artists' ? 'text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-neutral-800 dark:hover:text-white'}`}
         >
            FOLLOWING ARTISTS
         </button>
      </div>

      {/* CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
         {activeTab === 'playlists' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlists.length > 0 ? (
                    playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} />)
                ) : (
                    <p className="text-neutral-500 font-mono italic col-span-full py-10 text-center">[NO_PLAYLISTS_CREATED]</p>
                )}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ArtistCard name="Sơn Tùng M-TP" />
                <ArtistCard name="Đen Vâu" />
                <ArtistCard name="Chillies" />
            </div>
         )}
      </div>

    </div>
  );
};

export default ProfilePage;