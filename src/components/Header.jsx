"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User, LogOut, LogIn, UserPlus, ShieldCheck, Settings } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef, useCallback } from "react";
import { useModal } from "@/context/ModalContext";

const Header = ({ children, className }) => {
  const router = useRouter();
  const { openModal } = useModal(); 
  
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

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
    
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
        getUserData();
    });

    const handleProfileUpdate = () => {
      getUserData();
    };
    window.addEventListener('profile-updated', handleProfileUpdate);

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
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

  return (
    // Header trong suốt để lộ nền Aurora
    <div className={`h-fit p-6 sticky top-0 z-20 transition-all duration-500 ${className}`}>
      <div className="w-full mb-6 flex items-center justify-between">
        
        {/* Nút điều hướng style kính mờ */}
        <div className="hidden md:flex gap-x-3 items-center">
          <button onClick={() => router.back()} className="rounded-full bg-black/40 border border-white/5 flex items-center justify-center p-2 hover:bg-white/10 transition backdrop-blur-md group">
            <ChevronLeft size={22} className="text-white group-hover:-translate-x-0.5 transition"/>
          </button>
          <button onClick={() => router.forward()} className="rounded-full bg-black/40 border border-white/5 flex items-center justify-center p-2 hover:bg-white/10 transition backdrop-blur-md group">
            <ChevronRight size={22} className="text-white group-hover:translate-x-0.5 transition"/>
          </button>
        </div>

        {/* User Menu Area */}
        <div className="flex items-center gap-x-4 relative" ref={menuRef}>
          
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="rounded-full p-[2px] border border-emerald-500/30 hover:border-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] overflow-hidden h-11 w-11 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            {user && avatarUrl ? (
               <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full rounded-full opacity-90 hover:opacity-100 transition" />
            ) : (
               <User className="text-emerald-500 p-1" size={28}/>
            )}
          </button>

          {/* === MENU THẢ XUỐNG (DROPDOWN) STYLE GLASS === */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-3 w-72 glass rounded-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
              {user ? (
                <>
                  {/* User Info Header */}
                  <div className="px-5 py-4 border-b border-white/5 mb-1 bg-white/5">
                    <p className="text-[10px] text-emerald-400 tracking-widest font-bold uppercase mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        :: ACCESS_GRANTED ::
                    </p>
                    <p className="text-sm text-white truncate font-mono">{user.email}</p>
                  </div>

                  {/* Admin Option */}
                  {isAdmin && (
                    <div 
                      onClick={() => { router.push('/admin'); setShowMenu(false); }}
                      className="px-4 py-3 text-sm text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-x-3 transition group border-l-2 border-transparent hover:border-emerald-500"
                    >
                      <ShieldCheck size={18} className="group-hover:scale-110 transition"/>
                      <span className="font-mono tracking-wide">[ADMIN_DASHBOARD]</span>
                    </div>
                  )}

                  {/* Profile Option */}
                  <div 
                    onClick={() => { router.push('/account'); setShowMenu(false); }}
                    className="px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer flex items-center gap-x-3 transition group border-l-2 border-transparent hover:border-white"
                  >
                    <Settings size={18} className="group-hover:rotate-90 transition duration-500"/>
                    <span className="font-mono tracking-wide">ACCOUNT_SETTINGS</span>
                  </div>

                  <div className="border-t border-white/5 my-1 mx-4"></div>

                  {/* Logout Option */}
                  <div 
                    onClick={handleLogout}
                    className="px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer flex items-center gap-x-3 transition group"
                  >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition"/>
                    <span className="font-mono tracking-wide">:: LOGOUT ::</span>
                  </div>
                </>
              ) : (
                /* Guest View */
                <>
                   <div className="px-5 py-3 border-b border-white/5 mb-1">
                    <p className="text-[10px] text-neutral-500 tracking-widest uppercase mb-1">Status</p>
                    <p className="text-sm text-white font-mono">GUEST_MODE</p>
                  </div>

                  <div 
                    onClick={() => { openModal('login'); setShowMenu(false); }}
                    className="px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-emerald-500/10 cursor-pointer flex items-center gap-x-3 transition group hover:border-l-2 hover:border-emerald-500"
                  >
                    <LogIn size={18} />
                    <span className="font-mono">LOGIN_SYSTEM</span>
                  </div>
                  <div 
                    onClick={() => { openModal('register'); setShowMenu(false); }}
                    className="px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-purple-500/10 cursor-pointer flex items-center gap-x-3 transition group hover:border-l-2 hover:border-purple-500"
                  >
                    <UserPlus size={18} />
                    <span className="font-mono">CREATE_ACCOUNT</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default Header;