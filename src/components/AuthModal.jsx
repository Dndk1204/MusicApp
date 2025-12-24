"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useModal } from "@/context/ModalContext";
import { useRouter } from "next/navigation";
// Chỉ dùng icon có sẵn trong lucide-react
import { X, Lock, Mail, Fingerprint, KeyRound, AlertTriangle } from "lucide-react";
// Import Cyber Components của bạn
import { GlitchText, CyberButton } from "@/components/CyberComponents";

const AuthModal = () => {
  const { isOpen, closeModal, view } = useModal();
  const router = useRouter(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(""); // Lưu mã 6 số
  
  // Các trạng thái: 'login', 'register', 'recovery', 'verify_otp'
  const [variant, setVariant] = useState("login"); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
        setVariant(view);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setMessage(null);
    }
  }, [isOpen, view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
        // --- 1. ĐĂNG KÝ ---
        if (variant === 'register') {
            if (password !== confirmPassword) throw new Error("PASSWORDS_DO_NOT_MATCH");
            
            const { error } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: 'User', role: 'user' } }
            });
            if (error) throw error;
            setMessage({ type: 'success', text: ':: REGISTERED :: Check Email.' });
        }
        
        // --- 2. ĐĂNG NHẬP ---
        else if (variant === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            setMessage({ type: 'success', text: ':: ACCESS_GRANTED ::' });
            setTimeout(() => { closeModal(); router.refresh(); }, 1000);
        }
        
        // --- 3. QUÊN MẬT KHẨU (Gửi OTP) ---
        else if (variant === 'recovery') {
            // Gửi mã 6 số (OTP) thay vì Magic Link
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: false } 
            });
            if (error) throw error;

            setMessage({ type: 'success', text: ':: CODE_SENT :: Check Inbox.' });
            setVariant('verify_otp'); // Chuyển sang màn hình nhập code
        }

        // --- 4. XÁC THỰC OTP ---
        else if (variant === 'verify_otp') {
            // Xác thực mã người dùng nhập
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email'
            });

            if (error) throw error;

            setMessage({ type: 'success', text: ':: VERIFIED :: Redirecting...' });
            
            // Thành công -> Chuyển sang trang đổi mật khẩu
            setTimeout(() => {
                closeModal();
                router.push("/update-password"); 
            }, 1000);
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
      
      {/* KHUNG MODAL */}
      <div className="
          relative w-full max-w-sm overflow-hidden
          bg-white dark:bg-black 
          border-2 border-neutral-400 dark:border-white/20 
          shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(16,185,129,0.15)]
          rounded-none
      ">
        {/* Góc trang trí (Decor) */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

        {/* HEADER */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-6 text-center relative">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="w-12 h-12 mx-auto flex items-center justify-center mb-3 bg-neutral-200 dark:bg-white/5 border border-neutral-400 dark:border-white/20 rounded-none shadow-inner">
                {/* Đổi icon tùy theo trạng thái */}
                {variant === 'verify_otp' ? (
                     <KeyRound size={24} className="text-emerald-600 dark:text-emerald-500 animate-pulse"/>
                ) : (
                     <Fingerprint size={24} className="text-emerald-600 dark:text-emerald-500 animate-pulse"/>
                )}
            </div>
            
            <h2 className="text-xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                <GlitchText text={
                    variant === 'login' ? 'SYSTEM_LOGIN' : 
                    variant === 'register' ? 'NEW_USER_ENTRY' : 
                    variant === 'recovery' ? 'RESET_PROTOCOL' : 'SECURITY_CHECK'
                } />
            </h2>
            
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mt-1 text-emerald-600 dark:text-emerald-500/80">
                {variant === 'verify_otp' ? ':: AWAITING_CODE ::' : ':: AUTH_REQUIRED ::'}
            </p>

            <button 
                onClick={closeModal} 
                className="absolute top-3 right-3 text-neutral-500 hover:!text-red-500 dark:text-neutral-400 transition hover:!rotate-90 duration-300"
            >
                <X size={20} />
            </button>
        </div>

        {/* BODY */}
        <div className="p-6 bg-neutral-50/50 dark:bg-black/80">
            
            {/* THÔNG BÁO LỖI / THÀNH CÔNG */}
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
                
                {/* INPUT EMAIL: Ẩn khi đang nhập OTP */}
                {variant !== 'verify_otp' && (
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16}/>
                        <input
                            type="email"
                            placeholder="ENTER_EMAIL_ID..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full p-3 pl-10 text-xs font-mono outline-none transition-all rounded-none bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600 dark:focus:border-emerald-500"
                        />
                    </div>
                )}
                
                {/* INPUT PASSWORD: Chỉ hiện khi Login/Register */}
                {(variant === 'login' || variant === 'register') && (
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16}/>
                        <input
                            type="password"
                            placeholder="ENTER_PASSWORD..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full p-3 pl-10 text-xs font-mono outline-none transition-all rounded-none bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600 dark:focus:border-emerald-500"
                        />
                    </div>
                )}

                {/* CONFIRM PASSWORD: Chỉ hiện khi Register */}
                {variant === 'register' && (
                    <div className="relative group animate-in slide-in-from-left-2 fade-in duration-300">
                        <Lock className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16}/>
                        <input
                            type="password"
                            placeholder="CONFIRM_PASSWORD..."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full p-3 pl-10 text-xs font-mono outline-none transition-all rounded-none bg-white border-2 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500 dark:bg-black/40 dark:border-white/20 dark:text-white dark:placeholder-neutral-600 dark:focus:border-emerald-500"
                        />
                    </div>
                )}

                {/* --- MÀN HÌNH NHẬP OTP --- */}
                {variant === 'verify_otp' && (
                    <div className="relative group animate-in zoom-in duration-300">
                        <div className="text-center mb-4 text-[10px] font-mono text-neutral-500">
                            CODE SENT TO: <span className="text-emerald-500 block text-xs mt-1">{email}</span>
                        </div>
                        
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 text-neutral-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={16}/>
                            
                            <input
                                type="text"
                                placeholder="________"  // 8 dấu gạch dưới
                                value={otp}
                                onChange={(e) => {
                                    // Chỉ cho phép nhập số
                                    const val = e.target.value.replace(/\D/g, '');
                                    // SỬA: Cho phép nhập tối đa 8 ký tự
                                    if (val.length <= 8) setOtp(val);
                                }}
                                disabled={loading}
                                required
                                maxLength={8} // SỬA: Max length = 8
                                className="
                                    w-full p-3 pl-10 text-lg font-mono outline-none transition-all rounded-none 
                                    bg-white border-2 border-neutral-300 text-neutral-900 
                                    focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]
                                    
                                    dark:bg-black/40 dark:border-white/20 dark:text-white 
                                    dark:focus:border-emerald-500 dark:focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]
                                    
                                    text-center font-bold placeholder-neutral-600
                                    tracking-[0.3em] // SỬA: Giảm tracking từ 0.6em xuống 0.3em để vừa 8 số
                                "
                            />
                        </div>
                    </div>
                )}
                
                {/* NÚT SUBMIT */}
                <CyberButton 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed rounded-none mt-2"
                >
                    {loading ? 'PROCESSING...' : (
                        variant === 'login' ? 'INITIALIZE_LOGIN' : 
                        variant === 'register' ? 'CREATE_IDENTITY' : 
                        variant === 'recovery' ? 'SEND_CODE' : 'VERIFY_IDENTITY'
                    )}
                </CyberButton>
            </form>

            {/* FOOTER LINKS */}
            <div className="mt-6 text-center text-[10px] font-mono text-neutral-500 flex flex-col gap-y-3 pt-4 border-t border-dashed border-neutral-300 dark:border-white/10">
                {variant === 'login' && (
                <>
                    <div>
                        [NO_ID] <span onClick={() => {setVariant('register'); setMessage(null)}} className="text-emerald-600 dark:text-emerald-500 cursor-pointer hover:underline font-bold">:: REGISTER ::</span>
                    </div>
                    <div onClick={() => {setVariant('recovery'); setMessage(null)}} className="cursor-pointer hover:text-black dark:hover:text-white transition">
                        // LOST_PASSWORD?
                    </div>
                </>
                )}

                {(variant === 'register' || variant === 'recovery') && (
                    <div>
                        <span onClick={() => {setVariant('login'); setMessage(null)}} className="text-emerald-600 dark:text-emerald-500 cursor-pointer hover:underline font-bold w-full block">{'< RETURN_TO_LOGIN'}</span>
                    </div>
                )}

                {/* Nút quay lại khi nhập sai OTP hoặc muốn đổi email */}
                {variant === 'verify_otp' && (
                     <div onClick={() => {setVariant('recovery'); setOtp(''); setMessage(null)}} className="cursor-pointer hover:text-red-500 transition font-bold">
                        [ RESEND_CODE / EDIT_EMAIL ]
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default AuthModal;