"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useModal } from "@/context/ModalContext";
import { X, Lock, Mail, ShieldAlert, Fingerprint } from "lucide-react"; // Thêm icon trang trí

const AuthModal = () => {
  const { isOpen, closeModal, view } = useModal();
  
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
            setMessage({ type: 'success', text: ':: ADMIN_ACCESS_REQUESTED :: Check Email.' });
        } else {
            setMessage({ type: 'success', text: ':: REGISTRATION_COMPLETE :: Check Email.' });
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
            window.location.reload(); 
        }, 1000);
      }
      else if (variant === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: ':: RECOVERY_PROTOCOL_INITIATED ::' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `ERROR: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="glass w-full max-w-md rounded-2xl p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
        
        <button onClick={closeModal} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 transition hover:rotate-90 duration-300">
          <X size={24} />
        </button>

        {/* HEADER */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4 border border-white/10">
                <Fingerprint size={24} className="text-emerald-500"/>
            </div>
            <h2 className="text-3xl font-bold text-white font-mono tracking-tighter">
            {variant === 'login' && 'SYSTEM_LOGIN'}
            {variant === 'register' && 'NEW_USER_ENTRY'}
            {variant === 'recovery' && 'RESET_PROTOCOL'}
            </h2>
            <p className="text-xs font-mono text-emerald-500 tracking-[0.3em] uppercase mt-2 opacity-80">
            {variant === 'recovery' 
                ? ':: AWAITING_IDENTIFICATION ::' 
                : ':: AUTHENTICATION_REQUIRED ::'}
            </p>
        </div>

        {/* MESSAGE BOX */}
        {message && (
          <div className={`p-3 rounded-lg mb-6 text-xs font-mono font-bold text-center border ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* EMAIL INPUT */}
          <div className="relative group">
            <Mail className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-500 transition" size={18}/>
            <input
                type="email"
                placeholder="Enter Email ID..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition"
            />
          </div>
          
          {/* PASSWORD INPUT */}
          {variant !== 'recovery' && (
             <div className="relative group">
                <Lock className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-500 transition" size={18}/>
                <input
                    type="password"
                    placeholder="Enter Password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition"
                />
            </div>
          )}

          {/* ADMIN CODE INPUT */}
          {variant === 'register' && (
             <div className="relative group">
                <ShieldAlert className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-blue-500 transition" size={18}/>
                <input
                    type="text"
                    placeholder="Admin Code (Optional)"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono text-sm outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition"
                />
             </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 bg-emerald-500 text-black font-bold font-mono py-3 rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]"
          >
            {loading ? 'PROCESSING...' : (
              variant === 'login' ? 'INITIALIZE_LOGIN' : 
              variant === 'register' ? 'CREATE_IDENTITY' : 'SEND_RECOVERY_KEY'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-mono text-neutral-500 flex flex-col gap-y-3">
          {variant === 'login' ? (
            <>
              <div>
                [NO_ID_FOUND] <span onClick={() => {setVariant('register'); setMessage(null)}} className="text-emerald-500 cursor-pointer hover:underline hover:text-emerald-400">:: REGISTER_NEW ::</span>
              </div>
              <div onClick={() => {setVariant('recovery'); setMessage(null)}} className="cursor-pointer hover:text-white transition">
                // FORGOT_PASSWORD?
              </div>
            </>
          ) : (
            <div>
              {variant === 'register' 
                ? <>[ID_EXISTS] <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-emerald-500 cursor-pointer hover:underline hover:text-emerald-400">:: LOGIN_NOW ::</span></>
                : <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-emerald-500 cursor-pointer hover:underline hover:text-emerald-400 text-center w-full block">{'< BACK_TO_LOGIN'}</span>
              }
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;