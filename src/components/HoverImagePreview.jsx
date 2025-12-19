"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ScanlineOverlay } from "@/components/CyberComponents";
import { Volume2, VolumeX, Loader2, Disc, User } from "lucide-react"; 
import usePlayer from "@/hooks/usePlayer";
import Image from "next/image";

const HoverImagePreview = ({ 
    src, 
    alt, 
    audioSrc, 
    className = "",
    previewSize = 240, 
    fallbackIcon = "disc", 
    children 
}) => {
    const player = usePlayer();
    
    const [isHovering, setIsHovering] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState("idle"); 
    const [imgRatio, setImgRatio] = useState(1); 

    const popupRef = useRef(null); 
    const audioRef = useRef(null);
    const fadeIntervalRef = useRef(null);
    const playTimeoutRef = useRef(null);
    const isHoveringRef = useRef(false);
    const requestRef = useRef(null);

    // THÊM: Ref lưu tọa độ chuột cuối cùng
    const lastMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setMounted(true);
        return () => {
            stopAudioImmediate();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }; 
    }, []);

    // --- LOGIC TÍNH TOÁN VỊ TRÍ (Tách ra hàm riêng để tái sử dụng) ---
    const updatePopupPosition = useCallback((clientX, clientY) => {
        if (!popupRef.current) return;

        const offset = 20; 
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const actualHeight = previewSize / imgRatio; 

        let x = clientX + offset;
        let y = clientY + offset;
        
        // Xử lý tràn ngang
        if (x + previewSize > viewportWidth - 20) { 
            x = clientX - previewSize - offset;
        }
        
        // Xử lý tràn dọc
        const isFlippedY = y + actualHeight > viewportHeight;
        const translateY = isFlippedY ? `-${actualHeight}px` : '0px';

        popupRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translateY(${translateY})`;
    }, [previewSize, imgRatio]);

    // --- LOGIC SỰ KIỆN WINDOW ---
    useEffect(() => {
        if (!isHovering) return;

        // 1. Cập nhật vị trí NGAY LẬP TỨC khi vừa hiện (Fix lỗi hiện góc trái)
        if (lastMousePos.current.x !== 0 && lastMousePos.current.y !== 0) {
            // Dùng requestAnimationFrame để đảm bảo DOM đã render xong
            requestRef.current = requestAnimationFrame(() => {
                updatePopupPosition(lastMousePos.current.x, lastMousePos.current.y);
            });
        }

        // 2. Handler khi di chuột
        const handleWindowMouseMove = (e) => {
            // Cập nhật tọa độ mới nhất vào ref
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(() => {
                updatePopupPosition(e.clientX, e.clientY);
            });
        };

        // 3. Handler khi cuộn trang (Để cập nhật lại tính toán tràn màn hình nếu cần)
        const handleWindowScroll = () => {
             if (requestRef.current) cancelAnimationFrame(requestRef.current);
             requestRef.current = requestAnimationFrame(() => {
                // Dùng lại tọa độ chuột cũ (vì chuột không di chuyển so với màn hình khi scroll)
                updatePopupPosition(lastMousePos.current.x, lastMousePos.current.y);
            });
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('scroll', handleWindowScroll, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('scroll', handleWindowScroll);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isHovering, updatePopupPosition]); 


    // --- AUDIO LOGIC (Giữ nguyên) ---
    useEffect(() => {
        if (player.isPlaying && status === "playing") {
            stopAudioWithFade();
        }
    }, [player.isPlaying]);

    const visualizerBars = useMemo(() => {
        return (
            <div className="absolute bottom-0 left-0 w-full h-12 flex items-end gap-0.5 opacity-90 px-1 pb-1 z-10 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-black dark:to-transparent">
                {Array.from({ length: 16 }).map((_, i) => {
                    const height = Math.random() * 60 + 20; 
                    const duration = 0.4 + Math.random() * 0.4; 
                    return (
                        <div 
                            key={i} 
                            className="flex-1 bg-emerald-600 dark:bg-emerald-500 animate-[bounce_1s_infinite]" 
                            style={{
                                animationDuration: `${duration}s`,
                                animationDelay: `${i * 0.05}s`, 
                                height: `${height}%`
                            }}
                        ></div>
                    );
                })}
            </div>
        );
    }, []);

    const stopAudioImmediate = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
        setStatus("idle");
    };

    const stopAudioWithFade = () => {
        if (!audioRef.current) {
            setStatus("idle");
            return;
        }
        const audio = audioRef.current;
        let vol = audio.volume;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.005;
                audio.volume = Math.max(0, vol);
            } else {
                stopAudioImmediate();
            }
        }, 3);
    };

    const playPreview = () => {
        if (!audioSrc) return;
        if (player.isPlaying) return;

        stopAudioImmediate();
        setStatus("loading");

        const audio = new Audio();
        audioRef.current = audio;
        audio.volume = 0; 

        const handleError = (e) => {
            if (isHoveringRef.current) setStatus("error");
        };

        audio.onerror = handleError;
        audio.onabort = handleError;
        
        audio.onloadedmetadata = () => {
            if (!isHoveringRef.current) return;
            if (audio.duration > 45 && Number.isFinite(audio.duration)) {
                audio.currentTime = 30;
            }
        };

        audio.src = audioSrc;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    if (!isHoveringRef.current) {
                        stopAudioImmediate();
                        return;
                    }
                    setStatus("playing");
                    let vol = 0;
                    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                    fadeIntervalRef.current = setInterval(() => {
                        if (vol < 0.5) {
                            vol += 0.003;
                            audio.volume = Math.min(vol, 0.5);
                        } else {
                            clearInterval(fadeIntervalRef.current);
                        }
                    }, 50);
                    setTimeout(() => {
                        if (isHoveringRef.current) stopAudioWithFade();
                    }, 15000);
                })
                .catch(err => {
                    handleError(err);
                });
        }
        audio.onended = () => stopAudioImmediate();
    };

    // --- HANDLE MOUSE EVENTS (SỬA ĐỔI) ---
    const handleMouseEnter = (e) => {
        // QUAN TRỌNG: Lưu vị trí chuột ngay khi vừa chạm vào
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        
        setIsHovering(true);
        isHoveringRef.current = true;
        
        if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = setTimeout(() => {
            if (isHoveringRef.current) {
                playPreview();
            }
        }, 200);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        isHoveringRef.current = false;
        if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
        stopAudioWithFade();
    };

    const renderContent = () => {
        if (src) {
            return (
                <div className="relative w-full h-full">
                    <Image 
                        src={src} 
                        alt={alt || "preview"} 
                        fill
                        className="object-cover"
                        onLoadingComplete={(result) => {
                            if (result.naturalWidth && result.naturalHeight) {
                                setImgRatio(result.naturalWidth / result.naturalHeight);
                            }
                        }}
                        onError={() => setImgRatio(1)} 
                    />
                </div>
            );
        }
        return (
            <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                {fallbackIcon === "user" ? (
                    <User size={previewSize * 0.4} className="text-neutral-400 dark:text-neutral-700" strokeWidth={1} />
                ) : (
                    <Disc size={previewSize * 0.4} className="text-neutral-400 dark:text-neutral-700 animate-spin-slow" strokeWidth={1} />
                )}
            </div>
        );
    };

    return (
        <>
            <div 
                className={`relative shrink-0 ${className}`}
                onMouseEnter={handleMouseEnter} // Đã cập nhật hàm này
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>

            {mounted && isHovering && createPortal(
                <div 
                    ref={popupRef}
                    className="fixed z-[9999] pointer-events-none origin-top-left"
                    style={{ 
                        left: 0, 
                        top: 0,
                        width: previewSize, 
                        height: previewSize / imgRatio, 
                        willChange: "transform", 
                        transition: "height 0.2s ease",
                        // Mặc định ẩn đi 1 xíu để tránh nháy ở góc 0,0 nếu máy chậm
                        // opacity: popupRef.current ? 1 : 0 
                    }}
                >
                    <div 
                        className={`
                            w-full h-full relative overflow-hidden transition-colors duration-300
                            border-2 shadow-[0_0_30px_rgba(0,0,0,0.2)] dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]
                            bg-white dark:bg-black
                            ${status === "error" 
                                ? "border-red-600 dark:border-red-500 shadow-red-500/20" 
                                : "border-emerald-600 dark:border-emerald-500 shadow-emerald-500/20"
                            }
                            animate-in fade-in zoom-in-95 duration-150
                        `}
                    >
                        {renderContent()}

                        <ScanlineOverlay />
                        
                        <div className={`
                            absolute top-0 left-0 backdrop-blur border-b text-[10px] font-mono font-bold px-2 py-1 flex items-center gap-2 z-20 w-full
                            ${status === "error" 
                                ? "bg-red-100/90 dark:bg-red-900/80 border-red-500/50 text-red-700 dark:text-red-200" 
                                : "bg-white/90 dark:bg-black/90 border-emerald-600/20 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-500"
                            }
                        `}>
                            <span>PREVIEW</span>
                            <span className="flex-1"></span>
                            
                            {status === "loading" && (
                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500"><Loader2 size={10} className="animate-spin" /> LOAD</span>
                            )}
                            {status === "error" && (
                                <span className="flex items-center gap-1 text-red-600 dark:text-red-200 font-bold"><VolumeX size={10} /> ERR</span>
                            )}
                            {status === "playing" && (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Volume2 size={10} className="animate-pulse" /> LIVE</span>
                            )}
                        </div>
                        
                        <div className={`absolute bottom-0 right-0 w-4 h-4 border-l-2 border-t-2 border-white dark:border-black z-20 ${status === "error" ? "bg-red-600 dark:bg-red-500" : "bg-emerald-600 dark:bg-emerald-500"}`}></div>

                        {status === "playing" && visualizerBars}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default HoverImagePreview;