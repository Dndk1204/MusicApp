"use client";

import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { User, LogOut, LogIn, UserPlus, ShieldCheck, Search, Disc, Sun, Moon, SlidersHorizontal, Zap, ZapOff } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef, useCallback } from "react";
import { useModal } from "@/context/ModalContext";
import qs from "query-string"; 
import AdvancedSearchModal from "./AdvancedSearchModal"; 
import { useAuth } from "@/components/AuthWrapper";

const Navbar = () => {
  const router = useRouter();
  const { openModal } = useModal(); 
  const { user } = useAuth(); 
  
  // Logic User Local State
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [theme, setTheme] = useState("dark");
  const [keepAwake, setKeepAwake] = useState(false);
  const wakeLockRef = useRef(null);

  // --- 1. THEME & LOAD SETTINGS ---
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light") {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    if (localStorage.getItem("keepAwake") === "true") {
        setKeepAwake(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  // --- 2. WAKE LOCK LOGIC ---
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
        try {
            if (document.visibilityState !== 'visible') return;
            if (wakeLockRef.current && !wakeLockRef.current.released) return;

            wakeLockRef.current = await navigator.wakeLock.request('screen');
            
            wakeLockRef.current.addEventListener('release', () => {
                if (wakeLockRef.current && wakeLockRef.current.released) {
                    wakeLockRef.current = null;
                }
            });
        } catch (err) { 
            if (err.name !== 'NotAllowedError') console.error(err); 
        }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
        try { await wakeLockRef.current.release(); wakeLockRef.current = null; } catch (err) { console.error(err); }
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => { 
        if (document.visibilityState === 'visible' && keepAwake) {
            requestWakeLock();
        }
    };

    if (keepAwake) {
        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibility);
    } else {
        releaseWakeLock();
        document.removeEventListener('visibilitychange', handleVisibility);
    }
    
    return () => { 
        document.removeEventListener('visibilitychange', handleVisibility); 
        releaseWakeLock(); 
    };
  }, [keepAwake, requestWakeLock, releaseWakeLock]);

  const toggleKeepAwake = () => {
    const nextState = !keepAwake;
    setKeepAwake(nextState);
    localStorage.setItem("keepAwake", nextState.toString());
  };

  // --- 3. USER DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
        if (user) {
            const { data } = await supabase.from('profiles').select('role, avatar_url').eq('id', user.id).single();
            if (data) {
                setIsAdmin(data.role === 'admin');
                setAvatarUrl(data.avatar_url);
            }
        } else {
            setIsAdmin(false);
            setAvatarUrl(null);
        }
    };
    fetchProfile();
    const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  const handleLogout = async () => {
    setShowMenu(false);
    await supabase.auth.signOut();
    router.refresh();
  };

  // --- 4. SEARCH LOGIC ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(searchValue), 1200);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if(debouncedValue) {
        const url = qs.stringifyUrl({ url: '/search', query: { title: debouncedValue } }, { skipEmptyString: true, skipNull: true });
        router.push(url);
    }
  }, [debouncedValue, router]);

  const handleSearch = () => {
      if (!searchValue) return;
      const url = qs.stringifyUrl({ url: '/search', query: { title: searchValue } }, { skipEmptyString: true, skipNull: true });
      router.push(url);
  };

  return (
    <div className="w-full h-full flex items-center justify-between px-6 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-neutral-300 dark:border-white/10 relative z-50 transition-colors duration-300">
      
      {/* LEFT: LOGO WITH EFFECTS */}
      <div className="flex items-center gap-x-6">
        <Link href="/" className="hidden md:flex items-center gap-x-4 cursor-pointer group">
          {/* Logo Icon Box: Giữ nền tối để tạo điểm nhấn tương phản kể cả ở Light Mode */}
          <div className="relative w-10 h-10 bg-neutral-900 dark:bg-black flex items-center justify-center border border-neutral-400 dark:border-white/20 group-hover:border-emerald-500 transition-colors duration-300 rounded-none overflow-hidden shadow-sm group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Disc size={20} className="text-neutral-500 dark:text-neutral-400 group-hover:text-white animate-[spin_4s_linear_infinite] relative z-10 transition-colors duration-300" />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none z-20 opacity-50"></div>
          </div>
          
          {/* Logo Text with Glitch Effect */}
          <div className="flex flex-col items-start justify-center h-10">
              <div className="relative">
                  {/* Main Text: Đen ở Light, Trắng ở Dark */}
                  <h1 className="text-2xl font-black font-mono text-neutral-900 dark:text-white tracking-[0.35em] leading-none transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-cyan-600 dark:group-hover:from-emerald-500 dark:group-hover:to-cyan-500 pl-1">
                      VOID
                  </h1>
                  
                  {/* Glitch Overlay 1 (Red): Multiply ở Light để hiện trên nền trắng, Screen ở Dark */}
                  <h1 className="absolute top-0 left-0 text-2xl font-black font-mono text-red-500 tracking-[0.35em] leading-none opacity-0 group-hover:opacity-70 group-hover:animate-pulse pl-1 pointer-events-none translate-x-[2px] mix-blend-multiply dark:mix-blend-screen">
                      VOID
                  </h1>
                  
                  {/* Glitch Overlay 2 (Blue): Multiply ở Light, Screen ở Dark */}
                  <h1 className="absolute top-0 left-0 text-2xl font-black font-mono text-blue-500 tracking-[0.35em] leading-none opacity-0 group-hover:opacity-70 group-hover:animate-pulse pl-1 pointer-events-none -translate-x-[2px] mix-blend-multiply dark:mix-blend-screen delay-75">
                      VOID
                  </h1>
              </div>
              
              <div className="flex items-center gap-2 h-3 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">System_Null</span>
              </div>
          </div>
        </Link>
      </div>

      {/* CENTER: SEARCH */}
      <div className="flex-1 max-w-[500px] mx-4 hidden md:block"> 
        <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-neutral-300 dark:border-white/10 pr-2">
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">CMD:</span>
            </div>
            <input 
                type="text" 
                placeholder="SEARCH_QUERY..." 
                value={searchValue} 
                onChange={(e) => setSearchValue(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                className="
                    block w-full py-2.5 pl-14 pr-[80px] text-xs 
                    bg-neutral-100 dark:bg-white/5 
                    text-neutral-900 dark:text-white 
                    border border-neutral-300 dark:border-white/10 
                    rounded-none transition-all duration-300 
                    font-mono uppercase tracking-wide 
                    focus:border-emerald-600 dark:focus:border-emerald-500 outline-none 
                    focus:bg-white dark:focus:bg-black
                "
            />
            <div className="absolute inset-y-0 right-0 flex items-center border-l border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-white/5">
                <button onClick={() => setShowAdvancedSearch(true)} className="h-full px-3 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-white/50 dark:hover:bg-white/10 transition border-r border-black/10 dark:border-white/10" title="Advanced Filter"><SlidersHorizontal size={14} /></button>
                <button onClick={handleSearch} className="h-full px-3 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-white/50 dark:hover:bg-white/10 transition" title="Search"><Search size={14} /></button>
            </div>
        </div>
      </div>

      {/* RIGHT: MENU */}
      <div className="flex items-center gap-x-4 relative" ref={menuRef}>
          <button className="md:hidden p-2 text-neutral-900 dark:text-white" onClick={() => router.push('/search')}><Search size={20}/></button>
          
          <button onClick={() => setShowMenu(!showMenu)} className="relative h-10 w-10 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/20 hover:border-emerald-500 transition-all duration-300 group rounded-none overflow-hidden">
            {user && avatarUrl ? <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" /> : <User className="text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors" size={20} />}
            
            {/* Corner Markers */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-black border border-neutral-300 dark:border-white/20 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 rounded-none">
               <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
               {user ? (
                <>
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5">
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 tracking-widest font-bold uppercase mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none"></span> :: ONLINE ::</p>
                    <p className="text-xs text-neutral-900 dark:text-white truncate font-mono font-bold">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                      <div onClick={() => { if (user?.id) router.push(`/user/${user.id}`); setShowMenu(false); }} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-neutral-300 dark:hover:border-white/20"><User size={14} /> My_Profile</div>
                      {isAdmin && <div onClick={() => { router.push('/admin'); setShowMenu(false); }} className="px-3 py-2 text-xs font-mono uppercase text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-emerald-500/30"><ShieldCheck size={14} /> Admin_Dashboard</div>}
                      
                      {/* THEME TOGGLE */}
                      <div onClick={toggleTheme} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-neutral-300 dark:hover:border-white/20">
                        <div className="flex items-center gap-3">{theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}<span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span></div>
                        <div className={`w-6 h-3 border border-neutral-400 dark:border-white/40 relative flex items-center ${theme === 'dark' ? 'justify-end' : 'justify-start'} p-0.5 transition-all`}>
                            <div className="w-2 h-2 bg-neutral-900 dark:bg-white rounded-none"></div>
                        </div>
                      </div>

                      {/* WAKE LOCK TOGGLE */}
                      <div onClick={toggleKeepAwake} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-neutral-300 dark:hover:border-white/20">
                        <div className="flex items-center gap-3">{keepAwake ? <Zap size={14} className="text-yellow-600 dark:text-yellow-500" /> : <ZapOff size={14} />}<span>Awake: {keepAwake ? 'ON' : 'OFF'}</span></div>
                        <div className={`w-6 h-3 border border-neutral-400 dark:border-white/40 relative flex items-center ${keepAwake ? 'justify-end border-yellow-500' : 'justify-start'} p-0.5 transition-all`}>
                            <div className={`w-2 h-2 rounded-none transition-colors ${keepAwake ? 'bg-yellow-500' : 'bg-neutral-500'}`}></div>
                        </div>
                      </div>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-white/10 mt-1 p-2">
                    <div onClick={handleLogout} className="px-3 py-2 text-xs font-mono uppercase text-red-600 dark:text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-red-500/30"><LogOut size={14} /> Terminate_Session</div>
                  </div>
                </>
              ) : (
                <div className="p-2 space-y-1">
                    <div onClick={() => openModal('login')} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-500 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-emerald-500/30"><LogIn size={14} /> Access_System</div>
                    <div onClick={() => openModal('register')} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-500 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-emerald-500/30"><UserPlus size={14} /> Register_New_User</div>
                </div>
              )}
            </div>
          )}
      </div>
      
      {showAdvancedSearch && <AdvancedSearchModal onClose={() => setShowAdvancedSearch(false)} currentSearch={searchValue} />}
    </div>
  );
}

export default Navbar;