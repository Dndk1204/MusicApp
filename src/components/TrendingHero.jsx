"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, User, ChevronRight, ChevronLeft, Music, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer";
// Chỉ giữ lại DecoderText, bỏ HoloButton
import { DecoderText } from "@/components/CyberComponents";

const TrendingHero = ({ songs, artists }) => { 
  const player = usePlayer();
  
  const [activeTab, setActiveTab] = useState('songs'); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const currentList = activeTab === 'songs' ? (songs || []) : (artists || []);
  const activeItem = currentList.length > 0 ? currentList[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  useEffect(() => {
    if (isHovered || !currentList.length) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentIndex, isHovered, activeTab]);

  const nextSlide = () => {
    if (currentList.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % currentList.length);
  };

  const prevSlide = () => {
    if (currentList.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + currentList.length) % currentList.length);
  };

  const handlePlay = () => {
    if (activeTab !== 'songs' || !activeItem) return;
    
    if (typeof window !== "undefined") {
        const songMap = {};
        songs.forEach(song => songMap[song.id] = song);
        window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
    player.setId(activeItem.id);
    player.setIds(songs.map(s => s.id));
  };

  if (!activeItem) return null;

  return (
    <div 
        className="relative w-full h-[280px] md:h-[320px] rounded-2xl overflow-hidden mb-8 group transition-all duration-500 shadow-xl border border-neutral-200 dark:border-white/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <Image 
            src={activeItem.image_path || activeItem.image_url || '/images/music-placeholder.png'} 
            alt="bg" 
            fill 
            className="object-cover blur-2xl opacity-50 dark:opacity-30 scale-110 transition-all duration-1000"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent dark:from-black/95 dark:via-black/70 dark:to-transparent"></div>
      </div>

      {/* 2. TAB SWITCHER */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-1 bg-white/20 dark:bg-black/30 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-sm">
          <button 
            onClick={() => setActiveTab('songs')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'songs' ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
          >
            <Music size={12}/> POPULAR SONGS
          </button>
          <button 
            onClick={() => setActiveTab('artists')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'artists' ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-md' : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
          >
            <User size={12}/> TOP ARTISTS
          </button>
      </div>

      {/* 3. CONTENT */}
      <div className="absolute inset-0 flex items-center px-6 md:px-10 gap-6 md:gap-10 pt-10 z-20 pointer-events-none">
          
          <div className="hidden md:block relative w-[180px] h-[180px] shrink-0 rounded-xl overflow-hidden shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-white/20 bg-neutral-800 pointer-events-auto">
            <Image 
                src={activeItem.image_path || activeItem.image_url || '/images/music-placeholder.png'} 
                alt={activeItem.title || activeItem.name} 
                fill 
                className="object-cover"
            />
          </div>

          <div key={`${activeTab}-${activeItem.id || activeItem.name}`} className="flex-1 flex flex-col items-start justify-center animate-in slide-in-from-right-10 duration-500 pointer-events-auto">
            
            {activeTab === 'songs' && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-bold font-mono rounded-full animate-pulse">#TRENDING_TRACK</span>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">{currentIndex + 1} / {currentList.length}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-mono text-neutral-900 dark:text-white mb-2 tracking-tighter drop-shadow-sm line-clamp-1">
                        <DecoderText text={activeItem.title} />
                    </h1>
                    <Link href={`/artist/${encodeURIComponent(activeItem.author)}`} className="text-sm text-emerald-600 dark:text-emerald-400 font-mono mb-5 flex items-center gap-2 hover:underline cursor-pointer w-fit pointer-events-auto">
                        <User size={14}/> {activeItem.author}
                    </Link>
                    
                    {/* BUTTON CŨ (STANDARD) - CHẮC CHẮN HOẠT ĐỘNG */}
                    <button 
                        onClick={handlePlay} 
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-full font-bold font-mono text-xs shadow-lg transition-all hover:scale-105 active:scale-95 pointer-events-auto"
                    >
                        <Play size={16} fill="currentColor" /> LISTEN_NOW
                    </button>
                </>
            )}

            {activeTab === 'artists' && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold font-mono rounded-full animate-pulse flex items-center gap-1">
                            <TrendingUp size={10}/> #TOP_ARTIST
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">{currentIndex + 1} / {currentList.length}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-900 dark:text-white mb-3 tracking-tighter drop-shadow-sm">
                        <DecoderText text={activeItem.name} />
                    </h1>
                    
                    <div className="flex gap-6 mb-6 font-mono text-xs">
                        <div className="flex flex-col">
                            <span className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-widest">Followers</span>
                            <span className="text-neutral-800 dark:text-white font-bold flex items-center gap-1"><Users size={12}/> {activeItem.followers || "2.1M"}</span>
                        </div>
                        <div className="w-[1px] h-full bg-neutral-300 dark:bg-white/20"></div>
                        <div className="flex flex-col">
                            <span className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-widest">Monthly Plays</span>
                            <span className="text-neutral-800 dark:text-white font-bold flex items-center gap-1"><Play size={12}/> {activeItem.total_plays || "15.4M"}</span>
                        </div>
                    </div>

                    {/* BUTTON CŨ (STANDARD) - DẠNG LINK */}
                    <Link href={`/artist/${encodeURIComponent(activeItem.name)}`}>
                        <button className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200 px-6 py-2.5 rounded-full font-bold font-mono text-xs shadow-lg transition-all hover:scale-105 active:scale-95 pointer-events-auto">
                            VIEW_PROFILE
                        </button>
                    </Link>
                </>
            )}

          </div>
      </div>

      {/* 4. NÚT ĐIỀU HƯỚNG */}
      <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-300 z-30">
         <button onClick={prevSlide} className="p-2 rounded-full bg-white/20 dark:bg-black/40 hover:bg-white/40 dark:hover:bg-black/60 backdrop-blur-md transition text-neutral-800 dark:text-white cursor-pointer">
            <ChevronLeft size={18}/>
         </button>
         <button onClick={nextSlide} className="p-2 rounded-full bg-white/20 dark:bg-black/40 hover:bg-white/40 dark:hover:bg-black/60 backdrop-blur-md transition text-neutral-800 dark:text-white cursor-pointer">
            <ChevronRight size={18}/>
         </button>
      </div>

    </div>
  );
};

export default TrendingHero;