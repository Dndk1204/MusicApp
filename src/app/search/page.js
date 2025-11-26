import getSongsByTitle from "@/app/actions/getSongsByTitle";
import SearchContent from "@/components/SearchContent"; 
import { Search, Disc } from "lucide-react";

export const revalidate = 0;

// Thay đổi ở dòng này: thêm async và await searchParams
const SearchPage = async ({ searchParams }) => {
  
  // --- FIX LỖI NEXT.JS 15 Ở ĐÂY ---
  // Phải await searchParams trước khi sử dụng
  const params = await searchParams; 
  
  const songs = await getSongsByTitle(params.title);

  return (
    <div className="bg-transparent h-full w-full overflow-hidden overflow-y-auto p-6 pb-[120px]">
      
      {/* HEADER SEARCH PAGE */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-800 dark:text-white tracking-tighter flex items-center gap-3">
            <Search className="text-emerald-500" size={40} />
            SEARCH_RESULTS
        </h1>
        <div className="flex items-center gap-2 text-sm font-mono text-neutral-500 dark:text-neutral-400">
            <span className="text-emerald-500">:: QUERY</span>
            <span className="bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded text-neutral-800 dark:text-white border border-neutral-300 dark:border-white/5">
                {/* Sửa searchParams.title thành params.title */}
                {params.title || "ALL"} 
            </span>
            <span className="text-emerald-500">:: FOUND</span>
            <span>[{songs.length}]</span>
        </div>
      </div>
      
      {/* CONTENT */}
      {songs.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 opacity-50 font-mono gap-4 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <Disc size={60} className="text-neutral-400 animate-spin-slow"/>
                <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-black"/>
            </div>
            <p className="text-lg tracking-widest">[NO_DATA_MATCHED]</p>
            <p className="text-xs">Try searching for "Rock", "Pop", or specific artists.</p>
         </div>
      ) : (
         <SearchContent songs={songs} />
      )}

    </div>
  );
};

export default SearchPage;