"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Howl } from "howler";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify, Plus, Square, X,
  Maximize2, ChevronUp, ChevronDown, Save
} from "lucide-react"; 
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

// --- CUSTOM HOOKS ---
import usePlayer from "@/hooks/usePlayer";
import useTrackStats from "@/hooks/useTrackStats";
import useAudioFilters from "@/hooks/useAudioFilters";
import { useIsTunedTracksPage } from "@/hooks/useIsTunedTracksPage"; 
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

  // Nút Save Tuned (từ Code 2)
  const onSaveTunedSong = async (e) => {
    e?.stopPropagation();
    if (!userId || !song) return;
    // Logic lưu tuned song của bạn ở đây...
    alert('Tuned settings saved!', 'success', 'SAVED');
  };

  const volumePercentage = Math.round(volume * 100);

  if (!songUrl || !song) return null;

  return (
    <div className="w-full max-w-full overflow-hidden box-border">
      
      {/* ========================================================================
        MOBILE LAYOUT (từ Code 1)
        ========================================================================
      */}
      <div 
          className={`
              md:hidden w-full max-w-full box-border
              relative /* Bỏ dấu ! để tránh xung đột nếu không cần thiết */
              transition-all duration-300 ease-in-out 
              bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl 
              border-t border-neutral-200 dark:border-white/10
              shadow-[0_-5px_20px_rgba(0,0,0,0.3)]
              /* TUYỆT ĐỐI KHÔNG CÓ overflow-hidden Ở ĐÂY */
              ${isExpanded ? 'h-auto pb-6 rounded-none !border-emerald-500' : 'h-16'}
          `}
      >
          {error && <div className="absolute -top-8 bg-red-500 text-white text-xs py-1 px-3 z-50 font-mono w-full text-center">Error: Load Failed</div>}

          <button 
              onClick={(e) => {
                  e.stopPropagation(); // Chặn sự kiện lan ra ngoài
                  setIsExpanded(!isExpanded);
              }}
              className="
                  absolute 
                  top-1 /* Đẩy lên trên hẳn viền player */
                  left-1/2 -translate-x-1/2 
                  w-12 h-6 
                  bg-white dark:bg-neutral-900 
                  flex items-center justify-center 
                  border-t border-x border-neutral-300 dark:border-white/10 
                  z-[99999] /* z-index cao nhất có thể */
                  cursor-pointer
                  shadow-md
              "
          >
              {isExpanded ? (
                  <ChevronDown size={18} className="text-emerald-500" />
              ) : (
                  <ChevronUp size={18} className="text-emerald-500" />
              )}
          </button>

          {!isExpanded && (
             <div className="flex items-center justify-between px-3 h-full w-full max-w-full" onClick={() => setIsExpanded(true)}>
                 <div className="flex items-center gap-2 flex-1 min-w-0 mr-2 overflow-hidden">
                     <div className="w-10 h-10 shrink-0 bg-neutral-800 border border-neutral-600 overflow-hidden relative">
                        <img 
                            src={song.image_path || song.image_url || "/images/default_song.png"} 
                            alt={song.title} 
                            className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                        />
                     </div>
                     <div className="flex flex-col justify-center min-w-0 overflow-hidden">
                        <p className="text-xs font-bold font-mono text-neutral-900 dark:text-white truncate uppercase">{song.title}</p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate font-mono uppercase">{song.author}</p>
                     </div>
                 </div>

                 <div className="flex items-center gap-1 shrink-0">
                      <button onClick={handlePlay} className="relative flex items-center justify-center h-8 w-8 bg-neutral-200 dark:bg-emerald-400/50 text-black dark:text-emerald-100 border border-neutral-300 dark:border-emerald-300 rounded-none shadow-sm mx-1">
                          {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" style={{ borderRadius: '50%' }}/> : <Icon size={18} fill="currentColor"/>}
                      </button>

                      <button onClick={handleClearPlayer} className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 p-2">
                        <Square size={16} fill="currentColor" />
                      </button>
                      
                      <button onClick={(e) => { e.stopPropagation(); navigateToFullPlayer(); }} className="p-2 text-neutral-400">
                          <Maximize2 size={18}/>
                      </button>
                 </div>
                 <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/20 w-full">
                     <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(seek / (duration || 1)) * 100}%` }}/>
                 </div>
             </div>
          )}

          {isExpanded && (
             <div className="flex flex-col px-4 pt-4 gap-4 animate-in slide-in-from-bottom-10 duration-300 bg-neutral-100 dark:bg-neutral-900/50 w-full max-w-full overflow-hidden">
                 <div className="flex justify-between items-start">
                     <div className="w-full flex justify-center"><MediaItem data={song} /></div>
                     <button onClick={navigateToFullPlayer} className="p-2 absolute right-4 top-4 bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"><Maximize2 size={20}/></button>
                 </div>

                 <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono w-8 text-right text-neutral-500">{formatTime(seek)}</span>
                      <div className="flex-1 h-6 flex items-center"><Slider value={seek} max={duration || 100} onCommit={handleSeekCommit} onChange={handleSeekChange}/></div>
                      <span className="text-[10px] font-mono w-8 text-neutral-500">{formatTime(duration)}</span>
                 </div>

                 <div className="flex flex-wrap justify-between items-center gap-2 mt-2 w-full px-2">
                      <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`p-2 ${player.isShuffle ? "text-emerald-500" : "text-neutral-400"}`}><Shuffle size={20}/></button>
                      <div className="flex items-center gap-4">
                          <button onClick={onPlayPrevious} className="p-2 text-neutral-800 dark:text-white"><SkipBack size={24}/></button>
                          <button onClick={() => { if(sound) sound.seek(Math.max(0, seek - 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><Rewind size={18}/></button>
                          <button onClick={handlePlay} className="h-12 w-12 bg-neutral-200 dark:bg-emerald-400/50 flex items-center justify-center border border-emerald-300">
                               {isLoading ? <div className="w-6 h-6 border-2 border-current border-t-transparent animate-spin" style={{ borderRadius: '50%' }}/> : <Icon size={28} fill="currentColor"/>}
                          </button>
                          <button onClick={() => { if(sound) sound.seek(Math.min(duration, seek + 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><FastForward size={18}/></button>
                          <button onClick={onPlayNext} className="p-2 text-neutral-800 dark:text-white"><SkipForward size={24}/></button>
                      </div>
                      <button onClick={() => player.setRepeatMode((player.repeatMode+1)%3)} className={`p-2 ${player.repeatMode!==0 ? "text-emerald-500" : "text-neutral-400"}`}>
                        {player.repeatMode===2 ? <Repeat1 size={20}/> : <Repeat size={20}/>}
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
            
            <div className="flex items-center gap-1">
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
                    className="text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 transition p-1.5" title="Add to Playlist"
                ><Plus size={18} /></button>

                <button onClick={handleClearPlayer} className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 transition p-1.5" title="Stop & Clear"><Square size={16} fill="currentColor" /></button>
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
            
            <div className="w-full flex items-center gap-3 -translate-y-2">
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