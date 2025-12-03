"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, User, ChevronRight, ChevronLeft, Music, Users, TrendingUp, Heart, Crown } from "lucide-react";
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer";
import { DecoderText } from "@/components/CyberComponents";

const TrendingHero = ({ songs, artists }) => { 
  const player = usePlayer();
  
  const [activeTab, setActiveTab] = useState('songs'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Dữ liệu hiển thị
  const activeSong = songs && songs.length > 0 ? songs[currentIndex] : null;
  // Sắp xếp nghệ sĩ theo followers (giả lập hoặc có sẵn) để hiển thị bảng xếp hạng
  const topArtists = (artists || []).slice(0, 5); // Lấy top 5 để vừa khung height

  // Reset index khi đổi tab
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  // Auto slide cho SONGS (Artists thì đứng yên là bảng xếp hạng)
  useEffect(() => {
    if (activeTab === 'artists' || isHovered || !songs || songs.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isHovered, activeTab, songs]);

  const nextSlide = () => {
    if (!songs?.length) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  };

  const prevSlide = () => {
    if (!songs?.length) return;
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  };

  const handlePlay = () => {
    if (activeTab !== 'songs' || !activeSong) return;
    
    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
    player.setId(activeSong.id);
    player.setIds(songs.map(s => s.id));
  };

  return (
    <div 
        className="relative w-full h-[320px] md:h-[350px] rounded-2xl overflow-hidden mb-8 group transition-all duration-500 shadow-2xl border border-neutral-200 dark:border-white/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. BACKGROUND (Dynamic) */}
      <div className="absolute inset-0 z-0">
         {/* Nếu là Tab Song: Hiện ảnh bài hát hiện tại. Nếu Tab Artist: Hiện ảnh Top 1 Artist hoặc hình chung */}
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
         
         {/* Decor Grid */}
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
                <div className="hidden md:block relative w-[200px] h-[200px] shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-105 transition-transform duration-500">
                    <Image 
                        src={activeSong.image_path || activeSong.image_url || '/images/music-placeholder.png'} 
                        alt={activeSong.title} 
                        fill 
                        className="object-cover"
                    />
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={handlePlay} className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                            <Play size={20} fill="currentColor" className="ml-1"/>
                        </button>
                    </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 flex flex-col justify-center max-w-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono rounded-full animate-pulse flex items-center gap-1">
                            <ActivityIcon /> NOW_TRENDING
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">#{currentIndex + 1}</span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-black font-mono text-neutral-900 dark:text-white mb-2 tracking-tighter drop-shadow-sm line-clamp-2 leading-tight">
                        <DecoderText text={activeSong.title} />
                    </h1>
                    
                    <Link href={`/artist/${encodeURIComponent(activeSong.author)}`} className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 font-mono mb-6 flex items-center gap-2 hover:text-emerald-500 transition-colors w-fit">
                        <User size={16}/> {activeSong.author}
                    </Link>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePlay} 
                            className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold font-mono text-xs shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Play size={16} fill="currentColor" /> LISTEN_NOW
                        </button>
                        <button className="px-4 py-3 rounded-full border border-neutral-300 dark:border-white/20 hover:bg-neutral-100 dark:hover:bg-white/10 transition">
                            <Heart size={16} className="text-neutral-500 dark:text-neutral-400"/>
                        </button>
                    </div>
                </div>
             </div>
          )}

          {/* === MODE: ARTISTS (LEADERBOARD TABLE) === */}
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

                {/* BẢNG XẾP HẠNG (Style từ Admin Dashboard nhưng đẹp hơn) */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        {/* Top 1 Big Card (Mobile ẩn, hiện trên Desktop) */}
                        {topArtists[0] && (
                            // BỌC THẺ LINK Ở ĐÂY
                            <Link href={`/artist/${encodeURIComponent(topArtists[0].name)}`} className="hidden md:block h-full">
                                <div className="relative h-full rounded-xl overflow-hidden group/card cursor-pointer border border-neutral-200 dark:border-white/10 shadow-lg">
                                    <Image 
                                        src={topArtists[0].image_url || '/images/music-placeholder.png'} 
                                        alt="top1" 
                                        fill 
                                        className="object-cover group-hover/card:scale-110 transition duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                    
                                    {/* Nội dung bên trong Top 1 Card */}
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
                                    
                                    {/* Hiệu ứng hover icon (Optional) */}
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity">
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
                                                  index === 1 ? 'text-neutral-400 text-base' : 
                                                  index === 2 ? 'text-orange-700 dark:text-orange-600 text-base' : 'text-neutral-500'}
                                            `}>
                                                #{index + 1}
                                            </span>
                                            
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
                                                <Image src={artist.image_url || '/images/music-placeholder.png'} alt={artist.name} fill className="object-cover"/>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate max-w-[120px] group-hover/row:text-emerald-500 transition-colors">
                                                    {artist.name}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                                                    {artist.followers || 0} followers
                                                </span>
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

      {/* 4. NÚT ĐIỀU HƯỚNG (Chỉ hiện ở Tab Songs) */}
      {activeTab === 'songs' && (
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300 z-30 pointer-events-auto">
            <button onClick={prevSlide} className="p-3 rounded-full bg-white/10 dark:bg-black/20 hover:bg-emerald-500 hover:text-white border border-white/10 backdrop-blur-md transition text-neutral-800 dark:text-white cursor-pointer shadow-lg">
                <ChevronLeft size={16}/>
            </button>
            <button onClick={nextSlide} className="p-3 rounded-full bg-white/10 dark:bg-black/20 hover:bg-emerald-500 hover:text-white border border-white/10 backdrop-blur-md transition text-neutral-800 dark:text-white cursor-pointer shadow-lg">
                <ChevronRight size={16}/>
            </button>
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