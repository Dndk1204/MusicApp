import { Suspense } from "react";
import getSongs from "@/app/actions/getSongs";
import SongSection from "@/components/SongSection";
import TrendingHero from "@/components/TrendingHero"; 
import AsyncSongSection from "@/components/AsyncSongSection";
import SkeletonSection from "@/components/SkeletonSection";
import { Disc, Globe, Sparkles, Zap, Radio, Headphones } from "lucide-react"; 
import { VerticalGlitchText } from "@/components/CyberComponents";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const revalidate = 3600; // Cache 1 giờ để load cực nhanh

// --- LOGIC HELPER (Giữ nguyên của bạn) ---
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const getTopArtists = async () => {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  try {
    const { data: follows } = await supabase.from('following_artists').select('artist_name, artist_image');
    const { data: searches } = await supabase.from('artist_search_counts').select('artist_name, search_count');
    const stats = {};
    if (follows) {
      follows.forEach(item => {
        const key = item.artist_name.trim(); 
        if (!stats[key]) stats[key] = { name: item.artist_name, image: item.artist_image, followers: 0, searches: 0 };
        stats[key].followers += 1;
        if (!stats[key].image && item.artist_image) stats[key].image = item.artist_image;
      });
    }
    if (searches) {
      searches.forEach(item => {
        const key = item.artist_name.trim();
        if (!stats[key]) stats[key] = { name: item.artist_name, image: null, followers: 0, searches: 0 };
        stats[key].searches += item.search_count;
      });
    }
    return Object.values(stats).sort((a, b) => b.followers - a.followers).slice(0, 5).map((artist, index) => ({
      id: `artist_${index}`, name: artist.name, followers: formatNumber(artist.followers), 
      total_plays: formatNumber((artist.searches * 150) + (artist.followers * 50)), 
      image_url: artist.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60"
    }));
  } catch (error) { return []; }
};

// Component con để load nhạc cộng đồng từ Supabase độc lập
async function CommunitySection() {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data } = await supabase.from('songs').select('*').not('user_id', 'is', null).eq('is_public', true).not('is_denied', 'is', true).order('created_at', { ascending: false }).limit(20);
    if (!data || data.length === 0) return null;
    return (
        <SongSection 
            title={<span className="flex items-center gap-2"><Globe size={18} className="text-blue-500"/> Community Vibes</span>}
            songs={data.map(s => ({...s, image_path: s.image_url || s.image_path}))} 
            moreLink="/search?type=user_uploads"
        />
    );
}

export default async function Home() {
  // Chỉ fetch Hero và Artists chính - Đây là những thứ sẽ hiện ngay lập tức
  const mostHeard = await getSongs({ boost: 'popularity_month', limit: 10 });
  const popularArtists = await getTopArtists();

  return (
    <div className="h-full w-full p-3 md:p-6 pb-[120px] overflow-y-auto scroll-smooth bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* 1. HERO - Sẽ render ngay vì chỉ đợi 1-2 request nhẹ */}
      <TrendingHero songs={mostHeard.songs || []} artists={popularArtists} />

      <div className="mt-6 md:mt-8 px-1 md:px-2">
        {/* Main Title */}
        <div className="mb-6 md:mb-10 flex flex-col gap-1 border-l-4 border-emerald-500 pl-3 md:pl-4 py-2">
            <div className="flex items-center gap-2 md:gap-3">
                <Disc className="text-emerald-500 animate-[spin_10s_linear_infinite]" size={24} />
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter font-mono text-neutral-900 dark:text-white uppercase">
                    <VerticalGlitchText text="MUSIC_DASHBOARD" />
                </h1>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-[9px] md:text-[10px] tracking-[0.4em] font-mono uppercase">
                :: SYSTEM_READY ::
            </p>
        </div>

        <div className="flex flex-col gap-y-6 md:gap-y-10">
            {/* 2. CÁC SECTION LOAD ĐỘC LẬP QUA SUSPENSE */}
            {/* Trang web sẽ không bị "treo", cái nào xong trước hiện trước */}

            <Suspense fallback={<SkeletonSection />}>
                <CommunitySection />
            </Suspense>
            
            <Suspense fallback={<SkeletonSection />}>
              <AsyncSongSection 
                title="Discoveries" 
                query={{ boost: 'buzzrate', limit: 25 }} 
                icon={Sparkles} 
                iconColor="text-yellow-500"
                moreLink="/search"
              />
            </Suspense>
            
            <Suspense fallback={<SkeletonSection />}>
              <AsyncSongSection 
                title="Pop Hits" 
                query={{ tag: 'pop', limit: 25 }} 
                icon={Radio} 
                iconColor="text-pink-500"
                moreLink="/search?tag=pop"
              />
            </Suspense>
            
            <Suspense fallback={<SkeletonSection />}>
              <AsyncSongSection 
                title="Electronic Vibes" 
                query={{ tag: 'electronic', limit: 25 }} 
                icon={Zap} 
                iconColor="text-purple-500"
                moreLink="/search?tag=electronic"
              />
            </Suspense>

            <Suspense fallback={<SkeletonSection />}>
              <AsyncSongSection 
                title="Rock Anthems" 
                query={{ tag: 'rock', limit: 25 }} 
                icon={Disc} 
                iconColor="text-red-500"
                moreLink="/search?tag=rock"
              />
            </Suspense>

            <Suspense fallback={<SkeletonSection />}>
              <AsyncSongSection 
                title="Indie Corner" 
                query={{ tag: 'indie', limit: 25 }} 
                icon={Headphones} 
                iconColor="text-orange-500"
                moreLink="/search?tag=indie"
              />
            </Suspense>
        </div>
      </div>

      <footer className="mt-8 md:mt-12 py-6 md:py-8 border-t border-neutral-300 dark:border-white/10 text-center opacity-50">
          <p className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
            System Online • Powered by VOID Ecosystem
          </p>
      </footer>
    </div>
  );
}