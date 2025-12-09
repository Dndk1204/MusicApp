"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useModal } from "@/context/ModalContext";
import { useRouter } from "next/navigation";
import { X, Lock, Mail, ShieldAlert, Fingerprint } from "lucide-react";
// Import Cyber Components
import { GlitchText, CyberButton, HoloButton, CyberCard } from "@/components/CyberComponents";

const AuthModal = () => {
  const { isOpen, closeModal, view } = useModal();
  const router = useRouter(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState(""); 
  
  const [variant, setVariant] = useState("login"); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const SECRET_ADMIN_CODE = "admin123";

  useEffect(() => {
    if (isOpen) {
      setVariant(view);
      setEmail("");
      setPassword("");
      setAdminCode("");
      setMessage(null);
    }
  }, [isOpen, view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (variant === 'register') {
        let userRole = 'user';
        if (adminCode === SECRET_ADMIN_CODE) {
            userRole = 'admin';
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
                full_name: 'User',
                role: userRole
            } 
          }
        });

        if (error) throw error;
        
        if (userRole === 'admin') {
            setMessage({ type: 'success', text: ':: ADMIN_REQ :: Check Email.' });
        } else {
            setMessage({ type: 'success', text: ':: REGISTERED :: Check Email.' });
        }
      } 
      else if (variant === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        setMessage({ type: 'success', text: ':: ACCESS_GRANTED ::' });
        
        setTimeout(() => {
            closeModal();
            router.refresh(); 
        }, 1000);
      }
      else if (variant === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: ':: RECOVERY_SENT ::' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `ERR: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-900/90 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container (Cyber Brutalism) */}
      <div className="
          relative w-full max-w-sm overflow-hidden
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

        {/* HEADER */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-6 text-center relative">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="w-12 h-12 mx-auto flex items-center justify-center mb-3 bg-neutral-200 dark:bg-white/5 border border-neutral-400 dark:border-white/20 rounded-none shadow-inner">
                <Fingerprint size={24} className="text-emerald-600 dark:text-emerald-500 animate-pulse"/>
            </div>
            
            <h2 className="text-xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                <GlitchText text={variant === 'login' ? 'SYSTEM_LOGIN' : variant === 'register' ? 'NEW_USER_ENTRY' : 'RESET_PROTOCOL'} />
            </h2>
            
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mt-1 text-emerald-600 dark:text-emerald-500/80">
                {variant === 'recovery' ? ':: AWAITING_ID ::' : ':: AUTH_REQUIRED ::'}
            </p>

            <button 
                onClick={closeModal} 
                className="absolute top-3 right-3 text-neutral-500 hover:text-red-500 dark:text-neutral-400 transition hover:rotate-90 duration-300"
            >
                <X size={20} />
            </button>
        </div>

        {/* BODY */}
        <div className="p-6 bg-neutral-50/50 dark:bg-black/80">
            
            {/* MESSAGE BOX */}
            {message && (
                <div className={`mb-4 p-2 text-[10px] font-mono font-bold text-center border uppercase tracking-wide animate-in slide-in-from-top-2
                    ${message.type === 'error' 
                        ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/30' 
                        : 'bg-emerald-100 border-emerald-500 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/30'}
                `}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* EMAIL INPUT */}
                <div className="relative group">
                    <Mail className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16}/>
                    <input
                        type="email"
                        placeholder="ENTER_EMAIL_ID..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="
                            w-full p-3 pl-10 text-xs font-mono outline-none transition-all rounded-none
                            bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                            focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                            
                            dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                            dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                        "
                    />
                </div>
                
                {/* PASSWORD INPUT */}
                {variant !== 'recovery' && (
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16}/>
                        <input
                            type="password"
                            placeholder="ENTER_PASSWORD..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="
                                w-full p-3 pl-10 text-xs font-mono outline-none transition-all rounded-none
                                bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                                focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                                
                                dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                                dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                            "
                        />
                    </div>
                )}

                {/* ADMIN CODE INPUT */}
                {variant === 'register' && (
                    <div className="relative group">
                        <ShieldAlert className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors pointer-events-none" size={16}/>
                        <input
                            type="text"
                            placeholder="ADMIN_CODE (OPTIONAL)"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            disabled={loading}
                            className="
                                w-full p-3 pl-10 text-xs font-mono outline-none transition-all rounded-none
                                bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400
                                focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)]
                                
                                dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600
                                dark:focus:border-blue-500 dark:focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]
                            "
                        />
                    </div>
                )}
                
                {/* SUBMIT BUTTON */}
                <CyberButton 
                    type="submit" 
                    disabled={loading} 
                    className="
                        w-full py-3 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed rounded-none mt-2
                    "
                >
                    {loading ? 'PROCESSING...' : (
                        variant === 'login' ? 'INITIALIZE_LOGIN' : 
                        variant === 'register' ? 'CREATE_IDENTITY' : 'SEND_KEY'
                    )}
                </CyberButton>
            </form>

            {/* FOOTER LINKS */}
            <div className="mt-6 text-center text-[10px] font-mono text-neutral-500 flex flex-col gap-y-3 pt-4 border-t border-dashed border-neutral-300 dark:border-white/10">
                {variant === 'login' ? (
                <>
                    <div>
                        [NO_ID] <span onClick={() => {setVariant('register'); setMessage(null)}} className="text-emerald-600 dark:text-emerald-500 cursor-pointer hover:underline font-bold">:: REGISTER ::</span>
                    </div>
                    <div onClick={() => {setVariant('recovery'); setMessage(null)}} className="cursor-pointer hover:text-black dark:hover:text-white transition">
                        // LOST_PASSWORD?
                    </div>
                </>
                ) : (
                <div>
                    {variant === 'register' 
                        ? <>[ID_EXISTS] <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-emerald-600 dark:text-emerald-500 cursor-pointer hover:underline font-bold">:: LOGIN ::</span></>
                        : <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-emerald-600 dark:text-emerald-500 cursor-pointer hover:underline font-bold w-full block">{'< RETURN_TO_LOGIN'}</span>
                    }
                </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default AuthModal;