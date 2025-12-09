// app/(site)/loading.js

export default function Loading() {
  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
      
      {/* 1. HERO SKELETON */}
      <div className="relative w-full h-[350px] md:h-[380px] rounded-none bg-neutral-300 dark:bg-neutral-800 mb-8 border-2 border-neutral-400 dark:border-white/20">
         {/* Decor Lines */}
         <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
         <div className="absolute bottom-4 left-4 h-8 w-1/3 bg-neutral-400 dark:bg-white/10 rounded-none"></div>
      </div>

      {/* 2. CONTENT SKELETON */}
      <div className="mt-8">
         
         {/* Page Title Section */}
         <div className="mb-8 flex flex-col gap-2 border-l-4 border-neutral-300 dark:border-white/10 pl-4">
             <div className="h-10 w-64 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
             <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
         </div>

         {/* Song Sections */}
         <div className="flex flex-col gap-y-12">
            {[1, 2, 3].map((section) => (
                <div key={section} className="w-full">
                    {/* Section Title */}
                    <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
                         <div className="h-6 w-40 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                         <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
                    </div>
                    
                    {/* Grid Items (CyberCard Imitation) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <div key={item} className="flex flex-col gap-0 p-0 bg-white dark:bg-neutral-900/40 border border-neutral-300 dark:border-white/10 rounded-none h-full">
                                {/* Image Placeholder */}
                                <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-800 rounded-none border-b border-neutral-300 dark:border-white/10"></div>
                                
                                {/* Text Placeholder */}
                                <div className="p-3 flex flex-col gap-2">
                                    <div className="h-4 w-3/4 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                                    <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}