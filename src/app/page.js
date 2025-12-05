import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import { Disc, UploadCloud, Globe } from "lucide-react"; // Import đủ icon từ Page 1
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

// --- LOGIC 1: Lấy Top Artists (Dùng bản chuẩn của Page 2) ---
const getTopArtists = async () => {
  // SỬA LỖI: Await cookies() trước khi dùng (Fix Next.js 15)
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

// --- LOGIC 2: Lấy nhạc cộng đồng (Lấy từ Page 1) ---
const getCommunityUploads = async () => {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    try {
        // Kiểm tra field name có thể là is_public thay vì public
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .not('user_id', 'is', null) // Lọc những bài có người đăng (không phải null)
            .eq('is_public', true)      // Thử lại với is_public
            .order('created_at', { ascending: false }) // Mới nhất lên đầu
            .limit(15);

        let songsData = data;

        if (error) {
            console.error("Error checking is_public:", error);
            // Nếu lỗi, thử với field public (fallback)
            const { data: data2, error: error2 } = await supabase
                .from('songs')
                .select('*')
                .not('user_id', 'is', null)
                .eq('public', true)
                .order('created_at', { ascending: false })
                .limit(15);

            if (error2) {
                console.error("Error checking public:", error2);
                throw error2;
            }
            songsData = data2;
        }

        // Ensure each song has an image_path, set to null if missing to trigger fallback
        const processedSongs = (songsData || []).map(song => ({
            ...song,
            image_path: song.image_path || null
        }));

        return processedSongs;
    } catch (error) {
        console.error("Lỗi lấy nhạc cộng đồng:", error.message || error);
        return [];
    }
};

export default async function Home() {
  
  // 1. Fetch Dữ liệu bài hát, Nghệ sĩ & Nhạc cộng đồng song song
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs, 
    indieSongs,
    popularArtists,
    communityUploads // <--- Dữ liệu mới từ Page 1
  ] = await Promise.all([
    getSongs({ boost: 'popularity_month', limit: 10 }), 
    getSongs({ boost: 'buzzrate', limit: 15 }),        
    getSongs({ tag: 'pop', limit: 15 }),
    getSongs({ tag: 'electronic', limit: 15 }),
    getSongs({ tag: 'rock', limit: 15 }),
    getSongs({ tag: 'indie', limit: 15 }),
    getTopArtists(), // Gọi hàm fix của Page 2
    getCommunityUploads() // Gọi hàm mới của Page 1
  ]);

  const mostHeardSongs = mostHeard.songs || [];
  const discoverySongs = discoveries.songs || [];
  const popTracks = popSongs.songs || [];
  const electronicTracks = electronicSongs.songs || [];
  const rockTracks = rockSongs.songs || [];
  const indieTracks = indieSongs.songs || [];
  const communityTracks = communityUploads || []; // Dữ liệu cộng đồng

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
            
            {/* --- SECTION MỚI: COMMUNITY UPLOADS (Từ Page 1) --- */}
            {communityTracks.length > 0 && (
                <SongSection 
                    title={
                        <span className="flex items-center gap-2">
                            <Globe size={20} className="text-blue-500"/> Community Vibes
                        </span>
                    }
                    songs={communityTracks} 
                    moreLink="/search?type=user_uploads"
                />
            )}
            {/* -------------------------------------------------- */}

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
