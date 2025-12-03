import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import { Disc } from "lucide-react";
import { GlitchText } from "@/components/CyberComponents";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const revalidate = 0; 

// --- HELPER: Format số (VD: 1500 -> 1.5K) ---
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// --- LOGIC: Lấy Top Artists (Đã sửa lỗi Next.js 15) ---
const getTopArtists = async () => {
  // SỬA LỖI: Await cookies() trước khi dùng
  const cookieStore = await cookies();
  
  // Truyền vào dạng function trả về cookieStore đã await
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  });

  try {
    // 1. Lấy dữ liệu Follow (Tính Followers)
    const { data: follows } = await supabase
      .from('following_artists')
      .select('artist_name, artist_image');

    // 2. Lấy dữ liệu Search (Tính Popularity/Plays)
    const { data: searches } = await supabase
      .from('artist_search_counts')
      .select('artist_name, search_count');

    // 3. Tổng hợp dữ liệu (Aggregation)
    const stats = {};

    // Đếm Followers
    if (follows) {
      follows.forEach(item => {
        const key = item.artist_name.trim(); 
        if (!stats[key]) {
            stats[key] = { name: item.artist_name, image: item.artist_image, followers: 0, searches: 0 };
        }
        stats[key].followers += 1;
        if (!stats[key].image && item.artist_image) stats[key].image = item.artist_image;
      });
    }

    // Đếm Searches
    if (searches) {
      searches.forEach(item => {
        const key = item.artist_name.trim();
        if (!stats[key]) {
            stats[key] = { name: item.artist_name, image: null, followers: 0, searches: 0 };
        }
        stats[key].searches += item.search_count;
      });
    }

    // 4. Sắp xếp & Format (Top 5 Followed)
    const topArtists = Object.values(stats)
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 5)
      .map((artist, index) => ({
        id: `artist_${index}`,
        name: artist.name,
        followers: formatNumber(artist.followers), 
        total_plays: formatNumber((artist.searches * 150) + (artist.followers * 50)), 
        image_url: artist.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60"
      }));

    return topArtists;

  } catch (error) {
    console.error("Error fetching top artists:", error);
    return [];
  }
};

export default async function Home() {
  
  // 1. Fetch Dữ liệu bài hát & Nghệ sĩ song song
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs, 
    indieSongs,
    popularArtists 
  ] = await Promise.all([
    getSongs({ boost: 'popularity_month', limit: 10 }), 
    getSongs({ boost: 'buzzrate', limit: 15 }),        
    getSongs({ tag: 'pop', limit: 15 }),
    getSongs({ tag: 'electronic', limit: 15 }),
    getSongs({ tag: 'rock', limit: 15 }),
    getSongs({ tag: 'indie', limit: 15 }),
    getTopArtists() // Gọi hàm đã sửa
  ]);

  const mostHeardSongs = mostHeard.songs || [];
  const discoverySongs = discoveries.songs || [];
  const popTracks = popSongs.songs || [];
  const electronicTracks = electronicSongs.songs || [];
  const rockTracks = rockSongs.songs || [];
  const indieTracks = indieSongs.songs || [];

  return (
    <div className="h-full w-full p-4 pb-[100px] overflow-y-auto scroll-smooth">
      
      {/* 1. HERO */}
      <TrendingHero songs={mostHeardSongs} artists={popularArtists} />

      {/* 2. CÁC SECTION KHÁC */}
      <div className="mt-8">
        <div className="mb-6 flex flex-col gap-1">
             
            <div className="flex items-center gap-2">
                <Disc className="text-emerald-500 animate-spin-slow" size={24}/>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter font-mono text-neutral-900 dark:text-white">
                    <GlitchText text="MUSIC_DASHBOARD" />
                </h1>
            </div>
            
            <p className="text-neutral-500 dark:text-neutral-400 text-[10px] tracking-[0.3em] font-mono pl-8">
               :: EXPLORE_THE_SOUND ::
            </p>
        </div>

        <div className="flex flex-col gap-y-6"> 
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
            Powered by Jamendo API • V O I D
         </p>
      </div>

    </div>
  );
}