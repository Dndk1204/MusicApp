"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Copy, 
  Music, 
  Volume2, 
  VolumeX, 
  Terminal, 
  Maximize,
  LogOut,
  LogIn,
  ListPlus
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

  const menuRef = useRef(null);

  useEffect(() => {
    if (player.volume > 0) {
      setPrevVolume(player.volume);
    }
  }, [player.volume]);

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();

      const songElement = event.target.closest('[data-song-json]');
      let foundSong = null;
      
      if (songElement) {
          try {
              const jsonData = songElement.getAttribute('data-song-json');
              foundSong = JSON.parse(jsonData);
          } catch (e) {
              console.error("Failed to parse song data", e);
          }
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

    const handleClick = () => {
      if (visible) setVisible(false);
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleClick);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleClick);
    };
  }, [visible]);

  if (!visible) return null;

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
    if (player.volume > 0) {
      player.setVolume(0);
    } else {
      player.setVolume(prevVolume || 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
    setVisible(false);
  };

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (!error) {
          window.location.href = "/"; 
      }
  };

  const handleLogin = () => {
      openModal();
      setVisible(false);
  };

  // --- MỞ CONSOLE (LOG RA THÔNG ĐIỆP) ---
  const handleDevTools = () => {
      // JavaScript KHÔNG THỂ mở F12 DevTools do bảo mật trình duyệt
      // Thay vào đó, ta log một thông điệp "ngầu" ra console để user tự mở
      console.clear();
      console.log(
        "%c :: SYSTEM_ACCESS_GRANTED :: ",
        "background: #10b981; color: #000; font-size: 20px; font-weight: bold; padding: 5px;"
      );
      console.log(
        "%c Welcome to the Matrix. Use F12 to inspect elements. ",
        "color: #10b981; font-family: monospace; font-size: 14px;"
      );
      
      alert("CONSOLE_LOG_INITIATED. PRESS F12", "info");
      setVisible(false);
  };

  // --- XỬ LÝ THÊM VÀO PLAYLIST (CÓ CHECK LOGIN) ---
  const handleAddToPlaylist = () => {
      if (!targetSong) return;

      // 1. KIỂM TRA ĐĂNG NHẬP
      if (!user) {
          alert("ACCESS_DENIED: LOGIN_REQUIRED", "error");
          openModal(); // Mở modal đăng nhập
          setVisible(false);
          return;
      }
      
      const normalizedSong = {
          id: targetSong.id || targetSong.encodeId,
          title: targetSong.title,
          author: targetSong.artistsNames || targetSong.author,
          song_url: targetSong.streaming?.mp3 || targetSong.song_url,
          image_url: targetSong.thumbnailM || targetSong.image_url || targetSong.image_path,
          duration: targetSong.duration
      };

      router.push(`/add-to-playlist?song=${encodeURIComponent(JSON.stringify(normalizedSong))}`);
      setVisible(false);
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-[99999] w-[220px] bg-black/90 backdrop-blur-md border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in-95 duration-100 origin-top-left overflow-hidden rounded-none"
      style={{ top: coords.y, left: coords.x }}
    >
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-3 py-1 flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-emerald-500 tracking-widest">:: SYSTEM_MENU ::</span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500/50"></div>
            </div>
        </div>

        <div className="p-1 flex flex-col gap-0.5">
            <div className="flex gap-1 mb-1">
                <button onClick={handleBack} className="flex-1 p-2 bg-neutral-900 hover:bg-emerald-500 hover:text-black text-neutral-400 transition-colors flex items-center justify-center border border-white/5 hover:border-emerald-500">
                    <ArrowLeft size={16}/>
                </button>
                <button onClick={handleReload} className="flex-1 p-2 bg-neutral-900 hover:bg-emerald-500 hover:text-black text-neutral-400 transition-colors flex items-center justify-center border border-white/5 hover:border-emerald-500">
                    <RotateCw size={16}/>
                </button>
                <button onClick={handleForward} className="flex-1 p-2 bg-neutral-900 hover:bg-emerald-500 hover:text-black text-neutral-400 transition-colors flex items-center justify-center border border-white/5 hover:border-emerald-500">
                    <ArrowRight size={16}/>
                </button>
            </div>
            
            {targetSong && (
                <>
                    <div className="px-2 py-1 text-[9px] text-emerald-500 font-mono tracking-widest bg-emerald-500/5 truncate">
                        TRACK: {targetSong.title}
                    </div>
                    <MenuItem 
                        icon={<ListPlus size={14}/>} 
                        label="ADD_TO_PLAYLIST" 
                        onClick={handleAddToPlaylist} 
                        active 
                    />
                    <div className="h-px bg-white/10 my-1 mx-2"></div>
                </>
            )}

            <MenuItem icon={<Copy size={14}/>} label="COPY_LINK" onClick={handleCopyUrl} />
            <MenuItem icon={<Maximize size={14}/>} label="FULLSCREEN" onClick={toggleFullscreen} />
            
            <div className="h-px bg-white/10 my-1 mx-2"></div>
            
            <div className="px-2 py-1 text-[9px] text-neutral-500 font-mono tracking-widest">AUDIO_CORE</div>
            <MenuItem 
                icon={player.volume === 0 ? <VolumeX size={14}/> : <Volume2 size={14}/>} 
                label={player.volume === 0 ? "UNMUTE_SYSTEM" : "MUTE_SYSTEM"} 
                onClick={toggleMute} 
                active={player.volume > 0}
            />
            {player.activeId && (
                <MenuItem 
                    icon={<Music size={14}/>} 
                    label="JUMP_TO_PLAYER" 
                    onClick={() => router.push('/now-playing')} 
                />
            )}

            <div className="h-px bg-white/10 my-1 mx-2"></div>

            {/* DEV TOOLS - ĐỔI LOGIC: KHÔNG BÁO LỖI NỮA MÀ MỞ LOG */}
            <MenuItem icon={<Terminal size={14}/>} label="OPEN_CONSOLE" onClick={handleDevTools} />
            
            {user ? (
                <MenuItem 
                    icon={<LogOut size={14}/>} 
                    label="DISCONNECT" 
                    onClick={handleLogout} 
                    danger 
                />
            ) : (
                <MenuItem 
                    icon={<LogIn size={14}/>} 
                    label="ESTABLISH_LINK" 
                    onClick={handleLogin} 
                    active 
                />
            )}

        </div>

        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-transparent mt-1"></div>
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, danger = false, active = false }) => (
    <button 
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-3 py-2 text-xs font-mono tracking-wide text-left transition-all duration-200 border border-transparent
            ${danger 
                ? "text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400" 
                : "text-neutral-300 hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-400 hover:pl-5"
            }
            ${active && !danger ? "text-emerald-400 bg-emerald-500/5" : ""}
        `}
    >
        {icon}
        {label}
    </button>
);

export default CyberContextMenu;