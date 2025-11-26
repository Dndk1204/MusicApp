"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User, LogOut, LogIn, UserPlus, ShieldCheck, Settings, Search, Disc, Sun, Moon, Music } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef, useCallback } from "react";
import { useModal } from "@/context/ModalContext";
import qs from "query-string"; 

const Navbar = () => {
  const router = useRouter();
  const { openModal } = useModal(); 
  
  // Logic User
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Logic Search
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  // Logic Theme
  const [theme, setTheme] = useState("dark");

  // --- 1. LOGIC THEME SWITCHER ---
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

  // --- LOGIC USER ---
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
    const { data: authListener } = supabase.auth.onAuthStateChange(() => getUserData());
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
    await supabase.auth.signOut();
    router.refresh();
  }

  // --- LOGIC SEARCH ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(searchValue), 1200);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const query = { title: debouncedValue };
    const url = qs.stringifyUrl({ url: '/search', query: query }, { skipEmptyString: true, skipNull: true });
    if(debouncedValue) router.push(url);
  }, [debouncedValue, router]);

  return (
    <div className="h-[80px] w-full glass border-b border-neutral-200 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-50 shrink-0 transition-colors duration-300 bg-white/70 dark:bg-black/40 backdrop-blur-xl hover:border-emerald-200 hover:shadow-[0_0_5px_rgba(16,185,129,0.2)]">
      
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-x-6">
        <div className="hidden md:flex items-center gap-x-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-full flex items-center justify-center animate-spin-slow">
                <Disc size={20} className="text-white"/>
            </div>
            <span className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-white dark:to-neutral-400 font-mono">
                CẦN THỐNG NHẤT CHỌN RA TÊN WEB :)
            </span>
        </div>
      </div>

      {/* CENTER: SEARCH */}
      <div className="flex-1 max-w-[500px] mx-4">
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-500 transition duration-300" />
            </div>
            <input 
                type="text"
                placeholder="Search songs, artists..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="
                  block w-full p-2.5 pl-10 text-sm 
                  
                  /* --- BACKGROUND --- */
                  bg-neutral-100 dark:bg-black/20 
                  
                  /* --- TEXT COLOR --- */
                  text-neutral-900 dark:text-white 
                  
                  /* --- DEFAULT BORDER (Xám nhạt) --- */
                  border border-neutral-300 dark:border-white/10 
                  rounded-full 
                  transition-all duration-300 
                  font-mono backdrop-blur-sm shadow-sm
                  
                  /* --- HOVER EFFECT (QUAN TRỌNG: Đổi viền thành Emerald thay vì đen) --- */
                  hover:border-emerald-500 
                  hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] 
                  
                  /* --- FOCUS EFFECT --- */
                  focus:border-emerald-500 
                  focus:ring-0 
                  focus:shadow-[0_0_20px_rgba(16,185,129,0.5)]
                "
            />
        </div>
      </div>

      {/* RIGHT: PROFILE & MENU */}
      <div className="flex items-center gap-x-4 relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="
              rounded-full p-[2px] 
              overflow-hidden h-10 w-10 
              flex items-center justify-center 
              bg-neutral-100 dark:bg-black/50 
              shadow-sm
              
              /* --- DEFAULT BORDER (Hơi xanh nhẹ) --- */
              border border-emerald-500/30
              
              /* --- HOVER EFFECT (Xanh đậm phát sáng) --- */
              transition-all duration-300
              hover:border-emerald-500
              hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]
              hover:scale-105
            "
          >
            {user && avatarUrl ? (
               <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full rounded-full" />
            ) : (
               <User className="text-emerald-500 p-1" size={24}/>
            )}
          </button>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-3 w-72 glass rounded-xl border border-neutral-200 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-50 overflow-hidden py-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 bg-white/90 dark:bg-neutral-900/90">
               {user ? (
                <>
                  <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/5 mb-1 bg-neutral-50/50 dark:bg-white/5">
                    <p className="text-[10px] text-emerald-500 tracking-widest font-bold uppercase mb-1">:: ONLINE ::</p>
                    <p className="text-sm text-neutral-800 dark:text-white truncate font-mono">{user.email}</p>
                  </div>
                  
                  <div onClick={() => { router.push('/profile'); setShowMenu(false); }} className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/10 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-white cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <User size={18} /> Hồ sơ của tôi
                  </div>

                  <div onClick={() => { router.push('/account'); setShowMenu(false); }} className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/10 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-white cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <Settings size={18} /> Chỉnh sửa hồ sơ
                  </div>

                  {isAdmin && (
                    <div onClick={() => { router.push('/admin'); setShowMenu(false); }} className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-white/5 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                      <ShieldCheck size={18} /> Admin Panel
                    </div>
                  )}

                  <div onClick={toggleTheme} className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/10 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-white cursor-pointer flex items-center justify-between font-mono group transition-colors">
                    <div className="flex items-center gap-x-3">
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        <span>Giao diện: {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-emerald-500' : 'bg-neutral-400'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-4.5' : 'left-0.5'}`} style={{ left: theme === 'dark' ? '18px' : '2px' }}></div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-white/5 my-1 mx-4"></div>

                  <div onClick={handleLogout} className="px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <LogOut size={18} /> Đăng xuất
                  </div>
                </>
              ) : (
                <>
                   <div onClick={() => openModal('login')} className="px-4 py-3 text-sm text-neutral-800 dark:text-white hover:bg-emerald-500/10 dark:hover:bg-white/5 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <LogIn size={18} /> Đăng nhập
                  </div>
                   <div onClick={() => openModal('register')} className="px-4 py-3 text-sm text-neutral-800 dark:text-white hover:bg-emerald-500/10 dark:hover:bg-white/5 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <UserPlus size={18} /> Đăng ký
                  </div>
                </>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default Navbar;