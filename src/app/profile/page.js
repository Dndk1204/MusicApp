"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ListMusic, User, Play, Loader2 } from "lucide-react";
import Link from "next/link"; 
import { DecoderText, CyberCard, GlitchText } from "@/components/CyberComponents"; 

// --- PLAYLIST CARD ---
const PlaylistCard = ({ playlist }) => (
  <Link href={`/playlist/${encodeURIComponent(playlist.name)}`}>
    <CyberCard className="group h-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0 z-10">
          <div className="bg-emerald-500 p-2 rounded-full shadow-lg hover:scale-105 transition">
              <Play size={16} fill="black" className="text-black ml-0.5"/>
          </div>
       </div>
       
       <div className="w-full aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-black rounded-lg mb-3 flex items-center justify-center shadow-md border border-neutral-300 dark:border-white/5 group-hover:border-emerald-500/30 transition">
          <ListMusic size={32} className="text-neutral-500 group-hover:text-emerald-500 transition"/>
       </div>
       
       <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
          {playlist.name}
       </h3>
       <p className="text-[10px] text-neutral-500 font-mono mt-0.5 uppercase tracking-wider">Created By You</p>
    </CyberCard>
  </Link>
);

// --- ARTIST CARD ---
const ArtistCard = ({ name }) => (
  <CyberCard className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer group">
     <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 flex items-center justify-center overflow-hidden group-hover:border-emerald-500/50 transition">
        <User size={24} className="text-neutral-500 group-hover:text-emerald-500 transition"/>
     </div>
     <div className="flex-1">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{name}</h3>
        <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Artist</p>
     </div>
     <span className="px-2 py-1 rounded text-[9px] font-mono text-emerald-600 dark:text-emerald-500 border border-emerald-500/30 bg-emerald-500/10">
       FOLLOWING
     </span>
  </CyberCard>
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
        if (!session) { router.push('/'); return; }
        const currentUser = session.user;
        setUser(currentUser);
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData);
        const { data: playlistData } = await supabase.from('playlists').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        setPlaylists(playlistData || []);
      } catch (error) { console.error("Lỗi tải profile:", error); } finally { setLoading(false); }
    };
    getData();
  }, [router]);

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-100 dark:bg-black transition-colors">
        <Loader2 className="animate-spin text-emerald-500" size={32} /> 
        <DecoderText text="LOADING_USER_DATA..." className="text-xs text-emerald-500 tracking-widest"/>
    </div>
  );

  if (!user) return null; 

  return (
    // SỬA: Thêm bg-neutral-100 cho Light, dark:bg-black cho Dark, text-neutral-900 cho Light
    <div className="w-full h-full p-4 pb-[100px] overflow-y-auto custom-scrollbar bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
      
      {/* HEADER PROFILE */}
      <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pb-6 border-b border-neutral-300 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-neutral-300 dark:border-white/20 hover:border-emerald-500 transition duration-500">
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
            ) : (
                <div className="w-full h-full bg-neutral-200 dark:bg-black flex items-center justify-center">
                    <User size={48} className="text-neutral-400 dark:text-neutral-600 group-hover:text-emerald-500 transition"/>
                </div>
            )}
            <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none mix-blend-overlay"></div>
         </div>

         <div className="flex-1 mb-1">
            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                :: PERSONAL_PROFILE ::
            </p>
            
            <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-900 dark:text-white mb-3 tracking-tighter">
                <GlitchText text={profile?.full_name || "Unknown User"} />
            </h1>
            
            <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1"><ListMusic size={14}/> {playlists.length} Playlists</span>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <span className="truncate max-w-[200px]">{user?.email}</span>
            </div>
         </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-4 mb-6">
         <button 
            onClick={() => setActiveTab('playlists')}
            className={`pb-1 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider ${activeTab === 'playlists' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}
         >
            My_Playlists
         </button>
         <button 
            onClick={() => setActiveTab('artists')}
            className={`pb-1 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider ${activeTab === 'artists' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}
         >
            Following_Artists
         </button>
      </div>

      {/* CONTENT */}
      <div className="animate-in fade-in zoom-in duration-500">
         {activeTab === 'playlists' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {playlists.length > 0 ? (
                    playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} />)
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-500 gap-4">
                        <ListMusic size={40} className="opacity-50"/>
                        <p className="font-mono italic text-xs tracking-widest">[DATABASE_EMPTY: NO_PLAYLISTS]</p>
                    </div>
                )}
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <ArtistCard name="Sơn Tùng M-TP" />
                <ArtistCard name="Đen Vâu" />
                <ArtistCard name="Chillies" />
                <ArtistCard name="The Weeknd" />
            </div>
         )}
      </div>

    </div>
  );
};

export default ProfilePage;