"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Howl } from "howler";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify, Plus, Square, X 
} from "lucide-react"; 
import { useRouter, usePathname } from "next/navigation";

// --- CUSTOM HOOKS ---
import usePlayer from "@/hooks/usePlayer";
import useTrackStats from "@/hooks/useTrackStats";
import useAudioFilters from "@/hooks/useAudioFilters";
import useUI from "@/hooks/useUI";
import { supabase } from "@/lib/supabaseClient";

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
  
  // Track stats hook
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
  }, [player.volume]);

  // Hàm load EQ Settings (Đã xóa logic Tuned Tracks Page)
  const loadSongSettings = useCallback(async (songId) => {
    if (!songId) return;
    try {
        // Mặc định luôn reset về FLAT cho mọi bài hát
        // Nếu bạn muốn giữ lại tính năng load EQ global (từ profile), có thể uncomment đoạn dưới
        /*
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
             const { data: profileData } = await supabase
                .from('profiles').select('audio_settings').eq('id', session.user.id).single();
             if (profileData?.audio_settings) {
                 const s = profileData.audio_settings;
                 setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
                 return;
             }
        }
        */
        
        sessionStorage.removeItem(`audioSettings_${songId}`);
        setBass(0); setMid(0); setTreble(0);
        console.log("[EQ] Set to FLAT (0,0,0)");

    } catch (err) { console.error("Load Settings:", err); }
  }, [setBass, setMid, setTreble]);


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
    });

    setSound(newSound);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); newSound.unload(); };
  }, [songUrl]); 

  // --- LOAD EQ SETTINGS KHI SONG.ID THAY ĐỔI ---
  useEffect(() => {
    if (song?.id && loadedSongIdRef.current !== song.id) {
      loadSongSettings(song.id);
      loadedSongIdRef.current = song.id;
    }
  }, [song?.id, loadSongSettings]);

  useEffect(() => { if (sound) sound.loop(player.repeatMode === 2); }, [player.repeatMode, sound]);

  const handlePlay = () => { if (!sound) return; if (!isPlaying) { sound.play(); initAudioNodes(); } else sound.pause(); };
  
  const handleVolumeChange = (value, syncGlobal = true) => {
    const v = clampVolume(parseFloat(value));
    setVolume(v);
    if (sound) sound.volume(v);
    if (syncGlobal) player.setVolume(v);
  };

  const handleClearPlayer = () => {
    if (sound) {
        sound.stop();
        sound.unload();
    }
    player.reset();
  };

  const handleSeekChange = (nv) => { isDraggingRef.current = true; setSeek(nv); };
  const handleSeekCommit = (nv) => { if (sound) sound.seek(nv); isDraggingRef.current = false; };
  const toggleMute = () => handleVolumeChange(volume === 0 ? 1 : 0);
  const formatTime = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const Icon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  const toggleNowPlaying = () => {
    if (pathname === '/now-playing') {
      router.back();
    } else {
      const from = pathname === '/' ? 'home' : pathname.replace('/', '');
      router.push(`/now-playing?from=${from}`);
    }
  };

  const volumePercentage = Math.round(volume * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-6 items-center bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-200 dark:border-white/10 px-4 transition-colors duration-300">
      {error && <div className="absolute -top-12 bg-red-500 text-white text-xs py-1 px-3 rounded-none z-50 font-mono">Error</div>}
      
      {/* LEFT: Media Info + Actions */}
      <div className="flex w-full md:w-[20em] justify-start items-center gap-2 -translate-y-1 min-w-0">
        <div className="flex-1 min-w-0">
            <MediaItem data={song} />
        </div>
        
        {/* Actions */}
        <div className="hidden sm:flex items-center gap-1">
            <button 
                onClick={() => { 
                    if(song) {
                        const normalizedSong = {
                            id: song.id || song.encodeId,
                            title: song.title,
                            author: song.artistsNames || song.author,
                            song_url: song.streaming?.mp3 || song.song_url,
                            image_url: song.thumbnailM || song.image_url,
                            duration: song.duration
                        };
                        router.push(`/add-to-playlist?song=${encodeURIComponent(JSON.stringify(normalizedSong))}`); 
                    }
                }} 
                disabled={!song} 
                className="text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition p-1.5"
                title="Add to Playlist"
            >
                <Plus size={18} />
            </button>

            <button 
                onClick={handleClearPlayer} 
                className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 transition p-1.5"
                title="Stop & Clear"
            >
                <Square size={16} fill="currentColor" />
            </button>
        </div>

        <div className="hidden lg:block ml-2 border-l border-neutral-300 dark:border-neutral-700 pl-3 h-8 items-center">
            <AudioVisualizer isPlaying={isPlaying}/>
        </div>
      </div>

      {/* CENTER: CONTROLS */}
      <div className="hidden md:flex flex-col items-center w-full max-w-[722px] gap-y-1">
          <div className="flex items-center gap-x-6 translate-y-1.5">
            <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`transition p-1 ${player.isShuffle ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"}`} title="Shuffle"><Shuffle size={16}/></button>
            
            <button onClick={onPlayPrevious} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><SkipBack size={20}/></button>
            
            <button onClick={() => { if(sound) sound.seek(Math.max(0, seek - 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1">
              <Rewind size={18}/>
            </button>
            
            {/* Main Play Button */}
            <button 
              onClick={handlePlay} 
              disabled={!sound || isLoading} 
              className="
                  relative
                  flex items-center justify-center h-8 !w-16 
                  bg-neutral-200 dark:bg-emerald-400/50 
                  text-black dark:text-emerald-100 
                  border border-neutral-300 dark:border-emerald-300
                  hover:bg-emerald-500 hover:text-white hover:border-emerald-500
                  transition-all duration-200 rounded-none
                  shadow-sm
              "
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin relative z-20"/> : <Icon size={20} fill="currentColor" className="relative z-20"/>}
                    <ScanlineOverlay className="absolute inset-0 z-10"/> 
                </div>
            </button>

            <button onClick={() => { if(sound) sound.seek(Math.min(duration, seek + 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1">
              <FastForward size={18}/>
            </button>

            <button onClick={onPlayNext} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><SkipForward size={20}/></button>
            
            <button onClick={() => player.setRepeatMode((player.repeatMode+1)%3)} className={`transition p-1 ${player.repeatMode!==0 ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"}`} title="Repeat">
              {player.repeatMode===2 ? <Repeat1 size={16}/> : <Repeat size={16}/>}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full flex items-center gap-3 -translate-y-2">
              <span className="text-[10px] font-mono text-neutral-500 w-10 text-right">{formatTime(seek)}</span>
              <div className="flex-1 h-full flex items-center">
                  <Slider value={seek} max={duration || 100} onCommit={handleSeekCommit} onChange={handleSeekChange}/>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 w-10">{formatTime(duration)}</span>
          </div>
      </div>

      {/* RIGHT: Volume & View Switcher */}
      <div className="hidden md:flex justify-end pr-2 gap-4 w-full items-center -translate-y-[0.25rem]">
         <div className="flex items-center gap-2 border border-neutral-300 dark:border-white/10 px-2 py-1 bg-neutral-50 dark:bg-white/5">
             <button onClick={toggleMute}><VolumeIcon size={18} className="text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 transition"/></button>
             <div className="w-[80px]"><Slider value={volume} max={1} step={0.01} onChange={(v) => handleVolumeChange(v)}/></div>
             <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 font-bold w-6 text-right">
                {volumePercentage}%
             </span>
         </div>
         
         <button 
            onClick={toggleNowPlaying} 
            className={`
                p-2 border transition-all rounded-none
                ${pathname==='/now-playing' 
                    ? "text-emerald-500 border-emerald-500/50 bg-emerald-500/10" 
                    : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border-transparent hover:bg-neutral-200 dark:hover:bg-white/5"}
            `}
            title={pathname==='/now-playing' ? "Close Player" : "Open Player"}
         >
            {pathname === '/now-playing' ? <X size={20}/> : <AlignJustify size={20}/>}
         </button>
      </div>

      {/* MOBILE PLAY BUTTON */}
      <div className="flex md:hidden col-auto justify-end items-center gap-3">
        <button 
            onClick={toggleNowPlaying} 
            className="text-neutral-500 dark:text-neutral-400 p-2"
        >
            {pathname === '/now-playing' ? <X size={20}/> : <AlignJustify size={20}/>}
        </button>

        <button 
            onClick={handlePlay} 
            disabled={!sound || isLoading} 
            className="
                h-10 w-10 flex items-center justify-center shadow-lg active:scale-95 transition
                bg-neutral-900 dark:bg-white 
                text-white dark:text-black
                border border-transparent dark:border-neutral-200
            "
        >
           {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Icon size={20} fill="currentColor"/>}
        </button>
      </div>
    </div>
  );
};

export default PlayerContent;