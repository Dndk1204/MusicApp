import getSongs from "@/app/actions/getSongs";
import PageContent from "@/components/PageContent";

export const revalidate = 0;

export default async function Home() {
  const songs = await getSongs();

  return (
    // Thêm padding bottom để không bị Player che
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto">
      
      {/* Banner chào mừng */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tighter font-mono transition-colors duration-300
            text-neutral-900 dark:text-white 
            drop-shadow-sm dark:drop-shadow-lg">
          HELLO_USER
        </h1>
        <p className="text-xs tracking-widest mt-1 font-mono transition-colors duration-300
            text-neutral-500 dark:text-neutral-400">
          :: READY_TO_PLAY ::
        </p>
      </div>

      {/* List nhạc */}
      <div className="mt-4 mb-7">
        <div className="flex justify-between items-center pb-4 mb-4 transition-colors duration-300
            border-b border-neutral-300 dark:border-white/10">
          <h1 className="text-lg font-bold flex items-center gap-2 font-mono transition-colors duration-300
              text-neutral-900 dark:text-white">
            <span className="text-emerald-600 dark:text-emerald-500">#</span> NEW_RELEASE
          </h1>
        </div>
        
        <PageContent songs={songs} />
      </div>
    </div>
  );
}