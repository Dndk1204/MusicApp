import getSongs from "@/app/actions/getSongs";
import SearchContent from "@/components/SearchContent";
import { Search, Disc, Filter, X, Tag, Globe, Users, User, ArrowRight, CircleUser, Music } from "lucide-react";
import Link from "next/link";
import qs from "query-string";
import ArtistGrid from "@/components/ArtistGrid";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
// IMPORT CYBER COMPONENTS
import { CyberCard, ScanlineOverlay, GlitchText } from "@/components/CyberComponents";
// IMPORT HOVER PREVIEW
import HoverImagePreview from "@/components/HoverImagePreview";
// IMPORT BACK BUTTON
import BackButton from "@/components/BackButton"; 

export const revalidate = 0;

const GENRES = ["Pop", "Rock", "Electronic", "HipHop", "Jazz", "Indie", "Cinematic", "Chillout"];

// --- HELPER: SEARCH USERS LOGIC ---
const searchUsers = async (term) => {
    if (!term) return [];
    
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const searchTerm = term.trim();

    try {
        let { data: fullNameData, error: fullNameError } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${searchTerm}%`)
            .limit(20);

        if (fullNameError || !fullNameData) fullNameData = [];

        let usernameData = [];
        if (fullNameData.length < 20) {
            try {
                const { data: unameData } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('username', `%${searchTerm}%`) 
                    .limit(20);
                if (unameData) usernameData = unameData;
            } catch (e) { }
        }

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

// --- HELPER: SEARCH PLAYLISTS LOGIC ---
const searchPlaylists = async (term) => {
    if (!term) return [];

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const searchTerm = term.trim();

    try {
        const { data: playlists, error } = await supabase
            .from('playlists')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    avatar_url
                ),
                playlist_songs(count)
            `)
            .ilike('name', `%${searchTerm}%`)
            .limit(20);

        if (error || !playlists) return [];

        const playlistsWithCreators = playlists.map(playlist => ({
            ...playlist,
            creator: {
                name: playlist.profiles?.full_name || 'Unknown User',
                avatar: playlist.profiles?.avatar_url || null
            },
            songCount: playlist.playlist_songs?.[0]?.count || 0
        }));

        return playlistsWithCreators.slice(0, 20);
    } catch (err) {
        console.error("Playlist search error:", err);
        return [];
    }
};

// --- HELPER: SEARCH LOCAL ARTISTS ---
const searchLocalArtists = async (term) => {
    if (!term) return [];
    
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const searchTerm = term.trim();
    
    const { data: songs } = await supabase
        .from('songs')
        .select('author, image_url')
        .ilike('author', `%${searchTerm}%`)
        .limit(50); 

    if (!songs || songs.length === 0) return [];

    const uniqueArtists = [];
    const seen = new Set();

    songs.forEach(song => {
        const normalizedName = song.author.trim().toLowerCase();
        if (!seen.has(normalizedName)) {
            seen.add(normalizedName);
            uniqueArtists.push({
                id: `local-${normalizedName.replace(/\s+/g, '-')}`, 
                name: song.author,
                image: song.image_url || '/images/music-placeholder.png',
                is_local: true 
            });
        }
    });

    return uniqueArtists.slice(0, 10);
};

const SearchPage = async ({ searchParams }) => {
    const params = await searchParams;
    const activeTab = params.tab || 'songs';

    let songs = [];
    let artists = [];
    let users = [];
    let playlists = [];
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
                .order('created_at', { ascending: false });
            
            // XỬ LÝ: BẬT PREVIEW CHO COMMUNITY UPLOADS
            songs = (data || []).map(song => ({
                ...song,
                // Đảm bảo song_path trỏ đúng file nhạc trong DB
                song_path: song.song_path || song.song_url, 
                allow_preview: true // ✅ BẬT PREVIEW
            }));

        } catch (err) { console.error(err); }
        pageTitle = "COMMUNITY_UPLOADS";
    } else {
        const songsPromise = getSongs({
            title: params.title,
            tag: params.tag,
            artist: params.uploader
        });

        const userQuery = params.uploader || params.title;
        const usersPromise = userQuery ? searchUsers(userQuery) : Promise.resolve([]);

        const playlistQuery = params.title || params.uploader;
        const playlistsPromise = playlistQuery ? searchPlaylists(playlistQuery) : Promise.resolve([]);

        const artistQuery = params.title || params.uploader;
        const localArtistsPromise = artistQuery ? searchLocalArtists(artistQuery) : Promise.resolve([]);

        const [songsResult, usersResult, playlistsResult, localArtistsResult] = await Promise.all([
            songsPromise, 
            usersPromise, 
            playlistsPromise,
            localArtistsPromise
        ]);

        // API Songs (Mặc định bật preview)
        songs = (songsResult.songs || []).map(s => ({ ...s, allow_preview: true }));
        
        const jamendoArtists = songsResult.artists || [];
        const filteredLocalArtists = localArtistsResult.filter(local => 
            !jamendoArtists.some(jamendo => jamendo.name.toLowerCase() === local.name.toLowerCase())
        );
        
        artists = [...filteredLocalArtists, ...jamendoArtists]; 
        playlists = playlistsResult || [];
        users = usersResult || [];

        // Nếu có tìm kiếm (Gộp cả API và User Uploads)
        if (params.title || params.tag) {
            const cookieStore = await cookies();
            const supabase = createServerComponentClient({ cookies: () => cookieStore });

            let query = supabase
                .from('songs')
                .select('*')
                .not('user_id', 'is', null)
                .eq('is_public', true);

            if (params.title) query = query.ilike('title', `%${params.title}%`);
            if (params.tag) query = query.ilike('tag', `%${params.tag}%`);

            query = query.order('created_at', { ascending: false }).limit(20);

            try {
                const { data: userSongs } = await query;

                if (userSongs && userSongs.length > 0) {
                    
                    // Helper map cơ bản
                    const mapSongBase = (song) => ({
                        id: song.id,
                        title: song.title,
                        author: song.author,
                        // Quan trọng: Lấy đúng đường dẫn file để play preview
                        song_path: song.song_path || song.song_url, 
                        image_path: song.image_url || song.image_path || '/images/music-placeholder.png',
                        duration: song.duration,
                        lyrics: song.lyrics || null,
                        user_id: song.user_id
                    });

                    // Map API Songs: Cho phép Preview
                    const jamendoSongsMapped = songs.map(s => ({
                        ...mapSongBase(s),
                        allow_preview: true 
                    }));

                    // Map User Songs: BẬT PREVIEW LUÔN
                    const uploadedSongsMapped = userSongs.map(s => ({
                        ...mapSongBase(s),
                        allow_preview: true // ✅ BẬT PREVIEW CHO NHẠC DB
                    }));

                    // Gộp lại
                    const combined = [...uploadedSongsMapped, ...jamendoSongsMapped];
                    const unique = combined.filter((song, index, self) =>
                        index === self.findIndex(s => s.id === song.id && s.title === song.title && s.author === song.author)
                    );
                    songs = unique.slice(0, 50);
                }
            } catch (err) { console.error("Error searching user songs:", err); }
        }

        if (activeTab === 'users') {
            pageTitle = userQuery ? `USER_RESULTS: "${userQuery.toUpperCase()}"` : "SEARCH_USERS";
        } else if (activeTab === 'playlists') {
            pageTitle = playlistQuery ? `PLAYLIST_RESULTS: "${playlistQuery.toUpperCase()}"` : "SEARCH_PLAYLISTS";
        } else {
            if (params.uploader) pageTitle = `UPLOADER: "${params.uploader.toUpperCase()}"`;
            else if (params.tag && !params.title) pageTitle = `TAG: ${params.tag.toUpperCase()}`;
            else if (params.title) pageTitle = `RESULTS: "${params.title.toUpperCase()}"`;
        }
    }

    return (
        <div className="flex flex-col !w-full p-3.5 !min-h-full !overflow-y-auto transition-colors duration-500">
            
            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-6">

                {/* Title Area With Back Button */}
                <div className="flex items-end gap-6">
                    {/* BACK BUTTON */}
                    <div className="mb-3">
                        <BackButton /> 
                    </div>

                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-5xl font-black font-mono text-neutral-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
                            {activeTab === 'users' ? <Users className="text-blue-500" size={32} /> :
                             activeTab === 'playlists' ? <Music className="text-purple-500" size={32} /> :
                             <Search className="text-emerald-500" size={32} />}
                            <GlitchText text={pageTitle} />
                        </h1>
                        <div className="h-1 w-24 bg-emerald-500"></div>
                    </div>
                </div>

                {/* TABS */}
                {params.type !== 'user_uploads' && (
                    <div className="grid grid-cols-3 border-b-2 border-neutral-300 dark:border-white/10">
                        <Link
                            href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'songs' } }, { skipNull: true })}
                            className={`py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all relative group ${
                                activeTab === 'songs'
                                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                                    : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
                            }`}
                        >
                            <Disc size={14} /> SONGS <span className="opacity-50">[{songs.length}]</span>
                            {activeTab === 'songs' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 translate-y-full"></div>}
                        </Link>

                        <Link
                            href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'playlists' } }, { skipNull: true })}
                            className={`py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all relative group ${
                                activeTab === 'playlists'
                                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                                    : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'
                            }`}
                        >
                            <Music size={14} /> PLAYLISTS <span className="opacity-50">[{playlists.length}]</span>
                            {activeTab === 'playlists' && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 translate-y-full"></div>}
                        </Link>

                        <Link
                            href={qs.stringifyUrl({ url: '/search', query: { ...params, tab: 'users' } }, { skipNull: true })}
                            className={`py-3 text-xs font-mono font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all relative group ${
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

                {/* Status Bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-900 dark:text-neutral-400 border-l-2 border-emerald-500 pl-3">
                    <span>:: SYSTEM_FILTER ::</span>
                    {params.title && (
                        <div className="flex items-center gap-1 bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded-none text-neutral-900 dark:text-white border border-neutral-400 dark:border-white/20">
                            <span>QUERY="{params.title}"</span>
                            <Link href={qs.stringifyUrl({ url: '/search', query: { tag: params.tag, uploader: params.uploader } }, { skipNull: true })}>
                                <X size={12} className="hover:text-red-500 cursor-pointer"/>
                            </Link>
                        </div>
                    )}
                    {params.uploader && (
                        <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-none">
                            <CircleUser size={12} />
                            <span>USER="{params.uploader}"</span>
                            <Link href={qs.stringifyUrl({ url: '/search', query: { title: params.title, tag: params.tag } }, { skipNull: true })}>
                                <X size={12} className="hover:text-red-500 cursor-pointer ml-1"/>
                            </Link>
                        </div>
                    )}
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

            {/* FILTER TAGS */}
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
                    {artists && artists.length > 0 && (
                        <ArtistGrid artists={artists} />
                    )}

                    {songs.length > 0 && (
                        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
                                <h2 className="text-sm font-bold font-mono text-neutral-900 dark:text-white tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500"></span>
                                    SONGS_MATCHED
                                </h2>
                                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-white/10 px-2 py-0.5">
                                    CNT: {songs.length}
                                </span>
                            </div>
                        </div>
                    )}

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

            {/* 2. USERS TAB */}
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
                        <>
                            <div className="mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
                                    <h2 className="text-sm font-bold font-mono text-neutral-900 dark:text-white tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500"></span>
                                        USERS_DETECTED
                                    </h2>
                                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-white/10 px-2 py-0.5">
                                        CNT: {users.length}
                                    </span>
                                </div>
                            </div>
                            {/* USER LIST GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users.map((user, index) => ( 
                                    <Link key={user.id} href={`/user/${user.id}`} className="block h-full">
                                        <CyberCard className="group h-full p-0 bg-white dark:bg-neutral-900/40 border border-neutral-300 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 group-hover:border-blue-500 transition-colors z-10"></div>
                                            <div className="flex h-full">
                                                <div className="w-24 shrink-0 border-r border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-black/50 relative group/img">
                                                    <HoverImagePreview src={user.avatar_url} alt={user.full_name} className="w-full h-24 relative hover:cursor-none" previewSize={240}>
                                                        <div className="w-full h-full relative overflow-hidden">
                                                            {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"/> : <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800"><User size={32} className="text-neutral-400 dark:text-neutral-600"/></div>}
                                                            <ScanlineOverlay />
                                                        </div>
                                                    </HoverImagePreview>
                                                    <div className="p-1 text-center border-t border-neutral-300 dark:border-white/10">
                                                        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">
                                                            IMG_{String(index + 1).padStart(2, '0')} 
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col min-w-0">
                                                    <div className="flex items-center justify-between p-3 border-b border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-white/5">
                                                        <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{user.full_name || user.username || "UNKNOWN_UNIT"}</h3>
                                                        <Users size={14} className="text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                    <div className="p-3 flex-1">
                                                        <p className="text-[10px] text-neutral-900 dark:text-neutral-400 font-mono mb-1 uppercase tracking-widest">:: BIO_DATA ::</p>
                                                        {user.bio ? <p className="text-xs text-neutral-600 dark:text-neutral-300 font-mono line-clamp-2 leading-relaxed">{user.bio}</p> : <p className="text-[10px] text-neutral-500 italic font-mono">// NO DATA AVAILABLE</p>}
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
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 3. PLAYLISTS TAB */}
            {activeTab === 'playlists' && (
                <>
                    {playlists.length > 0 && (
                        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
                                <h2 className="text-sm font-bold font-mono text-neutral-900 dark:text-white tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-2 h-2 bg-purple-500"></span>
                                    PLAYLISTS_MATCHED
                                </h2>
                                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-white/10 px-2 py-0.5">
                                    CNT: {playlists.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> 
                                {playlists.slice(0, 9).map((playlist) => (
                                    <Link key={playlist.id} href={`/playlist?id=${playlist.id}`} className="block h-full">
                                        <CyberCard className="group h-full p-3 relative bg-white dark:bg-neutral-900/40 border border-neutral-300 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500/80 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                            <div className="absolute inset-0 translate-x-1 translate-y-1 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 opacity-50 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform duration-300"></div>
                                            <div className="absolute inset-0 translate-x-2 translate-y-2 bg-neutral-300 dark:bg-neutral-800/50 border border-neutral-300 dark:border-white/10 opacity-30 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform duration-300"></div>
                                            <div className="relative z-10 w-full flex flex-col gap-3">
                                                <div className="relative w-full aspect-square border border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden group/img">
                                                    {playlist.cover_url ? <img src={playlist.cover_url} alt={playlist.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"/> : <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500"><Music size={40} /></div>}
                                                    <ScanlineOverlay />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="w-10 h-10 bg-purple-500/80 flex items-center justify-center rounded-none shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-lg font-black text-neutral-900 dark:text-white font-mono group-hover:text-purple-600 dark:group-hover:text-purple-400 transition truncate">{playlist.name}</h3>
                                                    <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400 border-t border-dashed border-neutral-300 dark:border-white/10 pt-2">
                                                        <div className="flex items-center gap-2">
                                                            <HoverImagePreview src={playlist.creator.avatar} alt={playlist.creator.name} className="w-10 h-10 shrink-0 hover:cursor-none" previewSize={200}>
                                                                {playlist.creator.avatar ? <img src={playlist.creator.avatar} alt={playlist.creator.name} className="w-full h-full rounded-none object-cover border border-purple-500/50" /> : <div className="w-full h-full rounded-none bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center"><User size={14} className="text-neutral-500" /></div>}
                                                            </HoverImagePreview>
                                                            <span className="opacity-90 font-bold">{playlist.creator.name}</span>
                                                        </div>
                                                        <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1 py-0.5 border border-purple-500/50">{playlist.songCount} TRKS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CyberCard>
                                    </Link>
                                ))}
                            </div>
                            {playlists.length > 9 && <div className="mt-4 text-center"><p className="text-xs font-mono text-neutral-500">Showing 9 of {playlists.length} playlists</p></div>}
                        </div>
                    )}
                    {playlists.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-70 font-mono gap-4 animate-in fade-in zoom-in duration-500 text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-white/10">
                            <div className="relative"><Music size={60} className="text-purple-300 dark:text-purple-700 animate-pulse"/><Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-800 dark:text-white"/></div>
                            <p className="text-lg tracking-widest">[NO_PLAYLISTS_FOUND]</p>
                            <p className="text-xs">Try different query parameters.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchPage;