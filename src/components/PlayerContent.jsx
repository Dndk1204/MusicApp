"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Howl } from "howler";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify, Plus, X, Save
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

// --- CUSTOM HOOKS ---
import usePlayer from "@/hooks/usePlayer";
import useTrackStats from "@/hooks/useTrackStats";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import { addSongToPlaylist } from "@/lib/addSongToPlaylist";

// --- COMPONENTS ---
import LikeButton from "./LikeButton";
import MediaItem from "./MediaItem";
import Slider from "./Slider";
import { AudioVisualizer } from "./CyberComponents";

const PlayerContent = ({ song, songUrl }) => {
  const player = usePlayer();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Kích hoạt Audio Filter Global
  const { initAudioNodes, setBass, setMid, setTreble } = useAudioFilters();

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

  useEffect(() => { playerRef.current = player; }, [player]);

  const clampVolume = (val) => Math.max(0, Math.min(1, val));

  // --- 0. LẤY USER ID ---
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id);
    };
    getUser();
  }, []);

  // --- 1. VOLUME ---
  useEffect(() => {
    if (player.volume !== undefined && Math.abs(player.volume - volume) > 0.01) {
        setVolume(player.volume);
        if (sound) sound.volume(player.volume);
    }
  }, [player.volume]);

  // --- 2. LOAD SETTINGS ---
  const loadSongSettings = useCallback(async (songId) => {
    if (!songId) return;
    try {
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
    } catch (err) { console.error("Load Settings:", err); }
  }, [setBass, setMid, setTreble]);

  // --- 3. REALTIME ---
  useEffect(() => {
    if (!userId) return;
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
  }, [userId, song?.id]);

  // --- 4. PLAYBACK ---
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

  // --- 5. HOWLER ---
  useEffect(() => {
    if (sound) sound.unload();
    setIsLoading(true); setSeek(0); setError(null);

    const initialVol = clampVolume(player.volume ?? 1); 
    setVolume(initialVol);

    const newSound = new Howl({
      src: [songUrl], format: ["mp3", "mpeg"], volume: initialVol,
      html5: false, // FALSE for EQ
      preload: "metadata", autoplay: true,
      loop: playerRef.current.repeatMode === 2, 
      onplay: () => {
        setIsPlaying(true); setDuration(newSound.duration());
        initAudioNodes();
        if (song?.id) loadSongSettings(song.id);
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
      onload: () => { setDuration(newSound.duration()); setIsLoading(false); setError(null); },
      onloaderror: (id, err) => { console.error("Err:", err); setIsLoading(false); },
    });

    setSound(newSound);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); newSound.unload(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl]); 

  useEffect(() => { if (sound) sound.loop(player.repeatMode === 2); }, [player.repeatMode, sound]);

  const handlePlay = () => { if (!sound) return; if (!isPlaying) { sound.play(); initAudioNodes(); } else sound.pause(); };
  
  const handleVolumeChange = (value, syncGlobal = true) => {
    const v = clampVolume(parseFloat(value));
    setVolume(v);
    if (sound) sound.volume(v);
    if (syncGlobal) player.setVolume(v);
  };

  const handleSeekChange = (nv) => { isDraggingRef.current = true; setSeek(nv); };
  const handleSeekCommit = (nv) => { if (sound) sound.seek(nv); isDraggingRef.current = false; };
  const toggleMute = () => handleVolumeChange(volume === 0 ? 1 : 0);
  const formatTime = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  const Icon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  // --- HÀM TOGGLE ĐƯỢC THÊM TẠI ĐÂY ---
  const toggleNowPlaying = () => {
    if (pathname === '/now-playing') {
      router.back();
    } else {
      router.push('/now-playing');
    }
  };

  // Nút Save Tuned Song
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

      alert('Song saved as tuned song successfully!'); 
    } catch (err) {
      console.error('Save tuned song error:', err);
      setError('Failed to save tuned song');
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-6 items-center">
      {error && <div className="absolute -top-12 bg-red-500 text-white text-xs py-1 px-3 rounded z-50">Error</div>}
      
      {/* LEFT: Media Info + Actions */}
      <div className="flex w-[20em] justify-start items-center gap-3 mb-2.5">
        <MediaItem data={song} />
        <LikeButton songId={song?.id} />
        
        {/* Nút Save Tuned */}
        <button 
            onClick={onSaveTunedSong} 
            disabled={!song} 
            className="text-neutral-400 hover:text-green-500 transition hover:scale-110" 
            title="Save as Tuned Song"
        >
            <Save size={20}/>
        </button>
        
        {/* Nút Add Playlist */}
        <button 
            onClick={() => { 
                if(song) {
                    const normalizedSong = {
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
            className="
                group relative flex items-center justify-center w-8 h-8 rounded-full 
                border border-neutral-600 hover:border-emerald-500 
                bg-white/5 hover:bg-emerald-500/10 
                text-neutral-400 hover:text-emerald-500 
                transition-all duration-300
            "
            title="Add to Playlist"
        >
            <Plus size={18} />
             <div className="absolute inset-0 rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity pointer-events-none" />
        </button>

        <div className="hidden sm:block ml-1"><AudioVisualizer isPlaying={isPlaying}/></div>
      </div>

      {/* CENTER: CONTROLS */}
      <div className="hidden md:flex flex-col items-center w-full max-w-[722px] gap-y-1">
        <div className="flex items-center gap-x-4 translate-y-1.5">
          <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`transition ${player.isShuffle ? "text-emerald-500" : "text-neutral-400 hover:text-white"}`} title="Shuffle"><Shuffle size={16}/></button>
          
          <button onClick={onPlayPrevious} className="text-neutral-400 hover:text-white transition hover:scale-110"><SkipBack size={20}/></button>
          
          <button onClick={() => { if(sound) sound.seek(Math.max(0, seek - 5)); }} className="text-neutral-400 hover:text-white transition hover:scale-110">
             <Rewind size={18}/>
          </button>
          
          <button 
            onClick={handlePlay} 
            disabled={!sound || isLoading} 
            className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-400 text-black hover:scale-110 transition shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
             {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Icon size={20} fill="currentColor"/>}
          </button>

          <button onClick={() => { if(sound) sound.seek(Math.min(duration, seek + 5)); }} className="text-neutral-400 hover:text-white transition hover:scale-110">
             <FastForward size={18}/>
          </button>

          <button onClick={onPlayNext} className="text-neutral-400 hover:text-white transition hover:scale-110"><SkipForward size={20}/></button>
          
          <button onClick={() => player.setRepeatMode((player.repeatMode+1)%3)} className={`transition ${player.repeatMode!==0 ? "text-emerald-500" : "text-neutral-400 hover:text-white"}`} title="Repeat">
             {player.repeatMode===2 ? <Repeat1 size={16}/> : <Repeat size={16}/>}
          </button>
        </div>
        
        <div className="w-full flex items-center gap-2 -translate-y-2">
            <span className="text-xs font-mono text-neutral-400 w-10 text-right">{formatTime(seek)}</span>
            <div className="flex-1"><Slider value={seek} max={duration || 100} onCommit={handleSeekCommit} onChange={handleSeekChange}/></div>
            <span className="text-xs font-mono text-neutral-400 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Volume & View Switcher */}
      <div className="hidden md:flex justify-end pr-2 gap-2 w-full items-center -translate-y-1.5">
         <button onClick={toggleMute}><VolumeIcon size={20} className="text-neutral-400 hover:text-emerald-500 transition"/></button>
         <div className="w-[100px]"><Slider value={volume} max={1} step={0.01} onChange={(v) => handleVolumeChange(v)}/></div>
         
         <button 
            onClick={toggleNowPlaying} 
            className={`p-1 rounded-md transition-colors hover:bg-white/10 ${pathname==='/now-playing' ? "text-emerald-500" : "text-neutral-400 hover:text-white"}`}
            title={pathname==='/now-playing' ? "Close Player" : "Open Player"}
         >
            {pathname === '/now-playing' ? <X size={20}/> : <AlignJustify size={20}/>}
         </button>
      </div>

      {/* MOBILE */}
      <div className="flex md:hidden col-auto justify-end items-center">
        <button onClick={handlePlay} disabled={!sound || isLoading} className="h-8 w-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg">
           {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Icon size={20} fill="currentColor"/>}
        </button>
      </div>
    </div>
  );
};

export default PlayerContent;
