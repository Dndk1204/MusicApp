"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Howler } from "howler"; 
import { motion } from "framer-motion"; 
import { 
  Info, Loader2, Save, ArrowLeft, Sliders, UserCheck, ShieldCheck,
  RotateCcw, Activity, FileText, Mic2, AlertTriangle, Globe, User
} from "lucide-react";

// --- IMPORTS ---
import usePlayer from "@/hooks/usePlayer";
import useAudioFilters from "@/hooks/useAudioFilters";
import { supabase } from "@/lib/supabaseClient";
import Slider from "@/components/Slider";
import SpectrumVisualizer from "@/components/SpectrumVisualizer";
import useUI from "@/hooks/useUI";
import { GlitchText, CyberButton, GlitchButton, ScanlineOverlay } from "@/components/CyberComponents";
import HoverImagePreview from "@/components/HoverImagePreview"; 

// --- CYBER MARQUEE (GIỮ NGUYÊN) ---
const CyberMarquee = ({ text, className = "", speed = 40 }) => {
  const containerRef = useRef(null);
  const ghostRef = useRef(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !ghostRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const textRealWidth = ghostRef.current.offsetWidth;
      setContentWidth(textRealWidth);
      setIsOverflow(textRealWidth > containerWidth + 1);
    };
    checkOverflow();
    const timer = setTimeout(checkOverflow, 100); 
    window.addEventListener("resize", checkOverflow);
    return () => { window.removeEventListener("resize", checkOverflow); clearTimeout(timer); };
  }, [text]);

  const gap = 32; 
  const duration = (contentWidth + gap) / speed;

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden whitespace-nowrap font-mono uppercase tracking-wider border-y border-dashed border-neutral-400/50 dark:border-white/20 bg-neutral-200/30 dark:bg-neutral-900/30 py-1 select-none cursor-help group ${className}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <style jsx>{` @keyframes chromatic-buzz { 0% { transform: translate(0, 0); } 20% { transform: translate(-1px, 0); } 40% { transform: translate(1px, 0); } 60% { transform: translate(-0.5px, 0.5px); } 80% { transform: translate(0.5px, -0.5px); } 100% { transform: translate(0, 0); } } .group:hover .cyber-text::before { content: attr(data-text); position: absolute; left: -1px; top: 0; width: 100%; height: 100%; color: rgba(239, 68, 68, 0.6); z-index: -1; animation: chromatic-buzz 2s infinite reverse; } .group:hover .cyber-text::after { content: attr(data-text); position: absolute; left: 1px; top: 0; width: 100%; height: 100%; color: rgba(6, 182, 212, 0.6); z-index: -2; animation: chromatic-buzz 3s infinite; } `}</style>
      <span ref={ghostRef} className="absolute opacity-0 pointer-events-none z-[-1] font-mono uppercase tracking-wider py-1" aria-hidden="true">{text}</span>
      <motion.div className="inline-flex items-center gap-8" animate={isHovered && isOverflow ? { x: [0, -(contentWidth + gap)] } : { x: 0 }} transition={isHovered && isOverflow ? { repeat: Infinity, repeatType: "loop", duration: duration > 1 ? duration : 1, ease: "linear" } : { type: "spring", stiffness: 200, damping: 25 }}>
        <span className="cyber-text whitespace-nowrap relative z-10 transition-colors" data-text={text}>{text}</span>
        {isOverflow && ( <span className="cyber-text shrink-0 whitespace-nowrap relative z-10 transition-colors" data-text={text} aria-hidden="true">{text}</span> )}
      </motion.div>
      <div className="absolute inset-0 pointer-events-none z-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_3px)] dark:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.05)_3px)] mix-blend-overlay"></div>
    </div>
  );
};

// --- SRT PARSER ---
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

// --- SKELETON LOADER ---
const NowPlayingSkeleton = () => {
  return (
    <div className="w-full h-[70vh] grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 pb-[100px] overflow-hidden bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative border-r border-dashed border-neutral-300 dark:border-white/10 pr-4">
             <div className="w-[220px] h-[220px] rounded-full bg-neutral-300 dark:bg-neutral-800 border-4 border-neutral-400 dark:border-white/5"></div>
             <div className="mt-6 flex flex-col items-center gap-3 w-full max-w-md">
                 <div className="h-10 w-3/4 bg-neutral-300 dark:bg-white/10"></div>
                 <div className="h-4 w-1/3 bg-neutral-300 dark:bg-white/10"></div>
             </div>
        </div>
        <div className="hidden lg:flex h-[100%] lg:col-span-3 flex-col bg-white/5 border border-neutral-200 dark:border-white/10">
            <div className="h-12 border-b border-neutral-200 dark:border-white/10 flex items-center justify-center">
                 <div className="h-3 w-24 bg-neutral-300 dark:bg-white/10"></div>
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 bg-neutral-300 dark:bg-white/10"></div>
                        <div className="flex-1 space-y-1">
                            <div className="h-3 w-2/3 bg-neutral-300 dark:bg-white/10"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="hidden lg:flex lg:col-span-3 flex-col bg-white/5 border border-neutral-200 dark:border-white/10">
             <div className="flex h-12 border-b border-neutral-200 dark:border-white/10">
                 <div className="flex-1 bg-white/10 m-1"></div>
                 <div className="flex-1 m-1"></div>
             </div>
             <div className="flex-1 p-6 flex flex-col justify-center gap-8">
                 <div className="h-40 w-full bg-neutral-300 dark:bg-white/5 mb-4"></div>
             </div>
        </div>
    </div>
  )
}

const NowPlayingPage = () => {
  const player = usePlayer();
  const router = useRouter();
  const { alert } = useUI();
  const { initAudioNodes, setBass, setMid, setTreble, initAnalyzer } = useAudioFilters();

  const [song, setSong] = useState(null);
  const [realDuration, setRealDuration] = useState(0); 
  const [seek, setSeek] = useState(0); 
  const [activeTab, setActiveTab] = useState('equalizer'); 
  const [rawLyrics, setRawLyrics] = useState(null);
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [queueSongs, setQueueSongs] = useState([]);
  const [audioSettings, setAudioSettings] = useState({ bass: 0, mid: 0, treble: 0, volume: 100 });
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isPlaying, setIsPlaying] = useState(true);

  const audioHandlers = useRef({ setBass, setMid, setTreble });
  const durationCheckRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const queueContainerRef = useRef(null);

  // --- AUTO SCROLL QUEUE ---
  useEffect(() => {
    if (player.activeId && queueSongs.length > 0) {
        const scrollToActive = () => {
            const container = queueContainerRef.current;
            const elementId = `queue-item-${player.activeId}`;
            const activeItem = document.getElementById(elementId);
            
            if (container && activeItem) {
                const itemTop = activeItem.offsetTop;
                const containerHeight = container.clientHeight;
                const itemHeight = activeItem.clientHeight;
                const targetScrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
                container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
            } else {
                setTimeout(scrollToActive, 100); 
            }
        };
        const timer = setTimeout(scrollToActive, 300);
        return () => clearTimeout(timer);
    }
  }, [player.activeId, queueSongs]);

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
            if(activeSound.playing()) {
                setSeek(activeSound.seek()); 
            }
        }
    }, 200); 
    return () => { if (durationCheckRef.current) clearInterval(durationCheckRef.current); };
  }, [player.activeId]);

  // --- FETCH CURRENT SONG ---
  useEffect(() => {
    if (!isMounted) return;
    const updateSong = async () => {
        setLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 500));
        
        if (!player.activeId) {
            setSong(null);
            await minDelay; setLoading(false);
            return; 
        }

        try {
            // 1. Tìm trong Supabase
            const { data: dbSong } = await supabase
                .from('songs')
                .select(`*, profiles (full_name, role, avatar_url)`)
                .eq('id', player.activeId)
                .maybeSingle();

            if (dbSong) {
                let uploaderName = dbSong.profiles?.full_name || "Unknown";
                let uploaderRole = dbSong.profiles?.role || "user";
                let uploaderAvatar = dbSong.profiles?.avatar_url;
                if (!dbSong.profiles) { uploaderName = "System Admin"; uploaderRole = "admin"; }

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
                    source: 'database',
                    lyric_url: dbSong.lyric_url,
                    lyrics: dbSong.lyrics
                });
            } else {
                // 2. Fallback API
                const CLIENT_ID = "3501caaa"; 
                const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&id=${player.activeId}&audioformat=mp31`);
                const json = await res.json();

                if (json.results && json.results[0]) {
                    const track = json.results[0];
                    setSong({
                        id: player.activeId,
                        title: track.name,
                        author: track.artist_name,
                        image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
                        song_url: track.audio,
                        uploader: "Jamendo API",
                        uploader_role: "api",
                        uploader_avatar: null,
                        source: 'api',
                        lyric_url: null,
                        lyrics: null
                    });
                } else {
                    setSong(null);
                }
            }
        } catch (error) {
            console.error("Error fetching song:", error);
            setSong(null);
        } finally {
            await minDelay; setLoading(false);
        }
    };
    updateSong();
  }, [player.activeId, isMounted]);

  // --- RESET LYRICS ---
  useEffect(() => {
    if (song) {
      setRawLyrics(null); setParsedLyrics([]); setActiveLineIndex(-1); setLoadingLyrics(false);
      setActiveTab('equalizer');
    }
  }, [song?.id]);

  // --- FETCH LYRICS ---
  useEffect(() => {
    if (activeTab === 'lyrics' && song) {
        const fetchLyrics = async () => {
            if (rawLyrics || (!song.lyric_url && !song.lyrics)) {
                if (!song.lyric_url && !song.lyrics) setRawLyrics("NO_LYRICS_AVAILABLE");
                return;
            }
            setLoadingLyrics(true);
            try {
                let text = song.lyrics || "";
                if (!text && song.lyric_url) {
                    const res = await fetch(song.lyric_url);
                    if (res.ok) text = await res.text();
                }
                setRawLyrics(text);
                setParsedLyrics(parseSRT(text));
            } catch (err) {
                setRawLyrics("ERROR_LOADING_DATA");
            } finally {
                setLoadingLyrics(false);
            }
        };
        fetchLyrics();
    }
  }, [activeTab, song]);

  // --- FETCH QUEUE SONGS (FIX LỖI UNKNOWN) ---
  useEffect(() => {
    const fetchQueueSongs = async () => {
      if (!player.ids || player.ids.length === 0) {
        setQueueSongs([]);
        return;
      }

      try {
        const queueIds = player.ids;
        
        // 1. Lấy dữ liệu từ DB (Chỉ những ID hợp lệ của DB)
        const { data: queueData } = await supabase
          .from('songs')
          .select('id, title, author, image_url')
          .in('id', queueIds);

        const dbSongsMap = {};
        if (queueData) {
            queueData.forEach(s => dbSongsMap[String(s.id)] = s);
        }

        // 2. Tìm những ID không có trong DB (Giả định là API ID)
        // Lưu ý: ID của Jamendo thường là chuỗi số (vd: "1873426")
        const missingIds = queueIds.filter(id => !dbSongsMap[String(id)]);
        
        // 3. Fetch Bulk từ Jamendo API cho các ID thiếu
        let apiSongsMap = {};
        if (missingIds.length > 0) {
            const CLIENT_ID = "3501caaa";
            // Jamendo cho phép fetch nhiều ID cách nhau bằng dấu + hoặc space
            // Giới hạn khoảng 50 ID một lần để tránh lỗi URL quá dài
            const idsToFetch = missingIds.slice(0, 20).join('+'); 
            
            try {
                const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&id=${idsToFetch}`);
                const json = await res.json();
                if (json.results) {
                    json.results.forEach(track => {
                        apiSongsMap[String(track.id)] = {
                            id: track.id,
                            title: track.name,
                            author: track.artist_name,
                            image_url: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600"
                        };
                    });
                }
            } catch (e) {
                console.warn("Failed to fetch API queue details", e);
            }
        }

        // 4. Map lại toàn bộ queue theo đúng thứ tự
        const sortedQueueData = queueIds.map(queueId => {
          const idStr = String(queueId);
          
          // Ưu tiên 1: DB
          if (dbSongsMap[idStr]) {
              return {
                id: dbSongsMap[idStr].id,
                title: dbSongsMap[idStr].title,
                author: dbSongsMap[idStr].author,
                image_path: dbSongsMap[idStr].image_url || '/images/default_song.png'
              };
          }

          // Ưu tiên 2: API vừa fetch được
          if (apiSongsMap[idStr]) {
              return {
                  id: apiSongsMap[idStr].id,
                  title: apiSongsMap[idStr].title,
                  author: apiSongsMap[idStr].author,
                  image_path: apiSongsMap[idStr].image_url
              };
          }

          // Ưu tiên 3: Nếu là bài đang phát (lấy từ state song)
          if (song && String(song.id) === idStr) {
              return {
                  id: song.id,
                  title: song.title,
                  author: song.author,
                  image_path: song.image_path || '/images/default_song.png'
              };
          }

          // Fallback cuối cùng
          return {
            id: queueId,
            title: `Track ${queueId}`,
            author: "Unknown Artist",
            image_path: '/images/default_song.png'
          };
        });

        setQueueSongs(sortedQueueData);
      } catch (err) {
        console.error("Critical error in queue fetch:", err);
      }
    };

    fetchQueueSongs();
  }, [player.ids, song]); 

  // --- LYRICS SCROLL ---
  useEffect(() => {
      if (parsedLyrics.length > 0) {
          const index = parsedLyrics.findIndex((line, i) => {
              const nextLine = parsedLyrics[i + 1];
              return seek >= line.time && (!nextLine || seek < nextLine.time);
          });
          if (index !== -1 && index !== activeLineIndex) {
              setActiveLineIndex(index);
              const container = lyricsContainerRef.current;
              const element = document.getElementById(`lyric-line-${index}`);
              if (element && container) {
                  const targetScrollTop = element.offsetTop - (container.clientHeight / 2) + (element.offsetHeight / 2);
                  container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
              }
          }
      }
  }, [seek, parsedLyrics]); 

  // --- AUDIO HANDLERS ---
  const applySettings = useCallback((settings) => {
      setAudioSettings(prev => ({...prev, ...settings}));
      const handlers = audioHandlers.current;
      if (handlers.setBass) handlers.setBass(settings.bass);
      if (handlers.setMid) handlers.setMid(settings.mid);
      if (handlers.setTreble) handlers.setTreble(settings.treble);
  }, []);

  const handleAudioChange = (key, value) => {
    const numValue = parseFloat(value);
    setAudioSettings(prev => ({ ...prev, [key]: numValue }));
    const handlers = audioHandlers.current;
    if (key === 'bass') handlers.setBass(numValue);
    if (key === 'mid') handlers.setMid(numValue);
    if (key === 'treble') handlers.setTreble(numValue);
  };

  const handleSaveSettings = async () => { alert("Settings Saved", "success") };
  const handleResetSettings = async () => { applySettings({ bass: 0, mid: 0, treble: 0, volume: 100 }); alert("Reset", "info") };
  const isPresetActive = (preset) => audioSettings.bass === preset.bass && audioSettings.mid === preset.mid && audioSettings.treble === preset.treble;

  if (!isMounted) return null;
  if (loading) return <NowPlayingSkeleton />;
  if (!player.activeId || !song) return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-neutral-100 dark:bg-black relative">  
          <div className="text-center p-8 border-2 border-red-500/50 bg-black/50 backdrop-blur-md">
              <AlertTriangle size={48} className="text-red-500 mb-4 animate-pulse mx-auto"/>
              <h1 className="text-2xl font-black font-mono text-white tracking-wider uppercase">NO_ACTIVE_TRACK</h1>
              <GlitchButton onClick={() => router.push('/')} className="mt-6 text-xs px-6 py-2 border-red-500 text-red-400 hover:text-white">GO_TO_BROWSE</GlitchButton>
          </div>
      </div>
  );

  return (
    <div className="w-full h-[75vh] -mt-2 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden bg-neutral-100 dark:bg-black transition-colors animate-in fade-in duration-500 relative">

      {/* --- CỘT TRÁI (VISUAL) --- */}
      <div className="lg:col-span-6 translate-y-1 -translate-x-6 flex flex-col items-center justify-center relative perspective-1000 h-full min-h-0 border-r border-dashed border-neutral-300 dark:border-white/10 pr-4">
          <div className="relative flex items-center justify-center scale-90 md:scale-100">
              <div className={`relative w-[220px] h-[220px] md:w-[350px] md:h-[350px] flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}>
                 <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/30"></div>
                 <div className="absolute inset-4 rounded-full border border-neutral-800 dark:border-white/10"></div>
                 <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border-2 border-transparent border-t-emerald-500/50 border-b-emerald-500/50 rotate-45"></div>
                 <div className="absolute inset-0 m-auto w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-neutral-300 dark:border-neutral-800 bg-black shadow-2xl group">
                      <img src={song.image_path || song.image_url || "/images/default_song.png"} className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" alt="Cover" />
                      <ScanlineOverlay />
                 </div>
              </div>
          </div>

          <div className="md:mt-3 h-full text-center z-20 space-y-2 max-w-lg w-full px-4 overflow-hidden">
             {/* MAIN SONG TITLE MARQUEE */}
             <div className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase font-mono w-full">
                 <CyberMarquee text={song.title} speed={40} className="w-full text-center" />
             </div>
             <div className="flex items-center justify-center gap-2">
                 <span className="w-8 h-px bg-emerald-500"></span>
                 <p className="text-sm md:text-base font-bold font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase">{song.author}</p>
                 <span className="w-8 h-px bg-emerald-500"></span>
             </div>
             <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-white/50 dark:bg-white/5 px-4 py-2 border border-neutral-300 dark:border-white/10 mx-auto backdrop-blur-sm w-fit">
                 <span className="uppercase tracking-widest opacity-70 border-r border-neutral-400 dark:border-white/20 pr-2 mr-2">SOURCE</span>
                 <span className={`font-bold flex items-center gap-2 ${song.source === 'api' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                     {song.source === 'api' ? <Globe size={14} className="text-purple-500"/> : (song.uploader_role === 'admin' ? <ShieldCheck size={14} className="text-yellow-500"/> : <UserCheck size={14} className="text-blue-500"/>)}
                     <span className="text-sm uppercase">{song.uploader}</span>
                 </span>
             </div>
          </div>
          <button onClick={() => router.back()} className="absolute top-0 left-0 lg:hidden p-4 text-neutral-500 hover:text-emerald-500 z-50"><ArrowLeft size={24} /></button>
      </div>

      {/* --- CỘT GIỮA (QUEUE) - ĐÃ FIX IMAGE --- */}
      <div className="lg:col-span-3 flex -translate-x-12 flex-col h-[103%] w-[80%] bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-none overflow-hidden shadow-xl z-20 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 z-40"></div>

          <div className="flex items-center justify-center border-b border-neutral-200 dark:border-white/10 shrink-0 py-4">
             <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">:: PLAY_QUEUE ({queueSongs.length}) ::</h3>
          </div>

          <div className="flex-1 min-h-0 relative">
             <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 scroll-smooth" ref={queueContainerRef}>
                 {queueSongs.length > 0 ? (
                    <div className="space-y-2 pb-10">
                       {queueSongs.map((queueSong, index) => {
                          const isCurrentlyPlaying = String(queueSong.id) === String(song.id);
                          const hasImage = queueSong.image_path && queueSong.image_path !== '/images/default_song.png';

                          return (
                            <div
                               key={`${queueSong.id}-${index}`}
                               id={`queue-item-${queueSong.id}`}
                               className={`p-2 border group rounded-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors duration-200 ${
                                  isCurrentlyPlaying
                                     ? 'bg-emerald-500/10 border-emerald-500/30'
                                     : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10'
                               }`}
                               onClick={() => player.setId(queueSong.id)}
                            >
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 shrink-0 relative cursor-none">
                                      <HoverImagePreview src={queueSong.image_path} alt={queueSong.title} className="w-full h-full" previewSize={160} fallbackIcon="disc">
                                           {hasImage ? (
                                               <img 
                                                   src={queueSong.image_path} 
                                                   className={`w-full h-full object-cover border transition-all duration-300 grayscale group-hover:grayscale-0 ${isCurrentlyPlaying ? 'border-emerald-500/50' : 'border-neutral-300 dark:border-white/20'}`} 
                                                   alt="Queue"
                                                   onError={(e) => {
                                                       e.target.style.display = 'none';
                                                       e.target.nextSibling.style.display = 'flex';
                                                   }}
                                               />
                                           ) : (
                                               <div className={`w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-white/10 border ${isCurrentlyPlaying ? 'border-emerald-500/50 text-emerald-500' : 'border-neutral-300 dark:border-white/20 text-neutral-400'}`}>
                                                   <User size={16} strokeWidth={1.5} />
                                               </div>
                                           )}
                                           {hasImage && (
                                               <div className={`hidden w-full h-full absolute inset-0 items-center justify-center bg-neutral-200 dark:bg-white/10 border ${isCurrentlyPlaying ? 'border-emerald-500/50 text-emerald-500' : 'border-neutral-300 dark:border-white/20 text-neutral-400'}`}>
                                                   <User size={16} strokeWidth={1.5} />
                                               </div>
                                           )}
                                      </HoverImagePreview>
                                  </div>
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                     <div className={`text-xs font-bold font-mono ${isCurrentlyPlaying ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-800 dark:text-white'}`}>
                                         <CyberMarquee text={queueSong.title} speed={40} />
                                     </div>
                                     <p className="text-[10px] font-mono text-neutral-500 truncate">{queueSong.author}</p>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                       <p className="text-xs font-mono">NO_QUEUE_ITEMS</p>
                    </div>
                 )}
             </div>
          </div>
      </div>

      {/* --- CỘT PHẢI (GIỮ NGUYÊN) --- */}
      <div className="lg:col-span-3 flex flex-col -translate-x-28 w-[145%] h-[103%] bg-white/80 dark:bg-black/40 backdrop-blur-2xl border border-neutral-200 dark:border-white/10 rounded-none overflow-hidden shadow-2xl z-30 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500 z-40"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500 z-40"></div>

          <div className="flex border-b border-neutral-200 dark:border-white/10 shrink-0">
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

          <div className="flex-1 min-h-0 p-6 custom-scrollbar relative overflow-hidden flex flex-col w-full h-full">
            {activeTab === 'equalizer' && (
                <div className="flex flex-col h-full animate-in fade-in duration-300 w-full relative">
                    <h3 className="shrink-0 text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-2 flex justify-between border-b border-neutral-200 dark:border-white/10 pb-2 z-10">
                        <span className="flex items-center gap-2"><Activity size={12}/> AUDIO_PROCESSING_UNIT</span>
                        <span className="opacity-50">FREQ_MOD</span>
                    </h3>
                    <div className="flex-1 flex flex-col justify-center w-full min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="h-[140px] md:h-[180px] translate-y-20 shrink-0 w-full relative flex items-center justify-center">
                             <div className="w-full h-full absolute inset-0"><SpectrumVisualizer isPlaying={isPlaying} /></div>
                        </div>
                        <div className="shrink-0 space-y-4 px-1">
                            <div className="space-y-3">
                                {[{ id: 'bass', label: 'Bass_Freq', min: -15, max: 15 }, { id: 'mid', label: 'Mid_Freq', min: -15, max: 15 }, { id: 'treble', label: 'High_Freq', min: -15, max: 15 }].map((item) => (
                                    <div key={item.id} className="flex flex-col gap-y-1">
                                            <div className="flex justify-between text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400">
                                                <label>{item.label}</label>
                                                <span className="bg-neutral-200 dark:bg-white/10 px-1 text-black dark:text-white border border-neutral-300 dark:border-white/10 font-bold min-w-[30px] text-center">{audioSettings[item.id] > 0 ? '+' : ''}{audioSettings[item.id]}dB</span>
                                            </div>
                                            <Slider value={audioSettings[item.id]} max={item.max} min={item.min} step={1} onChange={(val) => handleAudioChange(item.id, val)} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <CyberButton onClick={handleSaveSettings} disabled={isSaving} className="flex-1 text-xs hover:!text-white py-2 h-auto"> {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} SAVE_CONFIG </CyberButton>
                                <GlitchButton onClick={handleResetSettings} className="flex-1 border-red-400/50 text-red-500 bg-transparent hover:text-white text-xs py-2 h-auto rounded-none"> <RotateCcw size={14} className="mr-1"/> RESET </GlitchButton>
                            </div>
                            <div className="border-t border-dashed border-neutral-300 dark:border-white/10 pt-2">
                                <p className="text-[8px] font-mono text-neutral-400 uppercase mb-2 tracking-widest">:: PRESET_MATRIX ::</p>
                                <div className="overflow-x-auto custom-scrollbar pb-1">
                                    <div className="flex gap-2 min-w-max">
                                            {['FLAT', 'BASS_BOOST', 'DYNAMIC', 'ROCK', 'POP', 'JAZZ', 'ELECTRONIC', 'INDIE', 'CLASSIC', 'HIPHOP', 'VOCAL', 'CINEMATIC'].map((name) => {
                                                const presets = { 'FLAT': {bass: 0, mid: 0, treble: 0}, 'BASS_BOOST': {bass: 10, mid: 2, treble: -3}, 'DYNAMIC': {bass: 7, mid: 3, treble: 7}, 'ROCK': {bass: 8, mid: 4, treble: 2}, 'POP': {bass: 5, mid: 8, treble: 5}, 'JAZZ': {bass: 6, mid: -2, treble: 8}, 'ELECTRONIC': {bass: 12, mid: 5, treble: -4}, 'INDIE': {bass: 3, mid: 7, treble: 6}, 'CLASSIC': {bass: 4, mid: -3, treble: 9}, 'HIPHOP': {bass: 11, mid: 6, treble: 1}, 'VOCAL': {bass: 2, mid: 12, treble: 4}, 'CINEMATIC': {bass: 9, mid: 3, treble: 3} };
                                                const values = presets[name];
                                                return (
                                                <button key={name} onClick={() => applySettings({ ...values, volume: audioSettings.volume })} className={`text-[9px] font-mono py-1.5 px-2 border transition-all duration-300 whitespace-nowrap shrink-0 ${isPresetActive(values) ? 'bg-emerald-500 text-black border-emerald-500 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'border-neutral-400 dark:border-white/20 text-neutral-500 hover:border-emerald-500 hover:text-emerald-500'}`}> {name} </button>
                                            )})}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'lyrics' && (
                <div className="flex flex-col animate-in fade-in duration-300 w-full h-full relative">
                    <h3 className="shrink-0 text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-2"> <FileText size={12}/> <span>:: KARAOKE_STREAM_V2 ::</span> </h3>
                    {loadingLyrics ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-emerald-500 gap-2"> <Loader2 className="animate-spin" size={24}/> <span className="text-xs font-mono animate-pulse">DECODING_STREAM...</span> </div>
                    ) : (
                        <div className="flex-1 relative overflow-hidden">
                             <div ref={lyricsContainerRef} className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 pb-20 text-center scroll-smooth">
                                 {rawLyrics === "NO_LYRICS_AVAILABLE" ? (
                                     <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-60"> <FileText size={32} className="mb-2 opacity-50"/> <p className="font-mono text-xs">NO_DATA_FOUND</p> </div>
                                 ) : parsedLyrics.length > 0 ? (
                                     <ul className="space-y-6 py-[40%] px-2 relative">
                                         {parsedLyrics.map((line, index) => {
                                             const isActive = index === activeLineIndex;
                                             return (
                                                 <li key={index} id={`lyric-line-${index}`} className={`transition-all duration-500 ease-out font-sans text-lg md:text-xl leading-relaxed cursor-pointer ${isActive ? 'text-emerald-500 font-bold scale-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-neutral-400 dark:text-neutral-500 opacity-50 hover:opacity-80 scale-100'}`} onClick={() => { const activeSound = Howler._howls.find(h => h.state() === 'loaded' && h.duration() > 0); if (activeSound) { activeSound.seek(line.time); setSeek(line.time); } }}> {line.content} </li>
                                             )
                                         })}
                                     </ul>
                                 ) : ( <pre className="font-sans text-sm md:text-base leading-relaxed whitespace-pre-wrap text-center text-neutral-800 dark:text-neutral-200"> {rawLyrics} </pre> )}
                             </div>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'info' && (
                <div className="flex flex-col h-full w-full gap-4 text-xs font-mono text-neutral-700 dark:text-white animate-in fade-in duration-300 max-w-2xl mx-auto overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5"> <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">ARTIST_ID</p> <p className="font-bold text-sm truncate">{song.author}</p> </div>
                        <div className="p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5"> <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">DURATION</p> <p className="font-bold text-emerald-600 dark:text-emerald-500 text-sm"> {formatTime(realDuration)} </p> </div>
                        <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 flex flex-col"> <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">UNIQUE_TRACK_ID</p> <p className="truncate text-emerald-600 dark:text-emerald-500 font-mono text-[10px]">{song.id}</p> </div>
                        <div className="col-span-2 p-3 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5"> <p className="text-[9px] text-neutral-500 uppercase tracking-widest mb-1">UPLOAD_SOURCE</p> <div className="flex items-center gap-2"> <div className="w-6 h-6 relative shrink-0"> <HoverImagePreview src={song.uploader_avatar} alt={song.uploader} className="w-full h-full cursor-none" previewSize={160} fallbackIcon="user"> <div className="w-full h-full group relative flex items-center justify-center overflow-hidden border border-white/20 bg-neutral-200 dark:bg-neutral-800 rounded-none"> {song.uploader_avatar ? ( <img src={song.uploader_avatar} className="w-full h-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0" alt={song.uploader} /> ) : ( song.uploader_role === 'admin' ? <ShieldCheck size={14} className="text-yellow-500"/> : <UserCheck size={14} className="text-green-500"/> )} <ScanlineOverlay /> </div> </HoverImagePreview> </div> <p className="font-bold">{song.uploader}</p> </div> </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-white/10 text-center shrink-0"> <p className="text-[9px] text-neutral-400 animate-pulse">:: SECURE_CONNECTION_ESTABLISHED ::</p> </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default NowPlayingPage;