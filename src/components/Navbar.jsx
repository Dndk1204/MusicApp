"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User, LogOut, LogIn, UserPlus, ShieldCheck, Settings, Search, Disc, Sun, Moon, Music } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef, useCallback } from "react";
import { useModal } from "@/context/ModalContext";
import qs from "query-string"; 
import { SlidersHorizontal } from "lucide-react"; 
import AdvancedSearchModal from "./AdvancedSearchModal"; 

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
    setUser(null);
    setAvatarUrl(null);
    setIsAdmin(false);
    router.refresh();
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
        flex items-center justify-between px-4 /* Giảm padding ngang từ 6 -> 4 */
        bg-white/70 dark:bg-black/40 backdrop-blur-xl 
        border-b border-neutral-200 dark:border-white/5
        transition-colors duration-300
        hover:border-emerald-200 hover:shadow-[0_0_5px_rgba(16,185,129,0.2)]
    ">
      
      {/* LEFT: LOGO - VOID THEME */}
<div className="flex items-center gap-x-6">
  <div 
    className="hidden md:flex items-center gap-x-4 cursor-pointer group" 
    onClick={() => router.push('/')}
  >
    {/* --- 1. THE PORTAL ICON --- */}
    {/* Khung icon: Đơn giản hóa, bỏ bớt chi tiết rườm rà, tập trung vào độ sâu */}
    <div className="relative w-10 h-10 bg-black flex items-center justify-center overflow-hidden border border-neutral-800 group-hover:border-emerald-500/50 transition-colors duration-500">
        
        {/* Deep Void Circle (Vòng tròn hư không) */}
        <div className="absolute w-full h-full rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Spinning Disc - Biến tấu thành Singularity (Điểm kỳ dị) */}
        <Disc size={20} className="text-neutral-400 group-hover:text-white animate-[spin_3s_linear_infinite] relative z-10 transition-colors duration-300" />
        
        {/* Glitch Lines (Chỉ hiện khi hover) */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,black_50%)] bg-[size:100%_2px] opacity-0 group-hover:opacity-20 pointer-events-none z-20"></div>
        
        {/* Góc vuông nhỏ (Minimal corners) */}
        <div className="absolute top-0 left-0 w-1 h-1 bg-white/50"></div>
        <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/50"></div>
    </div>

    {/* --- 2. VOID TYPOGRAPHY --- */}
    <div className="flex flex-col items-start justify-center h-10">
        
        {/* Main Text: Khoảng cách chữ cực rộng, tạo cảm giác không gian */}
        <div className="relative">
            <h1 className="text-2xl font-black font-mono text-white tracking-[0.35em] leading-none group-hover:text-emerald-400 transition-colors duration-300 pl-1">
                VOID
            </h1>
            
            {/* Glitch Shadow (Bóng ma) - Hiệu ứng tách hình khi hover */}
            <h1 className="absolute top-0 left-0 text-2xl font-black font-mono text-red-500 tracking-[0.35em] leading-none opacity-0 group-hover:opacity-70 mix-blend-screen -translate-x-[2px] pointer-events-none select-none" aria-hidden="true">
                VOID
            </h1>
             <h1 className="absolute top-0 left-0 text-2xl font-black font-mono text-blue-500 tracking-[0.35em] leading-none opacity-0 group-hover:opacity-70 mix-blend-screen translate-x-[2px] pointer-events-none select-none" aria-hidden="true">
                VOID
            </h1>
        </div>

        {/* Subtext: Dòng lệnh nhỏ bên dưới */}
        <div className="flex items-center gap-2 overflow-hidden h-3">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
             <span className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase group-hover:text-emerald-500/70 transition-colors">
                System_Null
             </span>
        </div>
    </div>
  </div>
</div>

      {/* CENTER: SEARCH BAR */}
      <div className="flex-1 max-w-[500px] mx-4"> {/* Max width nhỏ hơn 600 -> 500 */}
        <div className="relative group w-full">
            
            {/* INPUT */}
            <input 
                type="text"
                placeholder="Search songs, artists..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="
                  block w-full py-1.5 pl-4 pr-[70px] text-xs
                  bg-neutral-100 dark:bg-black/20 
                  text-neutral-900 dark:text-white 
                  border border-neutral-300 dark:border-white/10 
                  rounded-full 
                  transition-all duration-300 
                  font-mono backdrop-blur-sm shadow-sm
                  hover:border-emerald-500 
                  hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] 
                  focus:border-emerald-500 
                  focus:ring-0 
                  focus:shadow-[0_0_20px_rgba(16,185,129,0.5)]
                "
            />
            
            {/* CỤM NÚT BÊN PHẢI */}
            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                <button 
                    onClick={() => setShowAdvancedSearch(true)}
                    className="p-1.5 rounded-full text-neutral-400 hover:text-emerald-500 hover:bg-neutral-200 dark:hover:bg-white/10 transition"
                    title="Advanced Filter"
                >
                    <SlidersHorizontal size={14} /> {/* Icon nhỏ 14 */}
                </button>

                <div className="w-[1px] h-3 bg-neutral-300 dark:bg-white/10"></div>

                <button 
                    onClick={handleSearchClick}
                    className="p-1.5 rounded-full text-neutral-400 hover:text-emerald-500 hover:bg-neutral-200 dark:hover:bg-white/10 transition"
                    title="Search"
                >
                    <Search size={14} /> {/* Icon nhỏ 14 */}
                </button>
            </div>

        </div>
      </div>

      {/* RIGHT: PROFILE & MENU */}
      <div className="flex items-center gap-x-4 relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="
              rounded-full p-[2px] 
              overflow-hidden h-10 w-10 /* Avatar nhỏ lại 8 (32px) */
              flex items-center justify-center 
              bg-neutral-100 dark:bg-black/50 
              shadow-sm
              border border-emerald-500/30
              transition-all duration-300
              hover:border-emerald-500
              hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]
              hover:scale-105
            "
          >
            {user && avatarUrl ? (
               <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full rounded-full" />
            ) : (
               <User className="text-emerald-500 p-1" size={20}/>
            )}
          </button>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-3 w-64 glass rounded-xl border border-neutral-200 dark:border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-50 overflow-hidden py-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 bg-white/90 dark:bg-neutral-900/90">
               {user ? (
                <>
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-white/5 mb-1 bg-neutral-50/50 dark:bg-white/5">
                    <p className="text-[9px] text-emerald-500 tracking-widest font-bold uppercase mb-1">:: ONLINE ::</p>
                    <p className="text-xs text-neutral-800 dark:text-white truncate font-mono">{user.email}</p>
                  </div>
                  
                  <div onClick={() => { router.push('/profile'); setShowMenu(false); }} className="px-4 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/10 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-white cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <User size={16} /> Hồ sơ của tôi
                  </div>

                  <div onClick={() => { router.push('/account'); setShowMenu(false); }} className="px-4 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/10 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-white cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <Settings size={16} /> Chỉnh sửa hồ sơ
                  </div>

                  {isAdmin && (
                    <div onClick={() => { router.push('/admin'); setShowMenu(false); }} className="px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-white/5 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                      <ShieldCheck size={16} /> Admin Panel
                    </div>
                  )}

                  <div onClick={toggleTheme} className="px-4 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/10 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-white cursor-pointer flex items-center justify-between font-mono group transition-colors">
                    <div className="flex items-center gap-x-3">
                        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        <span>Giao diện: {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-emerald-500' : 'bg-neutral-400'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-4.5' : 'left-0.5'}`} style={{ left: theme === 'dark' ? '18px' : '2px' }}></div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-white/5 my-1 mx-4"></div>

                  <div onClick={handleLogout} className="px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <LogOut size={16} /> Đăng xuất
                  </div>
                </>
              ) : (
                <>
                   <div onClick={() => openModal('login')} className="px-4 py-2.5 text-xs text-neutral-800 dark:text-white hover:bg-emerald-500/10 dark:hover:bg-white/5 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <LogIn size={16} /> Đăng nhập
                  </div>
                   <div onClick={() => openModal('register')} className="px-4 py-2.5 text-xs text-neutral-800 dark:text-white hover:bg-emerald-500/10 dark:hover:bg-white/5 cursor-pointer flex items-center gap-x-3 font-mono transition-colors">
                    <UserPlus size={16} /> Đăng ký
                  </div>
                </>
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