import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import { Disc } from "lucide-react";
import { GlitchText } from "@/components/CyberComponents";

export const revalidate = 0; 

export default async function Home() {
  
  // 1. Fetch Dữ liệu bài hát từ Server
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs, 
    indieSongs
  ] = await Promise.all([
    getSongs({ boost: 'popularity_month', limit: 10 }), 
    getSongs({ boost: 'buzzrate', limit: 15 }),        
    getSongs({ tag: 'pop', limit: 15 }),
    getSongs({ tag: 'electronic', limit: 15 }),
    getSongs({ tag: 'rock', limit: 15 }),
    getSongs({ tag: 'indie', limit: 15 }),
  ]);

  const mostHeardSongs = mostHeard.songs || [];
  const discoverySongs = discoveries.songs || [];
  const popTracks = popSongs.songs || [];
  const electronicTracks = electronicSongs.songs || [];
  const rockTracks = rockSongs.songs || [];
  const indieTracks = indieSongs.songs || [];

  // --- 2. MOCKUP DATA: POPULAR ARTISTS ---
  // (Sau này bạn có thể thay thế bằng API fetch từ bảng 'artists')
  const popularArtists = [
    {
      id: 'mock_art_1',
      name: "The Weeknd",
      followers: "84.2M",
      total_plays: "2.1B",
      image_url: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=800&auto=format&fit=crop&q=60" 
    },
    {
      id: 'mock_art_2',
      name: "Sơn Tùng M-TP",
      followers: "14.5M",
      total_plays: "890M",
      image_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 'mock_art_3',
      name: "Daft Punk",
      followers: "22.1M",
      total_plays: "1.5B",
      image_url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 'mock_art_4',
      name: "Taylor Swift",
      followers: "95.4M",
      total_plays: "3.2B",
      image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 'mock_art_5',
      name: "Imagine Dragons",
      followers: "40.2M",
      total_plays: "1.8B",
      image_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&auto=format&fit=crop&q=60"
    }
  ];

  return (
    /* Giảm padding từ p-6 -> p-4 để rộng chỗ hơn */
    <div className="h-full w-full p-4 pb-[100px] overflow-y-auto scroll-smooth">
      
      {/* 1. HERO: Truyền thêm prop artists */}
      <TrendingHero songs={mostHeardSongs} artists={popularArtists} />

      {/* 2. CÁC SECTION KHÁC */}
      <div className="mt-8"> {/* Giảm mt-12 -> mt-8 */}
        <div className="mb-6 flex flex-col gap-1"> {/* Giảm mb-8 -> mb-6 */}
             
            <div className="flex items-center gap-2"> {/* Gap 3 -> 2 */}
                <Disc className="text-emerald-500 animate-spin-slow" size={24}/> {/* Size 32 -> 24 */}
                {/* Text 3xl -> 2xl */}
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter font-mono text-neutral-900 dark:text-white">
                    <GlitchText text="MUSIC_DASHBOARD" />
                </h1>
            </div>
            
            <p className="text-neutral-500 dark:text-neutral-400 text-[10px] tracking-[0.3em] font-mono pl-8">
               :: EXPLORE_THE_SOUND ::
            </p>
        </div>

        <div className="flex flex-col gap-y-6"> {/* Thêm wrapper để kiểm soát khoảng cách giữa các section */}
            <SongSection 
                title="Discoveries" 
                songs={discoverySongs} 
                moreLink="/search" 
            />
            
            <SongSection 
                title="Pop Hits" 
                songs={popTracks} 
                moreLink="/search?tag=pop" 
            />
            
            <SongSection 
                title="Electronic Vibes" 
                songs={electronicTracks} 
                moreLink="/search?tag=electronic" 
            />
            
            <SongSection 
                title="Rock Anthems" 
                songs={rockTracks} 
                moreLink="/search?tag=rock" 
            />

            <SongSection 
                title="Indie Corner" 
                songs={indieTracks} 
                moreLink="/search?tag=indie" 
            />
        </div>
      </div>

      <div className="mt-8 py-6 border-t border-neutral-200 dark:border-white/5 text-center">
         <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600">
            Powered by Jamendo API • Music OS v2.0
         </p>
      </div>

    </div>
  );
}