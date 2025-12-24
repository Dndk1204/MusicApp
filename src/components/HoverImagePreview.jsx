"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ScanlineOverlay } from "@/components/CyberComponents";
import { Volume2, VolumeX, Loader2, Disc, Activity } from "lucide-react"; 
import usePlayer from "@/hooks/usePlayer";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENT ĐƯỜNG KẺ CYBER (Z-SHAPE NGẪU NHIÊN) ---
const DigitalLine = ({ mouseX, mouseY, previewX, previewY }) => {
    // Tạo đường đi gấp khúc vuông góc (Orthogonal Path)
    const pathData = useMemo(() => {
        // Kiểm tra an toàn để tránh NaN
        if (isNaN(mouseX) || isNaN(mouseY) || isNaN(previewX) || isNaN(previewY)) return "";

        const midX = mouseX + (previewX - mouseX) * 0.5;
        // Jitter tạo độ lệch ngẫu nhiên cho đoạn giữa
        const jitter = (Math.random() - 0.5) * 40; 

        return `M ${mouseX} ${mouseY} 
                L ${midX + jitter} ${mouseY} 
                L ${midX + jitter} ${previewY} 
                L ${previewX} ${previewY}`;
    }, [mouseX, mouseY, previewX, previewY]);

    if (!pathData) return null;

    return (
        <motion.svg
            className="absolute pointer-events-none overflow-visible z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ top: 0, left: 0, position: 'fixed' }}
        >
            {/* Lớp Glow mờ */}
            <motion.path
                d={pathData}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="3"
                strokeOpacity="0.2"
                style={{ filter: "blur(4px)" }}
            />
            {/* Đường kẻ chính đứt đoạn chạy dữ liệu */}
            <motion.path
                d={pathData}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="10 5"
                animate={{ strokeDashoffset: [0, -30] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
            <circle cx={mouseX} cy={mouseY} r="2.5" fill="#34d399" />
            <circle cx={previewX} cy={previewY} r="2.5" fill="#34d399" />
        </motion.svg>
    );
};

const HoverImagePreview = ({ 
    src, 
    alt, 
    audioSrc, 
    className = "",
    previewSize = 240, 
    children 
}) => {
    const player = usePlayer();
    const [isHovering, setIsHovering] = useState(false);
    const [status, setStatus] = useState("idle"); 
    const [imgRatio, setImgRatio] = useState(1); // Mặc định là 1 để tránh chia cho 0
    const [isMobile, setIsMobile] = useState(false);
    const [coords, setCoords] = useState(null);

    const audioRef = useRef(null);
    const fadeIntervalRef = useRef(null);
    const playTimeoutRef = useRef(null);
    const stopTimeoutRef = useRef(null);
    const isHoveringRef = useRef(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768);
        };
        checkMobile();
        return () => stopAudioImmediate();
    }, []);

    // --- AUDIO LOGIC ---
    const playPreview = () => {
        if (!audioSrc || player.isPlaying || isMobile) return;
        stopAudioImmediate();
        setStatus("loading");
        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        audio.volume = 0; 
        audio.onloadedmetadata = () => { if (audio.duration > 45) audio.currentTime = 60; };

        audio.play().then(() => {
            if (!isHoveringRef.current) { stopAudioImmediate(); return; }
            setStatus("playing");
            let vol = 0;
            fadeIntervalRef.current = setInterval(() => {
                vol += 0.02;
                audio.volume = Math.min(vol, 0.4);
                if (vol >= 0.4) clearInterval(fadeIntervalRef.current);
            }, 50);

            stopTimeoutRef.current = setTimeout(() => stopAudioWithFade(), 20000);
        }).catch(() => setStatus("error"));
    };

    const stopAudioImmediate = () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        setStatus("idle");
    };

    const stopAudioWithFade = () => {
        if (!audioRef.current) return;
        let vol = audioRef.current.volume;
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = setInterval(() => {
            vol -= 0.02;
            if (vol > 0) audioRef.current.volume = vol;
            else stopAudioImmediate();
        }, 30);
    };

    // --- EVENT HANDLERS ---
    const handleMouseEnter = (e) => {
        if (isMobile) return;
        setCoords({ x: e.clientX, y: e.clientY });
        setIsHovering(true);
        isHoveringRef.current = true;
        playTimeoutRef.current = setTimeout(() => {
            if (isHoveringRef.current) playPreview();
        }, 400);
    };

    const handleMouseMove = (e) => {
        if (isMobile) return;
        setCoords({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        isHoveringRef.current = false;
        clearTimeout(playTimeoutRef.current);
        stopAudioWithFade();
    };

    // --- TÍNH TOÁN VỊ TRÍ AN TOÀN (FIX NaN) ---
    const getLayout = () => {
        const offset = 40;
        // Bảo vệ imgRatio không bằng 0 hoặc NaN
        const safeRatio = imgRatio > 0 ? imgRatio : 1;
        const actualHeight = previewSize / safeRatio;
        
        let posX = coords.x + offset;
        let posY = coords.y - actualHeight / 2;

        if (typeof window !== "undefined") {
            if (posX + previewSize > window.innerWidth - 20) posX = coords.x - previewSize - offset;
            if (posY + actualHeight > window.innerHeight - 20) posY = window.innerHeight - actualHeight - 20;
            if (posY < 20) posY = 20;
        }
        return { x: posX, y: posY, height: actualHeight };
    };

    const layout = coords ? getLayout() : null;

    return (
        <>
            <div 
                className={`relative ${className}`} 
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove} 
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>

            {isHovering && coords && layout && !isMobile && createPortal(
                <AnimatePresence mode="wait">
                    <DigitalLine 
                        key="line"
                        mouseX={coords.x} mouseY={coords.y}
                        previewX={layout.x} previewY={layout.y + (layout.height / 2)}
                        // Gợi ý: Truyền thêm prop cho DigitalLine để nó đổi màu theo mode
                        className="text-emerald-600 dark:text-emerald-500"
                    />
                    
                    <motion.div 
                        key="popup"
                        initial={{ 
                            opacity: 0, 
                            scale: 0.8, 
                            x: layout.x, // Không để mặc định là 0 nữa
                            y: layout.y  // Không để mặc định là 0 nữa
                        }}
                        animate={{ 
                            x: layout.x, 
                            y: layout.y,
                            opacity: 1,
                            scale: 1 
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed z-[9999] pointer-events-none top-0 left-0"
                        style={{ width: previewSize, height: layout.height }}
                    >
                        {/* KHUNG POPUP CHÍNH */}
                        <div className={`
                            relative w-full h-full p-1 border-t-2 border-l-2 transition-colors duration-300
                            bg-white dark:bg-black 
                            shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[10px_10px_0px_0px_rgba(16,185,129,0.2)] 
                            ${status === "error" 
                                ? "border-red-600 dark:border-red-500" 
                                : "border-emerald-600 dark:border-emerald-500"
                            }
                        `}>
                            {/* KHUNG CHỨA ẢNH */}
                            <div className="relative w-full h-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                                {src ? (
                                    <Image 
                                        src={src} 
                                        alt={alt || "preview"} 
                                        fill 
                                        className="object-cover opacity-90 dark:opacity-80 transition-opacity group-hover:opacity-100" 
                                        onLoadingComplete={(result) => {
                                            if (result.naturalWidth && result.naturalHeight) {
                                                setImgRatio(result.naturalWidth / result.naturalHeight);
                                            }
                                        }} 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Disc size={40} className="text-emerald-700 dark:text-emerald-900 animate-spin-slow" />
                                    </div>
                                )}

                                {/* SCANLINE LỚP PHỦ */}
                                <ScanlineOverlay className="opacity-[0.05] dark:opacity-100" />

                                {/* WAVE VISUALIZER */}
                                {status === "playing" && (
                                    <div className="absolute bottom-2 left-2 flex items-end gap-[2px] h-10 z-30">
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div 
                                                key={i} 
                                                className="w-[3px] bg-emerald-600 dark:bg-emerald-500/80" 
                                                animate={{ height: [4, Math.random() * 30 + 5, 4] }} 
                                                transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.05 }} 
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CYBER HEADER (Thanh tiêu đề nhỏ phía trên) */}
                            <div className="absolute top-0 left-0 w-full p-2 flex items-center justify-between font-mono z-40 bg-neutral-100/90 dark:bg-black/60 backdrop-blur-sm border-b border-neutral-200 dark:border-white/10 text-[9px]">
                                <div className="flex items-center gap-2">
                                    <Activity size={12} className="text-emerald-600 dark:text-emerald-500 animate-pulse" />
                                    <span className="text-neutral-900 dark:text-white font-bold uppercase tracking-widest">PREVIEW_MODE</span>
                                </div>
                                <span className="text-emerald-700 dark:text-emerald-500/70 font-bold">20S_MAX</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default HoverImagePreview;