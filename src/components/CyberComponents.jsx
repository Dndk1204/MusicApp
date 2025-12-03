"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// --- 1. GLITCH TEXT (Giữ nguyên, chỉ cần parent set màu chữ là được) ---
export const GlitchText = ({ text, className = "" }) => {
  // Cấu hình chung cho animation để code gọn hơn
  const glitchTransition = {
    duration: 3,
    repeat: Infinity,
    repeatType: "loop",
    ease: "linear",
    times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 1], // Glitch dồn dập trong 25% thời gian đầu
  };

  return (
    <div className={`relative inline-block group ${className}`}>
      {/* LAYER CHÍNH (Màu gốc) 
        Giữ nguyên hiển thị chính để người dùng đọc được chữ
      */}
      <span className="relative z-30 block">{text}</span>

      {/* LAYER 1: CYAN (Xanh Lơ) 
        Di chuyển: Ngang (Left/Right)
      */}
      <motion.span
        className="absolute top-0 left-0 z-20 block text-cyan-400 opacity-70 mix-blend-screen bg-transparent pointer-events-none"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 1, 0, 1, 0, 0], // Chớp tắt
          x: [-2, 2, -3, 0, 3, 0, 0],     // Rung lắc ngang
          y: [0, 1, -1, 0, 0, 0, 0],
          clipPath: [
            "inset(10% 0 80% 0)",
            "inset(40% 0 20% 0)",
            "inset(80% 0 5% 0)",
            "inset(0 0 100% 0)",
            "inset(10% 0 40% 0)",
            "inset(0 0 100% 0)",
            "inset(0 0 100% 0)"
          ],
        }}
        transition={glitchTransition}
      >
        {text}
      </motion.span>

      {/* LAYER 2: MAGENTA (Hồng Tím) 
        Di chuyển: Ngược chiều Cyan + Skew (Nghiêng)
      */}
      <motion.span
        className="absolute top-0 left-0 z-20 block text-fuchsia-500 opacity-70 mix-blend-screen bg-transparent pointer-events-none"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 1, 0, 1, 0, 0],
          x: [2, -2, 3, 0, -3, 0, 0],    // Ngược với Cyan
          y: [0, -1, 1, 0, 0, 0, 0],
          skew: [0, 15, -10, 0, 5, 0, 0], // Tạo cảm giác kéo giãn
          clipPath: [
            "inset(60% 0 10% 0)",
            "inset(20% 0 50% 0)",
            "inset(10% 0 80% 0)",
            "inset(0 0 100% 0)",
            "inset(50% 0 20% 0)",
            "inset(0 0 100% 0)",
            "inset(0 0 100% 0)"
          ],
        }}
        transition={{ ...glitchTransition, delay: 0.05 }} // Trễ 1 chút để không chồng khít lên Cyan
      >
        {text}
      </motion.span>

      {/* LAYER 3: YELLOW (Vàng Toxic) - NEW!
        Di chuyển: Dọc (Up/Down) nhiều hơn - Tạo độ rung chiều dọc
      */}
      <motion.span
        className="absolute top-0 left-0 z-20 block text-yellow-400 opacity-80 mix-blend-screen bg-transparent pointer-events-none"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 0, 1, 0, 0, 0],
          x: [0, 1, -1, 0, 0, 0, 0],     // Rung nhẹ ngang
          y: [-2, 2, -3, 3, 0, 0, 0],    // Rung mạnh dọc
          clipPath: [
            "inset(20% 0 20% 0)",
            "inset(80% 0 10% 0)",
            "inset(0 0 90% 0)",
            "inset(30% 0 30% 0)",
            "inset(0 0 100% 0)",
            "inset(0 0 100% 0)",
            "inset(0 0 100% 0)"
          ],
        }}
        transition={{ ...glitchTransition, delay: 0.1 }} // Trễ nhất
      >
        {text}
      </motion.span>
    </div>
  );
};

// --- 2. SCANLINE (Giữ nguyên) ---
export const ScanlineOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
      <motion.div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent" initial={{ top: "-50%" }} animate={{ top: "150%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-30"></div>
    </div>
  );
};

// --- 3. DECODER TEXT (Giữ nguyên) ---
const CYBER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*";
export const DecoderText = ({ text, className = "" }) => {
  const [displayText, setDisplayText] = useState(text);
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) => text.split("").map((letter, index) => { if (index < iteration) return text[index]; return CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)]; }).join(""));
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 2;
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span className={`font-mono ${className}`}>{displayText}</span>;
};

// --- 4. CYBER CARD (CẬP NHẬT LIGHT/DARK MODE) ---
export const CyberCard = ({ children, className = "" }) => {
  return (
    <motion.div 
      className={`
        relative group overflow-hidden 
        /* Light Mode */
        bg-white/80 border border-neutral-300 shadow-sm
        /* Dark Mode */
        dark:bg-neutral-900/40 dark:border-white/5 dark:shadow-none
        
        backdrop-blur-md 
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Góc công nghệ: Emerald ở cả 2 mode để giữ nhận diện thương hiệu */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// --- 5. AUDIO VISUALIZER (Giữ nguyên) ---
export const AudioVisualizer = ({ isPlaying = true }) => {
  return (
    <div className="flex items-end gap-1 h-5">
      {[1, 2, 3, 4, 5].map((item) => (
        <motion.div key={item} className="w-1 bg-emerald-500/80 rounded-t-sm" animate={isPlaying ? { height: ["20%", "80%", "40%", "100%", "30%"] } : { height: "10%" }} transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: item * 0.1 }} />
      ))}
    </div>
  );
};

// --- 6. HOLO BUTTON (CẬP NHẬT LIGHT/DARK MODE) ---
export const HoloButton = ({ children, onClick, disabled, className = "", ...props }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={`
        relative overflow-hidden group border backdrop-blur-md 
        font-mono font-bold uppercase tracking-widest 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        transition-all duration-300 cursor-pointer z-20 
        
        /* Light Mode Default: Nền sáng, viền xám, chữ đen */
        bg-neutral-100/50 border-neutral-300 text-neutral-800
        /* Dark Mode Default: Nền tối, viền trắng mờ, chữ xanh ngọc */
        dark:bg-white/5 dark:border-white/10 dark:text-emerald-400
        
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Quét sáng: Điều chỉnh màu gradient cho phù hợp cả 2 mode */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent skew-x-12 z-0 pointer-events-none"
        initial={{ x: "-150%" }}
        whileHover={{ x: "150%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      
      {/* Nội dung */}
      <span className="relative z-10 flex items-center gap-2 justify-center pointer-events-none transition-colors">
        {children}
      </span>
    </motion.button>
  );
};

// --- 7. GLITCH BUTTON (CẬP NHẬT LIGHT/DARK MODE) ---
export const GlitchButton = ({ children, onClick, disabled, className = "" }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-6 py-2 isolate group
        font-mono font-bold tracking-widest uppercase
        border disabled:opacity-50 disabled:cursor-not-allowed
        overflow-visible 
        transition-colors duration-200
        ${className} 
        /* Mặc định màu đỏ nếu không có border */
        ${!className.includes('border-') ? 'border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white dark:text-red-500' : ''}
      `}
      initial="rest"
      whileHover={!disabled ? "hover" : "rest"}
      whileTap="rest"
      variants={{
        rest: { scale: 1, transition: { duration: 0.1 } },
        hover: { scale: 1.02, transition: { duration: 0.2 } }
      }}
    >
      <span className="relative z-20 flex items-center justify-center gap-2 transition-colors">
        {children}
      </span>

      {/* CÁC LAYER GLITCH (Giữ nguyên) */}
      <motion.div className="absolute inset-0 flex items-center justify-center gap-2 text-red-500 z-10 mix-blend-screen pointer-events-none select-none" variants={{ rest: { opacity: 0, x: 0 }, hover: { opacity: [0, 1, 0, 1, 0], x: [-2, -4, 2, -3], transition: { duration: 0.1, repeat: Infinity } } }}>{children}</motion.div>
      <motion.div className="absolute inset-0 flex items-center justify-center gap-2 text-cyan-500 z-10 mix-blend-screen pointer-events-none select-none" variants={{ rest: { opacity: 0, x: 0 }, hover: { opacity: [0, 1, 0, 1, 0], x: [2, 4, -2, 3], transition: { duration: 0.1, repeat: Infinity, delay: 0.02 } } }}>{children}</motion.div>
      <motion.div className="absolute inset-0 bg-white/20 z-0 pointer-events-none" variants={{ rest: { opacity: 0 }, hover: { opacity: [0, 0.2, 0], clipPath: ["inset(10% 0 80% 0)", "inset(40% 0 50% 0)", "inset(80% 0 10% 0)", "inset(0 0 100% 0)"], transition: { duration: 0.2, repeat: Infinity } } }} />
    </motion.button>
  );
};