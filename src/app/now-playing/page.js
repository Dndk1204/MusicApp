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
  Mic2,
  Sliders,
  UserCheck,
  Globe,
  Database,
  ShieldCheck,
  RotateCcw
} from "lucide-react";

// --- IMPORTS ---
import usePlayer from "@/hooks/usePlayer";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import Slider from "@/components/Slider";
import SpectrumVisualizer from "@/components/SpectrumVisualizer";
import useUI from "@/hooks/useUI";
import { GlitchText, HoloButton, GlitchButton } from "@/components/CyberComponents";

// ==================================================================================
// --- 1. CẤU HÌNH EQ MẶC ĐỊNH (HARDCODE) ---
// ==================================================================================
const SONG_DEFAULTS = {
    // 'ID_BAI_HAT': { bass, mid, treble }
    '1873426': { bass: 8, mid: 2, treble: -2 }, 
    '1873427': { bass: -2, mid: 6, treble: 4 }, 
};

const getValuesForSong = (song) => {
    if (!song) return null;
    
    // Ưu tiên 1: Check ID
    if (SONG_DEFAULTS[song.id]) return SONG_DEFAULTS[song.id];

    // Ưu tiên 2: Check tên ca sĩ (Ví dụ)
    if (song.author && (song.author.toLowerCase().includes('alan walker'))) {
        return { bass: 10, mid: 2, treble: 5 };
    }

    return null; 
};
// ==================================================================================

// --- SKELETON LOADER ---
const NowPlayingSkeleton = () => {
  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
             <div className="w-[250px] h-[250px] md:w-[450px] md:h-[450px] rounded-full bg-neutral-300 dark:bg-neutral-800/50 border-4 border-neutral-200 dark:border-white/5 shadow-2xl"></div>
             <div className="mt-12 h-8 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
             <div className="mt-4 h-4 w-1/3 bg-neutral-200 dark:bg-neutral-900 rounded"></div>
        </div>
        <div className="lg:col-span-4 bg-white/5 rounded-xl border border-white/5"></div>
    </div>
  )
}

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  const { alert } = useUI();
  
  const { initAudioNodes, setBass, setMid, setTreble, initAnalyzer, getFrequencyData } = useAudioFilters();

  // --- STATE ---
  const [song, setSong] = useState(null);
  const [realDuration, setRealDuration] = useState(0); 
  const [activeTab, setActiveTab] = useState('lyrics'); 
  
  // Audio Settings (Đã bỏ Volume)
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

  // Cập nhật ref handlers
  useEffect(() => {
      audioHandlers.current = { setBass, setMid, setTreble };
  }, [setBass, setMid, setTreble]);

  // --- HELPER: FORMAT TIME (MM:SS) ---
  const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds) || seconds === 0) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- LOGIC: LẤY DURATION TỪ HOWLER ---
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

  // --- 1. FETCH SONG & UPLOADER INFO (Có Avatar + FullName) ---
  useEffect(() => {
    if (!isMounted) return;

    const updateSong = async () => {
        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        if (!player.activeId) {
            await minDelay; setLoading(false); return;
        }

        try {
            // A. Supabase (Lấy avatar_url và full_name)
            const { data: dbSong, error: dbError } = await supabase
                .from('songs')
                .select(`
                    *,
                    profiles (
                        full_name,
                        role,
                        avatar_url
                    )
                `)
                .eq('id', player.activeId)
                .maybeSingle();

            if (dbSong) {
                let uploaderName = "Unknown User";
                let uploaderRole = "user";
                let uploaderAvatar = null;
                let source = "database";

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
                    lyrics: null,
                    uploader: uploaderName,
                    uploader_role: uploaderRole,
                    uploader_avatar: uploaderAvatar,
                    uploader_id: dbSong.user_id,
                    is_public: dbSong.is_public
                });
            } 
            else {
                // B. Fallback Jamendo
                if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
                    const cached = window.__SONG_MAP__[player.activeId];
                    setSong({ ...cached, uploader: "Jamendo Network", uploader_role: "system", uploader_avatar: null });
                } else {
                    const CLIENT_ID = '3501caaa';
                    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${player.activeId}&include=musicinfo+lyrics&audioformat=mp31`);
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

  // --- 2. APPLY SETTINGS (Bỏ Volume) ---
  const applySettings = useCallback((settings) => {
      setAudioSettings(prev => ({...prev, ...settings}));
      
      const handlers = audioHandlers.current;
      if (settings.bass !== undefined && handlers.setBass) handlers.setBass(settings.bass);
      if (settings.mid !== undefined && handlers.setMid) handlers.setMid(settings.mid);
      if (settings.treble !== undefined && handlers.setTreble) handlers.setTreble(settings.treble);
      
      // Không chỉnh volume ở đây
  }, []);

  // --- 3. LOAD SETTINGS (Ưu tiên: Saved -> Hardcode -> Profile -> Flat) ---
  useEffect(() => {
    const loadSettings = async () => {
      if (!song?.id) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // 1. Session Storage
        // const sessionSaved = sessionStorage.getItem(`audioSettings_${song.id}`);
        // if (sessionSaved) {
        //     applySettings(JSON.parse(sessionSaved));
        //     return;
        // }

        // 2. User Settings (DB)
        if (session?.user) {
            const { data: songSetting } = await supabase
                .from('user_song_settings')
                .select('settings')
                .eq('user_id', session.user.id)
                .eq('song_id', song.id)
                .single();

            if (songSetting?.settings) {
                console.log("🎛️ Loaded User Preset");
                applySettings({ ...songSetting.settings, volume: audioSettings.volume });
                return;
            }
        }

        // 3. HARDCODE DEFAULT
        const hardcodedDefault = getValuesForSong(song);
        if (hardcodedDefault) {
             console.log("🎵 Loaded Song Default (Hardcoded)");
             applySettings({ ...hardcodedDefault, volume: audioSettings.volume });
             return;
        }

        // 4. Profile Default
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

        // 5. Flat
        applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });

      } catch (err) { console.error("Error loading settings:", err); }
    };
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]); 

  // --- 4. HANDLE AUDIO CHANGE ---
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
            
            const updatedSettings = { ...audioSettings, [key]: numValue };
            // sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(updatedSettings));
        }
    }
    // Bỏ chỉnh volume
  };

  const handleSaveSettings = async () => {
      setIsSaving(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
              alert("Please login to save your configuration.", "error", "ACCESS_DENIED");
              return;
          }

          const settingsToSave = {
              bass: audioSettings.bass,
              mid: audioSettings.mid,
              treble: audioSettings.treble
          };

          const { error } = await supabase
            .from('user_song_settings')
            .upsert({
                user_id: session.user.id,
                song_id: song.id,
                settings: settingsToSave,
                updated_at: new Date().toISOString(),
                song_title: song.title,
                song_author: song.author
            }, { onConflict: 'user_id, song_id' });

          if (error?.code === '23503' || error?.message?.includes('foreign key')) {
              sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(audioSettings));
              alert("External track detected. Settings saved locally.", "info", "LOCAL_SAVE");
              return;
          } else if (error) throw error;

          sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(audioSettings));
          alert(`EQ Preset saved for: ${song.title}`, "success", "SAVED");

      } catch (err) {
          console.error(err);
          alert("Failed to save audio configuration.", "error", "SAVE_ERROR");
      } finally { setIsSaving(false); }
  };

  // --- LOGIC RESET: Bỏ reset volume, ưu tiên Hardcode ---
  const handleResetSettings = async () => {
    // 1. Hardcode Default
    const hardcodedDefault = getValuesForSong(song);
    if (hardcodedDefault) {
        applySettings({ ...hardcodedDefault, volume: audioSettings.volume }); // Giữ vol hiện tại
        alert("Reset to Song Default.", "info", "RESET_SONG");
        return;
    }

    // 2. Profile Default
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('audio_settings')
                .eq('id', session.user.id)
                .single();
            if (profile?.audio_settings) {
                applySettings(profile.audio_settings);
                alert("Reverted to your default profile settings.", "success", "RESET_COMPLETE");
                return;
            }
        }
    } catch (err) {}

    // 3. Flat
    applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
    alert("Audio settings reset to FLAT.", "info", "RESET_DEFAULT");
  };

  const isPresetActive = (preset) => {
      return audioSettings.bass === preset.bass && 
             audioSettings.mid === preset.mid && 
             audioSettings.treble === preset.treble;
  };

  if (!isMounted) return null;
  if (loading) return <NowPlayingSkeleton />;
  if (!player.activeId || !song) return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-100 dark:bg-black text-neutral-500 font-mono">
            <Disc size={60} className="opacity-50 animate-spin-slow"/>
            <p className="text-xs uppercase">[NO_TRACK_SELECTED]</p>
            <button onClick={() => router.push('/')} className="flex items-center gap-2 text-emerald-600 border border-emerald-500/30 px-4 py-2 rounded-full hover:bg-emerald-500/10">
                <ArrowLeft size={14}/> RETURN
            </button>
        </div>
  );

  return (
    <div className="w-full h-[100vh] grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black transition-colors animate-in fade-in duration-500">
      
      {/* --- CỘT TRÁI (VISUAL) --- */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative perspective-1000 h-full min-h-0">
         
         <div className="relative flex items-center justify-center scale-90 md:scale-100">
             <div className={`relative w-[280px] h-[280px] md:w-[450px] md:h-[450px] flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(16,185,129,0.15)] opacity-60"></div>
                <div className="absolute inset-0 rounded-full bg-neutral-900 border border-neutral-800 shadow-2xl bg-[repeating-radial-gradient(#111,#111_2px,#0a0a0a_3px,#0a0a0a_4px)]"></div>
                <div className="absolute inset-0 m-auto w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-neutral-800 bg-black">
                      <img 
                        src={song.image_path || song.image_url || "/images/default_song.png"} 
                        className="w-full h-full object-cover opacity-90" 
                        alt="Cover"
                      />
                </div>
                <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-black border border-white/20 z-30 shadow-inner"></div>
                <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/5 z-10 pointer-events-none"></div>
             </div>
         </div>

         <div className="mt-8 md:mt-12 text-center z-20 space-y-2 max-w-lg">
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase font-mono truncate px-4">
                 <GlitchText text={song.title} />
            </h1>
            <p className="text-sm md:text-base font-bold font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase drop-shadow-md">
                {song.author}
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/50 dark:bg-white/5 px-4 py-2 rounded-full w-fit mx-auto backdrop-blur-sm border border-neutral-300 dark:border-white/10">
                <span className="uppercase tracking-widest opacity-70">Uploaded by:</span>
                {song.uploader_id ? (
                    <button
                        onClick={() => router.push(`/user/${song.uploader_id}`)}
                        className={`font-bold flex items-center gap-2 hover:opacity-80 transition-opacity ${song.uploader_role === 'admin' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}
                    >
                        {/* Hiển thị Avatar */}
                        {song.uploader_avatar ? (
                            <img
                                src={song.uploader_avatar}
                                alt="Uploader"
                                className="w-6 h-6 rounded-full object-cover border border-white/20"
                            />
                        ) : (
                            song.uploader_role === 'admin'
                                ? <ShieldCheck size={16} className="text-yellow-500"/>
                                : <UserCheck size={16} className="text-green-500"/>
                        )}
                        <span className="text-sm">{song.uploader}</span>
                    </button>
                ) : (
                    <span className={`font-bold flex items-center gap-2 ${song.uploader_role === 'admin' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {/* Hiển thị Avatar */}
                        {song.uploader_avatar ? (
                            <img
                                src={song.uploader_avatar}
                                alt="Uploader"
                                className="w-6 h-6 rounded-full object-cover border border-white/20"
                            />
                        ) : (
                            song.uploader_role === 'admin'
                                ? <ShieldCheck size={16} className="text-yellow-500"/>
                                : <UserCheck size={16} className="text-green-500"/>
                        )}
                        <span className="text-sm">{song.uploader}</span>
                    </span>
                )}
            </div>
         </div>
         
         <button onClick={() => router.back()} className="absolute top-0 left-0 lg:hidden p-4 text-neutral-500 hover:text-emerald-500 z-50"><ArrowLeft size={24} /></button>
      </div>

      {/* --- CỘT PHẢI (TABS & CONTROLS) --- */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-30">
         
         <div className="flex border-b border-neutral-200 dark:border-white/10 shrink-0">
                <button 
                    onClick={() => setActiveTab('lyrics')} 
                    className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all
                    ${activeTab === 'lyrics' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
                >
                    <Mic2 size={14}/> Lyrics
                </button>
                <button 
                    onClick={() => setActiveTab('equalizer')} 
                    className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all
                    ${activeTab === 'equalizer' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
                >
                    <Sliders size={14}/> Equalizer
                </button>
                <button 
                    onClick={() => setActiveTab('info')} 
                    className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all
                    ${activeTab === 'info' ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
                >
                    <Info size={14}/> Credits
                </button>
         </div>

         <div className="flex-1 overflow-hidden p-6 custom-scrollbar relative">

            {/* 1. LYRICS TAB */}
            {activeTab === 'lyrics' && (
                <div className="h-full overflow-y-auto custom-scrollbar">
                    {song.lyrics ? (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 py-4">
                            {song.lyrics.split('\n').map((line, i) => (
                                <p key={i} className="text-sm md:text-base font-medium text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-white transition-colors cursor-default leading-relaxed">
                                    {line}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600 gap-3 opacity-70">
                            <Disc size={30} className="animate-spin-slow"/>
                            <p className="font-mono text-[10px] tracking-widest">[INSTRUMENTAL / NO_LYRICS]</p>
                        </div>
                    )}
                </div>
            )}

            {/* 2. EQUALIZER TAB (Đã bỏ Volume) */}
            {activeTab === 'equalizer' && (
                <div className="flex flex-col animate-in fade-in duration-300 min-h-full pb-4">
                    <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-4 flex justify-between shrink-0">
                        <span>:: Audio Processing ::</span><span className="opacity-50">UNIT_01</span>
                    </h3>

                    {/* Spectrum Visualizer */}
                    <SpectrumVisualizer isPlaying={isPlaying} />

                    <div className="space-y-4 flex-1">
                        {[
                            { id: 'bass', label: 'Bass (Low)', min: -15, max: 15 },
                            { id: 'mid', label: 'Mid (Freq)', min: -15, max: 15 },
                            { id: 'treble', label: 'Treble (High)', min: -15, max: 15 },
                        ].map((item) => (
                            <div key={item.id} className="flex flex-col gap-y-2">
                                <div className="flex justify-between text-[9px] font-mono uppercase text-neutral-500">
                                    <label>{item.label}</label>
                                    <span className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded text-black dark:text-white">
                                        {audioSettings[item.id] > 0 ? '+' : ''}{audioSettings[item.id]}
                                    </span>
                                </div>
                                <Slider value={audioSettings[item.id]} max={item.max} min={item.min} step={1} onChange={(val) => handleAudioChange(item.id, val)} />
                            </div>
                        ))}

                        <div className="flex gap-2 pt-6 pb-4">
                            <HoloButton onClick={handleSaveSettings} disabled={isSaving} className="flex-1 text-xs py-2">
                                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SAVE
                            </HoloButton>
                            <GlitchButton onClick={handleResetSettings} className="flex-1 border-red-400/50 text-white bg-transparent hover:bg-red-600 text-xs py-2">
                                 <RotateCcw size={14} /> RESET
                            </GlitchButton>
                        </div>

                        <div className="border-t border-dashed border-neutral-300 dark:border-white/10 pt-4">
                            <p className="text-[8px] font-mono text-neutral-400 uppercase mb-3">:: Presets ::</p>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => { const s = { bass: 0, mid: 0, treble: 0, volume: audioSettings.volume }; applySettings(s); }} className={`text-[9px] font-mono py-2 rounded transition-all duration-300 ${isPresetActive({bass:0,mid:0,treble:0}) ? 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border border-emerald-400 scale-105' : 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-emerald-500/20 hover:bg-emerald-500'}`}>FLAT</button>
                                <button onClick={() => { const s = { bass: 10, mid: 2, treble: -3, volume: audioSettings.volume }; applySettings(s); }} className={`text-[9px] font-mono py-2 rounded transition-all duration-300 ${isPresetActive({bass:10,mid:2,treble:-3}) ? 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border border-emerald-400 scale-105' : 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-emerald-500/20 hover:bg-emerald-500'}`}>BASS</button>
                                <button onClick={() => { const s = { bass: 7, mid: 3, treble: 7, volume: audioSettings.volume }; applySettings(s); }} className={`text-[9px] font-mono py-2 rounded transition-all duration-300 ${isPresetActive({bass:7,mid:3,treble:7}) ? 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border border-emerald-400 scale-105' : 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-emerald-500/20 hover:bg-emerald-500'}`}>DYN</button>
                                <button onClick={() => { const s = { bass: -2, mid: 6, treble: 3, volume: audioSettings.volume }; applySettings(s); }} className={`text-[9px] font-mono py-2 rounded transition-all duration-300 ${isPresetActive({bass:-2,mid:6,treble:3}) ? 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border border-emerald-400 scale-105' : 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-emerald-500/20 hover:bg-emerald-500'}`}>VOC</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. INFO TAB */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-700 dark:text-white animate-in fade-in duration-300">
                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded">
                        <p className="text-neutral-500 uppercase">Artist</p>
                        <p className="font-bold">{song.author}</p>
                    </div>

                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded">
                        <p className="text-neutral-500 uppercase">Duration</p>
                        {/* HIỂN THỊ DURATION TỪ REAL-TIME */}
                        <p className="font-bold text-emerald-600 dark:text-emerald-500">
                            {formatTime(realDuration)}
                        </p>
                    </div>

                    <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 rounded">
                        <p className="text-neutral-500 uppercase">Track ID</p>
                        <p className="truncate text-emerald-600 dark:text-emerald-500">{song.id}</p>
                    </div>

                    <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 rounded">
                        <p className="text-neutral-500 uppercase">Uploaded by</p>
                        <p className="truncate opacity-70 flex items-center gap-2">
                             {/* Hiển thị Avatar trong tab info */}
                             {song.uploader_avatar
                                ? <img src={song.uploader_avatar} className="w-5 h-5 rounded-full object-cover"/>
                                : (song.uploader_role === 'admin'
                                    ? <ShieldCheck size={14} className="text-yellow-500"/>
                                    : <UserCheck size={14} className="text-green-500"/>
                                  )
                             }
                            {song.uploader}
                        </p>
                    </div>

                    <div className="col-span-2 pt-4 border-t border-neutral-200 dark:border-white/10 mt-2 text-center">
                        <p className="text-[10px] text-neutral-400">DATA RETRIEVED SECURELY</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;
