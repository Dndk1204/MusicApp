"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const CyberCursor = () => {
    const cursorRef = useRef(null); // Tâm (Dấu cộng)
    const trailerRef = useRef(null); // Khung vuông bao quanh
    
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);
        
        const moveCursor = (e) => {
            if (!isVisible) setIsVisible(true);
            
            const { clientX, clientY } = e;
            
            // 1. Tâm: Đi theo ngay lập tức
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
            }
            
            // 2. Khung: Đi theo mượt mà (Lag effect)
            if (trailerRef.current) {
                trailerRef.current.animate({
                    transform: `translate3d(${clientX}px, ${clientY}px, 0)`
                }, { duration: 500, fill: "forwards", easing: "ease-out" });
            }
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleElementHover = (e) => {
            const target = e.target;
            const isInteractive = 
                target.matches('button, a, input, textarea, select, [role="button"]') ||
                target.closest('button, a, [role="button"]') ||
                target.classList.contains('cursor-pointer') ||
                target.closest('.cursor-pointer') || 
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isInteractive);
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseover", handleElementHover);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseover", handleElementHover);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isVisible]);

    useEffect(() => {
        setIsHovering(false);
        setIsClicking(false);
    }, [pathname]);

    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return null;

    return (
        <>
            {/* 1. CENTER CROSSHAIR */}
            {/* FIX: Bỏ mix-blend-difference, dùng màu cụ thể: bg-black (Light) / bg-white (Dark) */}
            <div 
                ref={cursorRef}
                className={`
                    fixed top-0 left-[0.055rem] z-[100000] pointer-events-none
                    flex items-center justify-center -translate-x-1/2 -translate-y-1/2
                    transition-opacity duration-300
                    ${isVisible ? "opacity-100" : "opacity-0"}
                `}
                style={{ width: '0px', height: '0px' }} 
            >
                <div className={`relative flex items-center justify-center transition-all duration-200 ${isHovering ? 'scale-0' : 'scale-100'}`}>
                    <div className="w-[1px] h-3 bg-neutral-900 dark:bg-white absolute"></div>
                    <div className="w-3 h-[1px] bg-neutral-900 dark:bg-white absolute"></div>
                </div>
            </div>

            {/* 2. OUTER SQUARE FRAME (Khung vuông) */}
            <div 
                ref={trailerRef}
                className={`
                    fixed top-0 left-0 z-[100000] pointer-events-none
                    flex items-center justify-center -translate-x-1/2 -translate-y-1/2
                    transition-opacity duration-300
                    ${isVisible ? "opacity-100" : "opacity-0"}
                `}
                style={{ width: '0px', height: '0px' }}
            >
                <div 
                    className={`
                        relative flex items-center justify-center transition-all duration-300 ease-out
                        ${isHovering ? "w-16 h-16" : "w-8 h-8"}
                        ${isClicking ? "scale-75" : "scale-100"}
                    `}
                >
                    {/* KHUNG VUÔNG CHÍNH */}
                    {/* FIX: Border đen mờ ở Light mode, Trắng mờ ở Dark mode */}
                    <div className={`
                        absolute inset-0 border transition-all duration-300
                        ${isHovering 
                            ? "border-emerald-600/50 dark:border-emerald-500/50 bg-emerald-500/5 border-1" // Hover
                            : "border-neutral-900/30 dark:border-white/40 border-[1px]" // Bình thường
                        }
                        ${isClicking ? "bg-emerald-500/20 border-emerald-600 dark:border-emerald-400" : ""}
                    `}></div>
                    
                    {/* Thanh ngang trang trí khi click */}
                    <div className={`
                        absolute border transition-all duration-300
                        ${isHovering 
                            ? "border-emerald-600/50 dark:border-emerald-500/50 bg-emerald-500/5 w-[4.2rem] h-0.5 border-1"
                            : "border-neutral-900/30 dark:border-white/40 border-[1px] w-[2.2rem] h-0.5"
                        }
                        ${isClicking ? "bg-emerald-500/20 border-emerald-600 dark:border-emerald-400" : ""}
                    `}></div>

                    {/* 4 GÓC (CORNER BRACKETS) */}
                    {/* FIX: Chuyển màu góc thành đen (Light) và trắng (Dark) khi không hover */}
                    <div className={`absolute top-[-1px] left-[-18px] border-t-2 border-l-2 transition-all duration-300 
                        ${isHovering ? "w-3 h-3 -translate-x-4 border-emerald-600 dark:border-emerald-400" : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                    
                    <div className={`absolute top-[-1px] right-[-18px] border-t-2 border-r-2 transition-all duration-300 
                        ${isHovering ? "w-3 h-3 translate-x-4 border-emerald-600 dark:border-emerald-400" : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                    
                    <div className={`absolute bottom-[-1px] left-[-18px] border-b-2 border-l-2 transition-all duration-300 
                        ${isHovering ? "w-3 h-3 -translate-x-4 border-emerald-600 dark:border-emerald-400" : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>
                    
                    <div className={`absolute bottom-[-1px] right-[-18px] border-b-2 border-r-2 transition-all duration-300 
                        ${isHovering ? "w-3 h-3 translate-x-4 border-emerald-600 dark:border-emerald-400" : "w-1 h-1 border-neutral-900 dark:border-white"}`}></div>

                    {/* LABEL TEXT */}
                    {/* FIX: Nền trắng chữ đen ở Light mode cho dễ đọc */}
                    <div className={`
                        absolute !left-[50%] top-full mt-3
                        -translate-x-[49%] 
                        bg-white/90 dark:bg-black/90 
                        text-emerald-700 dark:text-emerald-400 
                        border border-emerald-600/50 dark:border-emerald-500/50 
                        px-2 py-0.5
                        text-[9px] font-mono font-bold whitespace-nowrap tracking-widest
                        transition-all duration-300 backdrop-blur-sm
                        ${isHovering ? "opacity-100 -translate-y-2" : "opacity-0 -translate-y-10"}
                    `}>
                        {isClicking ? ">> EXEC <<" : "TARGET"}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CyberCursor;