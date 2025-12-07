"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from "lucide-react";
import useUI from "@/hooks/useUI";

const GlobalPopup = () => {
  const { popup, closePopup, confirmAction } = useUI();

  const getTypeStyles = () => {
    switch (popup.type) {
      case 'error':
        return { 
            icon: <AlertTriangle size={24} />, 
            color: 'text-red-600 dark:text-red-500', 
            border: 'border-red-200 dark:border-red-500/50', 
            bgIcon: 'bg-red-100 dark:bg-red-500/10',
            bgDecor: 'bg-red-500'
        };
      case 'success':
        return { 
            icon: <CheckCircle size={24} />, 
            color: 'text-emerald-600 dark:text-emerald-500', 
            border: 'border-emerald-200 dark:border-emerald-500/50', 
            bgIcon: 'bg-emerald-100 dark:bg-emerald-500/10',
            bgDecor: 'bg-emerald-500'
        };
      case 'confirm':
        return { 
            icon: <HelpCircle size={24} />, 
            color: 'text-yellow-600 dark:text-yellow-500', 
            border: 'border-yellow-200 dark:border-yellow-500/50', 
            bgIcon: 'bg-yellow-100 dark:bg-yellow-500/10',
            bgDecor: 'bg-yellow-500'
        };
      default:
        return { 
            icon: <Info size={24} />, 
            color: 'text-blue-600 dark:text-blue-500', 
            border: 'border-blue-200 dark:border-blue-500/50', 
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
            className="absolute inset-0 bg-black/60 dark:bg-neutral-900/80 backdrop-blur-sm"
          />

          {/* Popup Content Compact - SQUARE CORNERS */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`
                relative w-full max-w-sm p-5 shadow-2xl
                bg-white border rounded-none /* Vuông góc */
                dark:bg-neutral-900/95 
                ${styles.border}
                backdrop-blur-xl overflow-hidden
            `}
          >
             {/* Decor Line */}
             <div className={`absolute top-0 left-0 w-full h-1 ${styles.bgDecor} animate-pulse`}></div>

             <div className="flex gap-3">
                {/* Icon Box: Square */}
                <div className={`p-2 h-fit rounded-none ${styles.bgIcon} ${styles.color}`}>
                    {styles.icon}
                </div>

                <div className="flex-1">
                    {/* Title */}
                    <h3 className={`text-base font-bold font-mono tracking-wide mb-1 ${styles.color}`}>
                        {popup.title || "SYSTEM_MESSAGE"}
                    </h3>
                    
                    {/* Message */}
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono leading-relaxed mb-4">
                        {popup.message}
                    </p>

                    {/* Actions Buttons: Square */}
                    <div className="flex justify-end gap-2">
                        {popup.type === 'confirm' ? (
                            <>
                                <button 
                                    onClick={closePopup}
                                    className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 font-mono text-[10px] hover:bg-neutral-100 dark:hover:bg-white/10 transition rounded-none"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    onClick={confirmAction}
                                    className="px-4 py-1.5 bg-yellow-500 text-black font-bold font-mono text-[10px] hover:bg-yellow-400 transition shadow-lg hover:shadow-yellow-500/20 rounded-none"
                                >
                                    CONFIRM
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={closePopup}
                                className={`px-4 py-1.5 font-bold font-mono text-[10px] text-white dark:text-black transition shadow-lg rounded-none ${
                                    popup.type === 'error' ? 'bg-red-600 dark:bg-red-500 hover:bg-red-500 dark:hover:bg-red-400' : 
                                    popup.type === 'success' ? 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400' :
                                    'bg-blue-600 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400'
                                }`}
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
             </div>

             {/* Close Icon */}
             <button onClick={closePopup} className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition">
                <X size={14}/>
             </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalPopup;