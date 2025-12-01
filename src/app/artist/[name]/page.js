"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ListMusic, User, Play, Loader2, Heart, Calendar, Library, Mic2, Disc, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import getSongs from "@/app/actions/getSongs";
import getAlbums from "@/app/actions/getAlbums";
import SongSection from "@/components/SongSection";
import FollowButton from "@/components/FollowButton";
// IMPORT: Thêm ScanlineOverlay
import { DecoderText, GlitchText, ScanlineOverlay } from "@/components/CyberComponents";

// --- ALBUM CARD (ĐÃ THÊM SCANLINE OVERLAY) ---
const AlbumCard = ({ album }) => (
  <Link 
    href={`/album/${album.id}`} 
    className="group relative flex flex-col gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 bg-white/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 backdrop-blur-md hover:bg-white/90 dark:hover:bg-neutral-800/60 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
  >
      {/* Container Ảnh */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-neutral-200 dark:border-white/5">
          
          <Image 
            src={album.image} 
            alt={album.name} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* --- HIỆU ỨNG SCANLINE (Mới thêm) --- */}
          {/* Chỉ hiện khi hover, nằm đè lên ảnh */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
             <ScanlineOverlay />
          </div>

          {/* Overlay tối màu + Nút Play */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
             <div className="bg-emerald-500 p-3 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                 <Play size={20} fill="black" className="text-black ml-1" />
             </div>
          </div>
      </div>

      <div>
          <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {album.name}
          </h3>
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1">
            <Calendar size={12}/> {album.release_date}
          </p>
      </div>
  </Link>
);

const ArtistPage = ({ params }) => {
  const router = useRouter();
  const [data, setData] = useState({ songs: [], albums: [] });
  const [artistName, setArtistName] = useState("");
  const [activeTab, setActiveTab] = useState('songs'); 
  const [loading, setLoading] = useState(true);

  const [followersCount, setFollowersCount] = useState(0);
  const [totalPlays, setTotalPlays] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const resolvedParams = await params;
            const name = decodeURIComponent(resolvedParams.name);
            setArtistName(name);

            const [songsData, albumsData] = await Promise.all([
                getSongs({ artist: name, limit: 20 }),
                getAlbums(name)
            ]);
            
            setData({ 
                songs: songsData.songs || [], 
                albums: albumsData || []
            });

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

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-100 dark:bg-black transition-colors">
        <Loader2 className="animate-spin text-emerald-500" size={32} /> 
        <DecoderText text="LOADING_ARTIST_DATA..." className="text-xs text-emerald-500 tracking-widest"/>
    </div>
  );

  if (!artistName) return null;

  return (
    <div className="w-full flex flex-col gap-8 p-6 pb-[120px] bg-neutral-100 dark:bg-black min-h-screen transition-colors duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-end gap-8 pb-8 border-b border-neutral-200 dark:border-white/10 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="w-48 h-48 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center border-4 border-white dark:border-neutral-700 shadow-2xl shrink-0 overflow-hidden relative group">
             {data.albums.length > 0 ? (
                 <Image src={data.albums[0].image} alt={artistName} width={192} height={192} className="object-cover w-full h-full opacity-90 group-hover:scale-110 transition duration-700"/>
             ) : (
                 <User size={80} className="text-emerald-500" />
             )}
             {/* Scanline cho Avatar luôn */}
             <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none z-10 rounded-full overflow-hidden">
                <ScanlineOverlay />
             </div>
         </div>

         <div className="flex-1 mb-2 flex flex-col items-start">
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.5em] uppercase mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                :: ARTIST_PROFILE ::
            </p>
            <h1 className="text-4xl md:text-7xl font-bold font-mono text-neutral-900 dark:text-white tracking-tighter drop-shadow-lg break-words mb-4">
                <GlitchText text={artistName} />
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 w-full mb-4">
                <div className="flex items-center gap-6 text-sm font-mono text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-2" title="Followers"><Users size={16} className="text-blue-500"/> {followersCount.toLocaleString()} Followers</span>
                    <span className="flex items-center gap-2" title="Plays"><Play size={16} className="text-emerald-500"/> {totalPlays.toLocaleString()} Plays</span>
                    <span className="flex items-center gap-2"><Disc size={16}/> {data.songs.length} Tracks</span>
                    <span className="flex items-center gap-2"><Library size={16}/> {data.albums.length} Albums</span>
                </div>
            </div>

            {/* NÚT FOLLOW */}
            <FollowButton 
                artistName={artistName} 
                artistImage={data.albums.length > 0 ? data.albums[0].image : null}
                onFollowChange={(isFollowing) => {
                    setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
                }}
            />
         </div>
      </div>

      {/* TABS & CONTENT */}
      <div className="flex items-center gap-8 border-b border-neutral-200 dark:border-white/5">
          <button onClick={() => setActiveTab('songs')} className={`pb-4 text-sm font-bold font-mono transition-all flex items-center gap-2 border-b-2 ${activeTab === 'songs' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-neutral-800 dark:hover:text-white'}`}><Mic2 size={16}/> POPULAR SONGS</button>
          <button onClick={() => setActiveTab('albums')} className={`pb-4 text-sm font-bold font-mono transition-all flex items-center gap-2 border-b-2 ${activeTab === 'albums' ? 'text-emerald-600 dark:text-emerald-500 border-emerald-500' : 'text-neutral-500 border-transparent hover:text-neutral-800 dark:hover:text-white'}`}><Library size={16}/> ALBUMS ({data.albums.length})</button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'songs' && (
            data.songs.length > 0 ? <SongSection title="" songs={data.songs} /> : <div className="py-20 text-center text-neutral-500 font-mono">[NO_TRACKS_AVAILABLE]</div>
        )}
        {activeTab === 'albums' && (
            data.albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {data.albums.map((album) => <AlbumCard key={album.id} album={album} />)}
                </div>
            ) : <div className="py-20 text-center text-neutral-500 font-mono">[NO_ALBUMS_FOUND]</div>
        )}
      </div>

    </div>
  );
};

export default ArtistPage;