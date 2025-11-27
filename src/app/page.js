import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import { Disc } from "lucide-react";

export const revalidate = 0; // Không cache để luôn có nhạc mới (hoặc đặt 3600 nếu muốn cache 1 tiếng)

export default async function Home() {
  
  // --- GỌI API SONG SONG (Parallel Data Fetching) ---
  // Chúng ta gọi nhiều hàm getSongs cùng lúc với các tham số khác nhau
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs,
    indieSongs
  ] = await Promise.all([
    // 1. Most Heard (Nhiều người nghe nhất tháng)
    getSongs({ boost: 'popularity_month', limit: 8 }), 
    
    // 2. Discoveries (Nhạc đang nổi - Buzz Rate)
    getSongs({ boost: 'buzzrate', limit: 8 }),         
    
    // 3. Các thể loại cụ thể
    getSongs({ tag: 'pop', limit: 8 }),
    getSongs({ tag: 'electronic', limit: 8 }),
    getSongs({ tag: 'rock', limit: 8 }),
    getSongs({ tag: 'indie', limit: 8 }),
  ]);

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto scroll-smooth">
      
      {/* Banner / Header */}
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter drop-shadow-md font-mono text-neutral-900 dark:text-white flex items-center gap-3">
          <Disc className="text-emerald-500 animate-spin-slow" size={32}/>
          MUSIC_DASHBOARD
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs tracking-[0.3em] font-mono pl-11">
          :: EXPLORE_THE_SOUND ::
        </p>
      </div>

      {/* --- CÁC DANH MỤC (SECTIONS) --- */}
      
      <SongSection title="Most Heard Songs" songs={mostHeard} />
      
      <SongSection title="Discoveries" songs={discoveries} />
      
      <SongSection title="Pop Hits" songs={popSongs} />
      
      <SongSection title="Electronic Vibes" songs={electronicSongs} />
      
      <SongSection title="Rock Anthems" songs={rockSongs} />

      <SongSection title="Indie Corner" songs={indieSongs} />

      {/* Footer trang trí */}
      <div className="mt-10 py-10 border-t border-neutral-200 dark:border-white/5 text-center">
         <p className="text-xs font-mono text-neutral-400 dark:text-neutral-600">
            Powered by Jamendo API • Music OS v2.0
         </p>
      </div>

    </div>
  );
}