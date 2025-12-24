"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { GlitchText } from "@/components/CyberComponents"; // Component bạn đã có

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/";

        // Đợi một chút để Supabase Client đồng bộ session từ URL hash
        const { data: { session } } = await supabase.auth.getSession();

        const t = setTimeout(() => {
          router.replace(next);
          router.refresh(); // Làm mới để ProfileGuard bắt được session mới
        }, 1500); // Tăng lên chút để người dùng thấy hiệu ứng Glitch

        return () => clearTimeout(t);
      } catch (e) {
        router.replace("/");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black font-mono">
      <div className="relative p-10 border border-emerald-500/20 bg-emerald-500/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
        
        <div className="space-y-4 text-center">
          <h2 className="text-emerald-500 text-xl font-black tracking-tighter italic">
            <GlitchText text="DECRYPTING_AUTH_SIGNAL" />
          </h2>
          
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 animate-ping"></div>
            <p className="text-[10px] text-emerald-500/60 uppercase tracking-[0.3em]">
              Synchronizing with VOID_CORE...
            </p>
          </div>
        </div>

        {/* Trang trí góc */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500"></div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500"></div>
      </div>
    </div>
  );
}