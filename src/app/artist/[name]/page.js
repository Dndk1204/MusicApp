"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
// Thêm icon ArrowLeft
import { Music, User, Play, Calendar, Library, Mic2, Disc, Users, BarChart3, Globe, Database, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import getAlbums from "@/app/actions/getAlbums";
import SongSection from "@/components/SongSection";
import FollowButton from "@/components/FollowButton";
import { GlitchText, CyberCard, ScanlineOverlay, DiagonalGlitchText, VerticalGlitchText } from "@/components/CyberComponents";

// --- SKELETON LOADER (Giữ nguyên) ---
const ArtistSkeleton = () => (
  <div className="w-full h-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
    <div className="flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-neutral-300 dark:border-white/10 mt-4">
        <div className="w-48 h-48 bg-neutral-300 dark:bg-neutral-800 shrink-0 border-2 border-dashed border-neutral-400 dark:border-white/20"></div>
        <div className="flex-1 w-full flex flex-col gap-4">
            <div className="h-4 w-32 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
            <div className="h-16 w-3/4 md:w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
            <div className="flex gap-6 mt-2">
                <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
            </div>
            <div className="h-10 w-32 bg-neutral-300 dark:bg-neutral-800 rounded-none mt-2"></div>
        </div>
    </div>
    <div className="flex gap-8 mb-8 mt-6 border-b border-neutral-200 dark:border-white/10 pb-4">
        <div className="h-6 w-32 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
        <div className="h-6 w-32 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[1,2,3,4].map(i => <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10"></div>)}
    </div>
  </div>
);

// --- ALBUM CARD (Giữ nguyên) ---
const AlbumCard = ({ album }) => (
  <Link href={`/album/${album.id}`}>
    <CyberCard className="group relative flex flex-col gap-0 p-0 rounded-none cursor-pointer transition-all duration-300 bg-white dark:bg-neutral-900/40 border border-neutral-300 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] h-full overflow-hidden">
        <div className="relative w-full aspect-square overflow-hidden border-b border-neutral-300 dark:border-white/10 group/img bg-neutral-200 dark:bg-neutral-800">
            <Image 
                src={album.image} 
                alt={album.name} 
                fill 
                className="object-cover transition-all duration-700 grayscale blur-0 group-hover:grayscale-0 group-hover/img:scale-110"
            />
            <ScanlineOverlay />
            <div className="absolute top-0 right-0 p-1 bg-black/80 text-[8px] font-mono text-emerald-500 border-l border-b border-emerald-500/50 z-20">ALBUM_REF</div>
            <div className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 bg-black/40 opacity-0 group-hover/img:opacity-100 backdrop-blur-none group-hover/img:backdrop-blur-[2px]">
                 <div className="bg-emerald-500 p-3 shadow-[0_0_15px_rgba(16,185,129,0.5)] transform scale-50 group-hover/img:scale-100 transition-transform duration-300 border border-emerald-400 rounded-none">
                     <Play size={20} fill="black" className="text-black ml-1" />
                 </div>
            </div>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-white/50 dark:bg-transparent">
            <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {album.name}
            </h3>
            <div className="flex items-center justify-between border-t border-dashed border-neutral-300 dark:border-white/10 pt-2 mt-1">
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={10}/> {album.release_date.split('-')[0]}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">ID_{album.id.toString().slice(0,4)}</span>
            </div>
        </div>
    </CyberCard>
  </Link>
);

const ArtistPage = ({ params }) => {
  const router = useRouter();
  
  const [localSongs, setLocalSongs] = useState([]);
  const [jamendoSongs, setJamendoSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  
  const [artistName, setArtistName] = useState("");
  const [activeTab, setActiveTab] = useState('songs'); 
  const [loading, setLoading] = useState(true);
  
  const [sourceFilter, setSourceFilter] = useState('all');
  const [followersCount, setFollowersCount] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);
  const [artistImage, setArtistImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const resolvedParams = await params;
            const rawName = decodeURIComponent(resolvedParams.name);
            const name = rawName.trim();
            setArtistName(name);

            // 1. FETCH LOCAL SONGS
            const { data: localData, error: localError } = await supabase
                .from('songs')
                .select('*') 
                .ilike('author', name) 
                .not('user_id', 'is', null)
                .order('created_at', { ascending: false });

            const formattedLocalSongs = (localData || []).map(song => ({
                ...song,
                source_type: 'local', 
                song_path: song.song_url,
                image_path: song.image_url
            }));
            setLocalSongs(formattedLocalSongs);

            // 2. FIND AVATAR FROM LOCAL PROFILE
            if (formattedLocalSongs.length > 0) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .or(`full_name.ilike."${name}",username.ilike."${name}"`)
                    .limit(1)
                    .maybeSingle();
                
                if (profileData?.avatar_url) {
                    setArtistImage(profileData.avatar_url);
                }
            }

            // 3. FETCH JAMENDO SONGS
            const CLIENT_ID = '3501caaa';
            const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&artist_name=${encodeURIComponent(name)}&limit=20&include=musicinfo&audioformat=mp31`);
            const json = await res.json();
            
            let formattedJamendoSongs = [];
            let jamendoImageCandidate = null;

            if (json.results) {
                formattedJamendoSongs = json.results.map(track => ({
                    id: track.id,
                    title: track.name,
                    author: track.artist_name,
                    song_path: track.audio,
                    image_path: track.image || track.album_image,
                    duration: track.duration,
                    source_type: 'jamendo'
                }));

                if (formattedJamendoSongs.length > 0) {
                    jamendoImageCandidate = formattedJamendoSongs[0].image_path;
                }
            }
            setJamendoSongs(formattedJamendoSongs);

            // DECIDE FINAL IMAGE
            setArtistImage(prev => prev || jamendoImageCandidate);

            // 4. FETCH ALBUMS
            const albumsData = await getAlbums(name);
            setAlbums(albumsData || []);

            // 5. COUNTS
            const { count: followCount } = await supabase
                .from('following_artists')
                .select('*', { count: 'exact', head: true })
                .eq('artist_name', name);
            setFollowersCount(followCount || 0);

            const { data: playsData } = await supabase
                .from('songs')
                .select('play_count')
                .eq('author', name);
            
            if (playsData) {
                const total = playsData.reduce((sum, song) => sum + (song.play_count || 0), 0);
                setTotalPlays(total);
            }

        } catch (error) {
            console.error("Lỗi tải trang Artist:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [params]);

  const getDisplaySongs = () => {
      if (sourceFilter === 'local') return localSongs;
      if (sourceFilter === 'jamendo') return jamendoSongs;
      return [...localSongs, ...jamendoSongs];
  };

  const displaySongs = getDisplaySongs();
  const totalTracksCount = localSongs.length + jamendoSongs.length;

  if (loading) return <ArtistSkeleton />;
  if (!artistName) return null;

  return (
    <div className="w-full flex flex-col gap-8 p-6 pb-[120px] bg-neutral-100 dark:bg-black min-h-screen transition-colors duration-500">
      
      {/* --- NÚT QUAY LẠI (MỚI THÊM) --- */}
      <button 
        onClick={() => router.back()} 
        className="group w-fit flex items-center gap-2 px-2 py-2 bg-black/50 hover:!bg-emerald-500 hover:!text-white text-white border border-white/20 border-neutral-300 dark:border-white/10 hover:border-emerald-500 dark:text-neutral-400 transition-all uppercase text-xs font-mono font-bold tracking-widest"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
      </button>

      {/* HEADER SECTION (Giữ nguyên) */}
      <div className="flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-neutral-300 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="w-48 h-48 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border-2 border-neutral-400 dark:border-white/20 shadow-2xl shrink-0 overflow-hidden relative group rounded-none">
             {artistImage ? (
                 <Image 
                    src={artistImage} 
                    alt={artistName} 
                    width={192} height={192} 
                    className="object-cover w-full h-full opacity-90 grayscale group-hover:grayscale-0 group-hover:scale-110 transition duration-700"
                 />
             ) : (
                 <User size={80} className="text-neutral-400 dark:text-neutral-600" />
             )}
             <ScanlineOverlay />
             <div className="absolute top-0 left-0 w-2 h-2 bg-emerald-500 z-20"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 z-20"></div>
         </div>

         <div className="flex-1 mb-1 flex flex-col items-start w-full">
            <div className="flex items-center gap-2 mb-2 w-full border-b border-dashed border-neutral-300 dark:border-white/10 pb-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none"></span>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.5em] uppercase font-bold">
                    :: ARTIST_PROFILE ::
                </p>
            </div>

            <h1 className="text-4xl md:text-7xl font-black font-mono text-neutral-900 dark:text-white tracking-tighter drop-shadow-sm break-words mb-4 leading-none">
                <VerticalGlitchText text={artistName} />
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 w-full mb-6 p-3 bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10">
                <div className="flex items-center gap-6 text-xs font-mono text-neutral-600 dark:text-neutral-300 uppercase tracking-wide flex-wrap">
                    <span className="flex items-center gap-2" title="Followers">
                        <Users size={14} className="text-blue-500"/> 
                        <span className="font-bold">{followersCount.toLocaleString()}</span> FOLLOWERS
                    </span>
                    <div className="w-px h-3 bg-neutral-400 dark:bg-white/20"></div>
                    <span className="flex items-center gap-2" title="Plays">
                        <BarChart3 size={14} className="text-emerald-500"/> 
                        <span className="font-bold">{totalPlays.toLocaleString()}</span> PLAYS
                    </span>
                    <div className="w-px h-3 bg-neutral-400 dark:bg-white/20 hidden md:block"></div>
                    
                    <span className="flex items-center gap-2" title="Total Tracks">
                        <Disc size={14} className="text-purple-500"/> 
                        <span className="font-bold">{totalTracksCount}</span> TRACKS
                    </span>
                    <div className="w-px h-3 bg-neutral-400 dark:bg-white/20"></div>
                    <span className="flex items-center gap-2" title="Total Albums">
                        <Library size={14} className="text-orange-500"/> 
                        <span className="font-bold">{albums.length}</span> ALBUMS
                    </span>

                    <div className="w-px h-3 bg-neutral-400 dark:bg-white/20 hidden md:block"></div>
                    
                    {localSongs.length > 0 && (
                        <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400" title="Community Uploads">
                            <Database size={12}/> {localSongs.length} LOC
                        </span>
                    )}
                    {jamendoSongs.length > 0 && (
                        <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400" title="Global Network">
                            <Globe size={12}/> {jamendoSongs.length} WEB
                        </span>
                    )}
                </div>
            </div>

            <FollowButton 
                artistName={artistName} 
                artistImage={artistImage}
                onFollowChange={(isFollowing) => {
                    setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
                }}
            />
         </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-0 border-b-2 border-neutral-300 dark:border-white/10 mb-6">
          <button onClick={() => setActiveTab('songs')} className={`px-6 py-3 text-xs font-bold font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 relative ${activeTab === 'songs' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'}`}>
            <Mic2 size={14}/> TRACKS
            {activeTab === 'songs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 translate-y-full"></div>}
          </button>
          
          <button onClick={() => setActiveTab('albums')} className={`px-6 py-3 text-xs font-bold font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 relative ${activeTab === 'albums' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'}`}>
            <Library size={14}/> ALBUMS <span className="opacity-50">[{albums.length}]</span>
            {activeTab === 'albums' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 translate-y-full"></div>}
          </button>
      </div>

      {/* CONTENT */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[300px]">
        
        {activeTab === 'songs' && (
            <>
                {/* SOURCE FILTER */}
                {(localSongs.length > 0 && jamendoSongs.length > 0) && (
                    <div className="flex items-center gap-2 mb-4 text-xs font-mono">
                        <span className="text-neutral-500 mr-2 uppercase tracking-widest">:: SOURCE_FILTER ::</span>
                        <button 
                            onClick={() => setSourceFilter('all')}
                            className={`px-3 py-1 border ${sourceFilter === 'all' ? 'bg-neutral-800 text-white border-neutral-800' : 'text-neutral-500 border-neutral-300 dark:border-white/20 hover:border-neutral-500'}`}
                        >
                            ALL
                        </button>
                        <button 
                            onClick={() => setSourceFilter('local')}
                            className={`px-3 py-1 border flex items-center gap-2 ${sourceFilter === 'local' ? 'bg-purple-600 text-white border-purple-600' : 'text-purple-600 dark:text-purple-400 border-neutral-300 dark:border-white/20 hover:border-purple-500'}`}
                        >
                            <Database size={12}/> COMMUNITY
                        </button>
                        <button 
                            onClick={() => setSourceFilter('jamendo')}
                            className={`px-3 py-1 border flex items-center gap-2 ${sourceFilter === 'jamendo' ? 'bg-orange-600 text-white border-orange-600' : 'text-orange-600 dark:text-orange-400 border-neutral-300 dark:border-white/20 hover:border-orange-500'}`}
                        >
                            <Globe size={12}/> NETWORK
                        </button>
                    </div>
                )}

                {displaySongs.length > 0 ? (
                    <SongSection title="" songs={displaySongs} /> 
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 border border-dashed border-neutral-300 dark:border-white/10">
                        <Music size={40} className="text-neutral-400"/>
                        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">[NO_TRACKS_AVAILABLE]</p>
                    </div>
                )}
            </>
        )}
        
        {activeTab === 'albums' && (
            albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {albums.map((album) => <AlbumCard key={album.id} album={album} />)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 border border-dashed border-neutral-300 dark:border-white/10">
                    <Disc size={40} className="text-neutral-400"/>
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">[NO_ALBUMS_FOUND]</p>
                </div>
            )
        )}
      </div>

    </div>
  );
};

export default ArtistPage;