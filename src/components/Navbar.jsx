"use client";

import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { User, LogOut, LogIn, UserPlus, ShieldCheck, Search, Disc, Sun, Moon, SlidersHorizontal, X, Menu } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef, useCallback } from "react";
import { useModal } from "@/context/ModalContext";
import qs from "query-string"; 
import AdvancedSearchModal from "./AdvancedSearchModal"; 
import { useAuth } from "@/components/AuthWrapper";

const Navbar = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { openModal } = useModal(); 
  const { user } = useAuth(); 
  
  // Logic User Local State
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Mobile Search State
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [theme, setTheme] = useState("dark");
  
  // --- KEEP AWAKE (ALWAYS ON) ---
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
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  // --- 2. WAKE LOCK LOGIC (AUTO ENABLE) ---
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

  useEffect(() => {
    requestWakeLock();
    const handleVisibility = () => { 
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { 
        document.removeEventListener('visibilitychange', handleVisibility); 
        if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [requestWakeLock]);

  // --- 3. USER DATA & REALTIME AVATAR UPDATE ---
  useEffect(() => {
    let channel;

    const fetchProfile = async () => {
        if (user) {
            const { data } = await supabase.from('profiles').select('role, avatar_url').eq('id', user.id).single();
            if (data) {
                setIsAdmin(data.role === 'admin');
                setAvatarUrl(data.avatar_url);
            }

            channel = supabase.channel('realtime-profile')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE', 
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}` 
                    },
                    (payload) => {
                        const newData = payload.new;
                        if (newData.avatar_url) {
                            setAvatarUrl(`${newData.avatar_url}?t=${new Date().getTime()}`);
                        }
                        if (newData.role) {
                            setIsAdmin(newData.role === 'admin');
                        }
                    }
                )
                .subscribe();

        } else {
            setIsAdmin(false);
            setAvatarUrl(null);
        }
    };

    fetchProfile();

    const handleClickOutside = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    setShowMenu(false);
    await supabase.auth.signOut();
    router.push('/');
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
      setShowMobileSearch(false); 
  };
  
  const handleSidebarToggle = () => {
      if (onToggleSidebar) onToggleSidebar();
  };

  return (
    <div className="
        w-full max-w-[100vw] overflow-x-hidden /* Chặn tràn ngang */
        h-14 md:h-16 /* Cố định chiều cao */
        flex items-center justify-between px-4 md:px-6 
        bg-white/90 dark:bg-black/90 backdrop-blur-md 
        border-b border-neutral-300 dark:border-white/10 
        relative z-50 transition-colors duration-300
    ">
      
      {/* LEFT: LOGO & MENU TOGGLE */}
      <div className="flex items-center gap-x-3 md:gap-x-4 shrink-0">
        
        {/* Mobile Menu Button */}
        <button 
            onClick={handleSidebarToggle}
            className="md:hidden p-1 text-neutral-600 dark:text-neutral-400 hover:text-emerald-500 transition active:scale-95"
        >
            <Menu size={24} />
        </button>

        <Link href="/" className="flex items-center gap-x-3 cursor-pointer group shrink-0">
          {/* Logo Icon Box */}
          <div className="relative w-8 h-8 md:w-10 md:h-10 bg-neutral-900 dark:bg-black flex items-center justify-center border border-neutral-400 dark:border-white/20 group-hover:border-emerald-500 transition-colors duration-300 rounded-none overflow-hidden shadow-sm group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Disc size={18} className="md:w-5 md:h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-white animate-[spin_4s_linear_infinite] relative z-10 transition-colors duration-300" />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none z-20 opacity-50"></div>
          </div>
          
          {/* Logo Text (Ẩn hoàn toàn trên mobile) */}
          <div className="hidden md:flex flex-col items-start justify-center h-10">
              <div className="relative">
                  <h1 className="text-xl md:text-2xl font-black font-mono text-neutral-900 dark:text-white tracking-[0.35em] leading-none transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-cyan-600 dark:group-hover:from-emerald-500 dark:group-hover:to-cyan-500 pl-1">
                      VOID
                  </h1>
              </div>
              <div className="flex items-center gap-2 h-3 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                  <span className="text-[8px] md:text-[9px] font-mono text-neutral-500 tracking-widest uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">System_Null</span>
              </div>
          </div>
        </Link>
      </div>

      {/* CENTER: SEARCH (DESKTOP ONLY) */}
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

      {/* MOBILE SEARCH OVERLAY (Fixed Layout) */}
      {showMobileSearch && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-black flex items-center px-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-200 border-b border-neutral-300 dark:border-white/10">
            <div className="flex-1 relative">
                <input 
                    type="text" 
                    autoFocus
                    placeholder="SEARCH..." 
                    value={searchValue} 
                    onChange={(e) => setSearchValue(e.target.value)} 
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()} 
                    className="w-full h-10 bg-neutral-100 dark:bg-white/10 border border-neutral-300 dark:border-white/20 pl-3 pr-10 text-sm font-mono text-neutral-900 dark:text-white outline-none focus:border-emerald-500 rounded-none"
                />
                <button onClick={handleSearch} className="absolute right-0 top-0 h-full px-3 text-neutral-500"><Search size={16}/></button>
            </div>
            <button onClick={() => setShowMobileSearch(false)} className="ml-3 p-2 text-neutral-500 hover:text-red-500"><X size={20}/></button>
        </div>
      )}

      {/* RIGHT: ACTIONS & MENU */}
      <div className="flex items-center gap-x-2 md:gap-x-4 relative shrink-0" ref={menuRef}>
          {/* Mobile Search Button */}
          {!showMobileSearch && (
            <button className="md:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-emerald-500 transition" onClick={() => setShowMobileSearch(true)}>
                <Search size={20}/>
            </button>
          )}
          
          {/* Avatar Menu Button */}
          <button onClick={() => setShowMenu(!showMenu)} className="relative h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/20 hover:border-emerald-500 transition-all duration-300 group rounded-none overflow-hidden shrink-0">
            {user && avatarUrl ? <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" /> : <User className="text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors" size={20} />}
            
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-4 w-[260px] max-w-[90vw] bg-white dark:bg-black border border-neutral-300 dark:border-white/20 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 rounded-none">
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