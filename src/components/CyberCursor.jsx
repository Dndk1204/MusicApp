"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Ban, Activity } from "lucide-react";

const CyberCursor = () => {
    const cursorRef = useRef(null);
    const trailerRef = useRef(null);
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const trailerX = useRef(0);
    const trailerY = useRef(0);

    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isOnScrollbar, setIsOnScrollbar] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);

    // --- LOGIC STATES: PHÒNG VỆ & HIỆU ỨNG ---
    const [isCustomEnabled, setIsCustomEnabled] = useState(true);
    const [showBSOD, setShowBSOD] = useState(false);
    const [isGlitching, setIsGlitching] = useState(false);
    
    const pathname = usePathname();

    // 1. TẠO ÂM THANH BEEP (Web Audio API)
    const playSystemSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type === 'error' ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(type === 'error' ? 120 : 880, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) { console.error("Audio error", e); }
    };

    // 2. ĐIỀU KHIỂN HỆ THỐNG & ESC TOGGLE
    useEffect(() => {
        let styleTag = document.getElementById("cyber-cursor-style");
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "cyber-cursor-style";
            document.head.appendChild(styleTag);
        }

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsGlitching(true);
                playSystemSound(isCustomEnabled ? 'error' : 'success');

                if (isCustomEnabled) {
                    setShowBSOD(true);
                    setTimeout(() => {
                        setShowBSOD(false);
                        setIsCustomEnabled(false);
                        setIsGlitching(false);
                    }, 1200);
                } else {
                    setTimeout(() => {
                        setIsCustomEnabled(true);
                        setIsGlitching(false);
                    }, 300);
                }
            }
        };

        const updateCursor = (enabled) => {
            styleTag.innerHTML = (enabled && !showBSOD) ? `* { cursor: none !important; }` : `* { cursor: auto !important; }`;
        };

        window.addEventListener("keydown", handleKeyDown);
        updateCursor(isCustomEnabled);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            styleTag.innerHTML = `* { cursor: auto !important; }`;
        };
    }, [isCustomEnabled, showBSOD]);

    // 3. LOGIC DI CHUYỂN
    useEffect(() => {
        if (!isCustomEnabled || showBSOD) return;

        const moveCursor = (e) => {
            mouseX.current = e.clientX;
            mouseY.current = e.clientY;

            // Logic Scrollbar
            const target = e.target;
            let onScroll = false;
            if (target instanceof Element) {
                if (target.clientWidth < target.offsetWidth) {
                    const rect = target.getBoundingClientRect();
                    if (e.clientX >= rect.left + target.clientWidth && e.clientX <= rect.right) onScroll = true;
                }
            }
            setIsOnScrollbar(onScroll);
            if (!isVisible && !onScroll) setIsVisible(true);
        };

        const handleElementHover = (e) => {
            const target = e.target;
            if (!target || !(target instanceof Element)) return;

            const checkDisabled = target.matches(':disabled') || target.closest('[disabled]') || 
                                target.classList.contains('cursor-not-allowed') || 
                                window.getComputedStyle(target).cursor === 'not-allowed';
            setIsDisabled(!!checkDisabled);

            const isInteractive = target.matches('button, a, input, textarea, [role="button"]') || 
                                target.closest('button, a, [role="button"]') ||
                                window.getComputedStyle(target).cursor === 'pointer';
            setIsHovering(!!isInteractive);
        };

        let animationFrameId;
        const animate = () => {
            if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${mouseX.current}px, ${mouseY.current}px, 0)`;
            trailerX.current += (mouseX.current - trailerX.current) * 0.15;
            trailerY.current += (mouseY.current - trailerY.current) * 0.15;
            if (trailerRef.current) trailerRef.current.style.transform = `translate3d(${trailerX.current}px, ${trailerY.current}px, 0)`;
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener("pointermove", moveCursor);
        window.addEventListener("mouseover", handleElementHover);
        window.addEventListener("mousedown", () => setIsClicking(true));
        window.addEventListener("mouseup", () => setIsClicking(false));
        document.addEventListener("mouseenter", () => setIsVisible(true));
        document.addEventListener("mouseleave", () => setIsVisible(false));

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("pointermove", moveCursor);
            window.removeEventListener("mouseover", handleElementHover);
        };
    }, [isCustomEnabled, showBSOD, isVisible]);

    useEffect(() => {
        setIsHovering(false);
        setIsClicking(false);
        setIsDisabled(false);
    }, [pathname]);

    // --- RENDER FALLBACK ---
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return null;

    // --- UI COMPONENTS ---
    const BSOD = () => (
        <div className="fixed inset-0 z-[1000000] bg-[#0078d7] text-white p-10 font-sans flex flex-col justify-center animate-in fade-in duration-75">
            <div className="max-w-3xl mx-auto">
                <div className="text-[120px] mb-10">:(</div>
                <h1 className="text-2xl mb-6 font-light">Your system encountered an internal conflict (ESC_KEY_TERMINATION). We're collecting some error info, and then we'll restore default input for you.</h1>
                <p className="text-xl mb-10">Restoring: 100% complete</p>
                <div className="flex gap-10 items-center">
                    <div className="w-24 h-24 bg-white p-1 shrink-0">
                        <div className="w-full h-full bg-black flex items-center justify-center text-[6px] text-center">CORE_DUMP_NULL</div>
                    </div>
                    <div className="text-xs font-mono opacity-80">
                        <p>Stop code: CYBER_CURSOR_OVERRIDE</p>
                        <p>Status: DEFAULT_HID_RECOVERY_SUCCESS</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- UI VARIABLES (TỪ ĐOẠN DƯỚI CỦA BẠN) ---
    const shouldShow = isVisible && !isOnScrollbar;

    const frameBorderColor = isDisabled 
        ? "!border-red-600 dark:!border-red-500" 
        : (isHovering ? "border-emerald-600/50 dark:border-emerald-500/50" : "border-neutral-900/30 dark:border-white/40");
    
    const bgColor = isDisabled 
        ? "bg-red-500 transform rotate-45" 
        : (isHovering || isClicking ? "bg-emerald-500/5" : "");
    
    const labelColor = isDisabled 
        ? "text-red-600 dark:text-red-500 border-red-600/50" 
        : "text-emerald-700 dark:text-emerald-400 border-emerald-600/50";
    
    const cornerColor = isDisabled 
        ? "border-red-600 dark:border-red-500" 
        : "border-emerald-600 dark:border-emerald-400";

    return (
        <>
            {/* HIỆU ỨNG GLITCH KHI CHUYỂN ĐỔI */}
            {isGlitching && (
                <div className="fixed inset-0 z-[999999] pointer-events-none bg-emerald-500/10 mix-blend-overlay animate-pulse" />
            )}

            {showBSOD && <BSOD />}

            {isCustomEnabled && !showBSOD && (
                <>
                    {/* 1. CENTER DOT (Crosshair) */}
                    {!isDisabled && (
                        <div 
                            ref={cursorRef}
                            className={`fixed top-0 left-[0.055rem] z-[100000] pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${shouldShow ? "opacity-100" : "opacity-0"}`}
                            style={{ width: '0px', height: '0px' }} 
                        >
                            <div className={`relative flex items-center justify-center transition-all duration-200 ${isHovering ? 'scale-[2]' : 'scale-100'}`}>
                                <div className="w-[1px] h-3 bg-neutral-900 dark:bg-white absolute"></div>
                                <div className="w-3 h-[1px] bg-neutral-900 dark:bg-white absolute"></div>
                            </div>
                        </div>
                    )}

                    {/* 2. OUTER FRAME */}
                    <div 
                        ref={trailerRef}
                        className={`fixed top-0 left-0 z-[100000] pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${shouldShow ? "opacity-100" : "opacity-0"}`}
                        style={{ width: '0px', height: '0px' }}
                    >
                        <div className={`relative flex items-center justify-center transition-all duration-300 ease-out ${isHovering || isDisabled ? "w-16 h-16" : "w-8 h-8"} ${isClicking ? "scale-75" : "scale-100"}`}>
                            
                            {/* KHUNG VUÔNG CHÍNH */}
                            <div className={`absolute inset-0 border !transition-all !duration-300 ${frameBorderColor} ${bgColor} ${isHovering || isDisabled ? "border-1" : "border-[1px]"} ${isClicking && !isDisabled ? "bg-emerald-500/20 border-emerald-600 dark:border-emerald-400" : ""}`}></div>
                            
                            {/* SVG ICON CẤM */}
                            {isDisabled && (
                                <div>
                                    <div className="absolute !inset-0 !top-0 !left-0 !-translate-x-1/2 translate-y-8 !items-center !justify-center border !border-red-600/50 dark:!border-red-500/50 bg-red-500 w-[4.2rem] h-[0.11rem] border-1 transform rotate-45"></div>
                                    <Ban size={32} strokeWidth={1.5} className="!absolute !inset-0 !top-0 !left-0 flex !-translate-x-1/2 !translate-y-1/2 items-center justify-center z-50 text-red-600 dark:text-red-500 animate-in zoom-in duration-200 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" />
                                </div>
                            )}

                            {!isDisabled && (
                                <div className={`absolute border transition-all duration-300 ${isHovering ? "border-emerald-600/50 dark:border-emerald-500/50 bg-emerald-500/5 w-[4.2rem] h-0.5 border-1" : "border-neutral-900/30 dark:border-white/40 border-[1px] w-[2.2rem] h-0.5"} ${isClicking ? "bg-emerald-500/20 border-emerald-600 dark:border-emerald-400" : ""}`}></div>
                            )}

                            {/* 4 GÓC */}
                            <div className={`absolute top-[-1px] left-[-18px] border-t-2 border-l-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 -translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                            <div className={`absolute top-[-1px] right-[-18px] border-t-2 border-r-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                            <div className={`absolute bottom-[-1px] left-[-18px] border-b-2 border-l-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 -translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                            <div className={`absolute bottom-[-1px] right-[-18px] border-b-2 border-r-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>

                            {/* LABEL TEXT */}
                            <div className={`absolute !left-[50%] top-full mt-3 -translate-x-[49%] bg-white/90 dark:bg-black/90 ${labelColor} border px-2 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap tracking-widest transition-all duration-300 backdrop-blur-sm ${isHovering || isDisabled ? "opacity-100 -translate-y-2" : "opacity-0 -translate-y-10"}`}>
                                {isDisabled ? ">> DENIED <<" : (isClicking ? ">> EXEC <<" : "TARGET")}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default CyberCursor;