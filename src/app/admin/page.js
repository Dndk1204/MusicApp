"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
    ShieldAlert, UploadCloud, Users, Trash2, TrendingUp,
    Search, Loader2, RefreshCw, Music, ArrowLeft, Eraser, Mic2, Heart,
    Globe, Lock, Star, ArchiveRestore, Skull, Activity, List, User,
    CheckCircle2, XCircle, Clock, Eye, ShieldCheck, ChevronDown, MessageSquare,
    X
} from "lucide-react";
import useUI from "@/hooks/useUI";

// Import Auth Context để lấy trạng thái Online
import { useAuth } from "@/components/AuthWrapper"; // Đảm bảo đường dẫn này đúng với file AuthWrapper của bạn

// Import các Cyber Components
import { GlitchButton, CyberButton, GlitchText, CyberCard, NeonButton, ScanlineOverlay } from "@/components/CyberComponents";

// Import Component đã tách ra
import ActivityStream from "@/components/ActivityStream";
import TrackDetailModal from "@/components/TrackDetailModal";

// --- LIKED USERS MODAL COMPONENT ---
const LikedUsersModal = ({ song, isOpen, onClose }) => {
    const [likedUsers, setLikedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && song?.id) {
            fetchLikedUsers();
        }
    }, [isOpen, song]);

    const fetchLikedUsers = async () => {
        if (!song?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('song_likes')
                .select(`
                    user_id,
                    created_at,
                    profiles:user_id (
                        id,
                        full_name,
                        avatar_url,
                        role,
                        created_at
                    )
                `)
                .eq('song_id', song.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter out users without profile data (deleted users)
            const validUsers = (data || []).filter(like => like.profiles);
            setLikedUsers(validUsers);
        } catch (error) {
            console.error("Error fetching liked users:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
        
        {/* Backdrop (Tối ưu cho cả 2 chế độ) */}
        <div 
            className="absolute inset-0 bg-neutral-900/80 dark:bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        />
        
        {/* Modal Container (Cyber Brutalism) */}
        <div className="
            relative z-10 w-[95%] md:w-full max-w-2xl overflow-hidden
            bg-white dark:bg-black 
            border-2 border-neutral-400 dark:border-white/20 
            shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(255,255,255,0.05)]
            rounded-none
        ">
            <ScanlineOverlay />
            
            {/* Decoration Corners (4 góc Emerald đặc trưng) */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

            {/* Header Section */}
            <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-5 md:p-6 text-center relative shrink-0">
                {/* Top Glow Line */}
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                
                {/* Icon Section */}
                <div className="w-12 h-12 mx-auto flex items-center justify-center mb-3 bg-neutral-200 dark:bg-white/5 border border-neutral-400 dark:border-white/20 rounded-none shadow-inner">
                    <Heart size={24} className="text-red-600 dark:text-red-500 animate-pulse" fill="currentColor" />
                </div>
                
                {/* Title Section */}
                <h2 className="text-lg md:text-xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                    <GlitchText text="LIKED_USERS" />
                </h2>
                
                <p className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase mt-1 text-black dark:text-emerald-400/80">
                    :: TRACK: {song?.title || "UNKNOWN_SOURCE"} | COUNT: {likedUsers.length} ::
                </p>

                {/* Close Button */}
                <button 
                    className="absolute top-2 right-2 p-2 text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300" 
                    onClick={onClose}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content Section */}
            <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh] bg-neutral-50/50 dark:bg-black/80 custom-scrollbar relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-emerald-500" size={40} />
                        <span className="text-[10px] text-emerald-500 font-mono tracking-[0.3em] uppercase">ACCESSING_USER_DB...</span>
                    </div>
                ) : likedUsers.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-neutral-300 dark:border-white/5">
                        <Heart size={48} className="text-neutral-300 dark:text-neutral-800 mx-auto mb-4 opacity-20" />
                        <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">NO_SIGNALS_DETECTED</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {likedUsers.map((like) => (
                            <div 
                            key={like.user_id} 
                            className="flex items-center gap-4 p-3 border-2 border-neutral-200 dark:border-white/5 bg-white dark:bg-black/40 hover:border-emerald-500/30 transition-all group"
                            >
                                {/* Avatar Square Style */}
                                <div className="w-12 h-12 rounded-none bg-neutral-200 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center relative shrink-0">
                                    {like.profiles.avatar_url ? (
                                        <img src={like.profiles.avatar_url} alt={like.profiles.full_name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    ) : (
                                        <User size={20} className="text-neutral-400" />
                                    )}
                                    <ScanlineOverlay />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-neutral-900 dark:text-white truncate font-mono text-sm uppercase">
                                            {like.profiles.full_name || 'NULL_USER'}
                                        </span>
                                        <span className={`
                                            inline-block px-2 py-0.5 text-[9px] rounded-none border-2 font-black uppercase tracking-tighter
                                            ${like.profiles.role === 'admin'
                                                ? 'border-red-500/30 text-red-600 bg-red-500/5'
                                                : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'}
                                        `}>
                                            {like.profiles.role || 'user'}
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-black dark:!text-neutral-400 font-mono uppercase tracking-tight">
                                        TIMESTAMP: {new Date(like.created_at).toLocaleString('en-GB')}
                                    </div>
                                </div>

                                {/* User ID Tag */}
                                <div className="hidden md:block text-right">
                                    <div className="text-[8px] text-black !font-extrabold font-mono dark:!text-neutral-400 bg-neutral-100 dark:bg-white/5 px-2 py-1 border border-neutral-300 dark:border-white/10">
                                        SID: {String(like.user_id).slice(0, 8)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Section */}
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border-t-2 border-neutral-300 dark:border-white/10 flex justify-end shrink-0 relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20"></div>
                <GlitchButton 
                    onClick={onClose}
                    className="px-8 py-2 text-xs !border-neutral-900/60 dark:!border-red-500 !text-neutral-900 dark:!text-red-500 hover:!bg-red-500 dark:hover:!bg-neutral-900/10 dark:hover:!text-white hover:!text-white"
                >
                    CLOSE_MANIFEST
                </GlitchButton>
            </div>

        </div>
        </div>
    );
};

// --- COMPONENT SKELETON (CYBER STYLE) ---
const AdminSkeleton = () => (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black animate-pulse">
       <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-300 dark:border-white/10 pb-6">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-neutral-300 dark:bg-white/10 rounded-none"></div>
                <div className="h-3 w-32 bg-neutral-200 dark:bg-white/5 rounded-none"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-8 w-24 bg-neutral-300 dark:bg-white/10 rounded-none"></div>
                <div className="h-8 w-24 bg-neutral-300 dark:bg-white/10 rounded-none"></div>
            </div>
       </div>
       <div className="h-20 w-full bg-neutral-200 dark:bg-white/5 rounded-none mb-8 border border-neutral-300 dark:border-white/10"></div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-none p-6 h-32"></div>
            ))}
       </div>
       <div className="bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-none h-64"></div>
    </div>
);

const AdminDashboard = () => {
const router = useRouter();
const { alert, confirm } = useUI();

// --- SỬ DỤNG AUTH CONTEXT CHO PRESENCE ---
const { onlineUsers } = useAuth();
// -----------------------------------------

const success = (msg) => alert(msg, 'success', 'SUCCESS');
const error = (msg) => alert(msg, 'error', 'ERROR');

const [loading, setLoading] = useState(true);
const [syncing, setSyncing] = useState(false);
const [syncingArtists, setSyncingArtists] = useState(false); 
const [cleaning, setCleaning] = useState(false); 
const [resetting, setResetting] = useState(false);
const [restoring, setRestoring] = useState(false); 

const [currentView, setCurrentView] = useState('dashboard');
const [stats, setStats] = useState({ totalUsers: 0, totalSongs: 0, totalArtists: 0, totalComments: 0, commentsToday: 0, topSongs: [], topSearchedArtists: [], topCommentedSongs: [], topCommenters: [], topLikedSongs: [], pendingCount: 0 });

const [usersList, setUsersList] = useState([]);
const [allSongsList, setAllSongsList] = useState([]); 
const [fullArtistsList, setFullArtistsList] = useState([]); 
const [popularArtistsList, setPopularArtistsList] = useState([]); 
const [allArtistsList, setAllArtistsList] = useState([]);

const [songSearchTerm, setSongSearchTerm] = useState("");
const [artistSearchTerm, setArtistSearchTerm] = useState("");
const [songSortType, setSongSortType] = useState('date'); 

// const [onlineUsers, setOnlineUsers] = useState(new Set()); // ĐÃ XÓA DÒNG NÀY VÌ DÙNG USEAUTH
const [selectedSong, setSelectedSong] = useState(null);
const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
const [selectedSongForLikes, setSelectedSongForLikes] = useState(null);
const [isLikedUsersModalOpen, setIsLikedUsersModalOpen] = useState(false);
const [selectedSongIds, setSelectedSongIds] = useState([]);
// Quản lý tab phê duyệt (mặc định hiện các bài đang chờ)
const [approvalFilter, setApprovalFilter] = useState('pending');

  // --- HELPER LOGIC ---
    const getUploaderInfo = (userId) => {
        if (!userId) return { name: 'System', role: 'admin', avatar_url: null }; 
        const user = usersList.find(u => u.id === userId);
        if (user) {
            return { name: user.full_name || 'Unknown', role: user.role || 'user', avatar_url: user.avatar_url };
        }
        return { name: 'Deleted User', role: 'unknown', avatar_url: null };
    };

    const isAdminTrack = (song) => {
        if (!song.user_id) return true; 
        const info = getUploaderInfo(song.user_id);
        return info.role === 'admin';
    };

    const getActionLabel = (action) => {
            switch (action) {
                case 'upload': return { label: 'NEW_UPLOAD', color: 'bg-blue-500/20 text-blue-400' };
                case 'set_public': return { label: 'REQ_PUBLIC', color: 'bg-emerald-500/20 text-emerald-400' };
                case 'set_private': return { label: 'REQ_PRIVATE', color: 'bg-amber-500/20 text-amber-400' };
                default: return { label: 'SYSTEM_MOD', color: 'bg-neutral-500/20 text-neutral-400' };
            }
    };

  // --- DATA FETCHING ---
  const fetchDashboardData = async () => {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        const { data: topSongs } = await supabase.from('songs').select('id, title, author, play_count, image_url').order('play_count', { ascending: false }).limit(10);

        const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: allSongs } = await supabase.from('songs').select('*').order('created_at', { ascending: false }).range(0, 1999);

        const pendingCount = (allSongs || []).filter(s => !s.is_verified && !s.is_denied).length;
        const { data: allSearchLogs } = await supabase.from('artist_search_counts').select('*').order('search_count', { ascending: false });
        
        const { data: dbArtists } = await supabase.from('artists').select('*');
        const { data: allFollows } = await supabase.from('following_artists').select('artist_name, artist_image');

        // --- COMMENTS METRICS ---
        const { data: allComments } = await supabase.from('song_comments').select('id, song_id, user_id, created_at').order('created_at', { ascending: false }).range(0, 1999);
        const totalComments = (allComments || []).length;
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        const commentsToday = (allComments || []).filter(c => new Date(c.created_at) >= todayStart).length;

        // Aggregate comment counts per song
        const commentCountBySong = {};
        (allComments || []).forEach(c => {
            const sid = c.song_id || 'unknown';
            commentCountBySong[sid] = (commentCountBySong[sid] || 0) + 1;
        });

        // Map to song details (from allSongs if available)
        const topCommentedSongs = Object.entries(commentCountBySong)
            .map(([song_id, count]) => {
                const song = (allSongs || []).find(s => String(s.id) === String(song_id));
                return { song_id, count, title: song?.title || 'Unknown', image_url: song?.image_url || null };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Top commenters
        const commentCountByUser = {};
        (allComments || []).forEach(c => {
            const uid = c.user_id || 'guest';
            commentCountByUser[uid] = (commentCountByUser[uid] || 0) + 1;
        });

        const topCommenters = Object.entries(commentCountByUser)
            .map(([user_id, count]) => {
                const u = (allUsers || []).find(x => String(x.id) === String(user_id));
                return { user_id, count, name: u?.full_name || 'Unknown' };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Get top liked songs using like_count column from songs table
        const topLikedSongs = (allSongs || [])
            .filter(song => song.like_count > 0)
            .map(song => ({
                song_id: song.id,
                count: song.like_count,
                title: song.title || 'Unknown',
                author: song.author || 'Unknown',
                image_url: song.image_url || null
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        const artistMap = {};
        (dbArtists || []).forEach(a => {
            const key = a.name.trim().toLowerCase();
            artistMap[key] = { ...a, originalName: a.name, followers: 0, inDB: true };
        });

        if (allFollows) {
            allFollows.forEach(item => {
                const key = item.artist_name.trim().toLowerCase();
                if (!artistMap[key]) {
                    artistMap[key] = { id: null, name: item.artist_name, originalName: item.artist_name, image_url: item.artist_image, created_at: new Date().toISOString(), followers: 0, inDB: false };
                }
                artistMap[key].followers += 1;
            });
        }

        const mergedArtists = Object.values(artistMap).sort((a, b) => b.followers - a.followers);

        setStats({ totalUsers: userCount || 0, totalSongs: songCount || 0, totalArtists: mergedArtists.length, totalComments: totalComments, commentsToday: commentsToday, topSongs: topSongs || [], topSearchedArtists: [], topCommentedSongs, topCommenters, topLikedSongs, pendingCount: pendingCount });

        setUsersList(allUsers || []);
        setAllSongsList(allSongs || []);
        setAllArtistsList(allSearchLogs || []);
        setFullArtistsList(mergedArtists || []);
        setPopularArtistsList(mergedArtists.slice(0, 5) || []);

    } catch (err) {
        console.error("System Error:", err);
        error("Failed to load dashboard data");
    }
  };

  // --- PRESENCE LOGIC ---
  // ĐÃ XÓA TOÀN BỘ useEffect Ở ĐÂY ĐỂ DÙNG USEAUTH
  // ----------------------------------------------

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role !== 'admin') { router.push("/"); return; }
      await fetchDashboardData();
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    // Lắng nghe thay đổi trực tiếp từ Database bảng profiles
    const profileSubscription = supabase
        .channel('public:profiles')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'profiles' 
        }, (payload) => {
            console.log(':: PROFILE_DATABASE_UPDATED ::', payload);
            
            // Cập nhật lại usersList cục bộ để không phải fetch lại toàn bộ
            setUsersList((currentList) => {
                if (payload.eventType === 'INSERT') return [payload.new, ...currentList];
                if (payload.eventType === 'UPDATE') {
                    return currentList.map(u => u.id === payload.new.id ? payload.new : u);
                }
                if (payload.eventType === 'DELETE') {
                    return currentList.filter(u => u.id !== payload.old.id);
                }
                return currentList;
            });
        })
        .subscribe();

    return () => {
        supabase.removeChannel(profileSubscription);
    };
    }, []);
    
  // --- FILTER LOGIC ---
  let displayedSongs = allSongsList;
  let songViewTitle = "Full_Database_Tracks";
  let songViewIcon = <Music size={16} className="text-purple-500"/>;

  if (currentView === 'songs_list') {
      displayedSongs = allSongsList;
      songViewTitle = "All Tracks (System + Users)";
  } else if (currentView === 'admin_uploads') {
      displayedSongs = allSongsList.filter(s => isAdminTrack(s));
      songViewTitle = "Admin & System Uploads";
      songViewIcon = <UploadCloud size={16} className="text-emerald-500"/>;
  } else if (currentView === 'user_uploads') {
      displayedSongs = allSongsList.filter(s => !isAdminTrack(s) && s.is_public);
      songViewTitle = "Public User Uploads";
      songViewIcon = <Globe size={16} className="text-blue-500"/>;
  }

  const filteredSongs = displayedSongs
    .filter((song) => (song.title || "").toLowerCase().includes(songSearchTerm.toLowerCase()) || (song.author || "").toLowerCase().includes(songSearchTerm.toLowerCase()))
    .sort((a, b) => {
        if (songSortType === 'plays') return (b.play_count || 0) - (a.play_count || 0);
        if (songSortType === 'likes') {
            // For likes sorting, use the like_count column directly from songs table
            return (b.like_count || 0) - (a.like_count || 0);
        }
        return new Date(b.created_at) - new Date(a.created_at);
    });

  const filteredArtists = fullArtistsList.filter((artist) => (artist.originalName || artist.name || "").toLowerCase().includes(artistSearchTerm.toLowerCase()));

  // --- HANDLERS ---
    const handleSyncMusic = async () => { if (!await confirm("Sync 100 tracks from API?", "SYNC")) return; setSyncing(true); try { const CLIENT_ID = '3501caaa'; let allTracks = []; const offsets = Array.from({ length: 5 }, (_, i) => i * 20); const responses = await Promise.all(offsets.map(offset => fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&include=musicinfo&order=popularity_week&offset=${offset}`).then(res => res.json()))); responses.forEach(data => { if (data.results) allTracks = [...allTracks, ...data.results]; }); if (allTracks.length > 0) { const songsToInsert = allTracks.map(track => ({ title: track.name, author: track.artist_name, song_url: track.audio, image_url: track.image, duration: track.duration, play_count: 0, is_public: true })); const { error: upsertError } = await supabase.from('songs').upsert(songsToInsert, { onConflict: 'song_url', ignoreDuplicates: true }); if (upsertError) throw upsertError; success("Synced successfully!"); await fetchDashboardData(); } } catch (e) { error(e.message); } finally { setSyncing(false); } };
    const handleSyncArtists = async () => { if (!await confirm("Update top 50 artists?", "SYNC")) return; setSyncingArtists(true); try { const CLIENT_ID = '3501caaa'; const res = await fetch(`https://api.jamendo.com/v3.0/artists/?client_id=${CLIENT_ID}&format=jsonpretty&limit=50&order=popularity_total`); const data = await res.json(); if (data.results) { const artistsToUpsert = data.results.map(artist => ({ name: artist.name, image_url: artist.image })); const { error: upsertError } = await supabase.from('artists').upsert(artistsToUpsert, { onConflict: 'name', ignoreDuplicates: true }); if (upsertError) throw upsertError; success("Artists synced!"); await fetchDashboardData(); } } catch (e) { error(e.message); } finally { setSyncingArtists(false); } };
    const handleResetArtists = async () => { if (!await confirm("Reset DB?", "RESET")) return; setResetting(true); try { await supabase.rpc('reset_artists_data'); success("Reset complete."); await fetchDashboardData(); } catch (e) { error(e.message); } finally { setResetting(false); } };
    const handleRestoreFollowed = async () => { if (!await confirm("Restore followed?", "RESTORE")) return; setRestoring(true); try { await supabase.rpc('restore_followed_artists'); success("Restored."); await fetchDashboardData(); } catch (e) { error(e.message); } finally { setRestoring(false); } };
    const handleCleanupSongs = async () => { if (!await confirm("Remove duplicates?", "CLEANUP")) return; setCleaning(true); try { await supabase.rpc('cleanup_duplicate_songs'); success("Songs cleaned."); await fetchDashboardData(); } catch (err) { error(err.message); } finally { setCleaning(false); } };
    const handleCleanupArtists = async () => { if (!await confirm("Remove duplicates?", "CLEANUP")) return; setCleaning(true); try { await supabase.rpc('cleanup_duplicate_artists'); success("Artists cleaned."); await fetchDashboardData(); } catch (err) { error(err.message); } finally { setCleaning(false); } };
    const handleDeleteUser = async (id) => {
    // 1. Xác nhận hành động
    if (!await confirm("PROTOCOL: PERMANENTLY_ERASE_USER_IDENTITY?", "CRITICAL_ACTION")) return;

    setLoading(true); // Bật loading nếu muốn (hoặc tạo state deleting riêng)
    
    try {
        // 2. Gọi hàm RPC đã tạo ở Bước 1
        const { error } = await supabase.rpc('delete_user_by_admin', { 
            target_user_id: id 
        });

        if (error) throw error;

        // 3. Thông báo thành công
        success("TARGET_ELIMINATED: User removed from System & Auth.");
        
        // 4. Cập nhật lại giao diện ngay lập tức (Optimistic Update)
        setUsersList(prev => prev.filter(u => u.id !== id));
        
        // 5. Fetch lại dữ liệu mới nhất để đồng bộ
        await fetchDashboardData();

    } catch (err) {
        console.error("Delete Error:", err);
        error(`EXECUTION_FAILED: ${err.message}`);
    } finally {
        setLoading(false);
    }
    };

    const handleDeleteSong = async (id) => { if(await confirm("Delete song?", "DELETE")) { await supabase.from('songs').delete().eq('id', id); success("Deleted."); fetchDashboardData(); } };
    const handleDeleteDbArtist = async (id) => { if (!id) return; if(await confirm("Delete artist?", "DELETE")) { await supabase.from('artists').delete().eq('id', id); success("Deleted."); fetchDashboardData(); } };

    const handleUpdateSong = async (songId, updates) => {
        try {
            const song = allSongsList.find(s => s.id === songId);
            if (!song) throw new Error("TRACK_NOT_FOUND");

            let finalUpdates = { ...updates };

            // 1. Xử lý Upload Lyrics nếu Admin có sửa nội dung trong Modal
            if (updates.new_lyrics_content) {
                const fileName = `lyric-mod-${songId}-${Date.now()}.srt`;
                const blob = new Blob([updates.new_lyrics_content], { type: 'text/plain' });
                
                const { error: uploadError } = await supabase.storage
                    .from('songs')
                    .upload(fileName, blob);
                    
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('songs')
                    .getPublicUrl(fileName);
                    
                finalUpdates.lyric_url = urlData.publicUrl;
            }

            // 2. Logic Phê duyệt (Approve)
            // Admin nhấn Approve từ Modal thường gửi updates.is_public = true
            if (updates.is_public === true || updates.is_verified === true) {
                finalUpdates.is_verified = true;
                finalUpdates.is_denied = false;

                // Thực thi dựa trên tín hiệu yêu cầu (pending_action) của User
                if (song.pending_action === 'set_private') {
                    finalUpdates.is_public = false; 
                } else {
                    // Mặc định cho 'upload' hoặc 'set_public'
                    finalUpdates.is_public = true; 
                }
                
                // Hoàn tất quy trình duyệt, xóa nhãn yêu cầu
                finalUpdates.pending_action = null; 
            }

            // 3. QUAN TRỌNG: Sửa lỗi "new_lyrics_content column not found"
            // Xóa tất cả các field "tạm" không tồn tại trong bảng 'songs' của Database
            delete finalUpdates.new_lyrics_content;
            // Nếu admin đánh dấu Deny, đảm bảo bài hát không còn public và không được coi là verified
            if (finalUpdates.is_denied === true) {
                finalUpdates.is_public = false;
                finalUpdates.is_verified = false;
                finalUpdates.pending_action = null;
            }

            // 4. Thực thi cập nhật Database
            const { error: dbError } = await supabase
                .from('songs')
                .update(finalUpdates)
                .eq('id', songId);

            if (dbError) throw dbError;

            success("PROTOCOL_EXECUTED: REQUEST_APPROVED.");
            await fetchDashboardData();
            setIsTrackModalOpen(false);
        } catch (err) {
            console.error("Moderation Error:", err);
            error(err.message || "Unknown error occurred during moderation.");
        }
    };

    const handleBulkAction = async (action) => {
            if (selectedSongIds.length === 0) return;
            const isApprove = action === 'approve';
            if (!await confirm(`Execute ${action} for ${selectedSongIds.length} signals?`, "BULK_PROTOCOL")) return;

            setLoading(true);
            try {
                for (const id of selectedSongIds) {
                    const song = allSongsList.find(s => s.id === id);
                    let updateBody = { is_verified: isApprove, is_denied: !isApprove, pending_action: null };
                    
                    if (isApprove) {
                        updateBody.is_public = song.pending_action !== 'set_private';
                    }

                    await supabase.from('songs').update(updateBody).eq('id', id);
                }
                success("BATCH_COMPLETE.");
                setSelectedSongIds([]);
                await fetchDashboardData();
            } catch (err) { error(err.message); } finally { setLoading(false); }
    };

    const totalMetrics = useMemo(() => {
        return allSongsList.reduce((acc, song) => {
            return {
            totalPlays: acc.totalPlays + (song.play_count || 0),
            totalLikes: acc.totalLikes + (song.like_count || 0),
            };
        }, { totalPlays: 0, totalLikes: 0 });
    }, [allSongsList]);

    const handleSelectAll = (filteredSongs) => {
        if (selectedSongIds.length === filteredSongs.length && filteredSongs.length > 0) {
        setSelectedSongIds([]);
        } else {
        setSelectedSongIds(filteredSongs.map(s => s.id));
        }
    };

    const handleChangeUserRole = async (id, newRole) => {
        if (!await confirm(`Set role to ${newRole}?`, 'SET_ROLE')) return;

        // Optimistic update (Cập nhật UI trước cho mượt)
        const prevUsers = usersList;
        setUsersList(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));

        try {
            // --- CÁCH CŨ (BỊ LỖI RLS) ---
            // const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);

            // --- CÁCH MỚI (DÙNG RPC) ---
            const { error } = await supabase.rpc('set_user_role', { 
                target_user_id: id, 
                new_role: newRole 
            });

            if (error) throw error;
            success('Role updated successfully.');
            
            // Refresh lại data để đảm bảo đồng bộ
            await fetchDashboardData();

        } catch (err) {
            console.error(err);
            // Revert lại UI nếu lỗi
            setUsersList(prevUsers);
            error(err.message || 'Failed to update role.');
        }
    };
  if (loading) return <AdminSkeleton />;
  const isSongTableView = ['songs_list', 'admin_uploads', 'user_uploads'].includes(currentView);

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-200 transition-colors duration-500 relative">
      {/* HEADER */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-300 dark:border-white/10 pb-4">
        <div>
            <h1 className="text-3xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] uppercase">
                <GlitchText text="Admin_Console" />
            </h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 tracking-[0.3em] font-mono mt-2 animate-pulse">:: ROOT_ACCESS_GRANTED ::</p>
        </div>
        
        {currentView === 'dashboard' && (
            <div className="flex gap-3 flex-wrap">
                <NeonButton onClick={handleSyncMusic} disabled={syncing} className="text-xs px-4 py-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-none">
                    {syncing ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} SYNC_API
                </NeonButton>
                <NeonButton onClick={handleSyncArtists} disabled={syncingArtists} className="text-xs px-4 py-2 border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-none">
                    {syncingArtists ? <Loader2 className="animate-spin" size={14}/> : <Mic2 size={14}/>} SYNC_ARTISTS
                </NeonButton>
                <NeonButton onClick={handleRestoreFollowed} disabled={restoring} className="text-xs px-4 py-2 border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-none">
                    {restoring ? <Loader2 className="animate-spin" size={14}/> : <ArchiveRestore size={14}/>} RESTORE
                </NeonButton>
                <GlitchButton onClick={handleResetArtists} disabled={resetting} className="text-xs px-4 py-2 border-red-500/50 text-red-600 dark:text-red-400 bg-red-500/10 dark:hover:!text-white rounded-none">
                    {resetting ? <Loader2 className="animate-spin" size={14}/> : <Skull size={14}/>} RESET_DB
                </GlitchButton>
            </div>
        )}
      </div>

      {/* ACTIVITY STREAM COMPONENT */}
      {currentView === 'dashboard' && (
            <ActivityStream 
                items={allSongsList} 
                getUploaderInfo={getUploaderInfo} 
                onUpdateSong={handleUpdateSong} // Thêm dòng này
            />
        )}

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <div className="animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* BLOCK 1: SYSTEM STATUS */}
                <CyberCard className="p-6 rounded-none border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Activity size={40} className="text-emerald-500/20"/></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <ArchiveRestore size={18} className="text-emerald-500"/> SYSTEM_STATUS
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">[ OK ] Active & Running</p>
                </CyberCard>

                {/* BLOCK 2: TOTAL USERS */}
                <CyberCard className="p-6 rounded-none border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Users size={40} className="text-blue-500/20"/></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <Users size={18} className="text-blue-500"/> TOTAL_USERS
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">
                        Registered Count: <span className="text-blue-600 dark:text-blue-400 font-bold text-lg ml-2">{stats.totalUsers}</span>
                    </p>
                </CyberCard>

                {/* BLOCK 3: PENDING QUEUES (Approval Module) */}
                <div 
                    className="cursor-pointer group" 
                    onClick={() => { 
                        setCurrentView('approval_module'); 
                        setApprovalFilter('pending'); 
                    }}
                >
                    <CyberCard className="h-full p-6 rounded-none border border-amber-500/30 bg-amber-500/5 group-hover:border-amber-500 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Clock size={48} className="text-amber-500"/>
                        </div>

                        <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 uppercase tracking-wide flex items-center gap-2">
                            <Activity size={18} className="text-amber-500"/> PENDING_QUEUES
                        </h3>
                        
                        <div className="flex items-end gap-2">
                            <p className="text-amber-600 dark:text-amber-400 font-mono font-bold text-3xl">
                                {stats.pendingCount || 0}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono mb-1 uppercase tracking-widest">
                                Signals_Awaiting_Review
                            </p>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-[9px] text-amber-600/60 font-mono uppercase group-hover:text-amber-500 transition-colors">
                            <span>Click to inspect protocol</span>
                            <div className="h-[1px] flex-1 bg-amber-500/20"></div>
                            <span>→</span>
                        </div>
                    </CyberCard>
                </div>

                {/* BLOCK 4: DB METRICS */}
                <CyberCard className="p-6 rounded-none border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 group hover:border-purple-500/50 transition-colors">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 uppercase tracking-wide">DB_METRICS</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono mb-4 border-b border-dashed border-neutral-300 dark:border-white/10 pb-2">
                        Songs: <span className="font-bold text-neutral-800 dark:text-white">{stats.totalSongs}</span> | Artists: <span className="font-bold text-neutral-800 dark:text-white">{stats.totalArtists}</span>
                    </p>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentView('songs_list')} className="flex-1 text-[9px] uppercase tracking-wider bg-purple-500/10 hover:bg-purple-500 text-purple-600 dark:text-purple-300 hover:!text-white px-2 py-1.5 rounded-none transition font-mono text-center border border-purple-500/20">ALL_SONGS</button>
                            <button onClick={() => setCurrentView('db_artists_list')} className="flex-1 text-[9px] uppercase tracking-wider bg-pink-500/10 hover:bg-pink-500 text-pink-600 dark:text-pink-300 hover:!text-white px-2 py-1.5 rounded-none transition font-mono text-center border border-pink-500/20">ALL_ARTISTS</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentView('admin_uploads')} className="flex-1 text-[9px] uppercase tracking-wider bg-yellow-500/10 hover:bg-yellow-500 text-yellow-600 dark:text-yellow-300 hover:!text-white px-2 py-1.5 rounded-none transition font-mono text-center flex items-center justify-center gap-1 border border-yellow-500/20">ADMIN_UPLOADS</button>
                            <button onClick={() => setCurrentView('user_uploads')} className="flex-1 text-[9px] uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-300 hover:!text-white px-2 py-1.5 rounded-none transition font-mono text-center flex items-center justify-center gap-1 border border-blue-500/20">USER_UPLOADS</button>
                        </div>

                    </div>
                </CyberCard>
            </div>

            {/* STATS TABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
                {/* 1. TOP_STREAMED */}
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none p-0 backdrop-blur-md overflow-hidden flex flex-col h-[418px]">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center shrink-0 h-[52px]">
                        <h4 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex gap-2 items-center">
                            <TrendingUp size={16} className="text-emerald-500" /> Top_Plays
                        </h4>
                        <button onClick={() => { setSongSortType('plays'); setCurrentView('songs_list'); }} className="text-[9px] text-emerald-600 dark:text-emerald-500 hover:underline font-mono uppercase">VIEW_ALL</button>
                    </div>
                    
                    {/* Phần thân: flex-1 kết hợp min-h-0 giúp đẩy footer xuống dưới cùng */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        {stats.topSongs?.slice(0, 5).map((s, i) => (
                            <div key={s.id} className="group flex justify-between items-center text-xs font-mono px-3 h-[64px] border-b border-dashed border-neutral-200 dark:border-white/5 hover:bg-emerald-500/10 transition-all cursor-crosshair">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-bold w-6 shrink-0 ${i < 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>#{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative flex items-center justify-center overflow-hidden">
                                        {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover" /> : <Music size={14} className="text-neutral-400" />}
                                        <ScanlineOverlay />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:text-emerald-500 transition-colors leading-tight">{s.title}</span>
                                        <span className="truncate text-[10px] text-neutral-500 opacity-70 leading-tight">{s.author}</span>
                                    </div>
                                </div>
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-500/20 px-2 py-0.5 text-[10px] shrink-0">{s.play_count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-2 border-t border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/5 flex justify-around items-center shrink-0 h-[44px]">
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Stream_Sum</p><p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{totalMetrics.totalPlays.toLocaleString()}</p></div>
                        <div className="h-4 w-[1px] bg-neutral-300 dark:border-white/10"></div>
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Realtime</p><p className="text-xs font-bold text-emerald-500 animate-pulse">LIVE</p></div>
                    </div>
                </CyberCard>

                {/* 2. TOP_ARTISTS */}
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none p-0 backdrop-blur-md overflow-hidden flex flex-col h-[418px]">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center shrink-0 h-[52px]">
                        <h4 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex gap-2 items-center"><Mic2 size={16} className="text-pink-500" /> Top_Artists</h4>
                        <button onClick={() => setCurrentView('db_artists_list')} className="text-[9px] text-pink-600 dark:text-pink-500 hover:underline font-mono uppercase">VIEW_ALL</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        {popularArtistsList.slice(0, 5).map((artist, i) => (
                            <div key={i} className="group flex justify-between items-center text-xs font-mono px-3 h-[64px] border-b border-dashed border-neutral-200 dark:border-white/5 hover:bg-pink-500/10 transition-all cursor-crosshair">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-bold w-6 shrink-0 ${i < 3 ? 'text-pink-600 dark:text-pink-400' : 'text-neutral-400'}`}>#{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative overflow-hidden flex items-center justify-center">
                                        {artist.image_url ? <img src={artist.image_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-neutral-400" />}
                                        <ScanlineOverlay />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:text-pink-500 transition-colors leading-tight">{artist.originalName}</span>
                                        {!artist.inDB && <span className="text-[8px] text-red-500 border border-red-500/30 px-1 w-fit mt-0.5">PENDING</span>}
                                    </div>
                                </div>
                                <span className="text-pink-700 dark:text-pink-400 font-bold bg-pink-100 dark:bg-pink-900/30 border border-pink-500/20 px-2 py-0.5 text-[10px] flex items-center gap-1 shrink-0"><Heart size={8} fill="currentColor" /> {artist.followers}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-2 border-t border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/5 flex justify-around items-center shrink-0 h-[44px]">
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Total_Entities</p><p className="text-xs font-bold text-pink-600 dark:text-pink-400">{stats.totalArtists || 0}</p></div>
                        <div className="h-4 w-[1px] bg-neutral-300 dark:border-white/10"></div>
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Sync_Req</p><p className="text-xs font-bold text-orange-500">{stats.totalArtists - stats.popularArtistsInDB || 0}</p></div>
                    </div>
                </CyberCard>

                {/* 3. TOP_COMMENTED */}
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none p-0 backdrop-blur-md overflow-hidden flex flex-col h-[418px]">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center shrink-0 h-[52px]">
                        <h4 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex gap-2 items-center"><MessageSquare size={16} className="text-sky-500" /> Top_Comments</h4>
                        <button onClick={() => router.push('/admin/comments')} className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline font-mono uppercase">VIEW_ALL</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        {stats.topCommentedSongs?.map((t, i) => (
                            <div key={t.song_id} className="group flex justify-between items-center text-xs font-mono px-3 h-[64px] border-b border-dashed border-neutral-200 dark:border-white/5 hover:bg-sky-500/10 transition-all cursor-crosshair">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-bold w-6 shrink-0 ${i < 3 ? 'text-sky-600 dark:text-sky-400' : 'text-neutral-400'}`}>#{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative overflow-hidden">
                                        {t.image_url ? <img src={t.image_url} alt="" className="w-full h-full object-cover" /> : <Music size={14} className="text-neutral-400" />}
                                        <ScanlineOverlay />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:text-sky-500 transition-colors leading-tight">{t.title}</span>
                                        <span className="text-[9px] opacity-70 uppercase leading-tight mt-0.5">ID:{String(t.song_id).slice(0,6)}</span>
                                    </div>
                                </div>
                                <span className="text-sky-700 dark:text-sky-400 font-bold bg-sky-100 dark:bg-sky-900/30 border border-sky-500/20 px-2 py-0.5 text-[10px] shrink-0">{t.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-2 border-t border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/5 flex justify-around items-center shrink-0 h-[44px]">
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Grand_Total</p><p className="text-xs font-bold text-sky-600 dark:text-sky-400">{stats.totalComments || 0}</p></div>
                        <div className="h-4 w-[1px] bg-neutral-300 dark:border-white/10"></div>
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">New_Today</p><p className="text-xs font-bold text-emerald-600">+{stats.commentsToday || 0}</p></div>
                    </div>
                </CyberCard>

                {/* 4. TOP_LIKED - Đã sửa lỗi Footer không xuống đáy */}
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none p-0 backdrop-blur-md overflow-hidden flex flex-col h-[418px]">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center shrink-0 h-[52px]">
                        <h4 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex gap-2 items-center"><Heart size={16} className="text-red-500" /> Top_Liked</h4>
                        <button onClick={() => { setSongSortType('likes'); setCurrentView('songs_list'); }} className="text-[9px] text-red-600 dark:text-red-500 hover:underline font-mono uppercase">VIEW_ALL</button>
                    </div>

                    {/* CỰC KỲ QUAN TRỌNG: flex-1 min-h-0 đảm bảo phần này chiếm hết diện tích còn lại */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                        {stats.topLikedSongs?.slice(0, 5).map((s, i) => (
                            <div key={s.song_id} className="group flex justify-between items-center text-xs font-mono px-3 h-[64px] border-b border-dashed border-neutral-200 dark:border-white/5 hover:bg-red-500/10 transition-all cursor-crosshair">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-bold w-6 shrink-0 ${i < 3 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`}>#{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative overflow-hidden">
                                        {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover" /> : <Music size={14} className="text-neutral-400" />}
                                        <ScanlineOverlay />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:!text-red-500 transition-colors leading-tight">{s.title}</span>
                                        <span className="truncate text-[10px] text-neutral-500 opacity-70 leading-tight">{s.author}</span>
                                    </div>
                                </div>
                                <span className="text-red-700 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 border border-red-500/20 px-2 py-0.5 text-[10px] flex items-center gap-1 shrink-0"><Heart size={8} fill="currentColor" /> {s.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* mt-auto là chốt chặn cuối cùng để footer luôn hít đáy */}
                    <div className="mt-auto p-2 border-t border-neutral-300 dark:border-white/10 bg-neutral-100/50 dark:bg-white/5 flex justify-around items-center shrink-0 h-[44px]">
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Hearts_Sum</p><p className="text-xs font-bold text-red-600 dark:text-red-400">{totalMetrics.totalLikes.toLocaleString()}</p></div>
                        <div className="h-4 w-[1px] bg-neutral-300 dark:border-white/10"></div>
                        <div className="text-center"><p className="text-[8px] text-neutral-500 uppercase font-mono">Trending</p><p className="text-xs font-bold text-orange-600 dark:text-orange-400">HOT</p></div>
                    </div>
                </CyberCard>
            </div>

            {/* USER TABLE */}
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
                {/* Header: Tối ưu khoảng cách trên mobile */}
                <div className="p-3 md:p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-xs md:text-sm uppercase tracking-wider flex items-center gap-2">
                        <List size={16} className="text-yellow-600 dark:text-yellow-500" /> 
                        <span className="hidden xs:inline">User_Manifest_Log</span>
                        <span className="xs:hidden">Users</span>
                    </h3>
                    <span className="text-[9px] md:text-[10px] text-neutral-500 font-mono bg-white dark:bg-black px-2 py-0.5 border border-neutral-300 dark:border-white/10">
                        COUNT: {usersList.length}
                    </span>
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {/* 1. MOBILE VIEW: Hiển thị dạng Card (Ẩn khi màn hình >= md) */}
                    <div className="block md:hidden divide-y divide-neutral-200 dark:divide-white/5">
                        {usersList.map((user) => {
                            // --- THAY ĐỔI: Sử dụng onlineUsers từ Context ---
                            const isOnline = Array.from(onlineUsers).some(id => String(id) === String(user.id));
                            // ------------------------------------------------
                            return (
                                <div key={user.id} className="p-4 flex flex-col gap-3 hover:bg-neutral-50 dark:hover:bg-white/5 transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 relative flex items-center justify-center shrink-0">
                                                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={16} />}
                                                {/* Dot trạng thái ngay góc avatar cho gọn */}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-neutral-900 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-neutral-400'}`}></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-neutral-800 dark:text-neutral-200 font-bold text-sm leading-tight">{user.full_name || "Unknown"}</span>
                                                <span className="text-[10px] text-neutral-500 font-mono uppercase mt-1">Joined: {new Date(user.created_at).toLocaleDateString('en-GB')}</span>
                                            </div>
                                        </div>
                                        {user.role !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-neutral-400 hover:text-red-500 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-neutral-200 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[9px] font-bold font-mono border ${user.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        {/* Dropdown Role cho Mobile */}
                                        <div className="relative group min-w-[100px]">
                                            {/* Label ẩn hoặc icon nhỏ phía trước nếu cần, ở đây tập trung vào select */}
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                                                className="
                                                    appearance-none w-full
                                                    bg-neutral-100/50 dark:bg-white/5 
                                                    border border-neutral-300 dark:border-white/10
                                                    group-hover:border-emerald-500/50 
                                                    focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20
                                                    text-neutral-800 dark:text-emerald-400
                                                    text-[10px] font-mono font-bold uppercase tracking-tighter
                                                    px-3 py-1.5 rounded-none
                                                    cursor-pointer transition-all duration-300
                                                    outline-none
                                                "
                                            >
                                                <option value="user" className="bg-white dark:bg-[#0a0a0a] text-neutral-800 dark:text-white">
                                                    // ACCESS: USER
                                                </option>
                                                <option value="admin" className="bg-white dark:bg-[#0a0a0a] text-red-500 font-bold">
                                                    // ACCESS: ADMIN
                                                </option>
                                            </select>

                                            {/* Custom Arrow với hiệu ứng của theme */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none 
                                                            text-neutral-400 group-hover:text-emerald-500 transition-colors">
                                                <ChevronDown size={12} strokeWidth={3} />
                                            </div>

                                            {/* Đường line trang trí phía dưới (Glow effect khi hover) */}
                                            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 
                                                            group-hover:w-full transition-all duration-500 shadow-[0_0_8px_#10b981]"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 2. DESKTOP VIEW: Bảng Table chuẩn (Ẩn khi màn hình < md) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400 border-collapse">
                            <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 backdrop-blur-md border-b border-neutral-300 dark:border-white/10 z-10">
                                <tr>
                                    <th className="px-6 py-4">Identity</th>
                                    <th className="px-6 py-4 text-center">Role_Configuration</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date_Joined</th>
                                    <th className="px-6 py-4 text-right">Cmd</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                                {usersList.map((user) => {
                                    // --- THAY ĐỔI: Sử dụng onlineUsers từ Context ---
                                    const isOnline = Array.from(onlineUsers).some(id => String(id) === String(user.id));
                                    // ------------------------------------------------
                                    return (
                                        <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition group">
                                            <td className="px-6 py-3 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 overflow-hidden shrink-0 relative">
                                                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User size={12} className="m-auto mt-2"/>}
                                                </div>
                                                <span className="text-neutral-800 dark:text-neutral-200 font-bold truncate max-w-[150px]">{user.full_name || "Unknown"}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className={`min-w-[60px] text-center px-2 py-0.5 text-[9px] uppercase border font-bold ${user.role === 'admin' ? 'border-red-500/30 text-red-600' : 'border-emerald-500/30 text-emerald-600'}`}>
                                                        {user.role}
                                                    </span>
                                                    <div className="relative group min-w-[100px]">
                                                        {/* Label ẩn hoặc icon nhỏ phía trước nếu cần, ở đây tập trung vào select */}
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                                                            className="
                                                                !appearance-none w-full
                                                                bg-neutral-100/50 dark:bg-white/5 
                                                                border border-neutral-300 dark:border-white/10
                                                                group-hover:border-emerald-500/50 
                                                                focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20
                                                                text-neutral-800 dark:text-emerald-400
                                                                text-[10px] font-mono font-bold uppercase tracking-tighter
                                                                px-3 py-1.5 rounded-none
                                                                cursor-pointer transition-all duration-300
                                                                outline-none
                                                            "
                                                        >
                                                            <option value="user" className="bg-white dark:bg-[#0a0a0a] text-neutral-800 dark:text-white">
                                                                // ACCESS: USER
                                                            </option>
                                                            <option value="admin" className="bg-white dark:bg-[#0a0a0a] text-red-500 font-bold">
                                                                // ACCESS: ADMIN
                                                            </option>
                                                        </select>

                                                        {/* Custom Arrow với hiệu ứng của theme */}
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none 
                                                                            text-neutral-400 group-hover:text-emerald-500 transition-colors">
                                                            <ChevronDown size={12} strokeWidth={3} />
                                                        </div>

                                                        {/* Đường line trang trí phía dưới (Glow effect khi hover) */}
                                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-emerald-500 
                                                                        group-hover:w-full transition-all duration-500 shadow-[0_0_8px_#10b981]"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className={`flex items-center gap-1.5 font-bold text-[9px] ${isOnline ? 'text-emerald-500' : 'text-neutral-400'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></div>
                                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 opacity-60 text-[10px]">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                                            <td className="px-6 py-3 text-right">
                                                {user.role !== 'admin' && (
                                                    <button onClick={() => handleDeleteUser(user.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-500 transition p-2">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CyberCard>
        </div>
      )}

        {/* SONG TABLES */}
        {isSongTableView && (
            /* Thêm w-full và overflow-hidden ở div bao ngoài cùng */
            <div className="w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 p-2 duration-500">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <button 
                        onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} 
                        className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest border border-transparent hover:border-neutral-500 px-3 py-1 transition-all"
                    >
                        <ArrowLeft size={14}/> RETURN_TO_BASE
                    </button>

                    {songSortType !== 'likes' && (
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex bg-neutral-200 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none p-1 shrink-0">
                                <button onClick={() => setSongSortType('plays')} className={`px-3 py-1 text-[10px] rounded-none font-mono uppercase transition ${songSortType === 'plays' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>Top_Plays</button>
                                <button onClick={() => setSongSortType('date')} className={`px-3 py-1 text-[10px] rounded-none font-mono uppercase transition ${songSortType === 'date' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>Newest_Uploads</button>
                            </div>
                            {currentView === 'songs_list' && <GlitchButton onClick={handleCleanupSongs} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 dark:hover:!text-white px-4 py-2 text-xs rounded-none shrink-0">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} CLEANUP</GlitchButton>}
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14}/>
                                <input
                                    value={songSearchTerm}
                                    onChange={(e) => setSongSearchTerm(e.target.value)}
                                    placeholder="SEARCH_TRACK_DB..."
                                    className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none pl-10 pr-4 py-2 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-purple-500 transition-colors uppercase"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center">
                        <h3 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2">{songViewIcon} {songViewTitle}</h3>
                        <span className="text-[10px] text-neutral-500 font-mono bg-white dark:bg-black px-2 border border-neutral-300 dark:border-white/10 shrink-0">Records: {filteredSongs.length}</span>
                    </div>

                    {/* Container cuộn ngang: Ép w-full và overflow-x-auto */}
                    <div className="w-full overflow-x-auto custom-scrollbar max-h-[600px]">
                        {/* min-w-[800px] đảm bảo bảng không bị bóp quá hẹp trên mobile, gây tràn text */}
                        <table className="w-full min-w-[800px] text-left text-xs font-mono text-neutral-600 dark:text-neutral-400 table-fixed">
                            <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md border-b border-neutral-300 dark:border-white/10">
                                {songSortType === 'likes' ? (
                                    <tr>
                                        <th className="px-6 py-3 w-[40%]">Track_ID</th>
                                        <th className="px-6 py-3 w-[30%]">Artist</th>
                                        <th className="px-6 py-3 w-[15%]">Likes</th>
                                        <th className="px-6 py-3 w-[15%] text-right">Action</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="px-6 py-3 w-[25%]">Track_ID</th>
                                        <th className="px-6 py-3 w-[18%]">Artist</th>
                                        <th className="px-6 py-3 w-[12%]">Uploader</th>
                                        <th className="px-6 py-3 w-[12%]">Status</th>
                                        <th className="px-6 py-3 w-[8%]">Plays</th>
                                        <th className="px-6 py-3 w-[8%]">Likes</th>
                                        <th className="px-6 py-3 w-[10%] text-right">Cmd</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                                {filteredSongs.map((song) => {
                                    const uploader = getUploaderInfo(song.user_id);
                                    return (
                                        <tr key={song.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition group">
                                            {songSortType === 'likes' ? (
                                                <>
                                                    <td className="px-6 py-3 align-middle">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden shrink-0 relative">
                                                                {song.image_url ? (
                                                                    <img src={song.image_url} className="w-full h-full object-cover" alt=""/>
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-neutral-400"><Music size={12}/></div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0 overflow-hidden">
                                                                <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold block" title={song.title}>
                                                                    {song.title}
                                                                </span>
                                                                <span className="text-[10px] text-neutral-500 truncate opacity-60">
                                                                    ID: {String(song.id).slice(0, 8)}...
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle uppercase truncate max-w-[150px]" title={song.author}>
                                                        {song.author}
                                                    </td>
                                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                        <span className="text-red-600 dark:text-red-500 font-bold bg-red-500/10 px-2 flex items-center gap-1">
                                                            <Heart size={10} fill="currentColor" /> {song.like_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right align-middle shrink-0">
                                                        <button 
                                                            onClick={() => { setSelectedSongForLikes(song); setIsLikedUsersModalOpen(true); }}
                                                            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-3 align-middle">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden shrink-0 relative">
                                                                {song.image_url ? (
                                                                    <img src={song.image_url} className="w-full h-full object-cover" alt=""/>
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-neutral-400"><Music size={12}/></div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0 overflow-hidden">
                                                                <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold block" title={song.title}>
                                                                    {song.title}
                                                                </span>
                                                                <span className="text-[10px] text-neutral-500 truncate opacity-60">
                                                                    ID: {String(song.id).slice(0, 8)}...
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle uppercase truncate max-w-[150px]" title={song.author}>
                                                        {song.author}
                                                    </td>
                                                    <td className="px-6 py-3 align-middle">
                                                        <div className="max-w-[120px] truncate">
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-none border font-bold uppercase ${uploader.role === 'admin' ? 'border-yellow-500/30 text-yellow-600 bg-yellow-500/5' : 'border-blue-500/30 text-blue-600 bg-blue-500/5'}`}>
                                                                {uploader.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle font-bold text-[10px] uppercase whitespace-nowrap">
                                                        {song.is_denied ? (
                                                            <span className="text-red-500 flex items-center gap-1"><Lock size={12}/> DENIED</span>
                                                        ) : song.is_public ? (
                                                            <span className="text-emerald-500 flex items-center gap-1"><Globe size={12}/> PUB</span>
                                                        ) : (
                                                            <span className="text-amber-500 flex items-center gap-1"><Clock size={12}/> PEND</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                        <span className="text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-500/10 px-2">
                                                            {song.play_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                        {song.like_count > 0 ? (
                                                            <span className="text-red-600 dark:text-red-500 font-bold bg-red-500/10 px-2 flex items-center gap-1">
                                                                <Heart size={10} fill="currentColor" /> {song.like_count}
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400 font-mono text-[10px]">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-right align-middle shrink-0">
                                                        <div className="flex justify-end items-center gap-1">
                                                            <button 
                                                                onClick={() => { setSelectedSong(song); setIsTrackModalOpen(true); }}
                                                                className="p-2 text-neutral-400 hover:text-emerald-500 transition-colors"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteSong(song.id)}
                                                                className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CyberCard>
            </div>
        )}

        {currentView === 'approval_module' && (() => {
            // Tiền xử lý danh sách bài hát dựa trên Tab và Tìm kiếm
            const currentFilteredSongs = allSongsList.filter(song => {
                // 1. Logic tìm kiếm (giữ nguyên)
                const matchesSearch = 
                    (song.title || "").toLowerCase().includes((songSearchTerm || "").toLowerCase()) || 
                    (song.author || "").toLowerCase().includes((songSearchTerm || "").toLowerCase());
                if (!matchesSearch) return false;

                // 2. Logic Filter theo Tab (QUAN TRỌNG NHẤT)
                if (approvalFilter === 'pending') {
                    // Hiện những bài chưa được duyệt (is_verified = false) và chưa bị từ chối
                    return song.is_verified === false && song.is_denied === false;
                }
                if (approvalFilter === 'approved') {
                    // Hiện những bài đã duyệt (is_verified = true)
                    return song.is_verified === true;
                }
                if (approvalFilter === 'denied') {
                    // Hiện những bài đã bị từ chối
                    return song.is_denied === true;
                }
                return true;
            });

            return (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {/* TOP BAR: Back Button & Search */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <button 
                            onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); setSelectedSongIds([]); }} 
                            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest border border-transparent hover:border-neutral-500 px-3 py-1 transition-all"
                        >
                            <ArrowLeft size={14}/> RETURN_TO_BASE
                        </button>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14}/>
                            <input 
                                value={songSearchTerm} 
                                onChange={(e) => setSongSearchTerm(e.target.value)} 
                                placeholder="SEARCH_IN_PENDING..." 
                                className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none pl-10 pr-4 py-2 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-emerald-500 transition-colors uppercase placeholder:text-[10px]"
                            />
                        </div>
                    </div>

                    {/* BULK TOOLBAR & FILTERS */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-neutral-100 dark:bg-white/5 p-2 border border-neutral-300 dark:border-white/10">
                        <div className="flex gap-2">
                            {['pending', 'approved', 'denied'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => { setApprovalFilter(tab); setSelectedSongIds([]); }}
                                    className={`px-4 py-2 text-[10px] font-mono uppercase transition-all ${
                                        approvalFilter === tab 
                                        ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Bulk Actions Menu */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleSelectAll(currentFilteredSongs)}
                                className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-500 hover:underline"
                            >
                                {selectedSongIds.length === currentFilteredSongs.length ? "[ UNSELECT_ALL ]" : "[ SELECT_ALL_VISIBLE ]"}
                            </button>
                            
                            {selectedSongIds.length > 0 && (
                                <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                                    <button 
                                        onClick={() => handleBulkAction('approve')}
                                        className="bg-emerald-500 text-black px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-emerald-400"
                                    >
                                        APPROVE ({selectedSongIds.length})
                                    </button>
                                    <button 
                                        onClick={() => handleBulkAction('deny')}
                                        className="bg-red-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-red-500"
                                    >
                                        DENY
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danh sách Card bài hát */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {currentFilteredSongs.map((song) => {
                            const isSelected = selectedSongIds.includes(song.id);
                            
                            // Lấy thông tin nhãn yêu cầu (Action Label)
                            const actionInfo = getActionLabel(song.pending_action);
                            // Lấy thông tin người upload/ yêu cầu để hiển thị cho admin
                            const requester = getUploaderInfo(song.user_id);

                            return (
                                <div 
                                    key={song.id} 
                                    className={`relative bg-white dark:bg-neutral-900 border transition-all duration-300 p-4 group ${
                                        isSelected 
                                        ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                        : 'border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/30'
                                    }`}
                                >
                                    {/* 1. Bảng thông báo yêu cầu (Góc trên bên phải) */}
                                    <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                                        <span className={`text-[8px] font-mono px-2 py-0.5 border font-bold tracking-tighter ${actionInfo.color} shadow-sm`}>
                                            {actionInfo.label}
                                        </span>
                                        {/* Người yêu cầu (uploader) */}
                                        <span className="text-[9px] font-mono text-neutral-700 dark:text-neutral-300 bg-white dark:bg-black/20 px-2 py-0.5 uppercase border border-neutral-200 dark:border-white/10">
                                            Requested: {requester?.name || 'Unknown'}
                                        </span>
                                        {/* Badge trạng thái phụ để Admin biết hiện tại bài đang là gì */}
                                        <span className="text-[7px] font-mono text-neutral-500 bg-neutral-100 dark:bg-white/5 px-1 uppercase border border-neutral-300 dark:border-white/10">
                                            Current: {song.is_public ? 'Public' : 'Private'}
                                        </span>
                                    </div>

                                    {/* Checkbox Layer (Click vào phần trống của Card để chọn) */}
                                    <div 
                                        className="absolute top-0 left-0 w-full h-full z-10 cursor-pointer" 
                                        onClick={() => {
                                            setSelectedSongIds(prev => 
                                                isSelected ? prev.filter(id => id !== song.id) : [...prev, song.id]
                                            );
                                        }}
                                    />

                                    <div className="flex gap-4 relative z-0">
                                        {/* 2. Custom Checkbox UI */}
                                        <div className={`absolute -top-2 -left-2 w-5 h-5 border flex items-center justify-center z-20 transition-colors ${
                                            isSelected ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white dark:bg-black border-neutral-400 dark:border-white/20'
                                        }`}>
                                            {isSelected && <CheckCircle2 size={14} />}
                                        </div>

                                        <div className="w-16 h-16 bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-white/10 overflow-hidden relative shrink-0">
                                            <img src={song.image_url} className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'grayscale-0 scale-110' : 'grayscale group-hover:grayscale-0'}`} />
                                            <ScanlineOverlay />
                                        </div>

                                        <div className="min-w-0 flex-1 flex flex-col justify-center pr-16"> {/* pr-16 để tránh đè lên nhãn yêu cầu */}
                                            <h4 className={`font-bold font-mono text-sm truncate uppercase tracking-tighter transition-colors ${isSelected ? 'text-emerald-500' : 'text-neutral-900 dark:text-white'}`}>
                                                {song.title}
                                            </h4>
                                            <p className="text-neutral-500 text-[10px] font-mono truncate">{song.author}</p>
                                            
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[8px] text-neutral-400 font-mono bg-neutral-100 dark:bg-white/5 px-1 border border-neutral-200 dark:border-white/10">
                                                    ID: {String(song.id).slice(0, 8)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Nút Inspect - Nổi lên trên cùng (z-20) */}
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSelectedSong(song); 
                                            setIsTrackModalOpen(true); 
                                        }}
                                        className="relative z-20 w-full mt-4 bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 hover:bg-emerald-500/20 text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] font-mono py-2 uppercase flex items-center justify-center gap-2 transition-all shadow-sm"
                                    >
                                        <Eye size={12}/> Inspect_Protocol
                                    </button>
                                    
                                    {/* 4. Thanh trạng thái dọc ở cạnh trái (Màu sắc theo is_verified/is_denied) */}
                                    <div className={`absolute top-0 left-0 w-[2px] h-full ${
                                        song.is_denied ? 'bg-red-500' : song.is_verified ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {currentFilteredSongs.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-neutral-300 dark:border-white/10">
                            <p className="font-mono text-neutral-500 uppercase text-xs tracking-widest">No_Signals_In_This_Sector</p>
                        </div>
                    )}
                </div>
            );
        })()}

        {/* VIEW: DB ARTISTS LIST */}
        {currentView === 'db_artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest border border-transparent hover:border-neutral-500 px-3 py-1 transition-all"><ArrowLeft size={14}/> RETURN</button>
                <div className="flex items-center gap-4">
                    <GlitchButton onClick={handleCleanupArtists} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 dark:hover:!text-white px-4 py-2 text-xs rounded-none">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} CLEANUP_DB</GlitchButton>
                    <div className="relative w-64"><Search className="absolute left-2 top-2 text-neutral-500" size={12}/><input value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} placeholder="SEARCH_ARTIST..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none pl-8 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-pink-500 placeholder:text-[10px]"/></div>
                </div>
            </div>
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 sticky top-0 backdrop-blur-md uppercase tracking-widest border-b border-neutral-300 dark:border-white/10"><tr><th className="px-4 py-3">Artist_Entity</th><th className="px-4 py-3">Follow_Count</th><th className="px-4 py-3 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredArtists.map((artist, i) => (
                                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition">
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 overflow-hidden border border-neutral-300 dark:border-white/10 relative flex items-center justify-center">
                                            {artist.image_url ? <img src={artist.image_url} className="w-full h-full object-cover"/> : <User size={14} className="text-neutral-400"/>}
                                        </div>
                                        <div className="flex flex-col"><span className="text-neutral-800 dark:text-neutral-200 font-bold uppercase">{artist.originalName}</span>{!artist.inDB && <span className="text-[8px] text-red-500 dark:text-red-400 border border-red-500/20 px-1 w-fit">SYNC_REQ</span>}</div>
                                    </td>
                                    <td className="px-4 py-3"><span className="text-pink-600 dark:text-pink-500 font-bold">{artist.followers}</span></td>
                                    <td className="px-4 py-3 text-right">{artist.id && <button onClick={() => handleDeleteDbArtist(artist.id)} className="hover:text-red-500 p-2"><Trash2 size={14}/></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
        )}

      <div className="mt-10 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-none flex items-center gap-3">
         <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={20} />
         <p className="text-xs text-yellow-700 dark:text-yellow-500/80 font-mono tracking-widest">WARNING: RESTRICTED AREA. UNAUTHORIZED ACTIONS ARE LOGGED.</p>
      </div>

      <TrackDetailModal 
            song={selectedSong} 
            isOpen={isTrackModalOpen} 
            onClose={() => setIsTrackModalOpen(false)}
            onUpdate={handleUpdateSong}
            getUploaderInfo={getUploaderInfo}
        />

      <LikedUsersModal 
            song={selectedSongForLikes} 
            isOpen={isLikedUsersModalOpen} 
            onClose={() => setIsLikedUsersModalOpen(false)}
        />
    </div>
  );
}

export default AdminDashboard;