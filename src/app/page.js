import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import { Disc, Globe, Sparkles, Zap, Radio, Headphones } from "lucide-react"; 
import { VerticalGlitchText } from "@/components/CyberComponents";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const revalidate = 0; 

// --- HELPER: Format số ---
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// --- LOGIC 1: Lấy Top Artists ---
const getTopArtists = async () => {
  const cookieStore = await cookies();
  
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  });

  try {
    const { data: follows } = await supabase.from('following_artists').select('artist_name, artist_image');
    const { data: searches } = await supabase.from('artist_search_counts').select('artist_name, search_count');

    const stats = {};

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

    if (searches) {
      searches.forEach(item => {
        const key = item.artist_name.trim();
        if (!stats[key]) {
            stats[key] = { name: item.artist_name, image: null, followers: 0, searches: 0 };
        }
        stats[key].searches += item.search_count;
      });
    }

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

// --- LOGIC 2: Lấy nhạc cộng đồng ---
const getCommunityUploads = async () => {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    try {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .not('user_id', 'is', null) 
            .eq('is_public', true)      
            .order('created_at', { ascending: false }) 
            .limit(11);

        let songsData = data;

        if (error) {
            console.error("Error checking is_public:", error);
            const { data: data2, error: error2 } = await supabase
                .from('songs')
                .select('*')
                .not('user_id', 'is', null)
                .eq('public', true)
                .order('created_at', { ascending: false })
                .limit(11);

            if (error2) {
                console.error("Error checking public:", error2);
                throw error2;
            }
            songsData = data2;
        }

        const processedSongs = (songsData || []).map(song => ({
            ...song,
            image_path: song.image_url || song.image_path || null
        }));

        return processedSongs;
    } catch (error) {
        console.error("Lỗi lấy nhạc cộng đồng:", error.message || error);
        return [];
    }
};

export default async function Home() {
  
  const [
    mostHeard, 
    discoveries, 
    popSongs, 
    electronicSongs, 
    rockSongs, 
    indieSongs,
    popularArtists,
    communityUploads 
  ] = await Promise.all([
    getSongs({ boost: 'popularity_month', limit: 10 }), 
    getSongs({ boost: 'buzzrate', limit: 11 }),        
    getSongs({ tag: 'pop', limit: 11 }),
    getSongs({ tag: 'electronic', limit: 11 }),
    getSongs({ tag: 'rock', limit: 11 }),
    getSongs({ tag: 'indie', limit: 11 }),
    getTopArtists(), 
    getCommunityUploads() 
  ]);

  const mostHeardSongs = mostHeard.songs || [];
  const discoverySongs = discoveries.songs || [];
  const popTracks = popSongs.songs || [];
  const electronicTracks = electronicSongs.songs || [];
  const rockTracks = rockSongs.songs || [];
  const indieTracks = indieSongs.songs || [];
  const communityTracks = communityUploads || []; 

  return (
    <div className="h-full w-full p-3 md:p-6 pb-[120px] overflow-y-auto scroll-smooth bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* 1. HERO */}
      <TrendingHero songs={mostHeardSongs} artists={popularArtists} />

      {/* 2. CÁC SECTION KHÁC */}
      <div className="mt-6 md:mt-8 px-1 md:px-2">
        
        {/* Main Title */}
        <div className="mb-6 md:mb-10 flex flex-col gap-1 border-l-4 border-emerald-500 pl-3 md:pl-4 py-2">
            <div className="flex items-center gap-2 md:gap-3">
                <Disc className="text-emerald-500 animate-[spin_10s_linear_infinite]" size={24} /> {/* Resize icon for mobile */}
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter font-mono text-neutral-900 dark:text-white uppercase">
                    <VerticalGlitchText text="MUSIC_DASHBOARD" />
                </h1>
            </div>
            
            <p className="text-neutral-500 dark:text-neutral-400 text-[9px] md:text-[10px] tracking-[0.4em] font-mono uppercase">
               :: EXPLORE_THE_SOUND_MATRIX ::
            </p>
        </div>

        <div className="flex flex-col gap-y-6 md:gap-y-10"> {/* Reduced gap on mobile */}
            
            {/* --- SECTION MỚI: COMMUNITY UPLOADS --- */}
            {communityTracks.length > 0 && (
                <SongSection 
                    title={
                        <span className="flex items-center gap-2 text-sm md:text-base">
                            <Globe size={16} className="text-blue-500 md:w-[18px] md:h-[18px]"/> Community Vibes
                        </span>
                    }
                    songs={communityTracks} 
                    moreLink="/search?type=user_uploads"
                />
            )}
            
            <SongSection 
                title={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                        <Sparkles size={16} className="text-yellow-500 md:w-[18px] md:h-[18px]"/> Discoveries
                    </span>
                }
                songs={discoverySongs} 
                moreLink="/search" 
            />
            
            <SongSection 
                title={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                         <Radio size={16} className="text-pink-500 md:w-[18px] md:h-[18px]"/> Pop Hits
                    </span>
                }
                songs={popTracks} 
                moreLink="/search?tag=pop" 
            />
            
            <SongSection 
                title={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                        <Zap size={16} className="text-purple-500 md:w-[18px] md:h-[18px]"/> Electronic Vibes
                    </span>
                }
                songs={electronicTracks} 
                moreLink="/search?tag=electronic" 
            />
            
            <SongSection 
                title={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                        <Disc size={16} className="text-red-500 md:w-[18px] md:h-[18px]"/> Rock Anthems
                    </span>
                }
                songs={rockTracks} 
                moreLink="/search?tag=rock" 
            />

            <SongSection 
                title={
                    <span className="flex items-center gap-2 text-sm md:text-base">
                        <Headphones size={16} className="text-orange-500 md:w-[18px] md:h-[18px]"/> Indie Corner
                    </span>
                }
                songs={indieTracks} 
                moreLink="/search?tag=indie" 
            />
        </div>
      </div>

      <div className="mt-8 md:mt-12 py-6 md:py-8 border-t border-neutral-300 dark:border-white/10 text-center bg-neutral-200/50 dark:bg-white/5 rounded-none mx-0 md:mx-2 mb-4">
         <p className="text-[9px] md:text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
            System Online • Powered by Jamendo API • V O I D
         </p>
      </div>

    </div>
  );
}