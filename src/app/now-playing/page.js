"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Howler } from "howler"; 
import { 
  Info, 
  Loader2, 
  Save, 
  ArrowLeft, 
  Sliders,
  UserCheck,
  ShieldCheck,
  Activity,
  FileText,
  Mic2,
  AlertTriangle,
  ListMusic
} from "lucide-react";

// --- IMPORTS ---
import usePlayer from "@/hooks/usePlayer";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import Slider from "@/components/Slider";
import SpectrumVisualizer from "@/components/SpectrumVisualizer";
import useUI from "@/hooks/useUI";
import { GlitchText, CyberButton, GlitchButton, ScanlineOverlay } from "@/components/CyberComponents";
// Import Hover Preview
import HoverImagePreview from "@/components/HoverImagePreview";

// ==================================================================================
// --- 1. SRT PARSER ---
// ==================================================================================
const parseSRT = (text) => {
    if (!text) return [];
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const blocks = normalized.split(/\n\s*\n/);
    const results = blocks.map(block => {
        const lines = block.split("\n").map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 2) return null;
        const timeLineIndex = lines.findIndex(l => l.includes("-->"));
        if (timeLineIndex === -1) return null;
        const timeString = lines[timeLineIndex].split("-->")[0].trim(); 
        const match = timeString.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/);
        if (!match) return null;
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        const milliseconds = parseInt(match[4]);
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000);
        const contentLines = lines.slice(timeLineIndex + 1);
        const content = contentLines.join(" "); 
        if (!content) return null;
        return { time: totalSeconds, content: content };
    }).filter(Boolean);
    return results;
};

// --- CẤU HÌNH EQ MẶC ĐỊNH ---
const SONG_DEFAULTS = {
    '1873426': { bass: 8, mid: 2, treble: -2 }, 
    '1873427': { bass: -2, mid: 6, treble: 4 }, 
};

const getValuesForSong = (song) => {
    if (!song) return null;
    if (SONG_DEFAULTS[song.id]) return SONG_DEFAULTS[song.id];
    if (song.author && (song.author.toLowerCase().includes('alan walker'))) {
        return { bass: 10, mid: 2, treble: 5 };
    }
    return null; 
};

// --- SKELETON LOADER ---
const NowPlayingSkeleton = () => {
  return (
    <div className="w-full h-[85vh] lg:h-[70vh] grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 pb-[120px] overflow-hidden bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative border-r border-dashed border-neutral-300 dark:border-white/10 pr-4">
             <div className="w-[200px] h-[200px] md:w-[350px] md:h-[350px] rounded-full bg-neutral-300 dark:bg-neutral-800 border-4 border-neutral-400 dark:border-white/5 flex items-center justify-center relative">
                 <div className="w-[65%] h-[65%] rounded-full bg-neutral-400 dark:bg-neutral-700"></div>
             </div>
             <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-md">
                 <div className="h-10 w-3/4 bg-neutral-300 dark:bg-white/10 rounded-none"></div>
                 <div className="h-4 w-1/3 bg-neutral-300 dark:bg-white/10 rounded-none"></div>
                 <div className="mt-2 h-8 w-40 bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-none"></div>
             </div>
        </div>
        <div className="hidden lg:flex h-[100%] lg:col-span-3 flex-col bg-white/5 border border-neutral-200 dark:border-white/10">
            <div className="h-12 border-b border-neutral-200 dark:border-white/10 flex items-center justify-center">
                 <div className="h-3 w-24 bg-neutral-300 dark:bg-white/10"></div>
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border border-transparent">
                        <div className="w-8 h-8 bg-neutral-300 dark:bg-white/10 rounded-none"></div>
                        <div className="flex-1 space-y-1">
                            <div className="h-3 w-2/3 bg-neutral-300 dark:bg-white/10"></div>
                            <div className="h-2 w-1/3 bg-neutral-300 dark:bg-white/10"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-white/5 border border-neutral-200 dark:border-white/10">
             <div className="flex h-12 border-b border-neutral-200 dark:border-white/10">
                 <div className="flex-1 bg-white/10 m-1"></div>
                 <div className="flex-1 m-1"></div>
                 <div className="flex-1 m-1"></div>
             </div>
             <div className="flex-1 p-6 flex flex-col justify-center gap-8">
                 <div className="h-40 w-full bg-neutral-300 dark:bg-white/5 mb-4"></div>
                 <div className="space-y-6">
                     <div className="h-4 w-full bg-neutral-300 dark:bg-white/10"></div>
                     <div className="h-4 w-full bg-neutral-300 dark:bg-white/10"></div>
                     <div className="h-4 w-full bg-neutral-300 dark:bg-white/10"></div>
                 </div>
             </div>
        </div>
    </div>
  )
}

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alert } = useUI();
  const fromPage = searchParams.get('from'); 
  const { initAudioNodes, setBass, setMid, setTreble, initAnalyzer } = useAudioFilters();

  const [song, setSong] = useState(null);
  const [realDuration, setRealDuration] = useState(0); 
  const [seek, setSeek] = useState(0); 
  
  const [activeTab, setActiveTab] = useState('visual'); 
  
  const [rawLyrics, setRawLyrics] = useState(null);
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const lyricsContainerRef = useRef(null);
  const [queueSongs, setQueueSongs] = useState([]);
  const [audioSettings, setAudioSettings] = useState({ bass: 0, mid: 0, treble: 0, volume: 100 });
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(true);

  const audioHandlers = useRef({ setBass, setMid, setTreble });
  const durationCheckRef = useRef(null);
  const seekRef = useRef(0); 

  useEffect(() => {
    if (player.isPlaying !== undefined) setIsPlaying(player.isPlaying);
  }, [player.isPlaying]);

  useEffect(() => {
      setIsMounted(true);
      initAudioNodes();
      initAnalyzer();
  }, [initAudioNodes, initAnalyzer]);

  useEffect(() => {
      audioHandlers.current = { setBass, setMid, setTreble };
  }, [setBass, setMid, setTreble]);

  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth >= 1024) {
              setActiveTab('equalizer');
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array - only run on mount/unmount

  const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds) || seconds === 0) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (durationCheckRef.current) clearInterval(durationCheckRef.current);
    durationCheckRef.current = setInterval(() => {
        const activeSound = Howler._howls.find(h => h.state() === 'loaded' && h.duration() > 0);
        if (activeSound) {
            setRealDuration(activeSound.duration());
            if(activeSound.playing()) {
                const currentSeek = activeSound.seek();
                setSeek(currentSeek); 
                seekRef.current = currentSeek;
            }
        }
    }, 200); 
    return () => { if (durationCheckRef.current) clearInterval(durationCheckRef.current); };
  }, [player.activeId]);

  useEffect(() => {
    if (!isMounted) return;
    const updateSong = async () => {
        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));
        if (!player.activeId) { setSong(null); await minDelay; setLoading(false); return; }
        try {
            const { data: dbSong } = await supabase.from('songs').select(`*, profiles (full_name, role, avatar_url)`).eq('id', player.activeId).maybeSingle();
            if (dbSong) {
                let uploaderName = "Unknown User"; let uploaderRole = "user"; let uploaderAvatar = null;
                if (dbSong.profiles) { uploaderName = dbSong.profiles.full_name || "Anonymous User"; uploaderRole = dbSong.profiles.role; uploaderAvatar = dbSong.profiles.avatar_url; }
                else { uploaderName = "System Admin"; uploaderRole = "admin"; }
                setSong({ id: dbSong.id, title: dbSong.title, author: dbSong.author, image_path: dbSong.image_url, song_url: dbSong.song_url, uploader: uploaderName, uploader_role: uploaderRole, uploader_avatar: uploaderAvatar, uploader_id: dbSong.user_id, is_public: dbSong.is_public, source: 'database', lyric_url: dbSong.lyric_url, lyrics: dbSong.lyrics });
            } else {
                if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
                    const cached = window.__SONG_MAP__[player.activeId];
                    setSong({ ...cached, uploader: "Jamendo Network", uploader_role: "system", uploader_avatar: null, source: 'api' });
                } else {
                    const CLIENT_ID = '3501caaa';
                    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${player.activeId}&include=musicinfo&audioformat=mp31`);
                    const data = await res.json();
                    if (data.results && data.results[0]) {
                        const track = data.results[0];
                        const newSong = { id: track.id, title: track.name, author: track.artist_name, song_path: track.audio, image_path: track.image || track.album_image, duration: track.duration, external_id: track.id.toString(), is_public: true, song_url: track.audio, uploader: "Jamendo Network", uploader_role: "system", uploader_avatar: null, source: "api" };
                        setSong(newSong);
                        setRealDuration(track.duration);
                        if (typeof window !== 'undefined') window.__SONG_MAP__ = { ...window.__SONG_MAP__, [newSong.id]: newSong };
                    } else { setSong(null); }
                }
            }
        } catch (error) { console.error("Error fetching song:", error); setSong(null); } finally { await minDelay; setLoading(false); }
    };
    updateSong();
  }, [player.activeId, isMounted]);

  // Set active tab to 'info' (meta tab) when song changes
  useEffect(() => {
    if (player.activeId) {
      setActiveTab('info');
    }
  }, [player.activeId]);

  useEffect(() => { if (song) { setRawLyrics(null); setParsedLyrics([]); setActiveLineIndex(-1); setLoadingLyrics(false); } }, [song?.id]);

  useEffect(() => {
    if (activeTab === 'lyrics' && song) {
        const fetchLyrics = async () => {
            if (rawLyrics || (!song.lyric_url && !song.lyrics)) { if (!song.lyric_url && !song.lyrics) setRawLyrics("NO_LYRICS_AVAILABLE"); return; }
            setLoadingLyrics(true);
            try { let text = ""; if (song.lyrics) { text = song.lyrics; } else if (song.lyric_url) { const res = await fetch(song.lyric_url); if (!res.ok) throw new Error("Failed to fetch lyrics file"); text = await res.text(); } setRawLyrics(text); const parsed = parseSRT(text); setParsedLyrics(parsed); } catch (err) { console.error("Error loading lyrics:", err); setRawLyrics("ERROR_LOADING_DATA"); } finally { setLoadingLyrics(false); }
        };
        fetchLyrics();
    }
  }, [activeTab, song]);

  useEffect(() => {
    const fetchQueueSongs = async () => {
      if (!player.ids || player.ids.length === 0) { setQueueSongs([]); return; }
      try {
        const queueIds = player.ids; if (queueIds.length === 0) { setQueueSongs([]); return; }

        // First, try to get songs from local database
        const { data: localSongs, error } = await supabase.from('songs').select('id, title, author, image_url').in('id', queueIds);
        if (error) { console.error('Error fetching local songs:', error); }

        // Check for cached songs in window.__SONG_MAP__
        const cachedSongs = [];
        if (typeof window !== 'undefined' && window.__SONG_MAP__) {
          queueIds.forEach(id => {
            if (window.__SONG_MAP__[id]) {
              cachedSongs.push(window.__SONG_MAP__[id]);
            }
          });
        }

        // Combine local and cached songs
        const allSongsMap = new Map();

        // Add local songs
        if (localSongs) {
          localSongs.forEach(song => {
            allSongsMap.set(song.id, {
              id: song.id,
              title: song.title,
              author: song.author,
              image_path: song.image_url || '/images/default_song.png'
            });
          });
        }

        // Add cached songs (will override local if same ID)
        cachedSongs.forEach(song => {
          allSongsMap.set(song.id, {
            id: song.id,
            title: song.title,
            author: song.author,
            image_path: song.image_path || song.image_url || '/images/default_song.png'
          });
        });

        // For any missing songs, try to fetch from API
        const missingIds = queueIds.filter(id => !allSongsMap.has(id));
        if (missingIds.length > 0) {
          const apiPromises = missingIds.map(async (songId) => {
            try {
              const res = await fetch(`/api/get-song?id=${songId}`);
              const data = await res.json();
              if (data.song) {
                return {
                  id: data.song.id,
                  title: data.song.title,
                  author: data.song.author,
                  image_path: data.song.image_path || data.song.image_url || '/images/default_song.png'
                };
              }
            } catch (err) {
              console.error(`Failed to fetch song ${songId} from API:`, err);
            }
            return null;
          });

          const apiSongs = await Promise.all(apiPromises);
          apiSongs.filter(song => song).forEach(song => {
            allSongsMap.set(song.id, song);
          });
        }

        // Create sorted queue data
        const sortedQueueData = queueIds.map(queueId => allSongsMap.get(queueId)).filter(Boolean);
        setQueueSongs(sortedQueueData);
      } catch (err) {
        console.error('Error in fetchQueueSongs:', err);
        setQueueSongs([]);
      }
    };
    fetchQueueSongs();
  }, [player.ids, player.activeId]);

  useEffect(() => { if (parsedLyrics.length > 0) { const index = parsedLyrics.findIndex((line, i) => { const nextLine = parsedLyrics[i + 1]; return seek >= line.time && (!nextLine || seek < nextLine.time); }); if (index !== -1 && index !== activeLineIndex) { setActiveLineIndex(index); const element = document.getElementById(`lyric-line-${index}`); if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } } }, [seek, parsedLyrics]);

  const applySettings = useCallback((settings) => { setAudioSettings(prev => ({...prev, ...settings})); const handlers = audioHandlers.current; if (settings.bass !== undefined && handlers.setBass) handlers.setBass(settings.bass); if (settings.mid !== undefined && handlers.setMid) handlers.setMid(settings.mid); if (settings.treble !== undefined && handlers.setTreble) handlers.setTreble(settings.treble); }, []);

  const handleAudioChange = (key, value) => { const numValue = parseFloat(value); setAudioSettings(prev => ({ ...prev, [key]: numValue })); if (['bass', 'mid', 'treble'].includes(key)) { if (song?.id) { const handlers = audioHandlers.current; setTimeout(() => { if (key === 'bass' && handlers.setBass) handlers.setBass(numValue); if (key === 'mid' && handlers.setMid) handlers.setMid(numValue); if (key === 'treble' && handlers.setTreble) handlers.setTreble(numValue); }, 0); } } };

  useEffect(() => {
    const loadSettings = async () => {
      if (!song?.id) return;
      try {
        if (fromPage === 'tuned-tracks') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) { const { data: songSetting } = await supabase.from('user_song_settings').select('settings').eq('user_id', session.user.id).eq('song_id', song.id).maybeSingle(); if (songSetting?.settings) { applySettings({ ...songSetting.settings, volume: audioSettings.volume }); return; } }
          const hardcodedDefault = getValuesForSong(song); if (hardcodedDefault) { applySettings({ ...hardcodedDefault, volume: audioSettings.volume }); return; }
          if (session?.user) { const { data: profile } = await supabase.from('profiles').select('audio_settings').eq('id', session.user.id).single(); if (profile?.audio_settings) { applySettings(profile.audio_settings); return; } }
        }
        applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
      } catch (err) { console.error(err); }
    };
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, fromPage]);

  const handleSaveSettings = async () => { if (!song?.id) return; setIsSaving(true); try { const { data: { session } } = await supabase.auth.getSession(); if (!session?.user) { alert("Please login to save.", "error"); return; } await supabase.from('user_song_settings').upsert({ user_id: session.user.id, song_id: song.id, settings: audioSettings, updated_at: new Date().toISOString(), song_title: song.title, song_author: song.author }, { onConflict: 'user_id, song_id' }); sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(audioSettings)); alert(`EQ Settings saved to Tuned Tracks!`, "success", "SAVED"); } catch (err) { console.error(err); } finally { setIsSaving(false); } };

  const isPresetActive = (preset) => { return audioSettings.bass === preset.bass && audioSettings.mid === preset.mid && audioSettings.treble === preset.treble; };

  if (!isMounted) return null;
  if (loading) return <NowPlayingSkeleton />;
  if (!player.activeId || !song) {
      return (
          <div className="w-full h-[70vh] flex items-center justify-center bg-neutral-100 dark:bg-black relative">
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-red-500/50 bg-black/50 backdrop-blur-md shadow-2xl shadow-red-500/10">
                  <AlertTriangle size={48} className="text-red-500 mb-4 animate-pulse"/>
                  <h1 className="text-2xl font-black font-mono text-white tracking-wider uppercase">NO_ACTIVE_TRACK</h1>
                  <p className="text-sm font-mono text-neutral-400 mt-2">Please select a song from your library or a playlist.</p>
                  <GlitchButton onClick={() => router.push('/')} className="mt-6 text-xs px-6 py-2 border-red-500 text-red-400 hover:text-white">GO_TO_BROWSE</GlitchButton>
              </div>
          </div>
      );
  }

  return (
    // MAIN CONTAINER: Padding bottom lớn để không bị che bởi Floating Nav
    <div className="w-full min-h-[85vh] lg:h-[70vh] grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 pb-[120px] lg:pb-[100px] overflow-y-auto lg:overflow-hidden bg-neutral-100 dark:bg-black transition-colors animate-in fade-in duration-500 relative">

      {/* --- CỘT TRÁI (VISUAL & INFO) --- */}
      {/* ALWAYS VISIBLE ON MOBILE (order-1, flex) */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative perspective-1000 min-h-[50vh] lg:h-full border-r border-dashed border-neutral-300 dark:border-white/10 lg:pr-4 order-1">
          
          <div className="relative flex items-center justify-center scale-90 md:scale-100 mt-4 lg:mt-0">
              {/* FUI Circle */}
              <div className={`relative w-[220px] h-[220px] md:w-[350px] md:h-[350px] flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}>
                 <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/30"></div>
                 <div className="absolute inset-4 rounded-full border border-neutral-800 dark:border-white/10"></div>
                 <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border-2 border-transparent border-t-emerald-500/50 border-b-emerald-500/50 rotate-45"></div>
                 
                 {/* Main Art Container */}
                 <div className="absolute inset-0 m-auto w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-neutral-300 dark:border-neutral-800 bg-black shadow-2xl group">
                      <img 
                        src={song.image_path || song.image_url || "/images/default_song.png"} 
                        className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        alt="Cover"
                      />
                      <ScanlineOverlay />
                 </div>
              </div>
          </div>

          <div className="mt-4 lg:mt-2 text-center z-20 space-y-2 max-w-lg w-full flex flex-col items-center">
             {/* Title - Đã xóa Marquee, dùng GlitchText tĩnh */}
             <div className="w-full px-4 overflow-hidden">
                <h1 className="text-2xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase font-mono w-full truncate text-center">
                    <GlitchText text={song.title} />
                </h1>
             </div>

             <div className="flex items-center justify-center gap-2 w-full px-4 lg:px-12">
                 <span className="w-4 md:w-8 h-px bg-emerald-500 shrink-0"></span>
                 {/* Author - Đã xóa Marquee, dùng text tĩnh */}
                 <div className="overflow-hidden max-w-[200px] md:max-w-[300px]">
                    <p className="text-xs md:text-base font-bold font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase truncate text-center">
                        {song.author}
                    </p>
                 </div>
                 <span className="w-4 md:w-8 h-px bg-emerald-500 shrink-0"></span>
             </div>

             <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-white/50 dark:bg-white/5 px-4 py-2 border border-neutral-300 dark:border-white/10 mx-auto backdrop-blur-sm w-fit mb-4 lg:mb-0">
                 <span className="uppercase tracking-widest opacity-70 border-r border-neutral-400 dark:border-white/20 pr-2 mr-2">UPLOADED_BY</span>
                 {song.uploader_id ? (
                     <button
                         onClick={() => router.push(`/user/${song.uploader_id}`)}
                         className={`font-bold flex items-center gap-2 hover:opacity-80 transition-opacity ${song.uploader_role === 'admin' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}
                     >
                         {song.uploader_role === 'admin' ? <ShieldCheck size={14} className="text-yellow-500"/> : <UserCheck size={14} className="text-blue-500"/>}
                         <span className="text-sm uppercase">{song.uploader}</span>
                     </button>
                 ) : (
                     <span className={`font-bold flex items-center gap-2 ${song.uploader_role === 'admin' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                         {song.uploader_role === 'admin' ? <ShieldCheck size={14} className="text-yellow-500"/> : <UserCheck size={14} className="text-blue-500"/>}
                         <span className="text-sm uppercase">{song.uploader}</span>
                     </span>
                 )}
             </div>
          </div>
          
          <button onClick={() => router.back()} className="absolute top-0 left-0 lg:hidden p-4 text-neutral-500 hover:text-emerald-500 z-50"><ArrowLeft size={24} /></button>
          
          {fromPage && (
            <div className="hidden lg:block absolute top-[9rem] right-[13.6rem] z-50 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-500">
                <div className="relative flex items-center group"> 
                    <div className="relative h-8 w-8 flex translate-x-10 !items-center !justify-center shrink-0">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_currentColor] z-10 translate-x-1 translate-y-[0.05rem]"></div>
                        <div className="absolute w-full h-full border border-emerald-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        <div className="absolute w-2/3 h-2/3 border border-emerald-500/50 rounded-full border-t-transparent border-l-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
                        <div className="absolute left-[100%] top-1/2 w-36 h-[1px] bg-emerald-500/60"></div>
                        <div className="absolute left-[7rem] transform -rotate-45 top-[-0.25rem] w-14 h-[1px] bg-emerald-500/70"></div>
                        <div className="absolute left-[9.99rem] top-[-1.5rem] w-12 h-[1px] bg-emerald-500/60"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_currentColor] z-10 translate-x-40 translate-y-[0.05rem]"></div>
                    </div>
                    <div className="ml-3 text-left translate-x-44 -translate-y-12">
                        <div className="text-[9px] text-emerald-500/60 font-mono tracking-[0.2em] mb-0.5">SYSTEM_SOURCE</div>
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold font-mono text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] backdrop-blur-sm">
                            {fromPage}
                        </div>
                    </div>
                </div>
            </div>
          )}
      </div>

      {/* --- MOBILE TABS NAVIGATION (FLOATING, SQUARE, Z-INDEX 99999) --- */}
      <div className="lg:hidden flex fixed bottom-2 left-1/2 -translate-x-1/2 w-[100%] max-w-md justify-center z-[99999]">
          <div className="flex w-full bg-neutral-900/95 dark:bg-black/95 backdrop-blur-xl border border-neutral-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <button onClick={() => setActiveTab('visual')} className={`flex-1 py-3 flex justify-center items-center border-r border-white/10 rounded-none transition-colors ${activeTab==='visual' ? 'text-emerald-500 bg-white/5' : 'text-neutral-400'}`}><Activity size={20}/></button>
              <button onClick={() => setActiveTab('queue')} className={`flex-1 py-3 flex justify-center items-center border-r border-white/10 rounded-none transition-colors ${activeTab==='queue' ? 'text-emerald-500 bg-white/5' : 'text-neutral-400'}`}><ListMusic size={20}/></button>
              <button onClick={() => setActiveTab('lyrics')} className={`flex-1 py-3 flex justify-center items-center border-r border-white/10 rounded-none transition-colors ${activeTab==='lyrics' ? 'text-emerald-500 bg-white/5' : 'text-neutral-400'}`}><Mic2 size={20}/></button>
              <button onClick={() => setActiveTab('equalizer')} className={`flex-1 py-3 flex justify-center items-center border-r border-white/10 rounded-none transition-colors ${activeTab==='equalizer' ? 'text-emerald-500 bg-white/5' : 'text-neutral-400'}`}><Sliders size={20}/></button>
              <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 flex justify-center items-center rounded-none transition-colors ${activeTab==='info' ? 'text-emerald-500 bg-white/5' : 'text-neutral-400'}`}><Info size={20}/></button>
          </div>
      </div>

      {/* --- CỘT GIỮA (QUEUE) --- */}
      <div className={`lg:col-span-3 flex flex-col h-[50vh] lg:h-[103%] w-full lg:w-[80%] bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-none overflow-hidden shadow-xl z-20 relative lg:-translate-x-10 order-2 ${activeTab === 'queue' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 z-40"></div>
          <div className="flex items-center justify-center border-b border-neutral-200 dark:border-white/10 shrink-0 py-4">
             <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">:: PLAY_QUEUE ::</h3>
          </div>
          <div className="flex-1 min-h-0 p-4 custom-scrollbar overflow-y-auto">
             {queueSongs.length > 0 ? (
                <div className="space-y-2">
                   {queueSongs.map((queueSong) => {
                      const isCurrentlyPlaying = queueSong.id === song.id;
                      return (
                         <div
                            key={queueSong.id}
                            className={`p-2 border group rounded-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-white/10 ${
                               isCurrentlyPlaying ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10'
                            }`}
                            onClick={() => player.setId(queueSong.id)}
                         >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 shrink-0 relative cursor-none">
                                   <HoverImagePreview 
                                        src={queueSong.image_path} 
                                        alt={queueSong.title}
                                        className="w-full h-full"
                                        previewSize={160}
                                        fallbackIcon="disc"
                                   >
                                        <img
                                           src={queueSong.image_path}
                                           className={`w-full h-full object-cover border transition-all duration-300 grayscale group-hover:grayscale-0 ${isCurrentlyPlaying ? 'border-emerald-500/50' : 'border-neutral-300 dark:border-white/20'}`}
                                           alt="Queue"
                                        />
                                   </HoverImagePreview>
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold font-mono truncate ${isCurrentlyPlaying ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-white'}`}>{queueSong.title}</p>
                                  <p className="text-[10px] font-mono text-neutral-500 truncate">{queueSong.author}</p>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
                   <p className="text-xs font-mono">NO_QUEUE_ITEMS</p>
                </div>
             )}
          </div>
      </div>

      {/* --- CỘT PHẢI (TABS: EQ, LYRICS, INFO) --- */}
      <div className={`lg:col-span-3 flex flex-col w-full lg:w-[135%] h-[60vh] lg:h-[103%] bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-none overflow-hidden shadow-2xl z-30 relative lg:-translate-x-24 order-2 ${(activeTab === 'equalizer' || activeTab === 'lyrics' || activeTab === 'info') ? 'flex' : 'hidden lg:flex'}`}>
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 z-40"></div>

          {/* TAB HEADER (DESKTOP ONLY) */}
          <div className="hidden lg:flex border-b border-neutral-200 dark:border-white/10 shrink-0">
                <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-none relative ${activeTab === 'info' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}>
                    <Info size={14}/> META
                    {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                </button>
                <button onClick={() => setActiveTab('lyrics')} className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-none relative ${activeTab === 'lyrics' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}>
                    <Mic2 size={14}/> LYRICS
                    {activeTab === 'lyrics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                </button>
                <button onClick={() => setActiveTab('equalizer')} className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-none relative ${activeTab === 'equalizer' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}>
                    <Sliders size={14}/> EQ
                    {activeTab === 'equalizer' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                </button>
          </div>

          <div className="flex-1 min-h-0 p-6 custom-scrollbar relative overflow-hidden flex flex-col w-full h-full pb-20 lg:pb-6">
            
            {/* 1. EQUALIZER */}
            {activeTab === 'equalizer' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300 w-full relative">
                    <h3 className="shrink-0 text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-2 flex justify-between border-b border-neutral-200 dark:border-white/10 pb-2 z-10">
                        <span className="flex items-center gap-2"><Activity size={12}/> AUDIO_PROCESSING_UNIT</span>
                        <span className="opacity-50">FREQ_MOD</span>
                    </h3>
                    <div className="flex-1 flex flex-col justify-center w-full min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="h-[140px] md:h-[180px] translate-y-20 shrink-0 w-full relative flex items-center justify-center">
                             <div className="w-full h-full absolute inset-0">
                                 <SpectrumVisualizer isPlaying={isPlaying} />
                             </div>
                        </div>
                        <div className="shrink-0 space-y-4 px-1">
                            <div className="space-y-3">
                                {[
                                    { id: 'bass', label: 'Bass_Freq', min: -15, max: 15 },
                                    { id: 'mid', label: 'Mid_Freq', min: -15, max: 15 },
                                    { id: 'treble', label: 'High_Freq', min: -15, max: 15 }
                                ].map((item) => (
                                    <div key={item.id} className="flex flex-col gap-y-1">
                                            <div className="flex justify-between text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400">
                                                <label>{item.label}</label>
                                                <span className="bg-neutral-200 dark:bg-white/10 px-1 text-black dark:text-white border border-neutral-300 dark:border-white/10 font-bold min-w-[30px] text-center">{audioSettings[item.id] > 0 ? '+' : ''}{audioSettings[item.id]}dB</span>
                                            </div>
                                            <Slider value={audioSettings[item.id]} max={item.max} min={item.min} step={1} onChange={(val) => handleAudioChange(item.id, val)} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2 w-full">
                                <CyberButton onClick={handleSaveSettings} disabled={isSaving} className="flex-1 w-full text-neutral-400 dark:hover:!text-white hover:text-green-500 transition p-1.5 justify-center border border-transparent hover:border-green-500/50 flex items-center gap-2 rounded-none" title="Save EQ Configuration">
                                    {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>}
                                    <span className="text-xs font-mono">SAVE_CONFIG</span>
                                </CyberButton>
                            </div>
                            <div className="border-t border-dashed border-neutral-300 dark:border-white/10 pt-2">
                                <p className="text-[8px] font-mono text-neutral-400 uppercase mb-2 tracking-widest">:: PRESET_MATRIX ::</p>
                                <div className="overflow-x-auto custom-scrollbar pb-1">
                                    <div className="flex gap-2 min-w-max">
                                            {['FLAT', 'BASS_BOOST', 'DYNAMIC', 'ROCK', 'POP', 'JAZZ', 'ELECTRONIC', 'INDIE', 'CLASSIC', 'HIPHOP', 'VOCAL', 'CINEMATIC'].map((name) => {
                                                const presets = { 'FLAT': {bass: 0, mid: 0, treble: 0}, 'BASS_BOOST': {bass: 10, mid: 2, treble: -3}, 'DYNAMIC': {bass: 7, mid: 3, treble: 7}, 'ROCK': {bass: 8, mid: 4, treble: 2}, 'POP': {bass: 5, mid: 8, treble: 5}, 'JAZZ': {bass: 6, mid: -2, treble: 8}, 'ELECTRONIC': {bass: 12, mid: 5, treble: -4}, 'INDIE': {bass: 3, mid: 7, treble: 6}, 'CLASSIC': {bass: 4, mid: -3, treble: 9}, 'HIPHOP': {bass: 11, mid: 6, treble: 1}, 'VOCAL': {bass: 2, mid: 12, treble: 4}, 'CINEMATIC': {bass: 9, mid: 3, treble: 3} };
                                                const values = presets[name];
                                                return (
                                                <button key={name} onClick={() => applySettings({ ...values, volume: audioSettings.volume })} className={`text-[9px] font-mono py-1.5 px-2 border transition-all duration-300 whitespace-nowrap shrink-0 ${isPresetActive(values) ? 'bg-emerald-500 text-black border-emerald-500 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'border-neutral-400 dark:border-white/20 text-neutral-500 hover:border-emerald-500 hover:text-emerald-500'}`}>{name}</button>
                                            )})}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. LYRICS */}
            {activeTab === 'lyrics' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300 w-full relative">
                    <h3 className="shrink-0 text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-2"><FileText size={12}/> <span>:: KARAOKE_STREAM_V2 ::</span></h3>
                    {loadingLyrics ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-emerald-500 gap-2"><Loader2 className="animate-spin" size={24}/><span className="text-xs font-mono animate-pulse">DECODING_STREAM...</span></div>
                    ) : (
                        <div className="flex-1 relative overflow-hidden" ref={lyricsContainerRef}>
                             <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 pb-20 text-center">
                                 {rawLyrics === "NO_LYRICS_AVAILABLE" ? (
                                     <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-60 space-y-3">
                                         <FileText size={48} className="opacity-30"/>
                                         <div className="text-center space-y-1">
                                             <p className="font-mono text-sm font-bold tracking-wider">NO LYRICS AVAILABLE</p>
                                             <p className="font-mono text-xs opacity-70">THIS SONG HAS NO LYRICS</p>
                                         </div>
                                     </div>
                                 ) : parsedLyrics.length > 0 ? (
                                     <ul className="space-y-6 py-[40%] px-2">
                                         {parsedLyrics.map((line, index) => {
                                             const isActive = index === activeLineIndex;
                                             return (
                                                 <li key={index} id={`lyric-line-${index}`} className={`transition-all duration-500 ease-out font-sans text-lg md:text-xl leading-relaxed cursor-pointer ${isActive ? 'text-emerald-500 font-bold scale-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-neutral-400 dark:text-neutral-500 opacity-50 hover:opacity-80 scale-100'}`} onClick={() => { const activeSound = Howler._howls.find(h => h.state() === 'loaded' && h.duration() > 0); if (activeSound) { activeSound.seek(line.time); setSeek(line.time); } }}>{line.content}</li>
                                             )
                                         })}
                                     </ul>
                                 ) : <pre className="font-sans text-sm md:text-base leading-relaxed whitespace-pre-wrap text-center text-neutral-800 dark:text-neutral-200">{rawLyrics}</pre>}
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. INFO */}
            {activeTab === 'info' && (
                <div className="flex flex-col h-full w-full gap-4 text-xs font-mono text-neutral-700 dark:text-white animate-in fade-in duration-300 max-w-2xl mx-auto overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">ARTIST_ID</p>
                            <p className="font-bold text-sm truncate">{song.author}</p>
                        </div>
                        <div className="p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">DURATION</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-500 text-sm">{formatTime(realDuration)}</p>
                        </div>
                        <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 flex flex-col">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">UNIQUE_TRACK_ID</p>
                            <p className="truncate text-emerald-600 dark:text-emerald-500 font-mono text-[10px]">{song.id}</p>
                        </div>
                        <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">UPLOAD_SOURCE</p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 relative shrink-0">
                                    <HoverImagePreview src={song.uploader_avatar} alt={song.uploader} className="w-full h-full cursor-none" previewSize={160} fallbackIcon="user">
                                            <div className="w-full h-full group relative flex items-center justify-center overflow-hidden border border-white/20 bg-neutral-200 dark:bg-neutral-800 rounded-none">
                                                {song.uploader_avatar ? <img src={song.uploader_avatar} className="w-full h-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0" alt={song.uploader}/> : song.uploader_role === 'admin' ? <ShieldCheck size={14} className="text-yellow-500"/> : <UserCheck size={14} className="text-green-500"/>}
                                                <ScanlineOverlay />
                                            </div>
                                    </HoverImagePreview>
                                </div>
                                <p className="font-bold">{song.uploader}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-white/10 text-center shrink-0">
                        <p className="text-[9px] text-neutral-400 animate-pulse">:: SECURE_CONNECTION_ESTABLISHED ::</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;
