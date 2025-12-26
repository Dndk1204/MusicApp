// components/SkeletonSection.jsx
const SkeletonItem = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    {/* Ảnh Square */}
    <div className="aspect-square w-full bg-neutral-300 dark:bg-neutral-800 border border-neutral-400/20" />
    {/* Text Lines */}
    <div className="space-y-2">
      <div className="h-4 w-3/4 bg-neutral-300 dark:bg-neutral-800" />
      <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-900" />
    </div>
  </div>
);

const SkeletonSection = () => {
  return (
    <div className="mb-8 md:mb-10">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-800" />
          <div className="h-5 w-32 bg-neutral-300 dark:bg-neutral-800" />
        </div>
      </div>
      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`${i > 1 ? 'hidden sm:block' : ''} ${i > 2 ? 'md:block' : ''}`}>
            <SkeletonItem />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonSection;