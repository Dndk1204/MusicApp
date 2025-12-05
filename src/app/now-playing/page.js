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
  Sliders
} from "lucide-react";

// --- IMPORTS ---
import usePlayer from "@/hooks/usePlayer";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import Slider from "@/components/Slider";

// --- SKELETON LOADER COMPONENT ---
const NowPlayingSkeleton = () => {
  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
             <div className="w-[250px] h-[250px] md:w-[450px] md:h-[450px] rounded-full bg-neutral-300 dark:bg-neutral-800/50 border-4 border-neutral-200 dark:border-white/5 shadow-2xl"></div>
             <div className="mt-12 h-8 w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
             <div className="mt-4 h-4 w-1/3 bg-neutral-200 dark:bg-neutral-900 rounded"></div>
        </div>
        {/* CỘT PHẢI */}
        <div className="lg:col-span-4 bg-white/5 rounded-xl border border-white/5"></div>
    </div>
  )
}

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  
  // Hook xử lý âm thanh (Equalizer)
  const { initAudioNodes, setBass, setMid, setTreble } = useAudioFilters(); 

  // --- STATE ---
  const [song, setSong] = useState(null);
  const [activeTab, setActiveTab] = useState('lyrics'); // lyrics | equalizer | info
  const [audioSettings, setAudioSettings] = useState({ 
    bass: 0, mid: 0, treble: 0, volume: 100 
  });
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(true);

  // Đồng bộ trạng thái Playing từ Global Player
  useEffect(() => {
    if (player.isPlaying !== undefined) setIsPlaying(player.isPlaying);
  }, [player.isPlaying]);

  // Khởi tạo Audio Context khi vào trang
  useEffect(() => {
      setIsMounted(true);
      initAudioNodes();
  }, [initAudioNodes]);

  // --- 1. FETCH SONG INFO (Logic từ Snippet 1) ---
  useEffect(() => {
    if (!isMounted) return;

    const updateSong = async () => {
        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 800)); // Delay nhẹ cho hiệu ứng

        if (!player.activeId) {
            await minDelay; setLoading(false); return;
        }

        try {
            // A. Kiểm tra Cache Global
            if (typeof window !== 'undefined' && window.__SONG_MAP__ && window.__SONG_MAP__[player.activeId]) {
                setSong(window.__SONG_MAP__[player.activeId]);
            } else {
                // B. Fetch API Jamendo
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
                        song_url: track.audio 
                    };
                    setSong(newSong);
                    // Lưu cache
                    if (typeof window !== 'undefined') window.__SONG_MAP__ = { ...window.__SONG_MAP__, [newSong.id]: newSong };
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

  // --- 2. LOAD AUDIO SETTINGS (Logic từ Snippet 2) ---
  useEffect(() => {
    const loadSettings = async () => {
      if (!song?.id) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // A. Ưu tiên Session Storage
        const sessionSaved = sessionStorage.getItem(`audioSettings_${song.id}`);
        if (sessionSaved) {
            applySettings(JSON.parse(sessionSaved));
            return;
        }

        if (session?.user) {
            // B. Tìm cấu hình riêng cho bài hát (DB)
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

            // C. Lấy cấu hình mặc định Profile (DB)
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

  // Helper: Áp dụng settings
  const applySettings = (settings) => {
      setAudioSettings(prev => ({...prev, ...settings}));
      if (song?.id) {
          if (settings.bass !== undefined) setBass(settings.bass, song.id);
          if (settings.mid !== undefined) setMid(settings.mid, song.id);
          if (settings.treble !== undefined) setTreble(settings.treble, song.id);
      }
      if (settings.volume !== undefined) player.setVolume(settings.volume / 100);
  };

  // --- 3. HANDLERS ---
  const handleAudioChange = (key, value) => {
    const numValue = parseFloat(value);
    setAudioSettings(prev => ({ ...prev, [key]: numValue }));

    switch (key) {
      case 'bass':
      case 'mid':
      case 'treble':
        if (song?.id) {
          // Realtime Update EQ
          setTimeout(() => applySettings({ [key]: numValue }), 0);
          // Auto-save session
          const updatedSettings = { ...audioSettings, [key]: numValue };
          sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(updatedSettings));
        }
        break;
      case 'volume':
        player.setVolume(numValue / 100);
        break;
    }
  };

  // Save Settings (với Fallback Foreign Key)
  const handleSaveSettings = async () => {
      setIsSaving(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
              alert("Vui lòng đăng nhập để lưu cấu hình!");
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

          // Fallback nếu bài hát chưa có trong DB (Lỗi Foreign Key)
          if (error?.code === '23503' || error?.message?.includes('foreign key')) {
              sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(audioSettings));
              alert(`Lưu ý: Bài hát từ nguồn ngoài. Cấu hình đã được lưu vào bộ nhớ trình duyệt.`);
              return;
          } else if (error) throw error;

          sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(audioSettings));
          alert(`Đã lưu EQ Preset cho bài: ${song.title}`);

      } catch (err) {
          console.error(err);
          alert("Lỗi khi lưu cấu hình.");
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
          alert("Đã reset về cài đặt mặc định của bạn.");
          return;
        }
      }
      applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
      alert("Đã reset về Flat.");
    } catch (err) {
      applySettings({ bass: 0, mid: 0, treble: 0, volume: audioSettings.volume });
    }
  };

  // --- RENDER ---
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
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black transition-colors animate-in fade-in duration-500">
      
      {/* --- CỘT TRÁI (VISUAL) --- */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center relative perspective-1000">
         {/* Đĩa Than */}
         <div className={`relative w-[280px] h-[280px] md:w-[480px] md:h-[480px] flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
            <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(16,185,129,0.15)] opacity-60"></div>
            <div className="absolute inset-0 rounded-full bg-neutral-900 border border-neutral-800 shadow-2xl bg-[repeating-radial-gradient(#111,#111_2px,#0a0a0a_3px,#0a0a0a_4px)]"></div>
            <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border-4 border-neutral-800 z-0"></div>
         </div>

         {/* Cover Art (Click to Play/Pause) */}
         <div className="absolute z-10 w-[200px] h-[200px] md:w-[320px] md:h-[320px] flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
            <div className="relative w-full h-full flex items-center justify-center">
                 <img src={song.image_path || "/images/default_song.png"} className="w-full h-full object-cover rounded-full border-4 border-black/80 opacity-90 group-hover:opacity-100 transition-opacity" alt="Cover"/>
                 <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-black/10 hover:bg-black/40' : 'bg-black/40'}`}>
                    {isPlaying ? <Pause fill="white" size={64} className="text-white opacity-0 group-hover:opacity-100 transition-opacity"/> : <Play fill="white" size={80} className="text-white ml-2"/>}
                 </div>
            </div>
         </div>

         {/* Thông tin bài hát */}
         <div className="absolute -bottom-12 w-full text-center z-20 space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase font-mono truncate px-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">{song.title}</span>
            </h1>
            <p className="text-sm md:text-base font-bold font-mono text-emerald-500 tracking-[0.3em] uppercase drop-shadow-md">{song.author}</p>
         </div>
         
         <button onClick={() => router.back()} className="absolute top-0 left-0 lg:hidden p-4 text-white hover:text-emerald-400 z-50"><ArrowLeft size={24} /></button>
      </div>

      {/* --- CỘT PHẢI (TABS & CONTROLS) --- */}
      <div className="lg:col-span-4 flex flex-col h-full bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-30">
         {/* Tab Navigation */}
         <div className="flex border-b border-neutral-200 dark:border-white/10">
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

         {/* Tab Content */}
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
                <div className="h-full flex flex-col animate-in fade-in duration-300">
                    <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-6 flex justify-between">
                        <span>:: Audio Processing ::</span><span className="opacity-50">UNIT_01</span>
                    </h3>
                    
                    <div className="space-y-6 flex-1">
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
                                ].map((p) => (
                                    <button
                                        key={p.name}
                                        onClick={() => {
                                            const presetSettings = {...p.s, volume: audioSettings.volume};
                                            applySettings(presetSettings);
                                            if (song?.id) sessionStorage.setItem(`audioSettings_${song.id}`, JSON.stringify(presetSettings));
                                        }}
                                        className="text-[9px] font-mono py-2 rounded bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6">
                        <button onClick={handleSaveSettings} disabled={isSaving} className="flex-1 bg-emerald-500 text-white py-3 rounded font-mono text-xs font-bold uppercase hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                            {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SAVE
                        </button>
                        <button onClick={handleResetSettings} className="flex-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 py-3 rounded font-mono text-xs font-bold uppercase hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-2">
                            <RotateCcw size={14} /> RESET
                        </button>
                    </div>
                </div>
            )}

            {/* 3. INFO TAB */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-700 dark:text-white animate-in fade-in duration-300">
                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Artist</p><p className="font-bold">{song.author}</p></div>
                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Duration</p><p className="font-bold">{Math.floor(song.duration/60)}:{String(song.duration%60).padStart(2,'0')}</p></div>
                    <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Track ID</p><p className="truncate text-emerald-600 dark:text-emerald-500">{song.id}</p></div>
                    <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 rounded"><p className="text-neutral-500 uppercase">Source URL</p><p className="truncate opacity-70">{song.song_url}</p></div>
                    <div className="col-span-2 pt-4 border-t border-neutral-200 dark:border-white/10 mt-2 text-center">
                        <p className="text-[10px] text-neutral-400">METADATA RETRIEVED VIA JAMENDO API</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;