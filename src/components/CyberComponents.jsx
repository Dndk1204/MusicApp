"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// --- 1. GLITCH TEXT (ORIGINAL) ---
export const GlitchText = ({ text, className = "" }) => {
  const glitchTransition = {
    duration: 3,
    repeat: Infinity,
    repeatType: "loop",
    ease: "linear",
    times: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 1], 
  };

  return (
    <div className={`relative inline-block group ${className}`}>
      <span className="relative z-30 block">{text}</span>
      <motion.span
        className="absolute top-0 left-0 z-20 block text-cyan-400 opacity-70 mix-blend-screen bg-transparent pointer-events-none"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 1, 0, 1, 0, 0],
          x: [-2, 2, -3, 0, 3, 0, 0],
          y: [0, 1, -1, 0, 0, 0, 0],
          clipPath: [
            "inset(10% 0 80% 0)", "inset(40% 0 20% 0)", "inset(80% 0 5% 0)",
            "inset(0 0 100% 0)", "inset(10% 0 40% 0)", "inset(0 0 100% 0)", "inset(0 0 100% 0)"
          ],
        }}
        transition={glitchTransition}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute top-0 left-0 z-20 block text-fuchsia-500 opacity-70 mix-blend-screen bg-transparent pointer-events-none"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 1, 0, 1, 0, 0],
          x: [2, -2, 3, 0, -3, 0, 0],
          y: [0, -1, 1, 0, 0, 0, 0],
          skew: [0, 15, -10, 0, 5, 0, 0],
          clipPath: [
            "inset(60% 0 10% 0)", "inset(20% 0 50% 0)", "inset(10% 0 80% 0)",
            "inset(0 0 100% 0)", "inset(50% 0 20% 0)", "inset(0 0 100% 0)", "inset(0 0 100% 0)"
          ],
        }}
        transition={{ ...glitchTransition, delay: 0.05 }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute top-0 left-0 z-20 block text-yellow-400 opacity-80 mix-blend-screen bg-transparent pointer-events-none"
        aria-hidden="true"
        initial={{ opacity: 0, x: 0 }}
        animate={{
          opacity: [0, 1, 0, 1, 0, 0, 0],
          x: [0, 1, -1, 0, 0, 0, 0],
          y: [-2, 2, -3, 3, 0, 0, 0],
          clipPath: [
            "inset(20% 0 20% 0)", "inset(80% 0 10% 0)", "inset(0 0 90% 0)",
            "inset(30% 0 30% 0)", "inset(0 0 100% 0)", "inset(0 0 100% 0)", "inset(0 0 100% 0)"
          ],
        }}
        transition={{ ...glitchTransition, delay: 0.1 }}
      >
        {text}
      </motion.span>
    </div>
  );
};

// --- 1.5 HORIZONTAL GLITCH TEXT (SLICE / TEARING EFFECT) ---
export const HorizontalGlitchText = ({ text, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* 1. TEXT GỐC (Làm nền định vị) */}
      <span className="relative z-10 opacity-0">{text}</span>

      {/* 2. MAIN TEXT (Hiển thị chính) */}
      <span className="absolute top-0 left-0 z-20 text-neutral-900 dark:text-white">
        {text}
      </span>

      {/* 3. GLITCH LAYER 1 (Cắt phần trên, dịch trái) */}
      <span 
        className="absolute top-0 left-0 z-30 w-full h-full text-neutral-900 dark:text-white bg-white dark:bg-black"
        aria-hidden="true"
        style={{
          clipPath: "inset(0 0 0 0)", // Khởi tạo
          animation: "glitch-slice-1 3s infinite linear alternate-reverse",
        }}
      >
        {text}
      </span>

      {/* 4. GLITCH LAYER 2 (Cắt phần dưới, dịch phải, đổi màu nhẹ) */}
      <span 
        className="absolute top-0 left-0 z-40 w-full h-full text-emerald-500 bg-transparent mix-blend-screen"
        aria-hidden="true"
        style={{
          clipPath: "inset(0 0 0 0)",
          opacity: 0.7,
          animation: "glitch-slice-2 2.5s infinite linear alternate-reverse",
        }}
      >
        {text}
      </span>

      {/* CSS KEYFRAMES: Tạo các lát cắt ngẫu nhiên */}
      <style jsx>{`
        @keyframes glitch-slice-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-3px, 0); }
          5% { clip-path: inset(10% 0 10% 0); transform: translate(3px, 0); } /* Glitch mạnh */
          10% { clip-path: inset(80% 0 5% 0); transform: translate(-3px, 0); }
          15% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); } /* Ẩn đi (Bình thường) */
          
          /* Khoảng nghỉ dài để không bị rối mắt */
          60% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); } 
          
          65% { clip-path: inset(40% 0 20% 0); transform: translate(4px, 0); }
          70% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
          100% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
        }

        @keyframes glitch-slice-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(3px, 0); }
          5% { clip-path: inset(80% 0 5% 0); transform: translate(-3px, 0); }
          10% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
          
          /* Khoảng nghỉ khác nhịp với layer 1 */
          40% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
          
          45% { clip-path: inset(50% 0 30% 0); transform: translate(-4px, 0); }
          50% { clip-path: inset(10% 0 80% 0); transform: translate(2px, 0); }
          55% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
          100% { clip-path: inset(0 0 100% 0); transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

// --- 1.6 VERTICAL GLITCH TEXT (Xé dọc) ---
export const VerticalGlitchText = ({ text, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Base Text ẩn để giữ chỗ */}
      <span className="relative z-10 opacity-0">{text}</span>
      {/* Main Text */}
      <span className="absolute top-0 left-0 z-20 text-neutral-900 dark:text-white">{text}</span>

      {/* LAYER 1: Cắt dải dọc, trượt lên */}
      <span 
        className="absolute top-0 left-0 z-30 w-full h-full text-neutral-900 dark:text-white bg-white dark:bg-black"
        aria-hidden="true"
        style={{ clipPath: "inset(0 100% 0 0)", animation: "glitch-v-1 2.5s infinite linear" }}
      >
        {text}
      </span>

      {/* LAYER 2: Cắt dải dọc khác, trượt xuống, thêm màu Cyan nhẹ */}
      <span 
        className="absolute top-0 left-0 z-40 w-full h-full text-cyan-500 mix-blend-screen"
        aria-hidden="true"
        style={{ clipPath: "inset(0 100% 0 0)", opacity: 0.8, animation: "glitch-v-2 3s infinite linear reverse" }}
      >
        {text}
      </span>

      <style jsx>{`
        @keyframes glitch-v-1 {
          0%, 100% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); } /* Ẩn */
          5% { clip-path: inset(0 40% 0 40%); transform: translate(0, -5px); } /* Cắt giữa, trượt lên mạnh */
          10% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }
          
          /* Nghỉ */
          50% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }

          55% { clip-path: inset(0 20% 0 70%); transform: translate(0, 3px); } /* Cắt bên phải, trượt xuống nhẹ */
          60% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }
        }

        @keyframes glitch-v-2 {
          0%, 100% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }
          15% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }

          20% { clip-path: inset(0 60% 0 10%); transform: translate(0, 4px); } /* Cắt bên trái, trượt xuống */
          25% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }
          
          65% { clip-path: inset(0 30% 0 30%); transform: translate(0, -2px); } /* Cắt rộng ở giữa, rung nhẹ lên */
          70% { clip-path: inset(0 100% 0 0); transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

// --- 1.7 DIAGONAL GLITCH TEXT (Xé chéo) ---
export const DiagonalGlitchText = ({ text, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <span className="relative z-10 opacity-0">{text}</span>
      <span className="absolute top-0 left-0 z-20 text-neutral-900 dark:text-white">{text}</span>

      {/* LAYER 1: Cắt chéo góc trên-trái, trượt xuống-phải */}
      <span 
        className="absolute top-0 left-0 z-30 w-full h-full text-neutral-900 dark:text-white bg-white dark:bg-black"
        aria-hidden="true"
        style={{ clipPath: "polygon(0 0, 0 0, 0 0)", animation: "glitch-d-1 4s infinite linear" }}
      >
        {text}
      </span>

      {/* LAYER 2: Cắt chéo góc dưới-phải, trượt lên-trái, thêm màu Hồng/Tím */}
      <span 
        className="absolute top-0 left-0 z-40 w-full h-full text-fuchsia-500 mix-blend-plus-lighter"
        aria-hidden="true"
        style={{ clipPath: "polygon(0 0, 0 0, 0 0)", opacity: 0.8, animation: "glitch-d-2 3.5s infinite linear reverse" }}
      >
        {text}
      </span>

      <style jsx>{`
        @keyframes glitch-d-1 {
          0%, 100% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); } /* Ẩn bằng polygon rỗng */
          
          /* Cú chém chéo 1 */
          2% { clip-path: polygon(0 0, 100% 40%, 100% 60%, 0 20%); transform: translate(4px, 4px); }
          4% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }

          /* Nghỉ dài */
          40% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }

          /* Cú chém chéo ngược lại nhẹ hơn */
          42% { clip-path: polygon(20% 0, 80% 0, 60% 100%, 0% 100%); transform: translate(-2px, 2px); }
          44% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }
        }

        @keyframes glitch-d-2 {
          0%, 100% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }
          
          /* Nghỉ lệch nhịp */
          20% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }

          /* Cú chém góc dưới lên */
          22% { clip-path: polygon(40% 100%, 100% 20%, 100% 100%); transform: translate(-3px, -3px); color: #ef4444; } /* Đổi màu đỏ thoáng qua */
          24% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }
          
          60% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }
          
          /* Rung chéo nhẹ */
          61% { clip-path: polygon(0 30%, 100% 70%, 100% 100%, 0 100%); transform: translate(2px, -2px); }
          62% { clip-path: polygon(0 0, 0 0, 0 0); transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

// --- 1.8 SKEW GLITCH TEXT (Nghiêng & Tách màu) ---
export const SkewGlitchText = ({ text, className = "" }) => {
  return (
    <div className={`relative inline-block font-bold ${className}`} title={text}>
      {/* 1. TEXT GỐC (Nền móng) */}
      <span className="relative z-10 block text-neutral-900 dark:text-white">
        {text}
      </span>

      {/* 2. LAYER GLITCH (Tím - Nghiêng Trái) */}
      <span 
        className="absolute top-0 left-0 z-0 w-full h-full text-fuchsia-500 opacity-70 mix-blend-multiply dark:mix-blend-screen pointer-events-none select-none"
        aria-hidden="true"
        style={{
          animation: "skew-glitch-1 3s infinite linear alternate-reverse",
          transformOrigin: "center"
        }}
      >
        {text}
      </span>

      {/* 3. LAYER GLITCH (Xanh - Nghiêng Phải) */}
      <span 
        className="absolute top-0 left-0 z-0 w-full h-full text-cyan-500 opacity-70 mix-blend-multiply dark:mix-blend-screen pointer-events-none select-none"
        aria-hidden="true"
        style={{
          animation: "skew-glitch-2 4s infinite linear alternate-reverse",
          transformOrigin: "center"
        }}
      >
        {text}
      </span>

      <style jsx>{`
        @keyframes skew-glitch-1 {
          0% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
          
          /* Giật nhẹ */
          5% { transform: skewX(-20deg) translate(-2px, 0); opacity: 0.8; }
          10% { transform: skewX(10deg) translate(1px, 0); opacity: 0.5; }
          15% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
          
          /* Nghỉ dài */
          60% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
          
          /* Cú giật mạnh */
          62% { transform: skewX(50deg) translate(-5px, 0); opacity: 1; }
          65% { transform: skewX(-30deg) translate(3px, 0); opacity: 0.7; }
          70% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
        }

        @keyframes skew-glitch-2 {
          0% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
          
          /* Nghỉ lệch pha so với layer 1 */
          20% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
          
          /* Rung lắc liên tục */
          25% { transform: skewX(30deg) translate(4px, 0); opacity: 0.8; }
          30% { transform: skewX(-10deg) translate(-2px, 0); opacity: 0.6; }
          35% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
          
          /* Cú giật cuối */
          80% { transform: skewX(-40deg) translate(2px, 0); opacity: 1; }
          85% { transform: skewX(20deg) translate(-1px, 0); opacity: 0; }
          100% { transform: skewX(0deg) translate(0, 0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// --- 2. SCANLINE ---
export const ScanlineOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-none z-10">
      <motion.div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent" initial={{ top: "-50%" }} animate={{ top: "150%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:4px_4px] opacity-30"></div>
    </div>
  );
};

// --- 3. DECODER TEXT ---
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

// --- 4. CYBER CARD ---
export const CyberCard = ({ children, className = "" }) => {
  return (
    <motion.div 
      className={`
        relative group overflow-hidden 
        bg-white/80 border border-neutral-300 shadow-sm
        dark:bg-neutral-900/40 dark:border-white/5 dark:shadow-none
        backdrop-blur-md 
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500/50 group-hover:border-emerald-500 group-hover:w-4 group-hover:h-4 transition-all duration-300"></div>
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// --- 5. AUDIO VISUALIZER ---
export const AudioVisualizer = ({ isPlaying = true }) => {
  return (
    <div className="flex items-end gap-1 h-8">
      {[1, 2, 3, 4, 5].map((item) => (
        <motion.div key={item} className="w-1 bg-emerald-500/80 rounded-none" animate={isPlaying ? { height: ["20%", "80%", "40%", "100%", "30%"] } : { height: "10%" }} transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: item * 0.1 }} />
      ))}
    </div>
  );
};

// --- 6. HOLO BUTTON (Cancel/Back) ---
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
        bg-neutral-100/50 border-neutral-300 text-neutral-800
        dark:bg-white/5 dark:border-white/10 dark:text-emerald-400
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent skew-x-12 z-0 pointer-events-none"
        initial={{ x: "-150%" }}
        whileHover={{ x: "150%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex items-center gap-2 justify-center pointer-events-none transition-colors">
        {children}
      </span>
    </motion.button>
  );
};

// --- 7. GLITCH BUTTON (Delete/Reset/Warning) ---
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
      <motion.div className="absolute inset-0 flex items-center justify-center gap-2 text-red-500 z-10 mix-blend-screen pointer-events-none select-none" variants={{ rest: { opacity: 0, x: 0 }, hover: { opacity: [0, 1, 0, 1, 0], x: [-2, -4, 2, -3], transition: { duration: 0.1, repeat: Infinity } } }}>{children}</motion.div>
      <motion.div className="absolute inset-0 flex items-center justify-center gap-2 text-cyan-500 z-10 mix-blend-screen pointer-events-none select-none" variants={{ rest: { opacity: 0, x: 0 }, hover: { opacity: [0, 1, 0, 1, 0], x: [2, 4, -2, 3], transition: { duration: 0.1, repeat: Infinity, delay: 0.02 } } }}>{children}</motion.div>
      <motion.div className="absolute inset-0 bg-white/20 z-0 pointer-events-none" variants={{ rest: { opacity: 0 }, hover: { opacity: [0, 0.2, 0], clipPath: ["inset(10% 0 80% 0)", "inset(40% 0 50% 0)", "inset(80% 0 10% 0)", "inset(0 0 100% 0)"], transition: { duration: 0.2, repeat: Infinity } } }} />
    </motion.button>
  );
};

// --- 8. CYBER BUTTON (Confirm/Primary Action) ---
export const CyberButton = ({ children, onClick, disabled, className = "", ...props }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={`
        relative px-6 py-2 overflow-hidden group
        font-mono font-bold tracking-widest uppercase
        disabled:opacity-50 disabled:cursor-not-allowed
        border transition-all duration-300
        
        /* Light/Dark styles */
        bg-emerald-500 text-white border-emerald-600
        hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]
        dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/50
        dark:hover:bg-emerald-500 dark:hover:text-black dark:hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]
        
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Corner Brackets Animation */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/50 dark:border-emerald-500 group-hover:w-full group-hover:h-full transition-all duration-500 opacity-0 group-hover:opacity-100"></span>
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/50 dark:border-emerald-500 group-hover:w-full group-hover:h-full transition-all duration-500 opacity-0 group-hover:opacity-100"></span>

      {/* Button Text */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

// --- 9. NEON BUTTON (Secondary/Alternative Action) ---
export const NeonButton = ({ children, onClick, disabled, className = "", ...props }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={`
        relative px-6 py-2 group
        font-mono font-bold tracking-widest uppercase
        disabled:opacity-50 disabled:cursor-not-allowed
        bg-transparent transition-all duration-300
        
        /* Text color & Glow */
        text-blue-600 dark:text-cyan-400
        hover:text-blue-500 dark:hover:text-cyan-300
        hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]
        
        /* Border styles handled by pseudo-element below for gradient effect */
        border border-blue-500/30 dark:border-cyan-500/30
        hover:border-blue-500 dark:hover:border-cyan-400
        
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Background Pulse on Hover */}
      <div className="absolute inset-0 bg-blue-500/5 dark:bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};