// app/(site)/loading.js

export default function Loading() {
  return (
    <div className="h-full w-full p-3 md:p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* 1. HERO SKELETON - Khớp với TrendingHero */}
      <div className="relative w-full h-[350px] md:h-[450px] bg-neutral-200 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-white/10 animate-pulse">
        <div className="absolute bottom-10 left-10 space-y-4 w-full">
          <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-800" />
          <div className="h-12 w-2/3 md:w-1/2 bg-neutral-300 dark:bg-neutral-800" />
          <div className="h-6 w-1/3 bg-neutral-300 dark:bg-neutral-800" />
        </div>
      </div>

      {/* 2. PAGE TITLE SKELETON */}
      <div className="mt-8 mb-10 flex flex-col gap-1 border-l-4 border-neutral-300 dark:border-neutral-800 pl-4 animate-pulse">
        <div className="h-10 w-64 bg-neutral-300 dark:bg-neutral-900 mb-2" />
        <div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-900/50" />
      </div>

      {/* 3. SECTIONS SKELETON */}
      <div className="flex flex-col gap-y-12">
        {[1, 2].map((section) => (
          <div key={section} className="w-full animate-pulse">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500/20" />
                <div className="h-6 w-40 bg-neutral-300 dark:bg-neutral-900" />
              </div>
              <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-900" />
            </div>
            
            {/* GRID HỆ THỐNG: Phải khớp 100% với SongSection.jsx */}
            <div className="
              grid 
              grid-cols-2 
              sm:grid-cols-3 
              md:grid-cols-4 
              lg:grid-cols-5 
              xl:grid-cols-6 
              2xl:grid-cols-8 
              gap-3 md:gap-4
            ">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div 
                  key={item} 
                  className={`
                    flex flex-col gap-0 bg-white dark:bg-neutral-900/40 border border-neutral-300 dark:border-white/5
                    ${item > 2 ? "hidden sm:block" : ""}
                    ${item > 3 ? "sm:hidden md:block" : ""}
                    ${item > 4 ? "md:hidden lg:block" : ""}
                    ${item > 5 ? "lg:hidden xl:block" : ""}
                    ${item > 6 ? "xl:hidden 2xl:block" : ""}
                  `}
                >
                  {/* Image Aspect Square */}
                  <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-800" />
                  
                  {/* Info lines */}
                  <div className="p-3 space-y-3">
                    <div className="h-3 w-full bg-neutral-300 dark:bg-neutral-800" />
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                      <div className="h-2 w-16 bg-neutral-200 dark:bg-neutral-900" />
                      <div className="h-2 w-8 bg-neutral-200 dark:bg-neutral-900" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}