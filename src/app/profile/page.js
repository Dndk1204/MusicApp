"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ListMusic, User, Play, Edit3, ArrowLeft, Music } from "lucide-react";
import Link from "next/link"; 
import { CyberCard, GlitchText, HoloButton, ScanlineOverlay } from "@/components/CyberComponents"; 
import FollowButton from '@/components/FollowButton';

// --- PLAYLIST CARD ---
const PlaylistCard = ({ playlist }) => (
  <Link href={`/playlist?id=${playlist.id}`}>
    <CyberCard className="group h-full p-0 hover:border-emerald-500/50 transition cursor-pointer relative bg-white dark:bg-neutral-900/40">
        <div className="relative aspect-square w-full bg-neutral-800 overflow-hidden group/img">
            {playlist.cover_url ? (
                <img src={playlist.cover_url} alt={playlist.name} className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition-transform duration-500" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-black">
                    <ListMusic size={32} className="text-neutral-600"/>
                </div>
            )}
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                 <Play size={32} className="text-white drop-shadow-lg"/>
            </div>
            <ScanlineOverlay />
        </div>
        
        <div className="p-3">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate group-hover:text-emerald-500 transition">
              {playlist.name}
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono mt-1 uppercase tracking-wider">My Playlist</p>
        </div>
    </CyberCard>
  </Link>
);

// --- ARTIST CARD ---
const ArtistCard = ({ name, image, onUnfollow }) => (
  <CyberCard className="p-0 hover:bg-white/80 dark:hover:bg-neutral-800/40 transition cursor-pointer group border border-neutral-200 dark:border-white/5 hover:border-emerald-500/30 bg-white dark:bg-neutral-900/20">
     <div className="flex items-center justify-between gap-3 p-3 w-full">
         <Link href={`/artist/${encodeURIComponent(name)}`} className="flex-1 flex items-center gap-3 min-w-0 group/link">
            <div className="w-12 h-12 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 flex items-center justify-center overflow-hidden group-hover/link:border-emerald-500/50 transition">
               {image ? (<img src={image} className="w-full h-full object-cover" alt={name}/>) : (<User size={24} className="text-neutral-500 group-hover/link:text-emerald-500 transition"/>)}
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition truncate">
                  {name}
               </h3>
               <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Artist</p>
            </div>
         </Link>
         <div className="shrink-0 ml-2 pointer-events-auto relative z-20">
            <FollowButton 
                artistName={name} 
                artistImage={image} 
                onFollowChange={(isFollowing) => !isFollowing && onUnfollow(name)} 
            />
         </div>
     </div>
  </CyberCard>
);

// --- SONG ROW COMPONENT (MỚI) ---
const SongRow = ({ song }) => (
    <div className="group flex items-center gap-4 p-3 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-default">
      <div className="relative w-12 h-12 bg-neutral-800 shrink-0 overflow-hidden">
        <img
          src={song.image_url || "/images/default_song.png"}
          alt={song.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {song.title}
        </h3>
        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {song.author}
        </p>
      </div>
      <div className="text-right flex items-center gap-4">
         <span className="text-[10px] font-mono bg-neutral-200 dark:bg-white/10 px-2 py-1 text-neutral-600 dark:text-neutral-400">
            {song.is_public ? "PUBLIC" : "PRIVATE"}
         </span>
      </div>
    </div>
);

// --- COMPONENT SKELETON ---
const ProfileSkeleton = () => (
    <div className="min-h-screen bg-neutral-100 dark:bg-black animate-pulse">
        <div className="h-48 bg-neutral-300 dark:bg-neutral-900 w-full relative"></div>
        <div className="px-6 pb-6 relative -mt-16 flex flex-col md:flex-row items-end gap-6">
            <div className="w-32 h-32 bg-neutral-400 dark:bg-neutral-800 border-4 border-neutral-100 dark:border-black shrink-0"></div>
            <div className="flex-1 space-y-2 mb-2">
                <div className="h-8 w-64 bg-neutral-300 dark:bg-neutral-800"></div>
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-900"></div>
            </div>
        </div>
    </div>
);

const ProfilePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  // Data State
  const [playlists, setPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [uploadedSongs, setUploadedSongs] = useState([]); // Thêm state cho nhạc upload
  
  const [activeTab, setActiveTab] = useState('uploads'); // Đổi mặc định sang Uploads

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/'); return; }
        
        const currentUser = session.user;
        setUser(currentUser);

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData);

        // 1. Fetch Playlists
        const { data: playlistData } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        setPlaylists(playlistData || []);

        // 2. Fetch Followed Artists
        const { data: followingData } = await supabase
            .from('following_artists')
            .select('artist_name, artist_image')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        setFollowedArtists(followingData || []);

        // 3. Fetch Uploaded Songs (NEW)
        const { data: songData } = await supabase
            .from('songs')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        setUploadedSongs(songData || []);

      } catch (error) { 
        console.error("Lỗi tải profile:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    getData();
  }, [router]);

  const handleUnfollow = (artistName) => {
      setFollowedArtists(prev => prev.filter(a => a.artist_name !== artistName));
  };

  if (loading) return <ProfileSkeleton />;
  if (!user) return null; 

  return (
    <div className="w-full h-full min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white pb-[100px]">
      
      {/* 1. HERO SECTION */}
      <div className="relative">
        <div className="h-48 w-full bg-neutral-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-black opacity-80"></div>
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),repeating-linear-gradient(45deg,#000_25%,#111_25%,#111_75%,#000_75%,#000)] bg-[length:10px_10px]"></div>
            <ScanlineOverlay />
            
            <button onClick={() => router.back()} className="absolute top-6 left-6 p-2 bg-black/50 hover:bg-emerald-500 hover:text-white text-white border border-white/20 transition-colors z-20">
                <ArrowLeft size={20} />
            </button>
        </div>

        <div className="px-6 pb-6 relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end -mt-20 gap-6">
            <div className="relative w-40 h-40 bg-black border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0 overflow-hidden group">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
              ) : (
                <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    <User size={48} className="text-neutral-400 dark:text-neutral-600"/>
                </div>
              )}
              <ScanlineOverlay />
            </div>

            <div className="flex-1 w-full mb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                      <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter uppercase mb-2">
                        <GlitchText text={profile?.full_name || "USER_PROFILE"} />
                      </h1>
                      <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-emerald-600 dark:text-emerald-500 uppercase">
                          <span className="bg-emerald-500/10 px-2 py-1 border border-emerald-500/30">:: PERSONAL_DASHBOARD ::</span>
                          <span className="opacity-70">{user.email}</span>
                      </div>
                  </div>
                  <HoloButton onClick={() => router.push('/account')} className="px-6 py-2 text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white">
                      <Edit3 size={14} className="mr-2"/> EDIT_PROFILE
                  </HoloButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="border-y border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 mb-8">
          <div className="max-w-7xl mx-auto px-6 py-4 flex gap-12 text-sm font-mono uppercase tracking-wider">
              <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Uploads:</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{uploadedSongs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Playlists:</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{playlists.length}</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Following:</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{followedArtists.length}</span>
              </div>
          </div>
      </div>

      {/* 3. CONTENT TABS */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex border-b border-neutral-200 dark:border-white/10 mb-6">
          <button onClick={() => setActiveTab('uploads')} className={`pb-3 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider px-2 mr-6 ${activeTab === 'uploads' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}>
             My_Uploads ({uploadedSongs.length})
          </button>
          <button onClick={() => setActiveTab('playlists')} className={`pb-3 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider px-2 mr-6 ${activeTab === 'playlists' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}>
             My_Playlists ({playlists.length})
          </button>
          <button onClick={() => setActiveTab('artists')} className={`pb-3 text-xs font-bold font-mono transition border-b-2 uppercase tracking-wider px-2 ${activeTab === 'artists' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-black dark:hover:text-white'}`}>
             Following ({followedArtists.length})
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="animate-in fade-in zoom-in duration-500">
             
             {/* UPLOADS TAB */}
             {activeTab === 'uploads' && (
                <div className="space-y-2">
                    {uploadedSongs.length > 0 ? (
                        uploadedSongs.map(song => <SongRow key={song.id} song={song} />)
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-300 dark:border-white/10">
                            <Music size={40} className="opacity-30"/>
                            <p className="font-mono italic text-xs tracking-widest">[NO_UPLOADS_YET]</p>
                        </div>
                    )}
                </div>
             )}

             {/* PLAYLISTS TAB */}
             {activeTab === 'playlists' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {playlists.length > 0 ? (
                        playlists.map(pl => <PlaylistCard key={pl.id} playlist={pl} />)
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-300 dark:border-white/10">
                            <ListMusic size={40} className="opacity-30"/>
                            <p className="font-mono italic text-xs tracking-widest">[NO_PLAYLISTS_CREATED]</p>
                        </div>
                    )}
                </div>
             )}

             {/* FOLLOWING TAB */}
             {activeTab === 'artists' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {followedArtists.length > 0 ? (
                        followedArtists.map((a) => (
                            <ArtistCard 
                                key={a.artist_name} 
                                name={a.artist_name} 
                                image={a.artist_image} 
                                onUnfollow={handleUnfollow} 
                            />
                        ))
                   ) : (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-300 dark:border-white/10">
                          <User size={40} className="opacity-30"/>
                          <p className="font-mono italic text-xs tracking-widest">[NO_ARTISTS_FOLLOWED]</p>
                      </div>
                   )}
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;