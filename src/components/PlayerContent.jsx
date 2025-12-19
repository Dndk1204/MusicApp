"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Howl } from "howler";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify, Plus, Square, X,
  Maximize2, ChevronUp, ChevronDown // Import thêm icon
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
  
  // State mở rộng Player trên Mobile
  const [isExpanded, setIsExpanded] = useState(false);

  const isDraggingRef = useRef(false);
  const rafRef = useRef(null);
  const playerRef = useRef(player);
  const loadedSongIdRef = useRef(null); // Track bài hát đã load EQ settings

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

  // Load EQ Settings
  const loadSongSettings = useCallback(async (songId) => {
    if (!songId) return;
    try {
      console.log("[EQ] Load settings for song:", songId, "isTunedTracksPage:", isTunedTracksPage);

      // Chỉ load EQ settings nếu đang ở trang tuned-tracks
      if (isTunedTracksPage) {
        console.log("[EQ] Loading EQ settings for tuned-tracks page");
        const { data: { session } } = await supabase.auth.getSession();
        const sessionSaved = sessionStorage.getItem(`audioSettings_${songId}`);
        if (sessionSaved) {
            const s = JSON.parse(sessionSaved);
            console.log("[EQ] Applied from sessionStorage:", s);
            setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
            return;
        }
        if (session?.user) {
          const { data: songData } = await supabase
            .from('user_song_settings').select('settings')
            .eq('user_id', session.user.id).eq('song_id', songId).single();

          if (songData?.settings) {
             const s = songData.settings;
             console.log("[EQ] Applied from database:", s);
             setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
             return;
          }
          const { data: profileData } = await supabase
            .from('profiles').select('audio_settings').eq('id', session.user.id).single();
          if (profileData?.audio_settings) {
             const s = profileData.audio_settings;
             console.log("[EQ] Applied from profile:", s);
             setBass(s.bass || 0); setMid(s.mid || 0); setTreble(s.treble || 0);
          }
        }
      } else {
        console.log("[EQ] Not on tuned-tracks page, setting to FLAT");
      }

      // Ở trang khác: luôn set về default (0, 0, 0) và xóa cache
      sessionStorage.removeItem(`audioSettings_${songId}`);
      setBass(0); setMid(0); setTreble(0);
      console.log("[EQ] Set to FLAT (0,0,0)");

    } catch (err) { console.error("Load Settings:", err); }
  }, [setBass, setMid, setTreble, isTunedTracksPage]);

  useEffect(() => {
    // Chỉ thực hiện realtime sync nếu đang ở trang tuned-tracks
    if (!userId || !isTunedTracksPage) return;

    const channel = supabase.channel('realtime-player')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_song_settings', filter: `user_id=eq.${userId}` },
        (payload) => {
            if (song?.id && String(payload.new.song_id) === String(song.id)) {
                const s = payload.new.settings;
                if(s.bass !== undefined) setBass(s.bass);
                if(s.mid !== undefined) setMid(s.mid);
                if(s.treble !== undefined) setTreble(s.treble);
            }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, song?.id, isTunedTracksPage]);

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
        // Chỉ load EQ khi thực sự là bài hát mới
        if (song?.id && loadedSongIdRef.current !== song.id) {
          console.log("[EQ] New song detected, loading settings:", song.id);
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
          setIsLoading(false); // Tắt loading ngay khi có metadata
          setError(null);
      },
    });

    setSound(newSound);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); newSound.unload(); };
  }, [songUrl]); 

  useEffect(() => {
    if (song?.id && loadedSongIdRef.current !== song.id) {
      loadSongSettings(song.id);
      loadedSongIdRef.current = song.id;
    }
  }, [song?.id, loadSongSettings]);

  // --- LOAD EQ SETTINGS KHI SONG.ID THAY ĐỔI ---
  useEffect(() => {
    if (song?.id && loadedSongIdRef.current !== song.id) {
      console.log("[EQ] Song changed, loading settings:", song.id);
      loadSongSettings(song.id);
      loadedSongIdRef.current = song.id;
    }
  }, [song?.id, loadSongSettings]);

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

  const handleClearPlayer = () => {
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
      // Pass thông tin trang hiện tại qua URL parameter
      const from = pathname === '/' ? 'home' : pathname.replace('/', '');
      router.push(`/now-playing?from=${from}`);
    }
  };

  const onSaveTunedSong = async () => {
    if (!userId || !song) return;
    try {
      let playlistId;
      const { data: playlists } = await supabase
        .from('playlists').select('id').eq('user_id', userId).eq('name', 'Tuned Songs');

      if (playlists && playlists.length > 0) {
        playlistId = playlists[0].id;
      } else {
        const { data: newPlaylist, error: insertError } = await supabase
          .from('playlists').insert({ user_id: userId, name: 'Tuned Songs' }).select('id').single();
        if (insertError) throw insertError;
        playlistId = newPlaylist.id;
      }
      
      const baseTitle = song.title;
      let uniqueTitle = baseTitle;
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase.from('songs').select('id').eq('user_id', userId).eq('title', uniqueTitle).limit(1);
        if (!existing || existing.length === 0) break;
        uniqueTitle = `${baseTitle}${counter}`;
        counter++;
      }

      const modifiedSong = { ...song, title: uniqueTitle };
      const { success, error } = await addSongToPlaylist(modifiedSong, playlistId);
      if (error) throw error;

      alert('Song saved as tuned song successfully!', 'success', 'SAVED'); 
    } catch (err) {
      console.error('Save tuned song error:', err);
      alert('Failed to save tuned song', 'error', 'ERROR');
    }
  };

  const volumePercentage = Math.round(volume * 100);

  if (!songUrl || !song) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-6 items-center bg-white dark:bg-black border-t border-neutral-300 dark:border-white/10 px-4">
      {error && <div className="absolute -top-12 bg-red-500 text-white text-xs py-1 px-3 rounded-none z-50 font-mono">Error</div>}
      
      {/* LEFT: Media Info + Actions */}
      <div className="flex w-full md:w-[20em] justify-start items-center gap-2 -translate-y-1">
        <MediaItem data={song} />
        
        {/* Nút Save Tuned */}
        <button 
            onClick={onSaveTunedSong} 
            disabled={!song} 
            className="text-neutral-400 hover:text-green-500 transition p-1.5 border border-transparent hover:border-green-500/50" 
            title="Save as Tuned Song"
        >
            <Save size={18}/>
        </button>
        
        {/* Nút Add Playlist */}
        <button 
            onClick={() => { 
                if(song) {
                    const normalizedSong = {
                        id: song.id || song.encodeId,
                        title: song.title,
                        author: song.artistsNames || song.author,
                        song_url: song.streaming?.mp3 || song.song_url,
                        image_url:
                              song.image_url?.startsWith("http")
                                ? song.image_url
                                : null,
                        image_path: song.image_path || null,
                        duration: song.duration
                    };
                    router.push(`/add-to-playlist?song=${encodeURIComponent(JSON.stringify(normalizedSong))}`); 
                }
            }} 
            disabled={!song} 
            className="
                group relative flex items-center justify-center w-7 h-7 rounded-none
                border border-neutral-400 dark:border-neutral-600 hover:border-emerald-500 
                bg-transparent hover:bg-emerald-500/10 
                text-neutral-400 hover:text-emerald-500 
                transition-all duration-200
            "
            title="Add to Playlist"
        >
            <Plus size={16} />
        </button>

        {/* --- NÚT TẮT PLAYER (STOP/CLEAR) --- */}
        <button 
            onClick={handleClearPlayer} 
            className="
                group relative flex items-center justify-center w-7 h-7 rounded-none
                border border-neutral-400 dark:border-neutral-600 hover:border-red-500 
                bg-transparent hover:bg-red-500/10 
                text-neutral-400 hover:text-red-500 
                transition-all duration-200
            "
            title="Stop & Clear"
        >
            <Square size={14} fill="currentColor" />
        </button>

        <div className="sm:block ml-2 border-l border-neutral-600 pl-3 h-8 flex items-center">
            <AudioVisualizer isPlaying={isPlaying}/>
        </div>
      </div>


      {/* ========================================================= */}
      {/* 2. DESKTOP LAYOUT (HIỆN TRÊN MÁY TÍNH >= MD) */}
      {/* ========================================================= */}
      <div className="hidden md:grid md:grid-cols-3 h-full px-4 items-center gap-6 bg-white dark:bg-black border-t border-neutral-200 dark:border-white/10">
        
        {/* LEFT: Info & Actions */}
        <div className="flex w-full md:w-[20em] justify-start items-center gap-2 -translate-y-1">
            <div className="flex-1 min-w-0">
                <MediaItem data={song} />
            </div>
            
            <div className="flex items-center gap-1">
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

        {/* CENTER: Controls & Progress */}
        <div className="flex flex-col items-center w-full max-w-[722px] gap-y-1">
            <div className="flex items-center gap-x-6 translate-y-1.5">
                <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`transition p-1 ${player.isShuffle ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"}`} title="Shuffle"><Shuffle size={16}/></button>
                <button onClick={onPlayPrevious} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><SkipBack size={20}/></button>
                <button onClick={() => { if(sound) sound.seek(Math.max(0, seek - 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><Rewind size={18}/></button>
                
                <button 
                onClick={handlePlay} 
                disabled={!sound || isLoading} 
                className="relative flex items-center justify-center h-8 !w-16 bg-neutral-200 dark:bg-emerald-400/50 text-black dark:text-emerald-100 border border-neutral-300 dark:border-emerald-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-200 rounded-none shadow-sm"
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-none animate-spin relative z-20" style={{ borderRadius: '50%' }}/> : <Icon size={20} fill="currentColor" className="relative z-20"/>}
                        <ScanlineOverlay className="absolute inset-0 z-10"/> 
                    </div>
                </button>

                <button onClick={() => { if(sound) sound.seek(Math.min(duration, seek + 5)); }} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><FastForward size={18}/></button>
                <button onClick={onPlayNext} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition hover:scale-110 p-1"><SkipForward size={20}/></button>
                <button onClick={() => player.setRepeatMode((player.repeatMode+1)%3)} className={`transition p-1 ${player.repeatMode!==0 ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"}`} title="Repeat">
                    {player.repeatMode===2 ? <Repeat1 size={16}/> : <Repeat size={16}/>}
                </button>
            </div>
            
            <div className="w-full flex items-center gap-3 -translate-y-2">
                <span className="text-[10px] font-mono text-neutral-500 w-10 text-right">{formatTime(seek)}</span>
                <div className="flex-1 h-full flex items-center">
                    <Slider value={seek} max={duration || 100} onCommit={(v) => { if(sound) sound.seek(v); }} onChange={(v) => { isDraggingRef.current=true; setSeek(v); }}/>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 w-10">{formatTime(duration)}</span>
            </div>
        </div>

        {/* RIGHT: Volume */}
        <div className="flex justify-end pr-2 gap-4 w-full items-center -translate-y-[0.25rem]">
             <div className="flex items-center gap-2 border border-neutral-300 dark:border-white/10 px-2 py-1 bg-neutral-50 dark:bg-white/5">
                 <button onClick={toggleMute}><VolumeIcon size={18} className="text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 transition"/></button>
                 <div className="w-[80px]"><Slider value={volume} max={1} step={0.01} onChange={(v) => handleVolumeChange(v)}/></div>
                 <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 font-bold w-6 text-right">{volumePercentage}%</span>
             </div>
             <button 
                onClick={navigateToFullPlayer} 
                className={`p-2 border transition-all rounded-none ${pathname==='/now-playing' ? "text-emerald-500 border-emerald-500/50 bg-emerald-500/10" : "text-neutral-500 dark:text-neutral-400 border-transparent hover:bg-neutral-200 dark:hover:bg-white/5"}`}
                title="Toggle View"
             >
                {pathname === '/now-playing' ? <X size={20}/> : <AlignJustify size={20}/>}
             </button>
        </div>
      </div>

    </div>
  );
};

export default PlayerContent;