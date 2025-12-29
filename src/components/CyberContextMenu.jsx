"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, RotateCw, Copy, Music, 
  Volume2, VolumeX, Terminal, Maximize, LogOut, 
  LogIn, ListPlus, AlertCircle, Activity 
} from "lucide-react";
import usePlayer from "@/hooks/usePlayer"; 
import { supabase } from "@/lib/supabaseClient"; 
import useUI from "@/hooks/useUI";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";

const CyberContextMenu = () => {
  const router = useRouter();
  const player = usePlayer();
  const { alert } = useUI();
  const { user } = useAuth(); 
  const { openModal } = useModal();
  
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [prevVolume, setPrevVolume] = useState(1);
  const [targetSong, setTargetSong] = useState(null);

  // --- LOGIC ĐỒNG BỘ VỚI CURSOR ---
  const [isEnabled, setIsEnabled] = useState(true);
  const isEnabledRef = useRef(true); 
  const isBSODActiveRef = useRef(false); // Theo dõi trạng thái màn hình xanh

  const menuRef = useRef(null);

  // 1. LẮNG NGHE PHÍM ESC VỚI TIMING KHỚP 100% VỚI CURSOR
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isEnabledRef.current) {
          // Bắt đầu quá trình BSOD (giống bên Cursor)
          isBSODActiveRef.current = true;
          setVisible(false);

          // Sau đúng 1.2s (thời gian BSOD), mới thực sự nhả Menu mặc định
          setTimeout(() => {
            isEnabledRef.current = false;
            setIsEnabled(false);
            isBSODActiveRef.current = false;
          }, 1200);
        } else {
          // Bật lại Cyber Mode ngay lập tức (giống bên Cursor)
          isEnabledRef.current = true;
          setIsEnabled(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. LOGIC CONTEXT MENU
  useEffect(() => {
    const handleContextMenu = (event) => {
      // ĐIỀU KIỆN CHẶN: 
      // 1. Nếu menu đã bị tắt hẳn (isEnabled = false)
      // 2. HOẶC đang trong quá trình hiện BSOD (isBSODActive = true)
      if (!isEnabledRef.current || isBSODActiveRef.current) {
        return; 
      }

      event.preventDefault();

      const songElement = event.target.closest('[data-song-json]');
      let foundSong = null;
      if (songElement) {
          try {
              foundSong = JSON.parse(songElement.getAttribute('data-song-json'));
          } catch (e) {}
      }
      setTargetSong(foundSong);

      const menuWidth = 220;
      const menuHeight = foundSong ? 400 : 350; 
      let x = event.clientX;
      let y = event.clientY;

      if (x + menuWidth > window.innerWidth) x -= menuWidth;
      if (y + menuHeight > window.innerHeight) y -= menuHeight;

      setCoords({ x, y });
      setVisible(true);
    };

    const handleClick = () => setVisible(false);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleClick);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleClick);
    };
  }, []);

  // --- ACTIONS ---
  const handleBack = () => router.back();
  const handleForward = () => router.forward();
  const handleReload = () => window.location.reload();
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("URL_COPIED_TO_CLIPBOARD", "success");
    setVisible(false);
  };
  const toggleMute = () => {
    player.volume > 0 ? player.setVolume(0) : player.setVolume(prevVolume || 1);
  };
  const toggleFullscreen = () => {
    !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
    setVisible(false);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };
  const handleLogin = () => {
    openModal();
    setVisible(false);
  };
  const handleDevTools = () => {
    console.clear();
    console.log("%c :: SYSTEM_ACCESS_GRANTED :: ", "background: #10b981; color: #000; font-size: 20px; font-weight: bold;");
    alert("CONSOLE_LOG_INITIATED. PRESS F12", "info");
    setVisible(false);
  };

  const handleAddToPlaylist = () => {
    if (!targetSong) return;

    if (!user) {
      alert("ACCESS_DENIED: LOGIN_REQUIRED", "error");
      openModal(); // Mở modal đăng nhập nếu chưa có user
      setVisible(false);
      return;
    }

    // Chuẩn hóa dữ liệu (Normalization) để trang /add-to-playlist luôn nhận được 1 format chung
    const normalizedSong = {
      id: targetSong.id || targetSong.encodeId,
      title: targetSong.title,
      author: targetSong.author || targetSong.artistsNames,
      // Ưu tiên song_url của mình, sau đó đến link từ API
      song_url: targetSong.song_url || targetSong.song_path || targetSong.streaming, 
      image_url: targetSong.image_url || targetSong.image_path || targetSong.thumbnailM,
      duration: targetSong.duration
    };

    // Chuyển hướng sang trang chọn playlist kèm theo thông tin bài hát
    const songDataString = encodeURIComponent(JSON.stringify(normalizedSong));
    router.push(`/add-to-playlist?song=${songDataString}`);
    
    setVisible(false);
  };

  // NẾU TẮT HOẶC KHÔNG HIỆN -> KHÔNG RENDER
  if (!isEnabled || !visible) return null;

  return (
    <div 
      ref={menuRef}
      className="fixed z-[99999] w-[220px] bg-white/95 dark:bg-black/95 backdrop-blur-md border-2 border-emerald-600 dark:border-emerald-500 shadow-xl dark:shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in-95 origin-top-left overflow-hidden rounded-none transition-colors duration-300"
      style={{ top: coords.y, left: coords.x }}
    >
        {/* Header Section */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-600/20 dark:border-emerald-500/30 px-3 py-1.5 flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-widest flex items-center gap-2">
                <Activity size={10} className="animate-pulse" /> :: SYSTEM_MENU ::
            </span>
            <div className="text-[8px] text-emerald-600/50 dark:text-emerald-500/50 font-mono">OS_V1.0</div>
        </div>

        <div className="p-1 flex flex-col gap-0.5">
            {/* Top Navigation Row */}
            <div className="flex gap-1 mb-1">
                <button onClick={handleBack} className="flex-1 p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-black text-neutral-600 dark:text-neutral-400 transition-colors border border-neutral-200 dark:border-white/5">
                    <ArrowLeft size={16}/>
                </button>
                <button onClick={handleReload} className="flex-1 p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-black text-neutral-600 dark:text-neutral-400 transition-colors border border-neutral-200 dark:border-white/5">
                    <RotateCw size={16}/>
                </button>
                <button onClick={handleForward} className="flex-1 p-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-black text-neutral-600 dark:text-neutral-400 transition-colors border border-neutral-200 dark:border-white/5">
                    <ArrowRight size={16}/>
                </button>
            </div>
            
            {targetSong && (
                <>
                    <div className="px-2 py-2 bg-emerald-500/10 border-l-4 border-emerald-500 mb-1 flex items-center gap-3">
                        {/* THUMBNAIL CONTAINER */}
                        <div className="relative w-10 h-10 shrink-0 border border-emerald-500/50 overflow-hidden bg-black">
                            <img 
                                src={targetSong.image_url || targetSong.image_path || targetSong.thumbnailM || "/images/music-placeholder.png"} 
                                alt={targetSong.title}
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                            />
                            {/* Lớp phủ Scanline mini cho ảnh */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]"></div>
                        </div>

                        {/* TEXT INFO */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] text-emerald-500 font-mono leading-none mb-1 opacity-70 flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-500 animate-ping"></span>
                                TARGET_LOCKED
                            </p>
                            <p className="text-[11px] font-bold text-neutral-800 dark:text-emerald-400 truncate font-mono uppercase tracking-tighter">
                                {targetSong.title}
                            </p>
                            <p className="text-[9px] text-neutral-500 dark:text-emerald-500/60 truncate font-mono">
                                {targetSong.author || targetSong.artistsNames}
                            </p>
                        </div>
                    </div>
                    
                    <MenuItem 
                        icon={<ListPlus size={16} className="text-emerald-500" />} 
                        label="ADD_TO_PLAYLIST" 
                        onClick={handleAddToPlaylist} 
                        active 
                    />
                    <div className="h-px bg-neutral-200 dark:bg-white/10 my-1 mx-2"></div>
                </>
            )}

            <MenuItem icon={<Copy size={14}/>} label="COPY_LINK" onClick={handleCopyUrl} />
            <MenuItem icon={<Maximize size={14}/>} label="FULLSCREEN" onClick={toggleFullscreen} />
            
            <div className="h-px bg-neutral-200 dark:bg-white/10 my-1 mx-2"></div>
            
            <MenuItem 
                icon={player.volume === 0 ? <VolumeX size={14}/> : <Volume2 size={14}/>} 
                label={player.volume === 0 ? "UNMUTE_CORE" : "MUTE_CORE"} 
                onClick={toggleMute} 
                active={player.volume > 0}
            />
            
            <div className="h-px bg-neutral-200 dark:bg-white/10 my-1 mx-2"></div>
            
            <MenuItem icon={<Terminal size={14}/>} label="DEBUG_CONSOLE" onClick={handleDevTools} />
            
            {user ? (
                <MenuItem icon={<LogOut size={14}/>} label="TERMINATE_LINK" onClick={handleLogout} danger />
            ) : (
                <MenuItem icon={<LogIn size={14}/>} label="ESTABLISH_LINK" onClick={handleLogin} active />
            )}
        </div>
        
        {/* Accent Footer Line */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-600 dark:from-emerald-500 to-transparent mt-1 opacity-50"></div>
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, danger = false, active = false }) => (
    <button 
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-3 py-2 text-xs font-mono tracking-wide text-left transition-all duration-200 border border-transparent
            ${danger 
                ? "text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-600 dark:hover:border-red-500 hover:text-red-700 dark:hover:text-red-400" 
                : "text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:pl-5"
            }
            ${active && !danger ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5" : ""}
        `}
    >
        {icon}
        {label}
    </button>
);

export default CyberContextMenu;