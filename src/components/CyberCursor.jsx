"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Ban } from "lucide-react"; // Import icon Ban

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
    
    // Khôi phục state disabled
    const [isDisabled, setIsDisabled] = useState(false);
    
    const pathname = usePathname();

    useEffect(() => {
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);
        
        const moveCursor = (e) => {
            mouseX.current = e.clientX;
            mouseY.current = e.clientY;

            // Logic Scrollbar
            const target = e.target;
            let onScroll = false;
            if (target && target instanceof Element) {
                if (target.clientWidth < target.offsetWidth) {
                    const rect = target.getBoundingClientRect();
                    if (e.clientX >= rect.left + target.clientWidth && e.clientX <= rect.right) onScroll = true;
                }
                if (!onScroll && target.clientHeight < target.offsetHeight) {
                    const rect = target.getBoundingClientRect();
                    if (e.clientY >= rect.top + target.clientHeight && e.clientY <= rect.bottom) onScroll = true;
                }
            }
            setIsOnScrollbar(onScroll);
            if (!isVisible && !onScroll) setIsVisible(true);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleElementHover = (e) => {
            if (isClicking) return;
            const target = e.target;

            // --- 1. LOGIC CHECK DISABLED ---
            const checkDisabled = 
                target.matches(':disabled') || 
                target.closest('[disabled]') ||
                target.classList.contains('disabled') ||
                target.closest('.disabled') ||
                target.getAttribute('aria-disabled') === 'true' ||
                target.getAttribute('data-disabled') === 'true' ||
                target.classList.contains('cursor-not-allowed') ||
                window.getComputedStyle(target).cursor === 'not-allowed';

            // Cập nhật state
            setIsDisabled(!!checkDisabled);

            // --- 2. LOGIC CHECK INTERACTIVE ---
            const isInteractive = 
                target.matches('button, a, input, textarea, select, [role="button"]') ||
                target.closest('button, a, [role="button"]') ||
                target.classList.contains('cursor-pointer') ||
                target.closest('.cursor-pointer') || 
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isInteractive);
        };

        let animationFrameId;
        const animate = () => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${mouseX.current}px, ${mouseY.current}px, 0)`;
            }
            trailerX.current += (mouseX.current - trailerX.current) * 0.15; 
            trailerY.current += (mouseY.current - trailerY.current) * 0.15;

            if (trailerRef.current) {
                trailerRef.current.style.transform = `translate3d(${trailerX.current}px, ${trailerY.current}px, 0)`;
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener("pointermove", moveCursor); 
        window.addEventListener("dragover", moveCursor);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseover", handleElementHover); 
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("pointermove", moveCursor);
            window.removeEventListener("dragover", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseover", handleElementHover);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isVisible, isClicking]);

    useEffect(() => {
        setIsHovering(false);
        setIsClicking(false);
        setIsDisabled(false);
    }, [pathname]);

    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return null;

    const shouldShow = isVisible && !isOnScrollbar;

    // Màu sắc khung viền
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
            {/* 1. CENTER DOT (Crosshair) */}
            {/* Logic: Ẩn hoàn toàn nếu Disabled. Nếu không disabled -> hiện */}
            {!isDisabled && (
                <div 
                    ref={cursorRef}
                    className={`
                        fixed top-0 left-[0.055rem] z-[100000] pointer-events-none
                        flex items-center justify-center -translate-x-1/2 -translate-y-1/2
                        transition-opacity duration-200
                        ${shouldShow ? "opacity-100" : "opacity-0"}
                    `}
                    style={{ width: '0px', height: '0px' }} 
                >
                    {/* Logic Scale: Hover -> Scale to gấp đôi (scale-[2]), Bình thường -> scale-100 */}
                    <div className={`
                        relative flex items-center justify-center transition-all duration-200 
                        ${isHovering ? 'scale-[2]' : 'scale-100'}
                    `}>
                        <div className="w-[1px] h-3 bg-neutral-900 dark:bg-white absolute"></div>
                        <div className="w-3 h-[1px] bg-neutral-900 dark:bg-white absolute"></div>
                    </div>
                </div>
            )}

            {/* 2. OUTER FRAME */}
            <div 
                ref={trailerRef}
                className={`
                    fixed top-0 left-0 z-[100000] pointer-events-none
                    flex items-center justify-center -translate-x-1/2 -translate-y-1/2
                    transition-opacity duration-200
                    ${shouldShow ? "opacity-100" : "opacity-0"}
                `}
                style={{ width: '0px', height: '0px' }}
            >
                <div 
                    className={`
                        relative flex items-center justify-center transition-all duration-300 ease-out
                        ${isHovering || isDisabled ? "w-16 h-16" : "w-8 h-8"}
                        ${isClicking ? "scale-75" : "scale-100"}
                    `}
                >
                    {/* KHUNG VUÔNG CHÍNH */}
                    <div className={`
                        absolute inset-0 border !transition-all !duration-300
                        ${frameBorderColor} ${bgColor}
                        ${isHovering || isDisabled ? "border-1" : "border-[1px]"}
                        ${isClicking && !isDisabled ? "bg-emerald-500/20 border-emerald-600 dark:border-emerald-400" : ""}
                    `}></div>
                    
                    {/* --- SVG ICON CẤM (HIỆN KHI DISABLED) --- */}
                    {isDisabled && (
                        <div>
                            <div className={`
                                ${isDisabled 
                                    ? "absolute !inset-0 !top-0 !left-0 !-translate-x-1/2 translate-y-8 !items-center !justify-center border !border-red-600/50 dark:!border-red-500/50 bg-red-500 w-[4.2rem] h-[0.11rem] border-1 transform rotate-45"
                                    : ""
                                }
                            `}>
                            </div>
                            <Ban 
                                size={32} 
                                strokeWidth={1.5} 
                                className="!absolute !inset-0 !top-0 !left-0 flex !-translate-x-1/2 !translate-y-1/2 items-center justify-center z-50 text-red-600 dark:text-red-500 animate-in zoom-in duration-200 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" 
                            />
                        </div>
                    )}

                    {/* THANH NGANG KHI CLICK */}
                    {!isDisabled && (
                        <div className={`
                            absolute border transition-all duration-300
                            ${isHovering 
                                ? "border-emerald-600/50 dark:border-emerald-500/50 bg-emerald-500/5 w-[4.2rem] h-0.5 border-1"
                                : "border-neutral-900/30 dark:border-white/40 border-[1px] w-[2.2rem] h-0.5"
                            }
                            ${isClicking ? "bg-emerald-500/20 border-emerald-600 dark:border-emerald-400" : ""}
                        `}></div>
                    )}

                    {/* 4 GÓC (CORNER BRACKETS) */}
                    <div className={`absolute top-[-1px] left-[-18px] border-t-2 border-l-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 -translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                    <div className={`absolute top-[-1px] right-[-18px] border-t-2 border-r-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                    <div className={`absolute bottom-[-1px] left-[-18px] border-b-2 border-l-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 -translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                    <div className={`absolute bottom-[-1px] right-[-18px] border-b-2 border-r-2 transition-all duration-300 ${isHovering || isDisabled ? `w-3 h-3 translate-x-4 ${cornerColor}` : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>

                    {/* LABEL TEXT */}
                    <div className={`
                        absolute !left-[50%] top-full mt-3
                        -translate-x-[49%] 
                        bg-white/90 dark:bg-black/90 
                        ${labelColor}
                        border px-2 py-0.5
                        text-[9px] font-mono font-bold whitespace-nowrap tracking-widest
                        transition-all duration-300 backdrop-blur-sm
                        ${isHovering || isDisabled ? "opacity-100 -translate-y-2" : "opacity-0 -translate-y-10"}
                    `}>
                        {isDisabled ? ">> DENIED <<" : (isClicking ? ">> EXEC <<" : "TARGET")}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CyberCursor;