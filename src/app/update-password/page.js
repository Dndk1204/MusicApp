"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Lock, Loader2, KeyRound } from "lucide-react";
import { GlitchButton, CyberCard, DecoderText } from "@/components/CyberComponents";

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
    // SỬA: Thay h-full bằng min-h-[80vh] để đảm bảo box luôn nằm giữa màn hình dọc
    <div className="w-full min-h-[80vh] flex items-center justify-center p-6 bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* WRAPPER */}
      <CyberCard className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-neutral-200 dark:border-white/10">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neutral-200 dark:bg-white/5 mb-4 border border-neutral-300 dark:border-white/10 shadow-inner">
                <KeyRound size={28} className="text-emerald-600 dark:text-emerald-500"/>
            </div>
            
            <h1 className="text-2xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white mb-2">
                <DecoderText text="SECURITY_UPDATE" />
            </h1>
            
            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.3em] uppercase opacity-80">
                :: NEW_CREDENTIALS_REQUIRED ::
            </p>
        </div>
        
        {/* NOTIFICATION AREA */}
        {message && (
            <div className={`mb-6 p-3 rounded-lg border text-xs font-mono text-center animate-in fade-in slide-in-from-top-2 ${
                message.type === 'error' 
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}>
                {message.text}
            </div>
        )}
        
        {/* FORM SECTION */}
        <form onSubmit={handleUpdate} className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase font-mono pl-1">
                  Enter New Password
              </label>
              <div className="relative group">
                  <Lock className="absolute left-3 top-3 text-neutral-400 group-focus-within:text-emerald-500 transition duration-300" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-neutral-900 dark:text-white font-mono text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  />
              </div>
          </div>

          <GlitchButton 
            onClick={(e) => !loading && handleUpdate(e)} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white py-3 rounded-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <Lock size={18}/>}
            CONFIRM_UPDATE
          </GlitchButton>

        </form>
      </CyberCard>
      
    </div>
  );
};

export default UpdatePassword;