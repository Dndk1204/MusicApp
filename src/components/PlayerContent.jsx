"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Howl } from "howler";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify, ListPlus, Square, X,
  Loader2, ChevronUp, ChevronDown, Clock, Maximize2,
  PlusCircle
} from "lucide-react"; 
import { useRouter, usePathname } from "next/navigation";

// --- CUSTOM HOOKS ---
import usePlayer from "@/hooks/usePlayer";
import useTrackStats from "@/hooks/useTrackStats";
import useAudioFilters from "@/hooks/useAudioFilters";
import { useIsTunedTracksPage } from "@/hooks/useIsTunedTracksPage"; 
import useUI from "@/hooks/useUI";
import { supabase } from "@/lib/supabaseClient";
import LikeButton from "./LikeButton";

// --- COMPONENTS ---
import MediaItem from "./MediaItem";
import Slider from "./Slider";
import { AudioVisualizer, ScanlineOverlay } from "./CyberComponents";

const PlayerContent = ({ song, songUrl }) => {
  const player = usePlayer();
  const router = useRouter();
  const pathname = usePathname();
  const { alert } = useUI(); 

  const { initAudioNodes, setBass, setMid, setTreble } = useAudioFilters();
  const isTunedTracksPage = useIsTunedTracksPage();
  
  useTrackStats(song);

  // --- LOCAL STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1);
  const [userId, setUserId] = useState(null);
  
  // State mở rộng Player trên Mobile (từ Code 1)
  const [isExpanded, setIsExpanded] = useState(false);

  const isDraggingRef = useRef(false);
  const rafRef = useRef(null);
  const playerRef = useRef(player);
  const loadedSongIdRef = useRef(null); 

  useEffect(() => { playerRef.current = player; }, [player]);

  const clampVolume = (val) => Math.max(0, Math.min(1, val));

  // Sync playing state
  useEffect(() => {
    player.setIsPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (player.volume !== undefined && Math.abs(player.volume - volume) > 0.01) {
        setVolume(player.volume);
        if (sound) sound.volume(player.volume);
    }
  }, [player.volume, sound, volume]);

  // --- LOGIC LOAD EQ (từ Code 2) ---
  const loadSongSettings = useCallback(async (songId) => {
    if (!songId) return;
    try {
      if (isTunedTracksPage) {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionSaved = sessionStorage.getItem(`audioSettings_${songId}`);
        
        if (sessionSaved) {
            const s = JSON.parse(sessionSaved);
            setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
            return;
        }
        if (session?.user) {
          const { data: songData } = await supabase
            .from('user_song_settings').select('settings')
            .eq('user_id', session.user.id).eq('song_id', songId).single();

          if (songData?.settings) {
             const s = songData.settings;
             setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
             return;
          }
          const { data: profileData } = await supabase
            .from('profiles').select('audio_settings').eq('id', session.user.id).single();
          if (profileData?.audio_settings) {
             const s = profileData.audio_settings;
             setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
          }
        }
      } else {
        sessionStorage.removeItem(`audioSettings_${songId}`);
        setBass(0); setMid(0); setTreble(0);
      }
    } catch (err) { console.error("Load Settings:", err); }
  }, [setBass, setMid, setTreble, isTunedTracksPage]);

  const onPlayNext = useCallback(() => {
    const { ids, activeId, isShuffle, setId, repeatMode } = playerRef.current;
    if (ids.length === 0) return;
    if (isShuffle) {
      const available = ids.filter((id) => id !== activeId);
      if (available.length === 0) setId(activeId);
      else setId(available[Math.floor(Math.random() * available.length)]);
    } else {
      const idx = ids.findIndex((id) => id === activeId);
      const nextId = ids[idx + 1];
      if (nextId) setId(nextId);
      else if (repeatMode === 1) setId(ids[0]);
    }
  }, []);

  const onPlayPrevious = useCallback(() => {
    const { ids, activeId, popHistory, setId } = playerRef.current;
    if (ids.length === 0) return;
    if (sound && sound.seek() > 3) { sound.seek(0); setSeek(0); return; }
    const prev = popHistory();
    if (prev) { setId(prev, true); return; }
    const idx = ids.findIndex((id) => id === activeId);
    if (ids[idx - 1]) setId(ids[idx - 1]);
    else if (sound) { sound.seek(0); setSeek(0); }
  }, [sound]);

  // --- AUDIO INITIALIZATION ---
  useEffect(() => {
    if (sound) sound.unload();
    setIsLoading(true); setSeek(0); setError(null);

    const initialVol = clampVolume(player.volume ?? 1);
    setVolume(initialVol);

    const newSound = new Howl({
      src: [songUrl],
      format: ["mp3", "mpeg"],
      volume: initialVol,
      html5: false, 
      preload: "auto", 
      autoplay: true,
      loop: playerRef.current.repeatMode === 2,
      onplay: () => {
        setIsPlaying(true);
        setDuration(newSound.duration());
        initAudioNodes();
        if (song?.id && loadedSongIdRef.current !== song.id) {
          loadSongSettings(song.id);
          loadedSongIdRef.current = song.id;
        }
        const updateSeek = () => {
          if (!isDraggingRef.current && newSound.playing()) setSeek(newSound.seek());
          rafRef.current = requestAnimationFrame(updateSeek);
        };
        updateSeek();
      },
      onpause: () => { setIsPlaying(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); },
      onend: () => {
        if (playerRef.current.repeatMode === 2) { setIsPlaying(true); setSeek(0); }
        else { setIsPlaying(false); setSeek(0); onPlayNext(); }
      },
      onload: () => {
          setDuration(newSound.duration());
          setIsLoading(false); 
          setError(null);
      },
      onloaderror: () => { setError(true); setIsLoading(false); }
    });

    setSound(newSound);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); newSound.unload(); };
  }, [songUrl, onPlayNext]); 

  useEffect(() => { if (sound) sound.loop(player.repeatMode === 2); }, [player.repeatMode, sound]);

  const handlePlay = (e) => { 
      e?.stopPropagation();
      if (!sound) return; 
      if (!isPlaying) { sound.play(); initAudioNodes(); } 
      else sound.pause(); 
  };
  
  const handleVolumeChange = (value, syncGlobal = true) => {
    const v = clampVolume(parseFloat(value));
    setVolume(v);
    if (sound) sound.volume(v);
    if (syncGlobal) player.setVolume(v);
  };

  const handleClearPlayer = (e) => {
    e?.stopPropagation();
    if (sound) { sound.stop(); sound.unload(); }
    player.reset();
  };

  const handleSeekChange = (nv) => { isDraggingRef.current = true; setSeek(nv); };
  const handleSeekCommit = (nv) => { if (sound) sound.seek(nv); isDraggingRef.current = false; };
  const toggleMute = () => handleVolumeChange(volume === 0 ? 1 : 0);
  const formatTime = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const Icon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  const navigateToFullPlayer = () => {
    if (pathname === '/now-playing') {
      router.back();
    } else {
      const from = pathname === '/' ? 'home' : pathname.replace('/', '');
      router.push(`/now-playing?from=${from}`);
    }
  };

  const volumePercentage = Math.round(volume * 100);

  if (!songUrl || !song) return null;

  return (
    <div className="w-full max-w-full box-border">
      {/* MOBILE LAYOUT - CYBERPUNK THEME */}
      <div 
        className={`
          md:hidden w-full max-w-full box-border relative 
          transition-all duration-300 ease-in-out
          bg-neutral-100/90 dark:bg-black/90 backdrop-blur-xl
          border-t border-emerald-500/50
          shadow-[0_-10px_30px_-15px_rgba(16,185,129,0.3)]
          overflow-visible 
          ${isExpanded ? 'h-[90vh] pb-10 rounded-t-3xl' : 'h-20 rounded-t-none'}
        `}
      >
        {/* NÚT TOGGLE - DẠNG TAB CÔNG NGHỆ */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="
            absolute -top-6 left-1/2 -translate-x-1/2
            w-20 h-6 
            bg-emerald-500 text-black
            flex items-center justify-center 
            clip-path-polygon-[0%_100%,15%_0%,85%_0%,100%_100%] /* Tạo hình thang */
            z-[100] font-mono font-bold text-[10px] tracking-widest
            shadow-[0_-4px_10px_rgba(16,185,129,0.5)]
          "
          style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} className="animate-bounce" />}
        </button>

        {/* PLAYER COLLAPSED (SLEEK VERSION) */}
        {!isExpanded && (
          <div className="flex items-center justify-between px-5 h-full" onClick={() => setIsExpanded(true)}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 border border-emerald-500/50 relative overflow-hidden shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <img src={song.image_path} className="w-full h-full object-cover" />
                    <ScanlineOverlay />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold font-mono text-neutral-900 dark:text-emerald-400 truncate uppercase tracking-tight">
                      {song.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <p className="text-[10px] font-mono text-neutral-500 truncate uppercase tracking-tighter opacity-70">
                        {song.author}
                      </p>
                    </div>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={handlePlay} className="w-12 h-12 flex items-center justify-center text-emerald-600 dark:text-emerald-400 active:scale-90 transition-transform">
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Icon size={28} fill="currentColor"/>}
                  </button>
                  <button onClick={handleClearPlayer} className="w-10 h-10 flex items-center justify-center text-neutral-400">
                    <Square size={16} />
                  </button>
              </div>
          </div>
        )}

        {/* PLAYER EXPANDED (FULL TECH MODE) */}
        {isExpanded && (
          <div className="flex flex-col p-5 gap-1 animate-in slide-in-from-bottom-10 duration-500">

            <button 
              onClick={() => {
                setIsExpanded(false); // Đóng player mobile trước
                router.push('/now-playing'); // Điều hướng tới trang Now Playing
              }}
              className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-[9px] font-bold tracking-widest hover:bg-emerald-500 hover:text-black transition-all duration-300 group z-20"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block">FULL_SYSTEM_VIEW</span>
              <Maximize2 size={14} strokeWidth={3} />
            </button>
            
            {/* 1. ART COVER - CYBER CARD STYLE */}
            <div className="relative self-center w-full max-w-[280px]">
              <div className="absolute -inset-2 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="relative z-10 aspect-square bg-black border border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] overflow-hidden">
                <img 
                    src={song.image_path || "/images/default_song.png"} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                    alt="Cover"
                />
                <ScanlineOverlay />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/60"></div>
                <div className="absolute bottom-3 left-3 flex flex-col">
                    <span className="bg-emerald-500 text-black font-mono text-[9px] px-2 py-0.5 font-bold w-fit">
                      SYSTEM_STABLE
                    </span>
                    <span className="text-white font-mono text-[10px] mt-1 opacity-80 uppercase tracking-widest">
                      ID_{song.id?.toString().slice(0,10)}
                    </span>
                </div>
              </div>
            </div>

            {/* 2. INFO & PROGRESS */}
            <div className="space-y-1">
              <div className="text-center">
                  <h2 className="text-xl font-black font-mono dark:text-emerald-400 uppercase tracking-tighter">
                      {song.title}
                  </h2>
                  <p className="text-sm font-mono text-neutral-500 uppercase opacity-70">
                      {song.author}
                  </p>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-none relative overflow-hidden">
                <div className="flex justify-between font-mono text-[10px] mb-2 text-emerald-600 dark:text-emerald-500/70">
                  <span className="flex items-center gap-1"><Clock size={10}/> {formatTime(seek)}</span>
                  <span className="animate-pulse tracking-widest">DATA_STREAMING</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <Slider 
                  value={seek} 
                  max={duration || 100} 
                  onCommit={handleSeekCommit} 
                  onChange={handleSeekChange}
                />
              </div>
            </div>

            {/* 3. VOLUME MODULE - CYBER STYLE */}
            <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/20 p-3 relative overflow-hidden">
              {/* Icon Volume với hiệu ứng quét */}
              <div className="w-8 h-8 flex items-center justify-center border border-emerald-500/30 relative">
                <Volume2 size={16} className="text-emerald-500" />
                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-center font-mono text-[8px] text-emerald-500/50 uppercase tracking-widest">
                  <span>Output_Level</span>
                  <span>{Math.round(player.volume * 100)}%</span>
                </div>
                <Slider 
                  value={player.volume} 
                  max={1} 
                  step={0.01}
                  onChange={(val) => player.setVolume(val)}
                />
              </div>
              
              {/* Chi tiết trang trí góc */}
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500/40"></div>
            </div>

            {/* 3. MAIN CONTROLS (COMMAND CENTER) */}
            <div className="grid grid-cols-5 gap-1 border border-emerald-500/30 bg-black/80 backdrop-blur-md p-1">
                <button onClick={onPlayPrevious} className="py-4 flex justify-center items-center text-emerald-500/50 hover:text-emerald-500 active:bg-emerald-500/20 transition-all">
                    <SkipBack size={20}/>
                </button>
                <button onClick={() => { if(sound) sound.seek(Math.max(0, seek - 5)); }} className="py-4 flex justify-center items-center text-emerald-500/50 hover:text-emerald-500 active:bg-emerald-500/20 transition-all">
                    <Rewind size={20}/>
                </button>
                
                {/* PLAY BUTTON - GLOW EFFECT */}
                <button 
                    onClick={handlePlay} 
                    className="py-4 bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition-transform"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={24} />
                    ) : (
                        <Icon size={24} fill="currentColor" /> 
                    )}
                </button>

                <button onClick={() => { if(sound) sound.seek(Math.min(duration, seek + 5)); }} className="py-4 flex justify-center items-center text-emerald-500/50 hover:text-emerald-500 active:bg-emerald-500/20 transition-all">
                    <FastForward size={20}/>
                </button>
                <button onClick={onPlayNext} className="py-4 flex justify-center items-center text-emerald-500/50 hover:text-emerald-500 active:bg-emerald-500/20 transition-all">
                    <SkipForward size={20}/>
                </button>
            </div>

            {/* 4. ACTIONS FOOTER */}
            <div className="grid grid-cols-5 gap-4 px-2 mt-3">
                <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`mt-0.5 flex flex-col items-center gap-1 font-mono text-[8px] transition-all ${player.isShuffle ? "text-emerald-500" : "text-neutral-500"}`}>
                    <Shuffle size={18}/>
                    <span>SHUFFLE</span>
                </button>
                
                <div className="flex flex-col items-center font-mono text-[8px] -translate-y-2 text-neutral-500">
                    <LikeButton songId={song.id} size={18} className="!bg-transparent !border-0" />
                    <span className="-translate-y-0.5">LIKE</span>
                </div>

                <button 
                    onClick={() => {if(song) {
                            const normalizedSong = {
                                id: song.id || song.encodeId,
                                title: song.title,
                                author: song.artistsNames || song.author,
                                song_url: song.streaming?.mp3 || song.song_url,
                                image_path: song.thumbnailM || song.image_path || song.image_url,
                                duration: song.duration
                            };
                            router.push(`/add-to-playlist?song=${encodeURIComponent(JSON.stringify(normalizedSong))}`); 
                        }}}
                    className="flex flex-col items-center gap-1 font-mono text-[8px] text-neutral-500"
                >
                    <ListPlus size={18} />
                    <span>ADD</span>
                </button>

                <button onClick={() => player.setRepeatMode((player.repeatMode+1)%3)} className={`flex flex-col items-center gap-1 font-mono text-[8px] transition-all ${player.repeatMode !== 0 ? "text-emerald-500" : "text-neutral-500"}`}>
                    {player.repeatMode === 2 ? <Repeat1 size={18}/> : <Repeat size={18}/>}
                    <span>REPEAT</span>
                </button>

                <button onClick={handleClearPlayer} className="flex flex-col items-center gap-1 font-mono text-[8px] text-red-500/70">
                    <Square size={18} />
                    <span>HALT</span>
                </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
        DESKTOP LAYOUT (Kết hợp UI Code 1 và Logic Code 2)
        =========================================================
      */}
      <div className="hidden md:grid md:grid-cols-3 h-full px-4 items-center gap-6 bg-white dark:bg-black border-t border-neutral-200 dark:border-white/10">
        
        {/* LEFT: Info & Actions */}
        <div className="flex w-full max-w-full md:max-w-[24em] justify-start items-center gap-2 -translate-y-1">
            <div className="max-w-[24em] flex-1 min-w-0"><MediaItem data={song} /></div>
            
            <div className="flex items-center">
                <LikeButton songId={song.id} size={20} />
                <button 
                    onClick={() => { 
                        if(song) {
                            const normalizedSong = {
                                id: song.id || song.encodeId,
                                title: song.title,
                                author: song.artistsNames || song.author,
                                song_url: song.streaming?.mp3 || song.song_url,
                                image_path: song.thumbnailM || song.image_path || song.image_url,
                                duration: song.duration
                            };
                            router.push(`/add-to-playlist?song=${encodeURIComponent(JSON.stringify(normalizedSong))}`); 
                        }
                    }} 
                    className="text-neutral-500 dark:text-neutral-400 p-2 rounded-full transition-all duration-200 hover:bg-neutral-200/50 dark:hover:bg-white/10 hover:!text-emerald-600" title="Add to Playlist"
                ><PlusCircle size={20} /></button>

                <button onClick={handleClearPlayer} className="text-neutral-500 dark:text-neutral-400 hover:!text-red-600 p-2 rounded-full transition-all duration-200 hover:bg-neutral-200/50 dark:hover:bg-white/10" title="Stop & Clear"><Square size={20} fill="currentColor" /></button>
            </div>

            <div className="hidden lg:block ml-2 border-l border-neutral-300 dark:border-neutral-700 pl-3 h-8 items-center">
                <AudioVisualizer isPlaying={isPlaying}/>
            </div>
        </div>

        {/* CENTER: Controls & Progress */}
        <div className="flex flex-col items-center w-full max-w-[500px] gap-y-1 mx-auto">
            <div className="flex items-center gap-x-6 translate-y-1.5">
                <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`transition p-1 ${player.isShuffle ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"}`} title="Shuffle"><Shuffle size={16}/></button>
                <button onClick={onPlayPrevious} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><SkipBack size={20}/></button>
                <button onClick={() => { if(sound) sound.seek(Math.max(0, seek - 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><Rewind size={20}/></button>
                
                <button onClick={handlePlay} disabled={!sound || isLoading} className="relative flex items-center justify-center h-8 !w-16 bg-neutral-200 dark:bg-emerald-400/50 text-black dark:text-emerald-100 border border-neutral-300 dark:border-emerald-300 hover:bg-emerald-500 transition-all duration-200 shadow-sm">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" style={{ borderRadius: '50%' }}/> : <Icon size={20} fill="currentColor" className="relative z-20"/>}
                        <ScanlineOverlay className="absolute inset-0 z-10"/> 
                    </div>
                </button>

                <button onClick={() => { if(sound) sound.seek(Math.min(duration, seek + 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><FastForward size={20}/></button>
                <button onClick={onPlayNext} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><SkipForward size={20}/></button>
                <button onClick={() => player.setRepeatMode((player.repeatMode+1)%3)} className={`transition p-1 ${player.repeatMode!==0 ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"}`} title="Repeat">
                    {player.repeatMode===2 ? <Repeat1 size={16}/> : <Repeat size={16}/>}
                </button>
            </div>
            
            <div className="w-full flex items-center gap-3 -translate-y-2 mt-2">
                <span className="text-[10px] font-mono text-neutral-500 w-10 text-right">{formatTime(seek)}</span>
                <div className="flex-1 h-full flex items-center">
                    <Slider value={seek} max={duration || 100} onCommit={handleSeekCommit} onChange={handleSeekChange}/>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 w-10">{formatTime(duration)}</span>
            </div>
        </div>

        {/* RIGHT: Volume & View */}
        <div className="flex justify-end pr-2 gap-4 w-full items-center -translate-y-[0.25rem]">
             <div className="flex items-center gap-2 border border-neutral-300 dark:border-white/10 px-2 py-1 bg-neutral-50 dark:bg-white/5">
                 <button onClick={toggleMute}><VolumeIcon size={18} className="text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 transition"/></button>
                 <div className="w-[80px]"><Slider value={volume} max={1} step={0.01} onChange={(v) => handleVolumeChange(v)}/></div>
                 <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 font-bold w-6 text-right">{volumePercentage}%</span>
             </div>
             <button onClick={navigateToFullPlayer} className={`p-2 border transition-all rounded-none ${pathname==='/now-playing' ? "text-emerald-500 border-emerald-500/50 bg-emerald-500/10" : "text-neutral-500 dark:text-neutral-400 border-transparent hover:bg-neutral-200 dark:hover:bg-white/5"}`}>
                {pathname === '/now-playing' ? <X size={20}/> : <AlignJustify size={20}/>}
             </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;