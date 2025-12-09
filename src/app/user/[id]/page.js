"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Components
import { GlitchText, CyberCard, HoloButton, ScanlineOverlay } from "@/components/CyberComponents";

// Icons
import { Music, Disc, ArrowLeft, PlayCircle, Edit3, Heart, User, Image as ImageIcon, LayoutGrid } from "lucide-react";

// Hooks
import usePlayer from "@/hooks/usePlayer";
import Link from "next/link"; 

// --- SKELETON LOADER (Cyber Style) ---
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-neutral-100 dark:bg-black animate-pulse">
    {/* Banner Skeleton */}
    <div className="h-48 bg-neutral-300 dark:bg-neutral-900 w-full relative border-b border-neutral-400 dark:border-white/10"></div>
    
    <div className="px-6 pb-6 relative -mt-16 flex flex-col md:flex-row items-end gap-6">
        {/* Avatar Skeleton */}
        <div className="w-32 h-32 bg-neutral-400 dark:bg-neutral-800 border-4 border-neutral-100 dark:border-black shrink-0 relative">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        </div>
        
        {/* Info Skeleton */}
        <div className="flex-1 space-y-3 mb-2 w-full">
            <div className="h-8 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
            <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
        </div>
    </div>

    {/* Tabs Skeleton */}
    <div className="px-6 mt-8 flex gap-4 border-b border-neutral-200 dark:border-white/10 pb-4">
        <div className="h-8 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
        <div className="h-8 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
        <div className="h-8 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
    </div>

    {/* Content Skeleton */}
    <div className="px-6 mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
            <div key={i} className="h-24 w-full bg-neutral-200 dark:bg-neutral-900 rounded-none border border-neutral-300 dark:border-white/5"></div>
        ))}
    </div>
  </div>
);

// --- ARTIST CARD ---
const ArtistCardView = ({ name, image }) => (
  <CyberCard className="p-0 hover:bg-white/80 dark:hover:bg-neutral-800/40 transition cursor-pointer group border border-neutral-200 dark:border-white/5 hover:border-emerald-500/30 bg-white dark:bg-neutral-900/20">
     <Link href={`/artist/${encodeURIComponent(name)}`} className="flex items-center gap-3 p-3 w-full">
        <div className="w-12 h-12 shrink-0 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 flex items-center justify-center overflow-hidden relative">
           {image ? (
               <img src={image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={name}/>
           ) : (
               <div className="w-full h-full flex items-center justify-center text-neutral-400 group-hover:text-emerald-500 transition-colors">
                   <User size={20} />
               </div>
           )}
           <ScanlineOverlay />
        </div>
        <div className="flex-1 min-w-0">
           <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate group-hover:text-emerald-500 transition-colors uppercase">
              {name}
           </h3>
           <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Artist</p>
        </div>
     </Link>
  </CyberCard>
);

const UserProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const player = usePlayer();

  const [user, setUser] = useState(null);
  const [userSongs, setUserSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]); 
  const [activeTab, setActiveTab] = useState('songs');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchPlaylists = async (userId) => {
      const { data: playlists } = await supabase
        .from('playlists')
        .select('*, playlist_songs(song_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (playlists) setUserPlaylists(playlists);
  };

  const fetchSongs = async (userId) => {
      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (songs) setUserSongs(songs);
  };

  const fetchFollowing = async (userId) => {
      const { data: following } = await supabase
        .from('following_artists')
        .select('artist_name, artist_image')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (following) setFollowedArtists(following);
  }

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user?.id);
    };
    getCurrentUser();

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .single();

        if (profileError || !profile) {
          setLoading(false);
          return;
        }
        setUser(profile);

        await Promise.all([
            fetchSongs(params.id),
            fetchPlaylists(params.id),
            fetchFollowing(params.id) 
        ]);

      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUserProfile();
    }

    const channel = supabase
      .channel(`realtime_profile_${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists', filter: `user_id=eq.${params.id}` }, () => fetchPlaylists(params.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: `user_id=eq.${params.id}` }, () => fetchSongs(params.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'following_artists', filter: `user_id=eq.${params.id}` }, () => fetchFollowing(params.id)) 
      .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, [params.id]);

  const handlePlaySong = (song) => {
    player.setIds([song.id]);
    player.setId(song.id);
  };

  const handlePlaylistClick = (playlist) => {
    router.push(`/playlist?id=${playlist.id}`);
  };

  if (loading) return <ProfileSkeleton />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 dark:bg-black font-mono">
        <h1 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-white"><GlitchText text="404_USER_NOT_FOUND" /></h1>
        <HoloButton onClick={() => router.back()} className="px-6 py-2 border-emerald-500 text-emerald-500">RETURN_BASE</HoloButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white pb-[100px]">
      
      {/* 1. HERO SECTION */}
      <div className="relative">
        {/* Banner with Placeholder Pattern */}
        <div className="h-48 w-full bg-neutral-900 relative overflow-hidden border-b border-white/10 group">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-black opacity-80 z-0"></div>
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>
            <ScanlineOverlay />
            <button onClick={() => router.back()} className="absolute top-6 left-6 p-2 bg-black/50 hover:bg-emerald-500 hover:text-white text-white border border-white/20 transition-colors z-20"><ArrowLeft size={20} /></button>
        </div>

        <div className="px-6 pb-6 relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end -mt-20 gap-6">
            
            {/* Avatar Container */}
            <div className="relative w-40 h-40 bg-black border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0 overflow-hidden group">
              {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"/>
              ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-500 group-hover:text-emerald-500 transition-colors">
                      <User size={64} strokeWidth={1.5} />
                  </div>
              )}
              <ScanlineOverlay />
            </div>

            <div className="flex-1 w-full mb-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                  <div>
                      <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter uppercase mb-2">
                        <GlitchText text={user.full_name || "UNKNOWN_USER"} />
                      </h1>
                      <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-emerald-600 dark:text-emerald-500 uppercase">
                          <span className="bg-emerald-500/10 px-2 py-1 border border-emerald-500/30">{user.role === 'admin' ? ':: SYSTEM_ADMIN ::' : ':: NET_RUNNER ::'}</span>
                          <span className="opacity-70">ID: {user.id.slice(0, 8)}...</span>
                      </div>
                      {user.bio && <p className="mt-4 text-sm font-mono text-neutral-600 dark:text-neutral-400 max-w-2xl border-l-2 border-neutral-300 dark:border-white/20 pl-3 italic">"{user.bio}"</p>}
                  </div>
                  {currentUser === params.id && (
                    <HoloButton onClick={() => router.push('/user/library')} className="px-6 py-2 text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white">
                      <Edit3 size={14} className="mr-2"/> EDIT_PROFILE
                    </HoloButton>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="border-y border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 mb-8">
          <div className="max-w-7xl mx-auto px-6 py-4 flex gap-12 text-sm font-mono uppercase tracking-wider">
              <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Total_Uploads:</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{userSongs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Playlists:</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{userPlaylists.length}</span>
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
          <button onClick={() => setActiveTab('songs')} className={`flex items-center gap-2 px-6 py-3 text-sm font-mono font-bold tracking-widest transition-all relative ${activeTab === 'songs' ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
            {activeTab === 'songs' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
            <Music size={16} /> UPLOADS
          </button>
          
          <button onClick={() => setActiveTab('playlists')} className={`flex items-center gap-2 px-6 py-3 text-sm font-mono font-bold tracking-widest transition-all relative ${activeTab === 'playlists' ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
            {activeTab === 'playlists' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
            <Disc size={16} /> PLAYLISTS
          </button>

          <button onClick={() => setActiveTab('following')} className={`flex items-center gap-2 px-6 py-3 text-sm font-mono font-bold tracking-widest transition-all relative ${activeTab === 'following' ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
            {activeTab === 'following' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
            <Heart size={16} /> FOLLOWING
          </button>
        </div>

        {/* SONGS CONTENT */}
        {activeTab === 'songs' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {userSongs.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-neutral-300 dark:border-white/10">
                <Music size={40} className="mx-auto mb-4 text-neutral-400"/>
                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">[NO_DATA_FOUND]</p>
              </div>
            ) : (
              userSongs.map((song) => (
                <div key={song.id} onClick={() => handlePlaySong(song)} className="group flex items-center gap-4 p-3 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                  {/* --- Song Image Placeholder Logic --- */}
                  <div className="relative w-12 h-12 bg-neutral-200 dark:bg-neutral-800 shrink-0 overflow-hidden border border-neutral-300 dark:border-white/10">
                    {song.image_url || song.image_path ? (
                        <img 
                            src={song.image_url || song.image_path} 
                            alt={song.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                            <Music size={18} />
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"><PlayCircle size={20} className="text-white"/></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">{song.title}</h3>
                    <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{song.author}</p>
                  </div>
                  <div className="text-right"><p className="text-xs font-mono text-neutral-400 dark:text-neutral-600">{formatDuration(song.duration)}</p></div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PLAYLISTS CONTENT */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {userPlaylists.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-neutral-300 dark:border-white/10">
                <Disc size={40} className="mx-auto mb-4 text-neutral-400"/>
                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">[NO_PLAYLISTS_FOUND]</p>
              </div>
            ) : (
              userPlaylists.map((playlist) => (
                <CyberCard key={playlist.id} className="p-4 cursor-pointer hover:border-emerald-500/50 bg-white dark:bg-neutral-900/40">
                  <div onClick={() => handlePlaylistClick(playlist)}>
                      <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 mb-4 overflow-hidden relative group/img border border-neutral-300 dark:border-white/10">
                        {playlist.cover_url ? (
                            <img src={playlist.cover_url} className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition-transform duration-500"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-300 to-neutral-200 dark:from-neutral-800 dark:to-black">
                                <Disc size={40} className="text-neutral-500 dark:text-neutral-600"/>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                        <ScanlineOverlay />
                      </div>
                      <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate uppercase">{playlist.name}</h3>
                      <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1">{playlist.playlist_songs?.length || 0} TRACKS</p>
                  </div>
                </CyberCard>
              ))
            )}
          </div>
        )}

        {/* FOLLOWING CONTENT */}
        {activeTab === 'following' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {followedArtists.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-neutral-300 dark:border-white/10">
                <Heart size={40} className="mx-auto mb-4 text-neutral-400"/>
                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">[NOT_FOLLOWING_ANYONE]</p>
              </div>
            ) : (
              followedArtists.map((artist, idx) => (
                <ArtistCardView key={idx} name={artist.artist_name} image={artist.artist_image} />
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfilePage;