import getSongs from "@/app/actions/getSongs";
import SearchContent from "@/components/SearchContent";
import { Search, Disc, Filter, X, Tag, Globe, Users, User, ArrowRight, CircleUser } from "lucide-react";
import Link from "next/link";
import qs from "query-string";
import ArtistGrid from "@/components/ArtistGrid";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// IMPORT CYBER COMPONENTS
import { CyberCard, ScanlineOverlay, GlitchText } from "@/components/CyberComponents";

export const revalidate = 0;

const GENRES = ["Pop", "Rock", "Electronic", "HipHop", "Jazz", "Indie", "Cinematic", "Chillout"];

// --- HELPER: SEARCH USERS LOGIC ---
const searchUsers = async (term) => {
    if (!term) return [];
    
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const searchTerm = term.trim();

    try {
        // 1. Tìm theo Full Name
        let { data: fullNameData, error: fullNameError } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${searchTerm}%`)
            .limit(20);

        if (fullNameError || !fullNameData) fullNameData = [];

        // 2. Tìm theo Username (nếu kết quả ít)
        let usernameData = [];
        if (fullNameData.length < 20) {
            try {
                const { data: unameData } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('username', `%${searchTerm}%`) // Giả sử bạn có cột username, nếu không thì bỏ qua
                    .limit(20);
                if (unameData) usernameData = unameData;
            } catch (e) { }
        }

        // Gộp và lọc trùng
        const allUsers = [...fullNameData, ...usernameData];
        const uniqueUsers = allUsers.filter((user, index, self) =>
            index === self.findIndex(u => u.id === user.id)
        );

        return uniqueUsers.slice(0, 20);
    } catch (err) {
        console.error("User search error:", err);
        return [];
    }
};

const SearchPage = async ({ searchParams }) => {
  const params = await searchParams;
  const activeTab = params.tab || 'songs';

  let songs = [];
  let artists = [];
  let users = [];

  // --- LOGIC TITLE & ICON ---
  let pageTitle = "SEARCH_RESULTS";
  
  if (params.type === 'user_uploads') {
      const cookieStore = await cookies();
      const supabase = createServerComponentClient({ cookies: () => cookieStore });
      try {
          const { data } = await supabase
              .from('songs')
              .select('*')
              .not('user_id', 'is', null)
              .eq('is_public', true)
              .order('created_at', { ascending: false })
              .limit(50);
          songs = data || [];
      } catch (err) { console.error(err); }
      pageTitle = "COMMUNITY_UPLOADS";
  } else {
      // 1. TÌM SONGS (Dựa trên title, tag, uploader)
      const songsPromise = getSongs({ 
          title: params.title, 
          tag: params.tag,
          uploader: params.uploader 
      });
      
      // 2. TÌM USERS (FIXED LOGIC)
      // Ưu tiên: Nếu có params.uploader thì tìm user đó, nếu không thì tìm theo params.title
      const userQuery = params.uploader || params.title;
      const usersPromise = userQuery ? searchUsers(userQuery) : Promise.resolve([]);

      // Chạy song song
      const [songsResult, usersResult] = await Promise.all([songsPromise, usersPromise]);

      songs = songsResult.songs || [];
      artists = songsResult.artists || []; 
      users = usersResult || [];

      // Logic hiển thị tiêu đề trang
      if (activeTab === 'users') {
          // Hiển thị từ khóa đang tìm kiếm user
          pageTitle = userQuery ? `USER_RESULTS: "${userQuery.toUpperCase()}"` : "SEARCH_USERS";
      } else {
          if (params.uploader) {
              pageTitle = `UPLOADER: "${params.uploader.toUpperCase()}"`;
          } else if (params.tag && !params.title) {
              pageTitle = `TAG: ${params.tag.toUpperCase()}`;
          } else if (params.title) {
              pageTitle = `RESULTS: "${params.title.toUpperCase()}"`;
          }
      }
  }

  return (
    <div className="flex flex-col w-full h-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black transition-colors duration-500">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-6">

        {/* Title Area - Cyber Style */}
        <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black font-mono text-neutral-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
                {activeTab === 'users' ? <Users className="text-blue-500" size={32} /> : <Search className="text-emerald-500" size={32} />}
                <GlitchText text={pageTitle} />
            </h1>
            <div className="h-1 w-24 bg-emerald-500"></div> {/* Decor Line */}
        </div>

        {/* TABS */}
        {params.type !== 'user_uploads' && (
          <div className="flex border-b-2 border-neutral-300 dark:border-white/10">
            <Link
              href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'songs' } }, { skipNull: true })}
              className={`flex-1 py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all relative group ${
                activeTab === 'songs'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
            >
              <Disc size={14} /> SONGS <span className="opacity-50">[{songs.length}]</span>
              {activeTab === 'songs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 translate-y-full"></div>}
            </Link>
            
            <Link
              href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'users' } }, { skipNull: true })}
              className={`flex-1 py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all relative group ${
                activeTab === 'users'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
              }`}
            >
              <Users size={14} /> USERS <span className="opacity-50">[{users.length}]</span>
              {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 translate-y-full"></div>}
            </Link>
          </div>
        )}

        {/* Status Bar (System Log Style) */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500 dark:text-neutral-400 border-l-2 border-emerald-500 pl-3">
            <span className="opacity-50">:: SYSTEM_FILTER ::</span>
            
            {/* Tag Title */}
            {params.title && (
                <div className="flex items-center gap-1 bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded-none text-neutral-900 dark:text-white border border-neutral-400 dark:border-white/20">
                    <span>QUERY="{params.title}"</span>
                    <Link href={qs.stringifyUrl({ url: '/search', query: { tag: params.tag, uploader: params.uploader } }, { skipNull: true })}>
                        <X size={12} className="hover:text-red-500 cursor-pointer"/>
                    </Link>
                </div>
            )}
            
            {/* Tag Uploader */}
            {params.uploader && (
                <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-none">
                    <CircleUser size={12} />
                    <span>USER="{params.uploader}"</span>
                    <Link href={qs.stringifyUrl({ url: '/search', query: { title: params.title, tag: params.tag } }, { skipNull: true })}>
                        <X size={12} className="hover:text-red-500 cursor-pointer ml-1"/>
                    </Link>
                </div>
            )}

            {/* Tag Genre */}
            {params.tag && (
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-none">
                    <span>TAG=#{params.tag}</span>
                </div>
            )}

            {params.type === 'user_uploads' && (
                <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-none">
                    <span>SOURCE=COMMUNITY</span>
                    <Link href={qs.stringifyUrl({ url: '/search', query: { ...params, type: null } }, { skipNull: true })}>
                        <X size={12} className="hover:text-red-500 cursor-pointer ml-1"/>
                    </Link>
                </div>
            )}
        </div>
      </div>

      {/* FILTER TAGS (Wrapped in CyberCard) */}
      {activeTab === 'songs' && (
        <CyberCard className="mb-8 p-4 bg-white dark:bg-black/20 rounded-none border border-neutral-300 dark:border-white/10 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono text-neutral-500 dark:text-neutral-400 tracking-widest border-b border-dashed border-neutral-300 dark:border-white/10 pb-2">
              <Filter size={14}/>
              <span>GENRE_MATRIX</span>
          </div>

          <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                  const isSelected = params.tag === genre.toLowerCase();
                  let newQuery = { ...params };
                  if (isSelected) delete newQuery.tag;
                  else newQuery.tag = genre.toLowerCase();

                  const href = qs.stringifyUrl({ url: '/search', query: newQuery }, { skipNull: true, skipEmptyString: true });

                  return (
                      <Link
                          key={genre}
                          href={href}
                          className={`
                              px-3 py-1.5 rounded-none text-xs font-mono transition-all border
                              ${isSelected
                                  ? "bg-emerald-500 text-black border-emerald-500 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] hover:bg-emerald-400"
                                  : "bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                              }
                          `}
                      >
                          {isSelected ? `[#${genre}]` : `#${genre}`}
                      </Link>
                  )
              })}
          </div>
        </CyberCard>
      )}

      {/* --- CONTENT AREA --- */}
      
      {/* 1. SONGS TAB */}
      {activeTab === 'songs' && (
        <>
          {/* Artists Found Grid */}
          {params.title && artists && artists.length > 0 && (
              <ArtistGrid artists={artists} />
          )}

          {/* Songs List */}
          {songs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-70 font-mono gap-4 animate-in fade-in zoom-in duration-500 text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-white/10">
                <div className="relative">
                    <Disc size={60} className="text-neutral-300 dark:text-neutral-700 animate-spin-slow"/>
                    <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-white"/>
                </div>
                <p className="text-lg tracking-widest">[NO_DATA_MATCHED]</p>
                <p className="text-xs">No tracks found within database parameters.</p>
             </div>
          ) : (
             <SearchContent songs={songs} />
          )}
        </>
      )}

      {/* 2. USERS TAB (SỬ DỤNG CYBERCARD CHO USER LIST) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-70 font-mono gap-4 animate-in fade-in zoom-in duration-500 text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-white/10">
                <div className="relative">
                    <Users size={60} className="text-blue-300 dark:text-blue-700 animate-pulse"/>
                    <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-white"/>
                </div>
                <p className="text-lg tracking-widest">[NO_USERS_FOUND]</p>
                <p className="text-xs">Try different query parameters.</p>
             </div>
          ) : (
             users.map((user) => (
               <Link key={user.id} href={`/user/${user.id}`} className="block h-full">
                    <CyberCard className="group h-full p-0 bg-white dark:bg-neutral-900/40 border border-neutral-300 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 relative overflow-hidden">
                        
                        {/* Decor: Corner Accent */}
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 group-hover:border-blue-500 transition-colors z-10"></div>

                        <div className="flex h-full">
                        {/* CỘT TRÁI: AVATAR */}
                        <div className="w-24 shrink-0 border-r border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-black/50 relative group/img">
                            <div className="w-full h-24 relative overflow-hidden">
                                {user.avatar_url ? (
                                    <img
                                      src={user.avatar_url}
                                      alt={user.full_name}
                                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
                                        <User size={32} className="text-neutral-400 dark:text-neutral-600"/>
                                    </div>
                                )}
                                <ScanlineOverlay />
                            </div>
                            <div className="p-1 text-center border-t border-neutral-300 dark:border-white/10">
                                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">IMG_01</span>
                            </div>
                        </div>

                        {/* CỘT PHẢI: INFO */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex items-center justify-between p-3 border-b border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-white/5">
                                <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                    {user.full_name || user.username || "UNKNOWN_UNIT"}
                                </h3>
                                <Users size={14} className="text-neutral-400 group-hover:text-blue-500 transition-colors" />
                            </div>

                            <div className="p-3 flex-1">
                                <p className="text-[10px] text-neutral-400 font-mono mb-1 uppercase tracking-widest opacity-70">:: BIO_DATA ::</p>
                                {user.bio ? (
                                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono line-clamp-2 leading-relaxed">
                                        {user.bio}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-neutral-400 italic font-mono opacity-50">// NO DATA AVAILABLE</p>
                                )}
                            </div>

                            <div className="flex border-t border-neutral-300 dark:border-white/10">
                                <div className="flex-1 p-2 border-r border-neutral-300 dark:border-white/10">
                                    <span className="block text-[8px] text-neutral-400 uppercase">ID_REF</span>
                                    <span className="block text-[10px] font-mono text-neutral-700 dark:text-neutral-300 truncate">{user.id.slice(0, 6)}</span>
                                </div>
                                <div className="flex-1 p-2">
                                    <span className="block text-[8px] text-neutral-400 uppercase">INIT_DATE</span>
                                    <span className="block text-[10px] font-mono text-neutral-700 dark:text-neutral-300 truncate">{new Date(user.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'})}</span>
                                </div>
                            </div>
                        </div>
                        </div>
                    </CyberCard>
                </Link>
             ))
          )}
        </div>
      )}

    </div>
  );
};

export default SearchPage;