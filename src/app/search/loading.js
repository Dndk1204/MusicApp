import { Search, Filter } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col w-full h-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-neutral-900 animate-pulse transition-colors duration-500">
      
      {/* 1. HEADER SKELETON */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded bg-neutral-300 dark:bg-neutral-800"></div>
           <div className="h-10 w-64 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
        </div>
        {/* Status Bar */}
        <div className="flex gap-2">
            <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
        </div>
      </div>

      {/* 2. FILTER TAGS SKELETON */}
      <div className="mb-8 p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-neutral-200 dark:border-white/5 backdrop-blur-md">
         <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
            <div className="h-3 w-32 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
         </div>
         <div className="flex flex-wrap gap-2">
            {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-9 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg border border-transparent"></div>
            ))}
         </div>
      </div>

      {/* 3. ARTIST GRID SKELETON (Giả lập loading artist) */}
      <div className="mb-10">
          <div className="h-6 w-48 bg-neutral-300 dark:bg-neutral-800 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 h-24">
                    <div className="w-16 h-16 rounded-full bg-neutral-300 dark:bg-neutral-800 shrink-0"></div>
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 w-3/4 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
                        <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-900 rounded"></div>
                    </div>
                 </div>
             ))}
          </div>
      </div>

      {/* 4. SONGS LIST SKELETON */}
      <div className="bg-white/60 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden">
         <div className="h-10 bg-neutral-200 dark:bg-white/5 border-b border-neutral-200 dark:border-white/5 w-full"></div>
         <div className="flex flex-col">
             {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="flex items-center p-3 gap-4 border-b border-neutral-200 dark:border-white/5 last:border-0">
                    {/* Image */}
                    <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-800 rounded-md shrink-0"></div>
                    
                    {/* Text Info */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="h-4 w-48 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
                        <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-900 rounded"></div>
                    </div>

                    {/* Stats/Duration */}
                    <div className="hidden md:block h-4 w-10 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
                    
                    {/* Action Button */}
                    <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-full ml-auto"></div>
                 </div>
             ))}
         </div>
      </div>

    </div>
  );
}