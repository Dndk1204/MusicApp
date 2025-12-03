// app/(site)/loading.js

export default function Loading() {
  return (
    <div className="h-full w-full p-4 pb-[100px] overflow-y-auto bg-neutral-100 dark:bg-black animate-pulse transition-colors duration-500">
      
      {/* 1. HERO SKELETON */}
      <div className="relative w-full h-[280px] md:h-[320px] rounded-2xl bg-neutral-300 dark:bg-neutral-800 mb-8"></div>

      {/* 2. CONTENT SKELETON */}
      <div className="mt-8">
         
         {/* Title Section */}
         <div className="mb-6 flex flex-col gap-2">
             <div className="h-8 w-64 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
             <div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-900 rounded ml-8"></div>
         </div>

         {/* Song Sections */}
         <div className="flex flex-col gap-y-8">
            {[1, 2, 3].map((section) => (
                <div key={section} className="w-full">
                    {/* Section Title */}
                    <div className="h-6 w-40 bg-neutral-300 dark:bg-neutral-800 rounded mb-4"></div>
                    
                    {/* Grid Items */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="flex flex-col gap-2">
                                <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-900 rounded-xl"></div>
                                <div className="h-4 w-3/4 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
                                <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-900 rounded"></div>
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