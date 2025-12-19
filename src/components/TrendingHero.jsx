"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, User, ChevronRight, ChevronLeft, Music, TrendingUp, Crown, BarChart3, Activity } from "lucide-react";
import Link from "next/link";
import usePlayer from "@/hooks/usePlayer";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
import { supabase } from "@/lib/supabaseClient";
// Import Cyber Components
import { GlitchText, CyberCard, ScanlineOverlay, HoloButton } from "@/components/CyberComponents";
// IMPORT HOVER PREVIEW
import HoverImagePreview from "@/components/HoverImagePreview"; 

const TrendingHero = ({ songs: initialSongs, artists: initialArtists }) => {
    const player = usePlayer();
    
    // Xử lý an toàn khi useAuth() trả về undefined/null
    const auth = useAuth(); 
    const isAuthenticated = auth?.isAuthenticated || false; 

    const { openModal } = useModal();
    
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
                    .eq('is_public', true) 
                    .order('play_count', { ascending: false })
                    .limit(10);

                if (topSongsDB && topSongsDB.length > 0) {
                    setTrendingSongs(topSongsDB);
                }

                // 2. TÍNH TOÁN STATS VÀ RANK CHO ARTISTS
                const { data: allSongStats } = await supabase
                    .from('songs')
                    .select('author, play_count')
                    .eq('is_public', true); 

                const { data: allFollows } = await supabase
                    .from('following_artists')
                    .select('artist_name, artist_image');

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
                    .filter(a => a.total_plays > 0 || a.followers > 0) 
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

        if (!isAuthenticated) {
            openModal();
            return;
        }

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
            className="relative w-full h-[400px] md:h-[380px] rounded-none overflow-hidden mb-8 group transition-all duration-500 shadow-2xl border-2 border-neutral-300 dark:border-white/10 touch-pan-y"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 1. BACKGROUND (With Scanline) */}
            <div className="absolute inset-0 z-0 bg-neutral-900">
                <Image 
                    src={
                        activeTab === 'songs' 
                        ? (activeSong?.image_path || activeSong?.image_url || '/images/music-placeholder.png')
                        : (topArtists[0]?.image_url || '/images/music-placeholder.png')
                    } 
                    alt="bg" 
                    fill 
                    className="object-cover blur-md opacity-40 scale-110 transition-all duration-1000 grayscale"
                />
                {/* Gradient tối hơn trên mobile để chữ dễ đọc */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/40 dark:from-black dark:via-black/70 dark:to-black/30 md:bg-gradient-to-r md:dark:from-black/95 md:dark:via-black/80 md:dark:to-transparent"></div>
                <ScanlineOverlay />
                
                {/* Grid Decoration */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            {/* 2. TAB SWITCHER (TECH STYLE - Responsive) */}
            <div className="absolute top-0 left-0 z-30 w-full md:w-auto flex items-center bg-white/80 dark:bg-black/80 border-b border-r border-neutral-300 dark:border-white/10">
                <button 
                    onClick={() => setActiveTab('songs')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-3 md:py-2 text-[10px] font-bold font-mono uppercase transition-all flex justify-center items-center gap-2 border-r border-neutral-300 dark:border-white/10 ${activeTab === 'songs' ? 'bg-emerald-500 text-black' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
                >
                    <Music size={12}/> <span className="hidden xs:inline">TRENDING_SONGS</span> <span className="xs:hidden">SONGS</span>
                </button>
                <button 
                    onClick={() => setActiveTab('artists')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-3 md:py-2 text-[10px] font-bold font-mono uppercase transition-all flex justify-center items-center gap-2 ${activeTab === 'artists' ? 'bg-blue-500 text-black' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}
                >
                    <TrendingUp size={12}/> <span className="hidden xs:inline">TOP_ARTISTS</span> <span className="xs:hidden">ARTISTS</span>
                </button>
            </div>

            {/* 3. CONTENT AREA */}
            <div className="absolute inset-0 z-20 px-4 md:px-12 pt-14 md:pt-16 pb-6 flex items-center">
                
                {/* === MODE: SONGS (SLIDESHOW) === */}
                {activeTab === 'songs' && activeSong && (
                    <div 
                        data-song-json={JSON.stringify(activeSong)} 
                        className="w-full flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-10 animate-in fade-in slide-in-from-right-4 duration-500 h-full justify-center md:justify-end"
                    >
                        {/* Image Card (Desktop: Big, Mobile: Small Thumbnail) */}
                        <div className="relative shrink-0 border-2 border-white/20 dark:border-white/10 group-hover:border-emerald-500 transition-colors duration-500 bg-neutral-200 dark:bg-neutral-800 
                            w-[80px] h-[80px] md:w-[220px] md:h-[220px] mb-2 md:mb-0
                        ">
                            {/* Corner Decor */}
                            <div className="absolute top-0 left-0 w-1 md:w-2 h-1 md:h-2 bg-emerald-500 z-10"></div>
                            <div className="absolute bottom-0 right-0 w-1 md:w-2 h-1 md:h-2 bg-emerald-500 z-10"></div>

                            <HoverImagePreview 
                                src={activeSong.image_path || activeSong.image_url || '/images/music-placeholder.png'} 
                                alt={activeSong.title}
                                audioSrc={activeSong.song_url || activeSong.song_path}
                                className="w-full h-full relative"
                                previewSize={240}
                            >
                                <div className="w-full h-full relative">
                                     {activeSong.image_path || activeSong.image_url ? (
                                         <Image 
                                             src={activeSong.image_path || activeSong.image_url} 
                                             alt={activeSong.title} 
                                             fill 
                                             className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                         />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center">
                                             <Music size={32} className="text-neutral-400 dark:text-neutral-600 opacity-50 md:scale-150"/>
                                         </div>
                                     )}
                                     <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            </HoverImagePreview>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 flex flex-col justify-center md:justify-end h-auto md:h-full pb-0 md:pb-2 w-full">
                            <div className="flex items-center gap-2 md:gap-4 mb-2 border-b border-dashed border-neutral-400 dark:border-white/20 pb-2 w-fit">
                                <span className="text-[9px] md:text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Activity size={10} className="animate-pulse"/> LIVE_FEED
                                </span>
                                <span className="text-[9px] md:text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">
                                    INDEX_#{currentIndex + 1 < 10 ? `0${currentIndex+1}` : currentIndex+1}
                                </span>
                            </div>
                            
                            <h1 className="text-2xl sm:text-3xl md:text-6xl font-black font-mono text-neutral-900 dark:text-white mb-1 tracking-tighter leading-tight md:leading-none truncate w-full">
                                <GlitchText text={activeSong.title} />
                            </h1>
                            
                            {/* [FIXED LINK] Artist Link with Source Param */}
                            <Link 
                                href={`/artist/${encodeURIComponent(activeSong.author)}?source=${activeSong.user_id === 'jamendo_api' ? 'jamendo' : 'local'}`}
                                onClick={(e) => e.stopPropagation()} 
                                className="hover:!text-emerald-500 hover:underline transition-colors flex text-xs md:text-base font-mono mb-4 md:mb-6 items-center gap-2 w-fit text-neutral-600 dark:text-neutral-300"
                            >
                                <User size={12} className="md:w-[14px] md:h-[14px]"/> {activeSong.author}
                            </Link>
                            
                            <div className="flex gap-4 items-center">
                                <HoloButton 
                                    onClick={handlePlay} 
                                    className="px-6 md:px-8 py-2 md:py-2 text-[10px] md:text-xs border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                >
                                    <Play size={12} fill="currentColor" className="mr-2" /> PLAY_TRACK
                                </HoloButton>
                                <div className="flex flex-col justify-center px-4 border-l border-neutral-400 dark:border-white/20">
                                    <span className="text-[8px] md:text-[9px] font-mono text-neutral-500 uppercase">Total_Plays</span>
                                    <span className="text-xs md:text-sm font-bold font-mono text-neutral-800 dark:text-white">{activeSong.play_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === MODE: ARTISTS (LEADERBOARD) === */}
                {activeTab === 'artists' && (
                    <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pt-2 md:pt-4">
                        <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
                            <h2 className="text-lg md:text-2xl font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2 tracking-tighter">
                                <Crown size={20} className="text-yellow-500 md:w-[24px] md:h-[24px]" fill="currentColor"/> 
                                ARTIST_BOARD
                            </h2>
                            <span className="text-[9px] md:text-[10px] font-mono text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-1 border border-emerald-500/30">
                                ACTIVE
                            </span>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                {/* Top 1 Card - Desktop Only */}
                                {topArtists[0] && (
                                    /* [FIXED LINK] Top Artist Link (Assume Local because it's from DB stats) */
                                    <Link href={`/artist/${encodeURIComponent(topArtists[0].name)}?source=local`} className="hidden md:block h-full group/card">
                                            <div className="relative h-full border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-neutral-800/50 overflow-hidden">
                                                {/* Decor */}
                                                <div className="absolute top-0 right-0 p-2 bg-yellow-500 text-black font-bold font-mono text-xs z-10">#01</div>
                                                
                                                <HoverImagePreview 
                                                    src={topArtists[0].image_url} 
                                                    alt={topArtists[0].name}
                                                    className="w-full h-full relative"
                                                    previewSize={240} 
                                                >
                                                     <div className="w-full h-full relative">
                                                        {topArtists[0].image_url ? (
                                                            <Image 
                                                                src={topArtists[0].image_url} 
                                                                alt="top1" 
                                                                fill 
                                                                className="object-cover grayscale group-hover/card:grayscale-0 transition duration-700 opacity-60 group-hover/card:opacity-100"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <User size={80} className="text-neutral-400 dark:text-neutral-600 opacity-50" />
                                                            </div>
                                                        )}
                                                        <ScanlineOverlay />
                                                     </div>
                                                </HoverImagePreview>

                                                <div className="absolute bottom-0 left-0 w-full p-4 bg-black/80 backdrop-blur-sm border-t border-white/10">
                                                    <h3 className="text-xl font-bold text-white font-mono mb-1 truncate">
                                                        {topArtists[0].name}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-400 uppercase">
                                                        <div className="flex items-center gap-1">
                                                            <Activity size={10}/> <span>FOLLOWERS: {topArtists[0].followers || '0'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <BarChart3 size={10}/> <span>PLAYS: {topArtists[0].total_plays || '0'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                    </Link>
                                )}

                                {/* List Top 5 */}
                                <div className="flex flex-col gap-1 h-full overflow-y-auto custom-scrollbar pr-1">
                                    {topArtists.map((artist, index) => (
                                        /* [FIXED LINK] List Artist Link (Assume Local) */
                                        <Link href={`/artist/${encodeURIComponent(artist.name)}?source=local`} key={index} className="group/row">
                                            <div className={`
                                                flex items-center justify-between p-2 border transition-all duration-300 cursor-pointer
                                                ${index === 0 ? 'md:hidden bg-yellow-500/10 border-yellow-500/30' : 'bg-white/40 dark:bg-white/5 border-neutral-300 dark:border-white/5 hover:border-emerald-500 hover:bg-emerald-500/5'}
                                            `}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-mono font-bold text-xs w-6 text-center ${index === 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-neutral-500'}`}>
                                                        {index + 1 < 10 ? `0${index+1}` : index+1}
                                                    </span>
                                                    
                                                    {/* Avatar List */}
                                                    <div className="relative w-8 h-8 border border-neutral-400 dark:border-white/20 bg-neutral-300 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                                                         <HoverImagePreview 
                                                            src={artist.image_url} 
                                                            alt={artist.name}
                                                            className="w-full h-full relative"
                                                            previewSize={160} 
                                                        >
                                                            <div className="w-full h-full relative flex justify-center items-center">
                                                                {artist.image_url ? (
                                                                    <Image src={artist.image_url} alt={artist.name} fill className="object-cover grayscale group-hover/row:grayscale-0 transition"/>
                                                                ) : (
                                                                    <User size={14} className="text-neutral-500"/>
                                                                )}
                                                            </div>
                                                        </HoverImagePreview>
                                                    </div>

                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-neutral-900 dark:text-white font-mono truncate max-w-[120px] sm:max-w-[200px]">
                                                            {artist.name}
                                                        </span>
                                                        <div className="flex gap-2 text-[9px] font-mono text-neutral-500 dark:text-neutral-500 uppercase">
                                                            <span className="flex items-center gap-1">
                                                                <Activity size={9}/> {artist.followers || 0}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <BarChart3 size={9}/> {artist.total_plays || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-neutral-400 group-hover/row:text-emerald-500 transition-transform group-hover/row:translate-x-1"/>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. NAVIGATION BUTTONS */}
            {activeTab === 'songs' && (
                <div className="absolute bottom-0 right-0 flex border-t border-l border-neutral-300 dark:border-white/10 bg-white dark:bg-black z-30">
                    <button onClick={prevSlide} className="p-3 md:p-3 hover:bg-emerald-500 hover:!text-white border-r border-neutral-300 dark:border-white/10 transition text-neutral-500 dark:text-neutral-400 active:bg-neutral-200 dark:active:bg-white/10"><ChevronLeft size={16}/></button>
                    <button onClick={nextSlide} className="p-3 md:p-3 hover:bg-emerald-500 hover:!text-white transition text-neutral-500 dark:text-neutral-400 active:bg-neutral-200 dark:active:bg-white/10"><ChevronRight size={16}/></button>
                </div>
            )}

        </div>
    );
};

export default TrendingHero;