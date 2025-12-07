"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, User, ChevronRight, ChevronLeft, Music, Users, TrendingUp, Crown, BarChart3 } from "lucide-react";
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer";
import { DecoderText } from "@/components/CyberComponents";
import { supabase } from "@/lib/supabaseClient";

const TrendingHero = ({ songs: initialSongs, artists: initialArtists }) => { 
  const player = usePlayer();
  
  const [activeTab, setActiveTab] = useState('songs'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const [artistsData, setArtistsData] = useState(initialArtists || []);
  const [trendingSongs, setTrendingSongs] = useState(initialSongs || []);

  // --- LOGIC FETCH DỮ LIỆU TỪ SUPABASE ---
  useEffect(() => {
      const fetchFreshData = async () => {
          try {
            // 1. LẤY TOP SONGS
            const { data: topSongsDB } = await supabase
                .from('songs')
                .select('*')
                .order('play_count', { ascending: false })
                .limit(10);

            if (topSongsDB && topSongsDB.length > 0) {
                setTrendingSongs(topSongsDB);
            }

            // 2. TÍNH TOÁN TOP ARTISTS
            const { data: allSongStats } = await supabase.from('songs').select('author, play_count');
            const { data: allFollows } = await supabase.from('following_artists').select('artist_name, artist_image');

            const statsMap = {};

            if (allSongStats) {
                allSongStats.forEach(song => {
                    if (!song.author) return;
                    const key = song.author.trim().toLowerCase();
                    if (!statsMap[key]) {
                        statsMap[key] = { name: song.author, originalName: song.author, image_url: null, followers: 0, total_plays: 0 };
                    }
                    statsMap[key].total_plays += (song.play_count || 0);
                });
            }

            if (allFollows) {
                allFollows.forEach(item => {
                    const key = item.artist_name.trim().toLowerCase();
                    if (!statsMap[key]) {
                        statsMap[key] = { name: item.artist_name, originalName: item.artist_name, image_url: item.artist_image, followers: 0, total_plays: 0 };
                    }
                    statsMap[key].followers += 1;
                    if (!statsMap[key].image_url) statsMap[key].image_url = item.artist_image;
                });
            }

            const rankedArtists = Object.values(statsMap)
                .sort((a, b) => {
                    if (b.followers !== a.followers) return b.followers - a.followers;
                    return b.total_plays - a.total_plays;
                })
                .slice(0, 5);

            const formatVal = (num) => {
                if (!num) return "0";
                if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
                if (num >= 1000) return (num / 1000).toFixed(1) + "K";
                return num.toString();
            };

            const finalArtistsData = rankedArtists.map(a => ({
                ...a,
                followers: formatVal(a.followers),
                total_plays: formatVal(a.total_plays)
            }));

            setArtistsData(finalArtistsData);

          } catch (error) {
              console.error("Failed to update trending stats:", error);
          }
      };

      fetchFreshData();
      const interval = setInterval(fetchFreshData, 30000);
      return () => clearInterval(interval);

  }, []);

  const topArtists = artistsData;
  const activeSong = trendingSongs && trendingSongs.length > 0 ? trendingSongs[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'artists' || isHovered || !trendingSongs || trendingSongs.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isHovered, activeTab, trendingSongs?.length]);

  const nextSlide = () => {
    if (!trendingSongs?.length) return;
    setCurrentIndex((prev) => (prev + 1) % trendingSongs.length);
  };

  const prevSlide = () => {
    if (!trendingSongs?.length) return;
    setCurrentIndex((prev) => (prev - 1 + trendingSongs.length) % trendingSongs.length);
  };

  const handlePlay = () => {
    if (activeTab !== 'songs' || !activeSong) return;
    if (typeof window !== "undefined") {
        const songMap = {};
        trendingSongs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
    player.setId(activeSong.id);
    player.setIds(trendingSongs.map(s => s.id));
  };

  return (
    <div 
        className="relative w-full h-[320px] md:h-[350px] rounded-2xl overflow-hidden mb-8 group transition-all duration-500 shadow-2xl border border-neutral-200 dark:border-white/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
         {/* Background Image Logic: Fallback to placeholder if url missing */}
         <Image 
            src={
                activeTab === 'songs' 
                ? (activeSong?.image_path || activeSong?.image_url || '/images/music-placeholder.png')
                : (topArtists[0]?.image_url || '/images/music-placeholder.png')
            } 
            alt="bg" 
            fill 
            className="object-cover blur-3xl opacity-60 dark:opacity-40 scale-125 transition-all duration-1000"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40 dark:from-black/95 dark:via-black/80 dark:to-transparent"></div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* 2. TAB SWITCHER */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-1 bg-white/40 dark:bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-sm">
          <button 
            onClick={() => setActiveTab('songs')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'songs' ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
          >
            <Music size={12}/> TRENDING SONGS
          </button>
          <button 
            onClick={() => setActiveTab('artists')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'artists' ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
          >
            <TrendingUp size={12}/> TOP CHART ARTISTS
          </button>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="absolute inset-0 z-20 px-6 md:px-10 pt-16 pb-6">
          
          {/* === MODE: SONGS (SLIDESHOW) === */}
          {activeTab === 'songs' && activeSong && (
             <div className="flex h-full items-center gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Image Card */}
                <div className="hidden md:block relative w-[200px] h-[200px] shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-105 transition-transform duration-500 bg-neutral-200 dark:bg-neutral-800">
                     {/* Song Image or Fallback */}
                    {activeSong.image_path || activeSong.image_url ? (
                        <Image 
                            src={activeSong.image_path || activeSong.image_url} 
                            alt={activeSong.title} 
                            fill 
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Music size={64} className="text-neutral-400 dark:text-neutral-600 opacity-50"/>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={handlePlay} className="w-12 h-12 translate-x-[70px] translate-y-[70px] rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                            <Play size={20} fill="currentColor" className="ml-1"/>
                        </button>
                    </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 flex flex-col justify-center max-w-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        {/* BADGE 1: Trending */}
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono rounded-full animate-pulse flex items-center gap-1">
                            <ActivityIcon /> NOW_TRENDING
                        </span>

                        {/* BADGE 2: Play Count */}
                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-white/10 border border-neutral-300 dark:border-white/20 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold font-mono rounded-full flex items-center gap-1">
                             <BarChart3 size={10} /> {activeSong.play_count || 0} PLAYS
                        </span>

                        {/* BADGE 3: Index */}
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">#{currentIndex + 1}</span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-black font-mono text-neutral-900 dark:text-white mb-2 tracking-tighter drop-shadow-sm line-clamp-2 leading-tight">
                        <DecoderText text={activeSong.title} />
                    </h1>
                    
                    <Link 
                        href={`/artist/${encodeURIComponent(activeSong.author)}`}
                        onClick={(e) => e.stopPropagation()} 
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors flex text-sm md:text-base font-mono mb-6 items-center gap-2 w-fit"
                    >
                        <User size={16}/> {activeSong.author}
                    </Link>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePlay} 
                            className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold font-mono text-xs shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Play size={16} fill="currentColor" /> LISTEN_NOW
                        </button>
                    </div>
                </div>
             </div>
          )}

          {/* === MODE: ARTISTS (LEADERBOARD) === */}
          {activeTab === 'artists' && (
             <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2">
                        <Crown size={24} className="text-yellow-500" fill="currentColor"/> 
                        <DecoderText text="ARTIST_LEADERBOARD" />
                    </h2>
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-white/20 px-2 py-1 rounded">
                        UPDATED_LIVE
                    </span>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        {/* Top 1 Card */}
                        {topArtists[0] && (
                            <Link href={`/artist/${encodeURIComponent(topArtists[0].name)}`} className="hidden md:block h-full">
                                <div className="relative h-full rounded-xl overflow-hidden group/card cursor-pointer border border-neutral-200 dark:border-white/10 shadow-lg bg-neutral-100 dark:bg-neutral-800">
                                    {/* -- UPDATE: Check Image URL for Top Artist -- */}
                                    {topArtists[0].image_url ? (
                                        <Image 
                                            src={topArtists[0].image_url} 
                                            alt="top1" 
                                            fill 
                                            className="object-cover group-hover/card:scale-110 transition duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User size={80} className="text-neutral-400 dark:text-neutral-600 opacity-50" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-5 w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-yellow-500 text-black font-bold text-[10px] px-2 py-0.5 rounded font-mono animate-pulse">#1 RANKING</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white font-mono mb-1 group-hover/card:text-emerald-400 transition-colors">
                                            {topArtists[0].name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs font-mono text-neutral-300">
                                            <span className="flex items-center gap-1"><Users size={12}/> {topArtists[0].followers || '0'} Followers</span>
                                            <span className="flex items-center gap-1"><Play size={12}/> {topArtists[0].total_plays || '0'} Plays</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-emerald-400 backdrop-blur-md p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        <ChevronRight size={20} className="text-white" />
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* List Top 5 */}
                        <div className="flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar pr-2">
                            {topArtists.map((artist, index) => (
                                <Link href={`/artist/${encodeURIComponent(artist.name)}`} key={index} className="group/row">
                                    <div className={`
                                        flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer
                                        ${index === 0 ? 'md:hidden bg-yellow-500/10 border-yellow-500/30' : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-200 dark:border-white/5 hover:bg-white/80 dark:hover:bg-neutral-800'}
                                    `}>
                                        <div className="flex items-center gap-4">
                                            <span className={`
                                                font-mono font-bold text-sm w-6 text-center
                                                ${index === 0 ? 'text-yellow-600 dark:text-yellow-500 text-lg' : 
                                                  index === 1 ? 'text-neutral-400 text-base' : 'text-neutral-500'}
                                            `}>#{index + 1}</span>
                                            
                                            {/* -- UPDATE: Check Image URL for List Item -- */}
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                                                {artist.image_url ? (
                                                    <Image src={artist.image_url} alt={artist.name} fill className="object-cover"/>
                                                ) : (
                                                    <User size={18} className="text-neutral-500 dark:text-neutral-400"/>
                                                )}
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate max-w-[120px] group-hover/row:text-emerald-500 transition-colors">
                                                    {artist.name}
                                                </span>
                                                <div className="flex">
                                                    <span className="flex text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                                                        {artist.followers || 0} followers
                                                    </span>
                                                    <span className="flex pl-2 text-[10px] text-emerald-600 dark:text-emerald-500 font-mono">
                                                        {artist.total_plays || 0} plays
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-neutral-200 dark:bg-white/10 p-1.5 rounded-full group-hover/row:bg-emerald-500 group-hover/row:text-white transition-colors">
                                                <ChevronRight size={14}/>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
          )}
      </div>

      {/* 4. NÚT ĐIỀU HƯỚNG */}
      {activeTab === 'songs' && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300 z-30 pointer-events-auto">
            <button onClick={prevSlide} className="p-3 rounded-full bg-white/10 dark:bg-black/20 hover:!bg-emerald-500 hover:text-white border border-white/10 backdrop-blur-md transition text-neutral-800 dark:text-white cursor-pointer shadow-lg"><ChevronLeft size={16}/></button>
            <button onClick={nextSlide} className="p-3 rounded-full bg-white/10 dark:bg-black/20 hover:!bg-emerald-500 hover:text-white border border-white/10 backdrop-blur-md transition text-neutral-800 dark:text-white cursor-pointer shadow-lg"><ChevronRight size={16}/></button>
          </div>
      )}

    </div>
  );
};

// Helper Icon
const ActivityIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);

export default TrendingHero;