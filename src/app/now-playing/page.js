"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Disc, 
  Info, 
  Loader2, 
  Save, 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Mic2,
  Sliders,
  UserCheck,
  Globe,
  Database,
  ShieldCheck
} from "lucide-react";

// --- IMPORTS ---
import usePlayer from "@/hooks/usePlayer";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import Slider from "@/components/Slider";
import useUI from "@/hooks/useUI"; 
import { GlitchText, HoloButton, GlitchButton } from "@/components/CyberComponents";

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
  
  const { initAudioNodes, setBass, setMid, setTreble } = useAudioFilters(); 

  // --- STATE ---
  const [song, setSong] = useState(null);
  const [activeTab, setActiveTab] = useState('lyrics'); 
  const [audioSettings, setAudioSettings] = useState({ 
    bass: 0, mid: 0, treble: 0, volume: 100 
  });
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (player.isPlaying !== undefined) setIsPlaying(player.isPlaying);
  }, [player.isPlaying]);

  useEffect(() => {
      setIsMounted(true);
      initAudioNodes();
  }, [initAudioNodes]);

  // --- FETCH SONG & UPLOADER INFO ---
  useEffect(() => {
    if (!isMounted) return;

    const updateSong = async () => {
        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));

        if (!player.activeId) {
            await minDelay; setLoading(false); return;
        }

        try {
            // 1. Thử tìm trong Database (Supabase) trước
            // Lấy cả thông tin profile của người upload
            const { data: dbSong, error: dbError } = await supabase
                .from('songs')
                .select(`
                    *,
                    profiles (
                        full_name,
                        email,
                        role
                    )
                `)
                .eq('id', player.activeId)
                .maybeSingle();

            if (dbSong) {
                // Xử lý thông tin người đăng
                let uploaderName = "Unknown User";
                let uploaderRole = "user";
                let source = "database";

                if (dbSong.profiles) {
                    uploaderName = dbSong.profiles.full_name || dbSong.profiles.email;
                    uploaderRole = dbSong.profiles.role;
                } else {
                    // Nếu không có user_id hoặc không join được profile => Admin/System cũ
                    uploaderName = "System Admin";
                    uploaderRole = "admin";
                }

                setSong({
                    id: dbSong.id,
                    title: dbSong.title,
                    author: dbSong.author,
                    // Đồng bộ image_path: dùng image_url từ DB
                    image_path: dbSong.image_url, 
                    song_url: dbSong.song_url,
                    duration: dbSong.duration,
                    lyrics: null, // DB chưa có lyrics (có thể update sau)
                    uploader: uploaderName,
                    uploader_role: uploaderRole,
                    source: source,
                    is_public: dbSong.is_public
                });
            } 
            else {
                // 2. Nếu không có trong DB -> Gọi Jamendo API
                // Kiểm tra cache trước
                if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
                    const cached = window.__SONG_MAP__[player.activeId];
                    setSong({ ...cached, uploader: "Jamendo Network", source: "api", uploader_role: "system" });
                } else {
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
                            external_id: track.id.toString(),
                            is_public: true,
                            song_url: track.audio,
                            uploader: "Jamendo Network",
                            uploader_role: "system",
                            source: "api"
                        };
                        setSong(newSong);
                        // Lưu cache
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

  // --- LOAD SETTINGS (Giữ nguyên logic cũ) ---
  useEffect(() => {
    const loadSettings = async () => {
      if (!song?.id) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const sessionSaved = sessionStorage.getItem(`audioSettings_${song.id}`);
        if (sessionSaved) {
            applySettings(JSON.parse(sessionSaved));
            return;
        }

        if (session?.user) {
            const { data: songSetting } = await supabase
                .from('user_song_settings')
                .select('settings')
                .eq('user_id', session.user.id)
                .eq('song_id', song.id)
                .single();

            if (songSetting?.settings) {
                applySettings({ ...songSetting.settings, volume: audioSettings.volume });
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('audio_settings')
                .eq('id', session.user.id)
                .single();

            if (profile?.audio_settings) {
                applySettings(profile.audio_settings);
            }
        }
      } catch (err) { console.error("Error loading settings:", err); }
    };
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  const applySettings = (settings) => {
      setAudioSettings(prev => ({...prev, ...settings}));
      if (song?.id) {
          if (settings.bass !== undefined) setBass(settings.bass, song.id);
          if (settings.mid !== undefined) setMid(settings.mid, song.id);
          if (settings.treble !== undefined) setTreble(settings.treble, song.id);
      }
      if (settings.volume !== undefined) player.setVolume(settings.volume / 100);
  };

  const handleAudioChange = (key, value) => {
    const numValue = parseFloat(value);
    setAudioSettings(prev => ({ ...prev, [key]: numValue }));

    switch (key) {
      case 'bass':
      case 'mid':
      case 'treble':
        if (song?.id) {
          setTimeout(() => applySettings({ [key]: numValue }), 0);
          const updatedSettings = { ...audioSettings, [key]: numValue };
          sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(updatedSettings));
        }
        break;
      case 'volume':
        player.setVolume(numValue / 100);
        break;
    }
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
              treble: audioSettings.treble,
              speed: 1.0
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

  const handleResetSettings = async () => {
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
      applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
      alert("Audio settings reset to FLAT.", "info", "RESET_DEFAULT");
    } catch (err) {
      applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
    }
  };

  // --- HELPER KIỂM TRA PRESET ---
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
         
         {/* Đĩa Than & Cover Art */}
         <div className="relative flex items-center justify-center scale-90 md:scale-100">
             <div className={`relative w-[280px] h-[280px] md:w-[450px] md:h-[450px] flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                {/* Glow Neon */}
                <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(16,185,129,0.15)] opacity-60"></div>
                {/* Vinyl Texture */}
                <div className="absolute inset-0 rounded-full bg-neutral-900 border border-neutral-800 shadow-2xl bg-[repeating-radial-gradient(#111,#111_2px,#0a0a0a_3px,#0a0a0a_4px)]"></div>
                {/* Nhãn đĩa */}
                <div className="absolute inset-0 m-auto w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-neutral-800 bg-black">
                     {/* Sử dụng image_path hoặc image_url từ state song đã chuẩn hóa */}
                     <img src={song.image_path || song.image_url || "/images/default_song.png"} className="w-full h-full object-cover opacity-90" alt="Cover"/>
                </div>
                {/* Lỗ đĩa */}
                <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-black border border-white/20 z-30 shadow-inner"></div>
                <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/5 z-10 pointer-events-none"></div>
             </div>
         </div>

         {/* Thông tin bài hát */}
         <div className="mt-8 md:mt-12 text-center z-20 space-y-2 max-w-lg">
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase font-mono truncate px-4">
                 <GlitchText text={song.title} />
            </h1>
            <p className="text-sm md:text-base font-bold font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase drop-shadow-md">
                {song.author}
            </p>

            {/* --- UPLOADED BY INFO --- */}
            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200/50 dark:bg-white/5 px-3 py-1 rounded-full w-fit mx-auto backdrop-blur-sm border border-neutral-300 dark:border-white/10">
                <span className="uppercase tracking-widest opacity-70">Uploaded by:</span>
                <span className={`font-bold flex items-center gap-1 ${song.uploader_role === 'admin' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {song.uploader_role === 'admin' ? <ShieldCheck size={12}/> : (song.source === 'api' ? <Globe size={12}/> : <UserCheck size={12}/>)}
                    {song.uploader}
                </span>
            </div>
         </div>
         
         <button onClick={() => router.back()} className="absolute top-0 left-0 lg:hidden p-4 text-neutral-500 hover:text-emerald-500 z-50"><ArrowLeft size={24} /></button>
      </div>

      {/* --- CỘT PHẢI (TABS & CONTROLS) --- */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-30">
         <div className="flex border-b border-neutral-200 dark:border-white/10 shrink-0">
            {[
                { id: 'lyrics', icon: Mic2, label: 'Lyrics' },
                { id: 'equalizer', icon: Sliders, label: 'Equalizer' },
                { id: 'info', icon: Info, label: 'Credits' }
            ].map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all
                    ${activeTab === tab.id 
                        ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500' 
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'}`}
                >
                    <tab.icon size={14}/> {tab.label}
                </button>
            ))}
         </div>

         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            
            {/* 1. LYRICS TAB */}
            {activeTab === 'lyrics' && (
                song.lyrics ? (
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
                )
            )}

            {/* 2. EQUALIZER TAB */}
            {activeTab === 'equalizer' && (
                <div className="flex flex-col animate-in fade-in duration-300 min-h-full pb-4">
                    <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-6 flex justify-between shrink-0">
                        <span>:: Audio Processing ::</span><span className="opacity-50">UNIT_01</span>
                    </h3>
                    
                    <div className="space-y-6 flex-1">
                        {/* Sliders */}
                        {[
                            { id: 'bass', label: 'Bass (Low)', min: -15, max: 15 },
                            { id: 'mid', label: 'Mid (Freq)', min: -15, max: 15 },
                            { id: 'treble', label: 'Treble (High)', min: -15, max: 15 },
                            { id: 'volume', label: 'Gain (Vol)', min: 0, max: 100 }
                        ].map((item) => (
                            <div key={item.id} className="flex flex-col gap-y-2">
                                <div className="flex justify-between text-[9px] font-mono uppercase text-neutral-500">
                                    <label>{item.label}</label>
                                    <span className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded text-black dark:text-white">
                                        {audioSettings[item.id] > 0 && item.id !== 'volume' ? '+' : ''}{audioSettings[item.id]}
                                    </span>
                                </div>
                                <Slider value={audioSettings[item.id]} max={item.max} min={item.min} step={1} onChange={(val) => handleAudioChange(item.id, val)} />
                            </div>
                        ))}
                        
                        {/* Presets Grid */}
                        <div className="mt-8 pt-4 border-t border-dashed border-neutral-300 dark:border-white/10">
                            <p className="text-[8px] font-mono text-neutral-400 uppercase mb-3">:: Presets ::</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { name: 'FLAT', s: { bass: 0, mid: 0, treble: 0 } },
                                    { name: 'BASS', s: { bass: 10, mid: 2, treble: -3 } },
                                    { name: 'DYN', s: { bass: 7, mid: 3, treble: 7 } },
                                    { name: 'VOC', s: { bass: -2, mid: 6, treble: 3 } }
                                ].map((p) => {
                                    const isActive = isPresetActive(p.s);
                                    return (
                                        <button
                                            key={p.name}
                                            onClick={() => {
                                                const presetSettings = {...p.s, volume: audioSettings.volume};
                                                applySettings(presetSettings);
                                                if (song?.id) sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(presetSettings));
                                            }}
                                            className={`
                                                text-[9px] font-mono py-2 rounded transition-all duration-300
                                                ${isActive 
                                                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_#10b981] border border-emerald-400 scale-105' 
                                                    : 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-emerald-500/20 hover:text-emerald-500'}
                                            `}
                                        >
                                            {p.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6 shrink-0">
                        <HoloButton onClick={handleSaveSettings} disabled={isSaving} className="flex-1 text-xs py-2">
                            {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SAVE
                        </HoloButton>
                        
                        <GlitchButton onClick={handleResetSettings} className="flex-1 border-red-400/50 text-white bg-transparent hover:bg-red-600 text-xs py-2">
                             <RotateCcw size={14} /> RESET
                        </GlitchButton>
                    </div>
                </div>
            )}

            {/* 3. INFO TAB */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-700 dark:text-white animate-in fade-in duration-300">
                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Artist</p><p className="font-bold">{song.author}</p></div>
                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Duration</p><p className="font-bold">{Math.floor(song.duration/60)}:{String(song.duration%60).padStart(2,'0')}</p></div>
                    <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Track ID</p><p className="truncate text-emerald-600 dark:text-emerald-500">{song.id}</p></div>
                    <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Source Type</p>
                        <p className="truncate opacity-70 flex items-center gap-2">
                            {song.source === 'database' ? <Database size={12} className="text-purple-500"/> : <Globe size={12} className="text-blue-500"/>}
                            {song.source === 'database' ? "INTERNAL_DB_STORAGE" : "JAMENDO_API_STREAM"}
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