"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Howler } from "howler"; 
import { 
  Disc, 
  Info, 
  Loader2, 
  Save, 
  ArrowLeft, 
  Sliders,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Activity,
  Cpu
} from "lucide-react";

// --- IMPORTS ---
import usePlayer from "@/hooks/usePlayer";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import Slider from "@/components/Slider";
import SpectrumVisualizer from "@/components/SpectrumVisualizer";
import useUI from "@/hooks/useUI";
import { GlitchText, HoloButton, GlitchButton, CyberButton, ScanlineOverlay } from "@/components/CyberComponents";

// ==================================================================================
// --- 1. CẤU HÌNH EQ MẶC ĐỊNH (HARDCODE) ---
// ==================================================================================
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

// --- SKELETON LOADER (CYBER STYLE) ---
const NowPlayingSkeleton = () => {
  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative border-r border-dashed border-neutral-300 dark:border-white/10">
             <div className="w-[250px] h-[250px] md:w-[450px] md:h-[450px] bg-neutral-300 dark:bg-neutral-800 rounded-none border border-neutral-400 dark:border-white/20"></div>
             <div className="mt-12 h-8 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
             <div className="mt-4 h-4 w-1/3 bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
        </div>
        <div className="lg:col-span-4 bg-white/5 rounded-none border border-white/10"></div>
    </div>
  )
}

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  const { alert } = useUI();
  
  const { initAudioNodes, setBass, setMid, setTreble, initAnalyzer } = useAudioFilters();

  // --- STATE ---
  const [song, setSong] = useState(null);
  const [realDuration, setRealDuration] = useState(0); 
  const [activeTab, setActiveTab] = useState('equalizer'); 
  
  // Audio Settings
  const [audioSettings, setAudioSettings] = useState({ 
    bass: 0, mid: 0, treble: 0, volume: 100 
  });
  
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(true);

  // Refs
  const audioHandlers = useRef({ setBass, setMid, setTreble });
  const durationCheckRef = useRef(null);

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
            clearInterval(durationCheckRef.current);
        }
    }, 1000);
    return () => { if (durationCheckRef.current) clearInterval(durationCheckRef.current); };
  }, [player.activeId]);

  // --- 1. FETCH SONG ---
  useEffect(() => {
    if (!isMounted) return;

    const updateSong = async () => {
        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        if (!player.activeId) {
            await minDelay; setLoading(false); return;
        }

        try {
            const { data: dbSong } = await supabase
                .from('songs')
                .select(`*, profiles (full_name, role, avatar_url)`)
                .eq('id', player.activeId)
                .maybeSingle();

            if (dbSong) {
                let uploaderName = "Unknown User";
                let uploaderRole = "user";
                let uploaderAvatar = null;

                if (dbSong.profiles) {
                    uploaderName = dbSong.profiles.full_name || "Anonymous User";
                    uploaderRole = dbSong.profiles.role;
                    uploaderAvatar = dbSong.profiles.avatar_url;
                } else {
                    uploaderName = "System Admin";
                    uploaderRole = "admin";
                }

                setSong({
                    id: dbSong.id,
                    title: dbSong.title,
                    author: dbSong.author,
                    image_path: dbSong.image_url,
                    song_url: dbSong.song_url,
                    uploader: uploaderName,
                    uploader_role: uploaderRole,
                    uploader_avatar: uploaderAvatar,
                    uploader_id: dbSong.user_id,
                    is_public: dbSong.is_public,
                    source: 'database'
                });
            } 
            else {
                // Jamendo Fallback
                if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
                    const cached = window.__SONG_MAP__[player.activeId];
                    setSong({ ...cached, uploader: "Jamendo Network", uploader_role: "system", uploader_avatar: null, source: 'api' });
                } else {
                    const CLIENT_ID = '3501caaa';
                    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${player.activeId}&include=musicinfo&audioformat=mp31`);
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
                            external_id: track.id.toString(),
                            is_public: true,
                            song_url: track.audio,
                            uploader: "Jamendo Network",
                            uploader_role: "system",
                            uploader_avatar: null,
                            source: "api"
                        };
                        setSong(newSong);
                        setRealDuration(track.duration);
                        if (typeof window !== 'undefined') window.__SONG_MAP__ = { ...window.__SONG_MAP__, [newSong.id]: newSong };
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching song:", error);
        } finally {
            await minDelay; setLoading(false);
        }
    };
    updateSong();
  }, [player.activeId, isMounted]);

  // --- 2. AUDIO HANDLERS ---
  const applySettings = useCallback((settings) => {
      setAudioSettings(prev => ({...prev, ...settings}));
      const handlers = audioHandlers.current;
      if (settings.bass !== undefined && handlers.setBass) handlers.setBass(settings.bass);
      if (settings.mid !== undefined && handlers.setMid) handlers.setMid(settings.mid);
      if (settings.treble !== undefined && handlers.setTreble) handlers.setTreble(settings.treble);
  }, []);

  const handleAudioChange = (key, value) => {
    const numValue = parseFloat(value);
    setAudioSettings(prev => ({ ...prev, [key]: numValue }));
    if (['bass', 'mid', 'treble'].includes(key)) {
        if (song?.id) {
            const handlers = audioHandlers.current;
            setTimeout(() => {
                if (key === 'bass' && handlers.setBass) handlers.setBass(numValue);
                if (key === 'mid' && handlers.setMid) handlers.setMid(numValue);
                if (key === 'treble' && handlers.setTreble) handlers.setTreble(numValue);
            }, 0);
        }
    }
  };

  // --- 3. LOAD SETTINGS ---
  useEffect(() => {
    const loadSettings = async () => {
      if (!song?.id) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            const { data: songSetting } = await supabase
                .from('user_song_settings')
                .select('settings')
                .eq('user_id', session.user.id)
                .eq('song_id', song.id)
                .maybeSingle();

            if (songSetting?.settings) {
                applySettings({ ...songSetting.settings, volume: audioSettings.volume });
                return;
            }
        }

        const hardcodedDefault = getValuesForSong(song);
        if (hardcodedDefault) {
             applySettings({ ...hardcodedDefault, volume: audioSettings.volume });
             return;
        }

        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('audio_settings')
                .eq('id', session.user.id)
                .single();

            if (profile?.audio_settings) {
                applySettings(profile.audio_settings);
                return;
            }
        }

        applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });

      } catch (err) { console.error("Error loading settings:", err); }
    };
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]); 

  const handleSaveSettings = async () => {
      setIsSaving(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
              alert("Please login to save your configuration.", "error", "ACCESS_DENIED");
              return;
          }
          const { error } = await supabase
            .from('user_song_settings')
            .upsert({
                user_id: session.user.id,
                song_id: song.id,
                settings: { bass: audioSettings.bass, mid: audioSettings.mid, treble: audioSettings.treble },
                updated_at: new Date().toISOString(),
                song_title: song.title,
                song_author: song.author
            }, { onConflict: 'user_id, song_id' });

          if (error?.code === '23503' || error?.message?.includes('foreign key')) {
              sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(audioSettings));
              alert("Saved locally (External Track).", "info", "LOCAL_SAVE");
              return;
          } else if (error) throw error;

          alert(`EQ Preset saved!`, "success", "SAVED");
      } catch (err) {
          console.error(err);
          alert("Save failed.", "error");
      } finally { setIsSaving(false); }
  };

  const handleResetSettings = async () => {
    const hardcodedDefault = getValuesForSong(song);
    if (hardcodedDefault) {
        applySettings({ ...hardcodedDefault, volume: audioSettings.volume });
        alert("Reset to Song Default.", "info", "RESET_SONG");
        return;
    }
    applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
    alert("Reset to FLAT.", "info", "RESET_DEFAULT");
  };

  const isPresetActive = (preset) => {
      return audioSettings.bass === preset.bass && 
             audioSettings.mid === preset.mid && 
             audioSettings.treble === preset.treble;
  };

  if (!isMounted) return null;
  if (loading) return <NowPlayingSkeleton />;
  if (!player.activeId || !song) return null;

  return (
    <div className="w-full h-[80vh] grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black transition-colors animate-in fade-in duration-500 relative">
      
      {/* Background FUI Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"></div>
      <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-emerald-500/50 uppercase tracking-widest hidden lg:block">System_Ready :: Audio_Core_V2</div>

      {/* --- CỘT TRÁI (VISUAL) --- */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative perspective-1000 h-full min-h-0 border-r border-dashed border-neutral-300 dark:border-white/10 pr-6">
         
         <div className="relative flex items-center justify-center scale-90 md:scale-100">
             {/* FUI Circle */}
             <div className={`relative w-[280px] h-[280px] md:w-[450px] md:h-[450px] flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}>
                <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/30"></div>
                <div className="absolute inset-4 rounded-full border border-neutral-800 dark:border-white/10"></div>
                <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border-2 border-transparent border-t-emerald-500/50 border-b-emerald-500/50 rotate-45"></div>
                
                {/* Main Art Container */}
                <div className="absolute inset-0 m-auto w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-neutral-300 dark:border-neutral-800 bg-black shadow-2xl group">
                      <img src={song.image_path || song.image_url || "/images/default_song.png"} className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110" alt="Cover"/>
                      <ScanlineOverlay />
                </div>
             </div>
         </div>

         <div className="mt-8 md:mt-12 text-center z-20 space-y-2 max-w-lg w-full">
            <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase font-mono truncate px-4">
                 <GlitchText text={song.title} />
            </h1>
            <div className="flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-emerald-500"></span>
                <p className="text-sm md:text-base font-bold font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase">
                    {song.author}
                </p>
                <span className="w-8 h-px bg-emerald-500"></span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-white/50 dark:bg-white/5 px-4 py-2 border border-neutral-300 dark:border-white/10 mx-auto backdrop-blur-sm w-fit">
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
      </div>

      {/* --- CỘT PHẢI (TABS & CONTROLS) --- */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-none overflow-hidden shadow-2xl z-30 relative">
         
         {/* Decorative FUI Corners */}
         <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 z-40"></div>
         <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 z-40"></div>
         <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 z-40"></div>
         <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 z-40"></div>

         {/* TAB HEADER */}
         <div className="flex border-b border-neutral-200 dark:border-white/10 shrink-0">
                <button onClick={() => setActiveTab('equalizer')} className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-none relative ${activeTab === 'equalizer' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}>
                    <Sliders size={14}/> EQ_CONTROLS
                    {activeTab === 'equalizer' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                </button>
                <button onClick={() => setActiveTab('info')} className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all rounded-none relative ${activeTab === 'info' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}>
                    <Info size={14}/> META_DATA
                    {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                </button>
         </div>

         {/* --- MAIN CONTENT CONTAINER (Đã chỉnh sửa điều kiện scroll) --- */}
         <div className="flex-1 min-h-0 p-6 custom-scrollbar relative overflow-hidden flex flex-col w-full h-full">

            {/* 1. EQUALIZER TAB */}
            {activeTab === 'equalizer' && (
                <div className="flex flex-col animate-in fade-in duration-300 min-h-full pb-4">
                    <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-4 flex justify-between shrink-0 border-b border-neutral-200 dark:border-white/10 pb-2">
                        <span className="flex items-center gap-2"><Activity size={12}/> AUDIO_PROCESSING_UNIT</span>
                        <span className="opacity-50">FREQ_MOD</span>
                    </h3>
                    
                    <SpectrumVisualizer isPlaying={isPlaying} />
                    
                    <div className="space-y-4 flex-1 mt-4">
                        {[
                            { id: 'bass', label: 'Bass_Freq (Low)', min: -15, max: 15 },
                            { id: 'mid', label: 'Mid_Freq (Med)', min: -15, max: 15 },
                            { id: 'treble', label: 'High_Freq (Treble)', min: -15, max: 15 },
                        ].map((item) => (
                            <div key={item.id} className="flex flex-col gap-y-2">
                                <div className="flex justify-between text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400">
                                    <label>{item.label}</label>
                                    <span className="bg-neutral-200 dark:bg-white/10 px-1 text-black dark:text-white border border-neutral-300 dark:border-white/10 font-bold min-w-[30px] text-center">
                                        {audioSettings[item.id] > 0 ? '+' : ''}{audioSettings[item.id]}dB
                                    </span>
                                </div>
                                <Slider value={audioSettings[item.id]} max={item.max} min={item.min} step={1} onChange={(val) => handleAudioChange(item.id, val)} />
                            </div>
                        ))}
                        <div className="border-t border-dashed border-neutral-300 dark:border-white/10 pt-2 mt-2">
                            <p className="text-[8px] font-mono text-neutral-400 uppercase mb-2 tracking-widest">:: PRESET_MATRIX ::</p>
                            <div className="overflow-x-auto custom-scrollbar pb-1">
                                <div className="flex gap-2 min-w-max">
                                    {[
                                        { name: 'FLAT', values: {bass: 0, mid: 0, treble: 0}, desc: 'Neutral EQ' },
                                        { name: 'BASS_BOOST', values: {bass: 10, mid: 2, treble: -3}, desc: 'Enhanced lows' },
                                        { name: 'DYNAMIC', values: {bass: 7, mid: 3, treble: 7}, desc: 'Balanced boost' },
                                        { name: 'ROCK', values: {bass: 8, mid: 4, treble: 2}, desc: 'Heavy guitars' },
                                        { name: 'POP', values: {bass: 5, mid: 8, treble: 5}, desc: 'Vocal clarity' },
                                        { name: 'JAZZ', values: {bass: 6, mid: -2, treble: 8}, desc: 'Smooth highs' },
                                        { name: 'ELECTRONIC', values: {bass: 12, mid: 5, treble: -4}, desc: 'Club vibration' },
                                        { name: 'INDIE', values: {bass: 3, mid: 7, treble: 6}, desc: 'Alternative vibe' },
                                        { name: 'CLASSIC', values: {bass: 4, mid: -3, treble: 9}, desc: 'Pure sound' },
                                        { name: 'HIPHOP', values: {bass: 11, mid: 6, treble: 1}, desc: 'Bass rhythm' },
                                        { name: 'VOCAL', values: {bass: 2, mid: 12, treble: 4}, desc: 'Voice forward' },
                                        { name: 'CINEMATIC', values: {bass: 9, mid: 3, treble: 3}, desc: 'Theatrical depth' }
                                    ].map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => applySettings({
                                                ...preset.values,
                                                volume: audioSettings.volume
                                            })}
                                            className={`text-[9px] font-mono py-1.5 px-2 border transition-all duration-300 whitespace-nowrap shrink-0 ${
                                                isPresetActive(preset.values)
                                                    ? 'bg-emerald-500 text-black border-emerald-500 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                                    : 'border-neutral-400 dark:border-white/20 text-neutral-500 hover:border-emerald-500 hover:text-emerald-500'
                                            }`}
                                            title={preset.desc}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 pb-2">
                            <CyberButton onClick={handleSaveSettings} disabled={isSaving} className="flex-1 text-xs py-2 h-auto">
                                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SAVE_CONFIG
                            </CyberButton>
                            <GlitchButton onClick={handleResetSettings} className="flex-1 border-red-400/50 text-red-500 bg-transparent hover:bg-red-600 hover:text-white text-xs py-2 h-auto rounded-none">
                                 <RotateCcw size={14} className="mr-1"/> RESET
                            </GlitchButton>
                        </div>

                        
                    </div>
                </div>
            )}

            {/* 2. INFO TAB (TECH SPECS) - Đã sửa để không scroll */}
            {activeTab === 'info' && (
                <div className="flex flex-col gap-4 text-xs font-mono text-neutral-700 dark:text-white animate-in fade-in duration-300 w-full">
                    <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-2">
                        <Cpu size={12}/> <span>:: TRACK_METADATA ::</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">ARTIST_ID</p>
                            <p className="font-bold text-sm truncate">{song.author}</p>
                        </div>

                        <div className="p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">DURATION</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-500 text-sm">
                                {formatTime(realDuration)}
                            </p>
                        </div>

                        <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 flex flex-col">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">UNIQUE_TRACK_ID</p>
                            <p className="truncate text-emerald-600 dark:text-emerald-500 font-mono text-[10px]">{song.id}</p>
                        </div>

                        <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                            <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">UPLOAD_SOURCE</p>
                            <div className="flex items-center gap-2">
                                {song.uploader_avatar
                                   ? <img src={song.uploader_avatar} className="w-6 h-6 rounded-none border border-white/20 object-cover"/>
                                   : (song.uploader_role === 'admin'
                                        ? <ShieldCheck size={16} className="text-yellow-500"/>
                                        : <UserCheck size={16} className="text-green-500"/>
                                   )
                                }
                                <p className="font-bold">{song.uploader}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-white/10 text-center">
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