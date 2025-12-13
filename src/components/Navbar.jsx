"use client";

import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link
import { User, LogOut, LogIn, UserPlus, ShieldCheck, Search, Disc, Sun, Moon, SlidersHorizontal, X } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef, useCallback } from "react";
import { useModal } from "@/context/ModalContext";
import qs from "query-string"; 
import AdvancedSearchModal from "./AdvancedSearchModal"; 
// Import Cyber Components
import { GlitchText } from "@/components/CyberComponents";

const Navbar = () => {
  const router = useRouter();
  const { openModal } = useModal(); 
  
  // Logic User
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Logic Search
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  // Logic Theme
  const [theme, setTheme] = useState("dark");

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
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  const getUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, avatar_url')
        .eq('id', currentUser.id)
        .single();
      
      if (profile) {
        setIsAdmin(profile.role === 'admin');
        setAvatarUrl(profile.avatar_url);
      }
    } else {
      setIsAdmin(false);
      setAvatarUrl(null);
    }
  }, []);

  useEffect(() => {
    getUserData();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            setUser(null);
            setAvatarUrl(null);
            setIsAdmin(false);
        } else {
            getUserData();
        }
    });

    const handleProfileUpdate = () => getUserData();
    window.addEventListener('profile-updated', handleProfileUpdate);
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('profile-updated', handleProfileUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [getUserData]);

  const handleLogout = async () => {
    setShowMenu(false);
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Lỗi đăng xuất:", error.message);
    
    // Reset state local ngay lập tức để UI phản hồi nhanh
    setUser(null);
    setAvatarUrl(null);
    setIsAdmin(false);
    
    // Không cần router.refresh() ở đây, chuyển trang là đủ
    window.location.href = '/'; 
  }

  // --- LOGIC SEARCH ---
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedValue(searchValue);
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if(debouncedValue) {
        const query = { title: debouncedValue };
        const url = qs.stringifyUrl({ 
            url: '/search', 
            query: query 
        }, { skipEmptyString: true, skipNull: true });
        router.push(url);
    }
  }, [debouncedValue, router]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); 
        if (!searchValue) return; 
        const query = { title: searchValue };
        const url = qs.stringifyUrl({ 
            url: '/search', 
            query: query 
        }, { skipEmptyString: true, skipNull: true });
        router.push(url);
    }
  };

  const handleSearchClick = () => {
      if (searchValue) {
        const query = { title: searchValue };
        const url = qs.stringifyUrl({ url: '/search', query: query }, { skipEmptyString: true, skipNull: true });
        router.push(url);
      }
  }

  return (
    <div className="
        w-full h-full 
        flex items-center justify-between px-6
        bg-white/80 dark:bg-black/80 backdrop-blur-md 
        border-b border-neutral-300 dark:border-white/10
        transition-colors duration-300
    ">
      
      {/* LEFT: LOGO (VOID) */}
      <div className="flex items-center gap-x-6">
        {/* SỬ DỤNG LINK ĐỂ PREFETCH VÀ TĂNG TỐC ĐỘ CHUYỂN TRANG */}
        <Link 
          href="/"
          className="hidden md:flex items-center gap-x-4 cursor-pointer group" 
        >
          {/* THE PORTAL ICON */}
          <div className="relative w-10 h-10 bg-neutral-900 dark:bg-black flex items-center justify-center overflow-hidden border border-neutral-400 dark:border-white/20 group-hover:border-emerald-500 transition-colors duration-300 rounded-none">
              <div className="absolute w-full h-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Disc size={20} className="text-neutral-500 dark:text-neutral-400 group-hover:text-white animate-[spin_3s_linear_infinite] relative z-10 transition-colors duration-300" />
              
              {/* Scanlines & Decor */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none z-20"></div>
              <div className="absolute top-0 left-0 w-1 h-1 bg-white/50"></div>
              <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/50"></div>
          </div>

          {/* VOID TYPOGRAPHY */}
          <div className="flex flex-col items-start justify-center h-10">
              <div className="relative">
                  <h1 className="text-2xl font-black font-mono text-neutral-900 dark:text-white tracking-[0.35em] leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 pl-1">
                      VOID
                  </h1>
                  <h1 className="absolute top-0 left-0 text-2xl font-black font-mono text-red-500 tracking-[0.35em] leading-none opacity-0 group-hover:opacity-70 mix-blend-multiply dark:mix-blend-screen -translate-x-[2px] pointer-events-none select-none" aria-hidden="true">
                      VOID
                  </h1>
                  <h1 className="absolute top-0 left-0 text-2xl font-black font-mono text-blue-500 tracking-[0.35em] leading-none opacity-0 group-hover:opacity-70 mix-blend-multiply dark:mix-blend-screen translate-x-[2px] pointer-events-none select-none" aria-hidden="true">
                      VOID
                  </h1>
              </div>
              <div className="flex items-center gap-2 overflow-hidden h-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none"></span>
                  <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-500/70 transition-colors">
                      System_Null
                  </span>
              </div>
          </div>
        </Link>
      </div>

      {/* CENTER: SEARCH BAR */}
      <div className="flex-1 max-w-[500px] mx-4"> 
        <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-neutral-300 dark:border-white/10 pr-2">
                <span className="text-[10px] font-mono text-neutral-400">CMD:</span>
            </div>
            
            <input 
                type="text"
                placeholder="SEARCH_QUERY..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="
                  block w-full py-2.5 pl-14 pr-[80px] text-xs
                  bg-neutral-100 dark:bg-white/5 
                  text-neutral-900 dark:text-white 
                  border border-neutral-300 dark:border-white/10 
                  rounded-none
                  transition-all duration-300 
                  font-mono uppercase tracking-wide
                  focus:border-emerald-500 dark:focus:border-emerald-500
                  focus:bg-white dark:focus:bg-black
                  outline-none
                "
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center border-l border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-white/5">
                <button 
                    onClick={() => setShowAdvancedSearch(true)}
                    className="h-full px-3 text-neutral-500 hover:text-emerald-500 hover:bg-white/10 transition border-r border-neutral-300 dark:border-white/10"
                    title="Advanced Filter"
                >
                    <SlidersHorizontal size={14} /> 
                </button>
                <button 
                    onClick={handleSearchClick}
                    className="h-full px-3 text-neutral-500 hover:text-emerald-500 hover:bg-white/10 transition"
                    title="Execute"
                >
                    <Search size={14} /> 
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT: PROFILE & MENU */}
      <div className="flex items-center gap-x-4 relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="
              relative
              h-10 w-10
              flex items-center justify-center 
              bg-neutral-200 dark:bg-neutral-800 
              border border-neutral-300 dark:border-white/20
              hover:border-emerald-500
              transition-all duration-300
              group rounded-none overflow-hidden
            "
          >
            {user && avatarUrl ? (
               <img 
                 src={avatarUrl} 
                 alt="Avatar" 
                 className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" 
               />
            ) : (
               <User 
                 className="text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-500 transition-colors" 
                 size={20} 
               />
            )}
            {/* Corner Decor */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-black border border-neutral-300 dark:border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-2 duration-200 rounded-none">
               <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>

               {user ? (
                <>
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5">
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 tracking-widest font-bold uppercase mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none"></span>
                        :: SYSTEM_ONLINE ::
                    </p>
                    <p className="text-xs text-neutral-900 dark:text-white truncate font-mono font-bold">{user.email}</p>
                  </div>
                  
                  <div className="p-2 space-y-1">
                      {/* LINK ĐẾN TRANG USER DÙNG CHUNG */}
                      <div 
                        onClick={() => { 
                            if (user?.id) router.push(`/user/${user.id}`); 
                            setShowMenu(false); 
                        }} 
                        className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-neutral-300 dark:hover:border-white/20"
                      >
                        <User size={14} /> My_Profile
                      </div>

                      {isAdmin && (
                        <div onClick={() => { router.push('/admin'); setShowMenu(false); }} className="px-3 py-2 text-xs font-mono uppercase text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-emerald-500/30">
                          <ShieldCheck size={14} /> Admin_Dashboard
                        </div>
                      )}

                      <div onClick={toggleTheme} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-neutral-300 dark:hover:border-white/20">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                            <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                        </div>
                        <div className={`w-6 h-3 border border-neutral-400 dark:border-white/40 relative flex items-center ${theme === 'dark' ? 'justify-end' : 'justify-start'} p-0.5`}>
                            <div className="w-2 h-2 bg-neutral-900 dark:bg-white rounded-none"></div>
                        </div>
                      </div>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-white/10 mt-1 p-2">
                    <div onClick={handleLogout} className="px-3 py-2 text-xs font-mono uppercase text-red-600 dark:text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-red-500/30">
                      <LogOut size={14} /> Terminate_Session
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-2 space-y-1">
                    <div onClick={() => openModal('login')} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-emerald-500/30">
                      <LogIn size={14} /> Access_System
                    </div>
                    <div onClick={() => openModal('register')} className="px-3 py-2 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-emerald-500/30">
                      <UserPlus size={14} /> Register_New_User
                    </div>
                </div>
              )}
            </div>
          )}
      </div>
      
      {showAdvancedSearch && (
          <AdvancedSearchModal 
            onClose={() => setShowAdvancedSearch(false)} 
            currentSearch={searchValue}
          />
      )}
    </div>
  );
}

export default Navbar;