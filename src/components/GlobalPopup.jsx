"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from "lucide-react";
import useUI from "@/hooks/useUI";
// Import Cyber Components nếu cần, hoặc dùng class trực tiếp cho nhẹ
import { HoloButton, GlitchButton, CyberButton } from "@/components/CyberComponents";

const GlobalPopup = () => {
  const { popup, closePopup, confirmAction } = useUI();

  const getTypeStyles = () => {
    switch (popup.type) {
      case 'error':
        return { 
            icon: <AlertTriangle size={24} />, 
            color: 'text-red-600 dark:text-red-500', 
            border: 'border-red-500', 
            bgIcon: 'bg-red-100 dark:bg-red-500/10',
            bgDecor: 'bg-red-500'
        };
      case 'success':
        return { 
            icon: <CheckCircle size={24} />, 
            color: 'text-emerald-600 dark:text-emerald-500', 
            border: 'border-emerald-500', 
            bgIcon: 'bg-emerald-100 dark:bg-emerald-500/10',
            bgDecor: 'bg-emerald-500'
        };
      case 'confirm':
        return { 
            icon: <HelpCircle size={24} />, 
            color: 'text-yellow-600 dark:text-yellow-500', 
            border: 'border-yellow-500', 
            bgIcon: 'bg-yellow-100 dark:bg-yellow-500/10',
            bgDecor: 'bg-yellow-500'
        };
      default:
        return { 
            icon: <Info size={24} />, 
            color: 'text-blue-600 dark:text-blue-500', 
            border: 'border-blue-500', 
            bgIcon: 'bg-blue-100 dark:bg-blue-500/10',
            bgDecor: 'bg-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {popup.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm"
          />

          {/* Popup Content - CYBER BRUTALISM */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`
                relative w-full max-w-sm p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]
                bg-white dark:bg-black 
                border-2 ${styles.border}
                rounded-none /* Vuông góc */
                overflow-hidden
            `}
          >
              {/* Corner Decor */}
              <div className={`absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 ${styles.border.replace('border-', 'border-')} pointer-events-none z-10`}></div>
              <div className={`absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 ${styles.border.replace('border-', 'border-')} pointer-events-none z-10`}></div>
              <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 ${styles.border.replace('border-', 'border-')} pointer-events-none z-10`}></div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 ${styles.border.replace('border-', 'border-')} pointer-events-none z-10`}></div>

              {/* Decor Line Top */}
              <div className={`absolute top-0 left-0 w-full h-1 ${styles.bgDecor} animate-pulse`}></div>

              <div className="flex flex-col gap-4 relative z-20">
                
                {/* Icon & Title Row */}
                <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-white/10 pb-3">
                    <div className={`p-2 rounded-none ${styles.bgIcon} ${styles.color}`}>
                        {styles.icon}
                    </div>
                    <h3 className={`text-lg font-bold font-mono uppercase tracking-widest ${styles.color}`}>
                        {popup.title || "SYSTEM_MESSAGE"}
                    </h3>
                </div>

                {/* Message Body */}
                <div className="py-2">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 font-mono leading-relaxed">
                        {popup.message}
                    </p>
                </div>

                {/* Actions Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                    {popup.type === 'confirm' ? (
                        <>
                            <GlitchButton 
                                onClick={closePopup}
                                className="px-4 py-2 border-red-500 dark:border-red/30 text-neutral-600 dark:text-neutral-400 font-mono text-xs hover:text-black dark:hover:text-white"
                            >
                                CANCEL
                            </GlitchButton>
                            
                            <HoloButton 
                                onClick={confirmAction}
                                className="px-6 py-2 !bg-yellow-500 !text-black !border-yellow-500 hover:!bg-yellow-400 hover:!text-black font-mono text-xs font-bold shadow-lg"
                            >
                                CONFIRM_ACTION
                            </HoloButton>
                        </>
                    ) : (
                        <CyberButton 
                            onClick={closePopup}
                            className={`
                                px-6 py-2 font-bold font-mono text-xs shadow-lg transition-all
                                ${popup.type === 'error' ? '!bg-red-600 !border-red-600 !text-white hover:!bg-red-500' : 
                                  popup.type === 'success' ? '!bg-emerald-600 !border-emerald-600 !text-white hover:!bg-emerald-500' :
                                  'bg-blue-600 !border-blue-600 !text-white hover:!bg-blue-500'}
                            `}
                        >
                            ACKNOWLEDGE
                        </CyberButton>
                    )}
                </div>
              </div>

              {/* Close Icon (Top Right) */}
              <button onClick={closePopup} className="absolute top-3 right-3 text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300 z-30">
                <X size={18}/>
              </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalPopup;