import getSongs from "@/app/actions/getSongs";
import SearchContent from "@/components/SearchContent";
import { Search, Disc, Filter, X, Tag, UserCheck, Globe, Users } from "lucide-react";
import Link from "next/link";
import qs from "query-string";
import ArtistGrid from "@/components/ArtistGrid";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const revalidate = 0;

const GENRES = ["Pop", "Rock", "Electronic", "HipHop", "Jazz", "Indie", "Cinematic", "Chillout"];

const SearchPage = async ({ searchParams }) => {
  const params = await searchParams;
  const activeTab = params.tab || 'songs';

  let songs = [];
  let artists = [];
  let users = [];

  // --- LOGIC TITLE THÔNG MINH ---
  let pageTitle = "SEARCH_RESULTS";
  let pageIcon = <Search className="text-emerald-500" size={40} />;

  // Handle different search types
  if (params.type === 'user_uploads') {
      // Handle user uploads search
      const cookieStore = await cookies();
      const supabase = createServerComponentClient({ cookies: () => cookieStore });

      try {
          const { data, error } = await supabase
              .from('songs')
              .select('*')
              .not('user_id', 'is', null)
              .eq('is_public', true)
              .order('created_at', { ascending: false })
              .limit(50);

          if (error) {
              console.error("Error fetching user uploads:", error);
          }
          songs = data || [];
      } catch (err) {
          console.error("User uploads search error:", err);
          songs = [];
      }
      pageTitle = "COMMUNITY UPLOADS";
      pageIcon = <Globe className="text-blue-500" size={40} />;
  } else {
      // Regular search using getSongs action for songs tab
      if (activeTab === 'songs') {
          const result = await getSongs({
              title: params.title,
              tag: params.tag
          });
          songs = result.songs || [];
          artists = result.artists || [];
      } 
      // --- PHẦN ĐÃ CHỈNH SỬA: TÌM KIẾM USER ---
      else if (activeTab === 'users' && params.title) {
          const cookieStore = await cookies();
          const supabase = createServerComponentClient({ cookies: () => cookieStore });

          try {
              const searchTerm = params.title.trim(); // Trim whitespace

              console.log("🔍 Searching for users with term:", searchTerm);

              // More flexible search: try both full_name and username if available
              // First try searching full_name
              let { data: fullNameData, error: fullNameError } = await supabase
                  .from('profiles')
                  .select('*')
                  .ilike('full_name', `%${searchTerm}%`)
                  .limit(20);

              if (fullNameError || !fullNameData) {
                  console.error("Full name search error:", fullNameError?.message);
                  fullNameData = [];
              }

              // Also try username if it exists and we have less than 20 results
              let usernameData = [];
              if (fullNameData.length < 20) {
                  try {
                      const { data: unameData, error: unameError } = await supabase
                          .from('profiles')
                          .select('*')
                          .ilike('username', `%${searchTerm}%`)
                          .limit(20);

                      if (!unameError && unameData) {
                          usernameData = unameData;
                      }
                  } catch (unameErr) {
                      // Username column might not exist, ignore
                      console.log("Username search not available");
                  }
              }

              // Combine and deduplicate results
              const allUsers = [...fullNameData, ...usernameData];
              const uniqueUsers = allUsers.filter((user, index, self) =>
                  index === self.findIndex(u => u.id === user.id)
              );

              users = uniqueUsers.slice(0, 20); // Limit to 20

              console.log(`✅ User search complete: ${fullNameData.length} from full_name + ${usernameData.length} from username = ${users.length} total unique users`);

              // Debug: Log some sample users if found
              if (users.length > 0) {
                  console.log("Sample found users:", users.slice(0, 2).map(u => ({ id: u.id, name: u.full_name, username: u.username })));
              }

          } catch (err) {
              console.error("Users search fatal error:", err);
              users = [];
          }
      }

      if (activeTab === 'users') {
          if (params.title) {
              pageTitle = `USER RESULTS FOR "${params.title.toUpperCase()}"`;
              pageIcon = <Users className="text-blue-500" size={40} />;
          } else {
              pageTitle = "SEARCH_USERS";
              pageIcon = <Users className="text-blue-500" size={40} />;
          }
      } else {
          if (params.tag && !params.title) {
              pageTitle = `${params.tag.toUpperCase()} SONGS`;
              pageIcon = <Tag className="text-emerald-500" size={40} />;
          } else if (params.title) {
              pageTitle = `RESULTS FOR "${params.title.toUpperCase()}"`;
          }
      }
  }

  return (
    <div className="flex flex-col w-full h-full p-6 pb-[120px] overflow-y-auto">
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4">

        {/* Tiêu đề động */}
        <h1 className="text-3xl md:text-5xl font-bold font-mono text-neutral-800 dark:text-white tracking-tighter flex items-center gap-3">
            {pageIcon}
            {pageTitle}
        </h1>

        {/* Search Tabs */}
        {params.type !== 'user_uploads' && (
          <div className="flex border-b border-neutral-200 dark:border-white/10">
            <Link
              href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'songs' } }, { skipNull: true })}
              className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                activeTab === 'songs'
                  ? 'bg-neutral-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-500 font-bold border-b-2 border-emerald-500'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Disc size={14} /> SONGS ({songs.length})
            </Link>
            <Link
              href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'users' } }, { skipNull: true })}
              className={`flex-1 py-4 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-neutral-100 dark:bg-white/5 text-blue-600 dark:text-blue-500 font-bold border-b-2 border-blue-500'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Users size={14} /> USERS ({users.length})
            </Link>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-neutral-500 dark:text-neutral-400">
            {params.title && (
                <div className="flex items-center gap-1 bg-neutral-200 dark:bg-white/10 px-3 py-1 rounded-full text-neutral-800 dark:text-white border border-neutral-300 dark:border-white/5">
                    <span>Query: "{params.title}"</span>
                    <Link href={qs.stringifyUrl({ url: '/search', query: { tag: params.tag } }, { skipNull: true })}>
                        <X size={14} className="hover:text-red-500 cursor-pointer"/>
                    </Link>
                </div>
            )}
            
            {params.tag && (
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                    <span>Genre: #{params.tag}</span>
                </div>
            )}

            {params.type === 'user_uploads' && (
                <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                    <span><Globe size={12} className="inline mr-1"/> Community Uploads (Public Only)</span>
                    <Link href={qs.stringifyUrl({ 
                        url: '/search', 
                        query: { ...params, type: null }
                    }, { skipNull: true })}>
                        <X size={14} className="hover:text-red-500 cursor-pointer ml-1"/>
                    </Link>
                </div>
            )}

            {!params.title && !params.tag && !params.type && !(activeTab === 'users') && <span>Displaying Top Trending</span>}

            <span className="ml-auto text-xs">FOUND: [{activeTab === 'users' ? users.length : songs.length}]</span>
        </div>
      </div>

      {/* FILTER TAGS - Only for songs tab */}
      {activeTab === 'songs' && (
        <div className="mb-8 p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-neutral-200 dark:border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono text-neutral-500 dark:text-neutral-400 tracking-widest">
              <Filter size={14}/>
              <span>FILTER_BY_GENRE</span>
          </div>

          <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                  const isSelected = params.tag === genre.toLowerCase();
                  let newQuery = { ...params };
                  if (isSelected) delete newQuery.tag;
                  else newQuery.tag = genre.toLowerCase();

                  const href = qs.stringifyUrl({
                      url: '/search',
                      query: newQuery
                  }, { skipNull: true, skipEmptyString: true });

                  return (
                      <Link
                          key={genre}
                          href={href}
                          className={`
                              px-4 py-2 rounded-lg text-sm font-mono transition-all border
                              ${isSelected
                                  ? "bg-emerald-500 text-black border-emerald-500 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400"
                                  : "bg-transparent text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                              }
                          `}
                      >
                          {isSelected ? `[#${genre}]` : `#${genre}`}
                      </Link>
                  )
              })}
          </div>
        </div>
      )}

      {/* SONGS TAB CONTENT */}
      {activeTab === 'songs' && (
        <>
          {/* --- PHẦN ARTISTS FOUND --- */}
          {params.title && artists && artists.length > 0 && (
              <ArtistGrid artists={artists} />
          )}

          {/* CONTENT SONGS */}
          {songs.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-70 font-mono gap-4 animate-in fade-in zoom-in duration-500 text-neutral-500 dark:text-neutral-400">
                <div className="relative">
                    <Disc size={60} className="text-neutral-300 dark:text-neutral-700 animate-spin-slow"/>
                    <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-white"/>
                </div>
                <p className="text-lg tracking-widest">[NO_DATA_MATCHED]</p>
                <p className="text-xs">No tracks found combining these filters.</p>
             </div>
          ) : (
             <SearchContent songs={songs} />
          )}
        </>
      )}

      {/* USERS TAB CONTENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-70 font-mono gap-4 animate-in fade-in zoom-in duration-500 text-neutral-500 dark:text-neutral-400">
                <div className="relative">
                    <Users size={60} className="text-blue-300 dark:text-blue-700 animate-pulse"/>
                    <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-white"/>
                </div>
                <p className="text-lg tracking-widest">[NO_USERS_FOUND]</p>
                <p className="text-xs">
                    Try searching with a different name. 
                    {/* Gợi ý lỗi RLS nếu cần */}
                    (Check Supabase RLS Policies if result is empty)
                </p>
             </div>
          ) : (
             users.map((user) => (
               <Link
                 key={user.id}
                 href={`/user/${user.id}`}
                 className="flex items-center gap-6 p-6 bg-white/50 dark:bg-neutral-900/50 rounded-xl hover:bg-white/70 dark:hover:bg-neutral-900/70 transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
               >
                 <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500">
                   <img
                     src={user.avatar_url || "/images/default-avatar.png"}
                     alt={user.full_name}
                     className="w-full h-full object-cover"
                   />
                 </div>

                 <div className="flex-1">
                   <h3 className="font-bold font-mono text-xl text-neutral-900 dark:text-white mb-2">
                     {user.full_name || user.username || "Anonymous User"}
                   </h3>
                   {user.bio && (
                     <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                       {user.bio}
                     </p>
                   )}
                   <div className="flex gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                     <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                   </div>
                 </div>

                 <Users size={24} className="text-blue-500" />
               </Link>
             ))
          )}
        </div>
      )}

    </div>
  );
};

export default SearchPage;
