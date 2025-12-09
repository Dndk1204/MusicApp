"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthScreen from "./AuthScreen";
import { Loader2, ShieldAlert, Terminal } from "lucide-react";
// Import Cyber Components
import { GlitchText, ScanlineOverlay } from "@/components/CyberComponents";

const AuthWrapper = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // --- LOADING STATE (SYSTEM BOOT) ---
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-black font-mono relative overflow-hidden">
        <ScanlineOverlay />
        <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
        <div className="text-xl font-bold text-neutral-900 dark:text-white tracking-widest uppercase">
            <GlitchText text="SYSTEM_INITIALIZING..." />
        </div>
        <div className="mt-2 text-[10px] text-neutral-500 dark:text-neutral-400">
            LOADING_SECURITY_PROTOCOLS...
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED STATE ---
  if (session) {
    return <>{children}</>;
  }

  // --- UNAUTHENTICATED STATE (SECURITY GATE) ---
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-black relative overflow-hidden">
      
      {/* 1. BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Animated Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Scanlines */}
        <ScanlineOverlay />
      </div>

      {/* 2. DECORATIVE HUD ELEMENTS */}
      <div className="absolute top-6 left-6 z-10 hidden md:block">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-500 mb-1">
              <Terminal size={14} /> 
              <span className="tracking-widest">SECURE_GATEWAY_V.2.4</span>
          </div>
          <div className="h-0.5 w-32 bg-emerald-500/30"></div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 hidden md:block text-right">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
              UNAUTHORIZED_ACCESS_IS_PROHIBITED
          </p>
          <p className="text-[10px] font-mono text-neutral-500">
              IP_LOGGING_ENABLED
          </p>
      </div>

      {/* 3. MAIN CONTENT (LOCK SCREEN + AUTH SCREEN) */}
      <div className="z-20 flex flex-col items-center w-full max-w-md px-4">
        
        {/* Lock Icon / Message */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-red-500/10 border border-red-500/50 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mb-2 tracking-tighter uppercase">
            <GlitchText text="ACCESS_DENIED" />
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono tracking-[0.2em] border-t border-b border-neutral-300 dark:border-white/10 py-1 inline-block">
            :: AUTHENTICATION_REQUIRED ::
          </p>
        </div>

        {/* Auth Screen Component */}
        <div className="w-full animate-in zoom-in-95 duration-500 delay-150">
            <AuthScreen />
        </div>

      </div>
    </div>
  );
};

export default AuthWrapper;