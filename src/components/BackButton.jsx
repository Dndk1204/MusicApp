"use client"; // <--- Bắt buộc phải có dòng này

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  const router = useRouter();

  return (
    <button 
        onClick={() => router.back()} 
        className="
            relative z-20 group flex items-center gap-2 px-3 py-3 
            backdrop-blur-md bg-neutral-100 dark:bg-white/5
            border border-neutral-300 dark:border-white/10 
            hover:border-emerald-500 dark:hover:border-emerald-500
            text-neutral-600 dark:text-neutral-400
            hover:!text-white hover:!bg-emerald-500
            transition-all duration-300 rounded-none
            uppercase text-[10px] font-bold tracking-[0.2em] font-mono
        "
        title="Go Back"
    >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
    </button>
  );
};

export default BackButton;