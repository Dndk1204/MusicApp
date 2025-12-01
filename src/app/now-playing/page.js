"use client";

import { useEffect, useState } from "react";
import usePlayer from "@/hooks/usePlayer";
import { supabase } from "@/lib/supabaseClient";
import { User, Disc, Music, Mic2, Info, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  const [song, setSong] = useState(null);
  const [activeTab, setActiveTab] = useState('lyrics'); 
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const updateSong = async () => {
        if (!player.activeId) {
            return;
        }

        if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
            const songData = window.__SONG_MAP__[player.activeId];
            setSong(songData);
            return;
        }

        try {
            const CLIENT_ID = '3501caaa';
            const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${player.activeId}&include=musicinfo+lyrics&audioformat=mp32`);
            const data = await res.json();
            if (data.results && data.results[0]) {
                const track = data.results[0];
                const newSong = {
                    id: track.id,
                    title: track.name,
                    author: track.artist_name,
                    song_path: track.audio,
                    image_path: track.image || track.album_image,
                    duration: track.duration, 
                    lyrics: track.musicinfo?.lyrics || null,
                    user_id: 'jamendo_api'
                };
                setSong(newSong);
                if (typeof window !== 'undefined') {
                    window.__SONG_MAP__ = { ...window.__SONG_MAP__, [newSong.id]: newSong };
                }
            }
        } catch (error) {
            console.error("Error fetching song details:", error);
        }
    };

    updateSong();
    
  }, [player.activeId, isMounted]);

  if (!isMounted) return null;

  if (!song) return (
    <div className="w-full h-full flex items-center justify-center text-neutral-500 font-mono gap-2 text-xs">
        <Loader2 className="animate-spin" size={16} /> [WAITING_FOR_SIGNAL]...
    </div>
  );

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden animate-in fade-in duration-700"> {/* Giảm p-6 -> p-4 */}
      
      {/* --- CỘT TRÁI (60%) --- */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative perspective-1000">
         
         {/* ĐĨA THAN: Giảm size */}
         <div key={song.id + "_disc"} className="relative w-[250px] h-[250px] md:w-[450px] md:h-[450px] flex items-center justify-center animate-[spin_10s_linear_infinite]">
            <div className="absolute inset-0 rounded-full shadow-2xl
                bg-neutral-100 border-4 border-neutral-300
                bg-[repeating-radial-gradient(#f5f5f5,#f5f5f5_2px,#e5e5e5_3px,#e5e5e5_4px)]
                dark:bg-black dark:border-neutral-800 
                dark:bg-[repeating-radial-gradient(black,black_2px,#1a1a1a_3px,#1a1a1a_4px)]
            "></div>
            <div className="absolute w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-800 z-0"></div>
            <div className="absolute inset-0 rounded-full shadow-[0_0_100px_rgba(16,185,129,0.2)] opacity-50"></div>
         </div>

         {/* COVER: Giảm size tương ứng */}
         <div key={song.id + "_cover"} className="absolute z-10 w-[200px] h-[200px] md:w-[320px] md:h-[320px] flex items-center justify-center pl-8 animate-in zoom-in duration-500">
            <div className="relative w-full h-full filter drop-shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform duration-500 hover:scale-105">
                <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="roundedPlayBtn">
                            <path d="M 93.5 46.4 L 12.5 1.4 C 10.5 0.3 8 1.8 8 4.1 L 8 95.9 C 8 98.2 10.5 99.7 12.5 98.6 L 93.5 53.6 C 95.5 52.5 95.5 47.5 93.5 46.4 Z" />
                        </clipPath>
                        <linearGradient id="glassGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
                            <stop offset="50%" stopColor="transparent" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                        </linearGradient>
                    </defs>

                    {song.image_path ? (
                        <image 
                            href={song.image_path} 
                            width="100%" 
                            height="100%" 
                            preserveAspectRatio="xMidYMid slice"
                            clipPath="url(#roundedPlayBtn)" 
                        />
                    ) : (
                        <g clipPath="url(#roundedPlayBtn)">
                            <rect width="100%" height="100%" fill="#171717" />
                            <foreignObject x="0" y="0" width="100%" height="100%">
                                <div className="w-full h-full bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center pl-4">
                                    <Music size={60} className="text-emerald-500/50"/>
                                </div>
                            </foreignObject>
                        </g>
                    )}

                    <path 
                        d="M 93.5 46.4 L 12.5 1.4 C 10.5 0.3 8 1.8 8 4.1 L 8 95.9 C 8 98.2 10.5 99.7 12.5 98.6 L 93.5 53.6 C 95.5 52.5 95.5 47.5 93.5 46.4 Z"
                        fill="url(#glassGradient)"
                        className="pointer-events-none"
                    />
                </svg>
            </div>
         </div>

         {/* INFO: Giảm text size */}
         <div className="absolute bottom-4 left-0 right-0 text-center z-20">
            <h1 className="text-2xl md:text-4xl font-bold font-mono text-neutral-900 dark:text-white tracking-tighter drop-shadow-xl truncate px-10 transition-colors">
                {song.title}
            </h1>
            <p className="text-base md:text-lg font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-2 drop-shadow-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                {song.author}
            </p>
         </div>
      </div>

      {/* --- CỘT PHẢI (40%) --- */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden shadow-xl transition-colors duration-300">
         <div className="flex border-b border-neutral-200 dark:border-white/10">
            <button 
                onClick={() => setActiveTab('lyrics')}
                className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5
                    ${activeTab === 'lyrics' 
                        ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' 
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
            >
                <Mic2 size={14}/> LYRICS
            </button>
            <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5
                    ${activeTab === 'info' 
                        ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' 
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
            >
                <Info size={14}/> CREDITS
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
            {activeTab === 'lyrics' ? (
                song.lyrics ? (
                    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {song.lyrics.split('\n').map((line, i) => (
                            /* Giảm text size lyrics xuống text-sm */
                            <p key={i} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-white transition-colors cursor-default leading-relaxed">
                                {line}
                            </p>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-3 opacity-70">
                        <Disc size={30} className="animate-spin-slow"/>
                        <p className="font-mono text-[10px] tracking-widest">[INSTRUMENTAL / NO_LYRICS]</p>
                    </div>
                )
            ) : (
                <div className="space-y-4 font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-0.5">Artist</p>
                        <p className="text-neutral-800 dark:text-white text-base font-bold">{song.author}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-0.5">Track Title</p>
                        <p className="text-neutral-800 dark:text-white text-sm">{song.title}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-0.5">Duration</p>
                        <p className="text-neutral-600 dark:text-neutral-400">{song.duration || "N/A"}</p>
                    </div>
                    <div className="pt-4 border-t border-neutral-200 dark:border-white/10">
                        <p className="text-[9px] text-neutral-400 text-center">:: METADATA_END ::</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;