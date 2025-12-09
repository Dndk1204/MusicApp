"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Lock, Loader2, KeyRound } from "lucide-react";
// Import Cyber Components
import { GlitchText, CyberButton } from "@/components/CyberComponents";

const UpdatePassword = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Kiểm tra session
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push("/"); 
        }
    };
    checkSession();
  }, [router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: ':: PASSWORD_UPDATED :: Redirecting...' });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `ERR: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Container chính: Căn giữa, padding
    <div className="w-full min-h-[80vh] flex items-center justify-center p-6 bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* CYBER CARD WRAPPER */}
      <div className="
          relative w-full max-w-md overflow-hidden
          bg-white dark:bg-black 
          border-2 border-neutral-400 dark:border-white/20 
          shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none
      ">
        {/* Decoration Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

        {/* HEADER SECTION */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-8 text-center relative">
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="w-14 h-14 mx-auto flex items-center justify-center mb-4 bg-neutral-200 dark:bg-white/5 border border-neutral-400 dark:border-white/20 rounded-none shadow-inner">
                <KeyRound size={28} className="text-emerald-600 dark:text-emerald-500 animate-pulse"/>
            </div>
            
            <h1 className="text-2xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                <GlitchText text="SECURITY_UPDATE" />
            </h1>
            
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mt-2 text-emerald-600 dark:text-emerald-500/80">
                :: NEW_CREDENTIALS_REQUIRED ::
            </p>
        </div>
        
        {/* BODY SECTION */}
        <div className="p-8 bg-neutral-50/50 dark:bg-black/80">
            
            {/* NOTIFICATION AREA */}
            {message && (
                <div className={`mb-6 p-3 border text-xs font-mono font-bold text-center uppercase tracking-wide animate-in slide-in-from-top-2 rounded-none
                    ${message.type === 'error' 
                        ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/30' 
                        : 'bg-emerald-100 border-emerald-500 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/30'}
                `}>
                    {message.text}
                </div>
            )}
            
            {/* FORM */}
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                
                {/* Password Input */}
                <div className="group relative">
                    <label className="text-[10px] font-mono uppercase mb-2 block font-bold text-neutral-500 dark:text-neutral-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors">
                        Enter New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            minLength={6}
                            className="
                                w-full p-3 pl-10 text-sm font-mono outline-none transition-all rounded-none
                                bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                                focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                                
                                dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                                dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                            "
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <CyberButton 
                    onClick={(e) => !loading && handleUpdate(e)} 
                    disabled={loading}
                    className="
                        w-full py-4 text-xs font-bold tracking-widest rounded-none mt-2
                        border-emerald-500 text-emerald-600 dark:text-emerald-400 
                        hover:bg-emerald-500 hover:text-white 
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    <span className="flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <Lock size={18}/>}
                        CONFIRM_UPDATE
                    </span>
                </CyberButton>

            </form>
        </div>
      </div>
      
    </div>
  );
};

export default UpdatePassword;