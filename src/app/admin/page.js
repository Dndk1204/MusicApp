"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { 
  ShieldAlert, UploadCloud, Users, Trash2, TrendingUp, 
  Search, Loader2, RefreshCw, Music, ArrowLeft, Eraser, Mic2, Heart,
  Globe, Lock, Star, ArrowDownWideNarrow, ArchiveRestore, Skull, Activity 
} from "lucide-react";
import useUI from "@/hooks/useUI";
import useUploadModal from "@/hooks/useUploadModal"; 
import UploadModal from "@/components/UploadModal"; 
// Import Cyber Components
import { GlitchButton, HoloButton, GlitchText, CyberCard } from "@/components/CyberComponents";

// --- COMPONENT SKELETON ---
const AdminSkeleton = () => (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black animate-pulse">
       <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-300 dark:border-white/10 pb-6">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-neutral-300 dark:bg-white/10 rounded"></div>
                <div className="h-3 w-32 bg-neutral-200 dark:bg-white/5 rounded"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-8 w-24 bg-neutral-300 dark:bg-white/10 rounded"></div>
                <div className="h-8 w-24 bg-neutral-300 dark:bg-white/10 rounded"></div>
            </div>
       </div>
       {/* Stream Skeleton */}
       <div className="h-20 w-full bg-neutral-200 dark:bg-white/5 rounded-xl mb-8"></div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-xl p-6 h-32"></div>
            ))}
       </div>
       <div className="bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-xl h-64"></div>
    </div>
);

// --- COMPONENT: ACTIVITY STREAM (DÒNG SÔNG LỊCH SỬ - UPDATED UI) ---
const ActivityStream = ({ items, getUploaderInfo }) => {
    const recentItems = items.slice(0, 20);
    const streamItems = [...recentItems, ...recentItems];

    if (items.length === 0) return null;

    return (
        <div className="w-full mb-10 relative group overflow-hidden py-6"> {/* Tăng padding Y */}
            {/* Tiêu đề nhỏ */}
            <div className="absolute top-0 left-2 z-20 text-[10px] font-mono text-emerald-500 uppercase tracking-widest bg-neutral-100 dark:bg-black px-2 rounded border border-emerald-500/20">
                :: Live_Upload_History ::
            </div>

            {/* Gradient mờ */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-100 dark:from-neutral-900 to-transparent z-10 pointer-events-none"/>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-100 dark:from-neutral-900 to-transparent z-10 pointer-events-none"/>
            
            {/* Container trôi */}
            <div className="flex gap-6 animate-flow-right w-max hover:[animation-play-state:paused] px-4">
                {streamItems.map((song, idx) => {
                    const uploader = getUploaderInfo(song.user_id);
                    return (
                         <div key={`${song.id}-${idx}`} className="flex flex-col gap-3 p-4 bg-white/80 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl min-w-[280px] max-w-[280px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-md hover:border-emerald-500/50 group/card">
                             
                             {/* Phần trên: Ảnh & Info */}
                             <div className="flex items-start gap-4 h-14">
                                 <div className="w-14 h-14 rounded-xl bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative shrink-0 border border-neutral-300 dark:border-white/10 shadow-inner group-hover/card:scale-105 transition-transform">
                                     {song.image_url ? (
                                        <img src={song.image_url} className="w-full h-full object-cover" alt={song.title}/>
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400"><Music size={20}/></div>
                                     )}
                                 </div>
                                 
                                 <div className="flex flex-col min-w-0 flex-1 justify-center h-14">
                                     <span className="text-sm font-bold font-mono truncate text-neutral-900 dark:text-white group-hover/card:text-emerald-500 transition-colors" title={song.title}>
                                        {song.title}
                                     </span>
                                     <Link 
                                        href={`/artist/${encodeURIComponent(song.author)}`}
                                        className="text-xs text-neutral-500 truncate hover:text-emerald-500 dark:hover:text-emerald-400 hover:underline transition-colors z-20 relative w-fit"
                                        onClick={(e) => e.stopPropagation()} // Tránh click nhầm vào card nếu sau này card có sự kiện click
                                     >
                                        {song.author}
                                     </Link>
                                 </div>
                             </div>

                             {/* Phần dưới: Uploader Info (Avatar + Name + Time) */}
                             <div className="flex justify-between items-center pt-3 border-t border-dashed border-neutral-300 dark:border-white/10 mt-1">
                                 <div className="flex items-center gap-2">
                                     {/* Avatar Người Upload */}
                                     <div className={`w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center ${uploader.role === 'admin' ? 'border-yellow-500 bg-yellow-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
                                         {uploader.avatar_url ? (
                                             <img src={uploader.avatar_url} alt={uploader.name} className="w-full h-full object-cover"/>
                                         ) : (
                                             uploader.role === 'admin' ? <ShieldAlert size={12} className="text-yellow-600 dark:text-yellow-500"/> : <Users size={12} className="text-blue-600 dark:text-blue-500"/>
                                         )}
                                     </div>
                                     
                                     <div className="flex flex-col">
                                         <span className={`text-[9px] font-bold uppercase leading-none ${uploader.role === 'admin' ? 'text-yellow-700 dark:text-yellow-500' : 'text-blue-700 dark:text-blue-400'}`}>
                                             {uploader.name.split(' ')[0]}
                                         </span>
                                         <span className="text-[8px] text-neutral-400 leading-none mt-0.5">
                                             {uploader.role}
                                         </span>
                                     </div>
                                 </div>

                                 <span className="text-[9px] text-neutral-400 font-mono bg-neutral-100 dark:bg-black/30 px-1.5 py-0.5 rounded">
                                    {new Date(song.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', month: '2-digit', day: '2-digit', year: '2-digit'})}
                                 </span>
                             </div>
                        </div>
                    )
                })}
            </div>

            <style jsx>{`
                @keyframes flowRight {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                .animate-flow-right {
                    animation: flowRight 100s linear infinite;
                }
            `}</style>
        </div>
    )
}

const AdminDashboard = () => {
  const router = useRouter();
  const { alert, confirm } = useUI();
  const uploadModal = useUploadModal(); 
  
  const success = (msg) => alert(msg, 'success', 'SUCCESS');
  const error = (msg) => alert(msg, 'error', 'ERROR');

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingArtists, setSyncingArtists] = useState(false); 
  const [cleaning, setCleaning] = useState(false); 
  const [resetting, setResetting] = useState(false);
  const [restoring, setRestoring] = useState(false); 
  
  const [currentView, setCurrentView] = useState('dashboard');

  const [stats, setStats] = useState({
    totalUsers: 0, totalSongs: 0, totalArtists: 0,
    topSongs: [], topSearchedArtists: [],
  });
  
  const [usersList, setUsersList] = useState([]);
  const [allSongsList, setAllSongsList] = useState([]); 
  const [allArtistsList, setAllArtistsList] = useState([]); 
  const [fullArtistsList, setFullArtistsList] = useState([]); 
  const [popularArtistsList, setPopularArtistsList] = useState([]); 

  const [songSearchTerm, setSongSearchTerm] = useState("");
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [songSortType, setSongSortType] = useState('date'); 

  // --- HELPER ---
  const getUploaderInfo = (userId) => {
      if (!userId) return { name: 'System', role: 'admin', avatar_url: null }; // System mặc định không avatar hoặc icon
      
      const user = usersList.find(u => u.id === userId);
      
      if (user) {
          return { 
              name: user.full_name || 'Unknown', 
              role: user.role || 'user',
              avatar_url: user.avatar_url // Thêm trường này
          };
      }
      
      return { name: 'Deleted User', role: 'unknown', avatar_url: null };
  };

  const isAdminTrack = (song) => {
      if (!song.user_id) return true; 
      const info = getUploaderInfo(song.user_id);
      return info.role === 'admin';
  };

  const fetchDashboardData = async () => {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        
        const { data: topSongs } = await supabase.from('songs').select('id, title, author, play_count').order('play_count', { ascending: false }).limit(10);
        
        const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: allSongs } = await supabase.from('songs').select('*').order('created_at', { ascending: false }).range(0, 1999); 
        const { data: allSearchLogs } = await supabase.from('artist_search_counts').select('*').order('search_count', { ascending: false });
        
        const { data: dbArtists } = await supabase.from('artists').select('*');
        const { data: allFollows } = await supabase.from('following_artists').select('artist_name, artist_image');
        
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

        setStats({ 
            totalUsers: userCount || 0, 
            totalSongs: songCount || 0, 
            totalArtists: mergedArtists.length, 
            topSongs: topSongs || [], 
            topSearchedArtists: [] // Bỏ dùng
        });
        
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

  useEffect(() => {
      if (!uploadModal.isOpen) {
          fetchDashboardData();
      }
  }, [uploadModal.isOpen]);

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

  // --- FILTER LOGIC ---
  let displayedSongs = allSongsList;
  let songViewTitle = "Full_Database_Tracks";
  let songViewIcon = <Music size={16} className="text-purple-500"/>;

  if (currentView === 'songs_list') {
      displayedSongs = allSongsList;
      songViewTitle = "All Tracks (System + Users)";
      songViewIcon = <Music size={16} className="text-purple-500"/>;
  } 
  else if (currentView === 'admin_uploads') {
      displayedSongs = allSongsList.filter(s => isAdminTrack(s));
      songViewTitle = "Admin & System Uploads";
      songViewIcon = <UploadCloud size={16} className="text-emerald-500"/>;
  } 
  else if (currentView === 'user_uploads') {
      displayedSongs = allSongsList.filter(s => !isAdminTrack(s) && s.is_public);
      songViewTitle = "Public User Uploads";
      songViewIcon = <Globe size={16} className="text-blue-500"/>;
  }

  const filteredSongs = displayedSongs
    .filter((song) => 
      (song.title || "").toLowerCase().includes(songSearchTerm.toLowerCase()) ||
      (song.author || "").toLowerCase().includes(songSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
        if (songSortType === 'plays') return (b.play_count || 0) - (a.play_count || 0);
        return new Date(b.created_at) - new Date(a.created_at);
    });

  const filteredArtists = fullArtistsList.filter((artist) => (artist.originalName || artist.name || "").toLowerCase().includes(artistSearchTerm.toLowerCase()));
  const filteredSearchLogs = allArtistsList.filter((log) => (log.artist_name || "").toLowerCase().includes(artistSearchTerm.toLowerCase()));

  // --- HANDLERS (Giữ nguyên các hàm xử lý logic) ---
  const handleSyncMusic = async () => { if (!await confirm("Sync 100 tracks from API?", "SYNC")) return; setSyncing(true); try { const CLIENT_ID = '3501caaa'; let allTracks = []; const offsets = Array.from({ length: 5 }, (_, i) => i * 20); const responses = await Promise.all(offsets.map(offset => fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&include=musicinfo&order=popularity_week&offset=${offset}`).then(res => res.json()))); responses.forEach(data => { if (data.results) allTracks = [...allTracks, ...data.results]; }); if (allTracks.length > 0) { const songsToInsert = allTracks.map(track => ({ title: track.name, author: track.artist_name, song_url: track.audio, image_url: track.image, duration: track.duration, play_count: 0, is_public: true })); const { error: upsertError } = await supabase.from('songs').upsert(songsToInsert, { onConflict: 'song_url', ignoreDuplicates: true }); if (upsertError) throw upsertError; success("Synced successfully!"); await fetchDashboardData(); } } catch (e) { error(e.message); } finally { setSyncing(false); } };
  const handleSyncArtists = async () => { if (!await confirm("Update top 50 artists?", "SYNC")) return; setSyncingArtists(true); try { const CLIENT_ID = '3501caaa'; const res = await fetch(`https://api.jamendo.com/v3.0/artists/?client_id=${CLIENT_ID}&format=jsonpretty&limit=50&order=popularity_total`); const data = await res.json(); if (data.results) { const artistsToUpsert = data.results.map(artist => ({ name: artist.name, image_url: artist.image })); const { error: upsertError } = await supabase.from('artists').upsert(artistsToUpsert, { onConflict: 'name', ignoreDuplicates: true }); if (upsertError) throw upsertError; success("Artists synced!"); await fetchDashboardData(); } } catch (e) { error(e.message); } finally { setSyncingArtists(false); } };
  const handleResetArtists = async () => { if (!await confirm("Reset DB?", "RESET")) return; setResetting(true); try { await supabase.rpc('reset_artists_data'); success("Reset complete."); await fetchDashboardData(); } catch (e) { error(e.message); } finally { setResetting(false); } };
  const handleRestoreFollowed = async () => { if (!await confirm("Restore followed?", "RESTORE")) return; setRestoring(true); try { await supabase.rpc('restore_followed_artists'); success("Restored."); await fetchDashboardData(); } catch (e) { error(e.message); } finally { setRestoring(false); } };
  const handleCleanupSongs = async () => { if (!await confirm("Remove duplicates?", "CLEANUP")) return; setCleaning(true); try { await supabase.rpc('cleanup_duplicate_songs'); success("Songs cleaned."); await fetchDashboardData(); } catch (err) { error(err.message); } finally { setCleaning(false); } };
  const handleCleanupArtists = async () => { if (!await confirm("Remove duplicates?", "CLEANUP")) return; setCleaning(true); try { await supabase.rpc('cleanup_duplicate_artists'); success("Artists cleaned."); await fetchDashboardData(); } catch (err) { error(err.message); } finally { setCleaning(false); } };
  const handleDeleteUser = async (id) => { if(await confirm("Delete user?", "DELETE")) { await supabase.from('profiles').delete().eq('id', id); success("Deleted."); fetchDashboardData(); } };
  const handleDeleteSong = async (id) => { if(await confirm("Delete song?", "DELETE")) { await supabase.from('songs').delete().eq('id', id); success("Deleted."); fetchDashboardData(); } };
  const handleDeleteSearch = async (name) => { if(await confirm(`Clear history?`, "DELETE")) { await supabase.from('artist_search_counts').delete().eq('artist_name', name); success("Cleared."); fetchDashboardData(); } };
  const handleDeleteDbArtist = async (id) => { if (!id) return; if(await confirm("Delete artist?", "DELETE")) { await supabase.from('artists').delete().eq('id', id); success("Deleted."); fetchDashboardData(); } };

  if (loading) return <AdminSkeleton />;

  const isSongTableView = ['songs_list', 'admin_uploads', 'user_uploads'].includes(currentView);

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-200 transition-colors duration-500 relative">
      
      {/* --- HIỂN THỊ MODAL UPLOAD --- */}
      <UploadModal />

      {/* HEADER */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-300 dark:border-white/10 pb-4">
        <div>
            <h1 className="text-3xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                <GlitchText text="Admin Dashboard" />
            </h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 tracking-[0.3em] font-mono mt-2 animate-pulse">:: ROOT_ACCESS_GRANTED ::</p>
        </div>
        
        {currentView === 'dashboard' && (
            <div className="flex gap-3 flex-wrap">
                {/* NÚT UPLOAD */}
                <button 
                    onClick={() => uploadModal.onOpen()}
                    className="group flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2 rounded hover:bg-emerald-500 hover:text-black transition disabled:opacity-50 font-mono shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                >
                    <UploadCloud size={14}/> UPLOAD SONG
                </button>
                
                <HoloButton onClick={handleSyncMusic} disabled={syncing} className="bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2">
                    {syncing ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} SYNC_API
                </HoloButton>
                <HoloButton onClick={handleSyncArtists} disabled={syncingArtists} className="bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 text-xs px-4 py-2">
                    {syncingArtists ? <Loader2 className="animate-spin" size={14}/> : <Mic2 size={14}/>} SYNC_ARTISTS
                </HoloButton>
                <HoloButton onClick={handleRestoreFollowed} disabled={restoring} className="bg-purple-500/10 border-purple-500/50 text-purple-600 dark:text-purple-400 text-xs px-4 py-2">
                    {restoring ? <Loader2 className="animate-spin" size={14}/> : <ArchiveRestore size={14}/>} RESTORE
                </HoloButton>
                <GlitchButton onClick={handleResetArtists} disabled={resetting} className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 text-xs px-4 py-2">
                    {resetting ? <Loader2 className="animate-spin" size={14}/> : <Skull size={14}/>} RESET
                </GlitchButton>
            </div>
        )}
      </div>

      {/* --- NEW: HISTORY STREAM (Dòng sông lịch sử) --- */}
      {currentView === 'dashboard' && (
         <ActivityStream items={allSongsList} getUploaderInfo={getUploaderInfo} />
      )}

      {/* VIEW 1: DASHBOARD STATS */}
      {currentView === 'dashboard' && (
        <div className="animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Content Status */}
                <CyberCard className="p-6 rounded-2xl border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 flex items-center gap-2">
                        <ArchiveRestore size={18} className="text-emerald-500"/> SYSTEM STATUS
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">
                        System Active. No Critical Errors.
                    </p>
                </CyberCard>

                {/* Card 2: Users */}
                <CyberCard className="p-6 rounded-2xl border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 flex items-center gap-2">
                        <Users size={18} className="text-blue-500"/> USERS
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">
                        Total Registered: <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.totalUsers}</span>
                    </p>
                </CyberCard>

                {/* Card 3: Database & Uploads */}
                <CyberCard className="p-6 rounded-2xl border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 group hover:border-purple-500/50">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">DATABASE_METRICS</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono mb-3">Songs: {stats.totalSongs} | Artists: {stats.totalArtists}</p>
                    <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button onClick={() => setCurrentView('songs_list')} className="flex-1 text-[10px] bg-purple-500/10 hover:bg-purple-500 text-purple-600 dark:text-purple-300 hover:text-white px-2 py-1.5 rounded transition font-mono text-center">ALL SONGS</button>
                            <button onClick={() => setCurrentView('db_artists_list')} className="flex-1 text-[10px] bg-pink-500/10 hover:bg-pink-500 text-pink-600 dark:text-pink-300 hover:text-white px-2 py-1.5 rounded transition font-mono text-center">ALL ARTISTS</button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setCurrentView('admin_uploads')} className="flex-1 text-[10px] bg-yellow-500/10 hover:bg-yellow-500 text-yellow-600 dark:text-yellow-300 hover:text-black px-2 py-1.5 rounded transition font-mono text-center flex items-center justify-center gap-1">
                                <Star size={10}/> ADMIN
                            </button>
                            <button onClick={() => setCurrentView('user_uploads')} className="flex-1 text-[10px] bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-300 hover:text-white px-2 py-1.5 rounded transition font-mono text-center flex items-center justify-center gap-1">
                                <Globe size={10}/> USER
                            </button>
                          </div>
                    </div>
                </CyberCard>
            </div>

            {/* STATS SECTIONS (Đã bỏ Top Searched) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl p-5 backdrop-blur-md">
                    <h4 className="text-neutral-900 dark:text-white font-mono text-sm mb-4 flex gap-2"><TrendingUp size={16} className="text-emerald-500"/> Top_Streamed_Tracks</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {stats.topSongs.map((s,i)=>(
                            <div key={s.id} className="flex justify-between text-xs font-mono border-b border-neutral-200 dark:border-white/5 pb-2">
                                <span className="truncate w-40 text-neutral-700 dark:text-neutral-300">{i+1}. {s.title}</span>
                                <span className="text-emerald-600 dark:text-emerald-500 font-bold">{s.play_count}</span>
                            </div>
                        ))}
                    </div>
                </CyberCard>
                
                <CyberCard className="relative bg-white/60 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl p-5 hover:border-pink-500/30 transition backdrop-blur-md">
                    <h4 className="text-neutral-900 dark:text-white font-mono text-sm mb-4 flex gap-2"><Mic2 size={16} className="text-pink-500"/> Most_Followed_Artists</h4>
                    <div className="space-y-3">
                        {popularArtistsList.slice(0, 5).map((artist, i) => (
                            <div key={i} className="flex justify-between items-center text-xs font-mono border-b border-neutral-200 dark:border-white/5 pb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-pink-600 dark:text-pink-500 font-bold">#{i+1}</span>
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                                        {artist.image_url && <img src={artist.image_url} className="w-full h-full object-cover"/>}
                                    </div>
                                    <span className="text-neutral-700 dark:text-neutral-300 truncate w-24">{artist.originalName}</span>
                                    {!artist.inDB && <span className="text-[8px] text-red-500 dark:text-red-400 ml-1">Sync Needed</span>}
                                </div>
                                <span className="text-[10px] text-pink-600 dark:text-pink-500 flex items-center gap-1"><Heart size={10} fill="currentColor"/> {artist.followers}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setCurrentView('db_artists_list')} className="absolute top-4 right-4 text-[10px] text-blue-600 dark:text-blue-500 hover:underline">VIEW ALL</button>
                </CyberCard>
            </div>

            {/* USER TABLE */}
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-white/5 flex justify-between items-center"><h3 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2"><Users size={16} className="text-yellow-600 dark:text-yellow-500"/> User_Manifest_Log</h3><span className="text-[10px] text-neutral-500 font-mono">Count: {usersList.length}</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest"><tr><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {usersList.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition">
                                    <td className="px-6 py-4 flex items-center gap-3 align-middle"><div className="w-8 h-8 rounded bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 overflow-hidden flex items-center justify-center">{user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <Users size={12}/>}</div><div className="flex flex-col"><span className="text-neutral-800 dark:text-neutral-200">{user.full_name || "Unknown"}</span>{user.phone && <span className="text-[10px] text-neutral-500 dark:text-neutral-600">{user.phone}</span>}</div></td>
                                    <td className="px-6 py-4 align-middle"><span className={`px-2 py-1 rounded text-[10px] border ${user.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}`}>{user.role}</span></td>
                                    <td className="px-6 py-4 opacity-60 align-middle">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 text-right align-middle">{user.role !== 'admin' && (<button onClick={() => handleDeleteUser(user.id)} className="text-neutral-500 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      {/* VIEW: SONG TABLES (Giữ nguyên logic bảng bài hát) */}
      {isSongTableView && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* ... Code bảng bài hát giữ nguyên từ file cũ của bạn ... */}
             {/* (Để tiết kiệm dòng, tôi chỉ render placeholder ở đây, bạn copy lại phần bảng bài hát từ code cũ nếu cần, 
                  hoặc nếu bạn muốn tôi paste lại toàn bộ phần đó hãy nói nhé. 
                  Nhưng logic chính là phần Dashboard view ở trên đã được cập nhật) */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-sm group">
                    <ArrowLeft size={16}/> RETURN_TO_BASE
                </button>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-neutral-200 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-lg p-1">
                          <button onClick={() => setSongSortType('plays')} className={`px-3 py-1 text-[10px] rounded font-mono transition ${songSortType === 'plays' ? 'bg-purple-500 text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>Top Plays</button>
                          <button onClick={() => setSongSortType('date')} className={`px-3 py-1 text-[10px] rounded font-mono transition ${songSortType === 'date' ? 'bg-purple-500 text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>Newest</button>
                    </div>
                    {currentView === 'songs_list' && <GlitchButton onClick={handleCleanupSongs} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 px-4 py-2 text-xs">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} CLEANUP</GlitchButton>}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16}/>
                        <input value={songSearchTerm} onChange={(e) => setSongSearchTerm(e.target.value)} placeholder="SEARCH_TRACK..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-purple-500"/>
                        {songSearchTerm && <button onClick={() => setSongSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><Eraser size={14}/></button>}
                    </div>
                </div>
            </div>
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-100 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2">{songViewIcon} {songViewTitle}</h3>
                    <span className="text-[10px] text-neutral-500 font-mono">Showing: {filteredSongs.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-100 dark:bg-black/40 text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr><th className="px-6 py-4">Track</th><th className="px-6 py-4">Artist</th><th className="px-6 py-4">Uploader</th><th className="px-6 py-4">Privacy</th><th className="px-6 py-4">Plays <ArrowDownWideNarrow size={12} className="inline"/></th><th className="px-6 py-4 text-right">Cmd</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredSongs.map((song) => {
                                const uploader = getUploaderInfo(song.user_id);
                                return (
                                    <tr key={song.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition">
                                        <td className="px-6 py-4 flex items-center gap-3 align-middle"><div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex-shrink-0">{song.image_url ? <img src={song.image_url} className="w-full h-full object-cover"/> : <Music size={12}/>}</div><span className="text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">{song.title}</span></td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 align-middle">{song.author}</td>
                                        <td className="px-6 py-4 align-middle"><span className={`text-[9px] px-2 py-0.5 rounded border ${uploader.role === 'admin' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}>{uploader.name}</span></td>
                                        <td className="px-6 py-4 align-middle">{song.is_public ? <span className="flex items-center gap-1 text-blue-500"><Globe size={12}/> Public</span> : <span className="flex items-center gap-1 text-red-500"><Lock size={12}/> Private</span>}</td>
                                        <td className="px-6 py-4 align-middle"><span className="text-emerald-600 dark:text-emerald-500 font-bold">{song.play_count}</span></td>
                                        <td className="px-6 py-4 text-right align-middle"><button onClick={() => handleDeleteSong(song.id)} className="text-neutral-500 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      {/* VIEW 3: ARTISTS LOGS (Giữ nguyên) */}
      {currentView === 'artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => { setCurrentView('dashboard'); setArtistSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-sm"><ArrowLeft size={14}/> BACK</button>
                <div className="relative w-64"><Search className="absolute left-2 top-2 text-neutral-500" size={12}/><input value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} placeholder="Search Logs..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded pl-8 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-blue-500"/></div>
            </div>
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-100 dark:bg-black/40 text-neutral-500 sticky top-0 backdrop-blur-md"><tr><th className="px-6 py-4">Keyword</th><th className="px-6 py-4">Count</th><th className="px-6 py-4 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredSearchLogs.map((artist, i) => (
                                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-white/5"><td className="px-6 py-4"><span className="text-neutral-800 dark:text-neutral-200 font-bold">{artist.artist_name}</span></td><td className="px-6 py-4 text-blue-600 dark:text-blue-400">{artist.search_count}</td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteSearch(artist.artist_name)} className="hover:text-red-500"><Trash2 size={16} /></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      {/* VIEW 4: DB ARTISTS LIST (Giữ nguyên) */}
      {currentView === 'db_artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white text-xs font-mono"><ArrowLeft size={14}/> BACK</button>
                <div className="flex items-center gap-4">
                    <GlitchButton onClick={handleCleanupArtists} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 px-4 py-2 text-xs">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} CLEANUP</GlitchButton>
                    <div className="relative w-64"><Search className="absolute left-2 top-2 text-neutral-500" size={12}/><input value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} placeholder="Search Artist..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded pl-8 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-pink-500"/></div>
                </div>
            </div>
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-100 dark:bg-black/40 text-neutral-500 sticky top-0 backdrop-blur-md"><tr><th className="px-4 py-2">Artist</th><th className="px-4 py-2">Followers</th><th className="px-4 py-2 text-right">Action</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredArtists.map((artist, i) => (
                                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-white/5">
                                    <td className="px-4 py-2 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">{artist.image_url && <img src={artist.image_url} className="w-full h-full object-cover"/>}</div>
                                        <div className="flex flex-col"><span className="text-neutral-800 dark:text-neutral-200 font-bold">{artist.originalName}</span>{!artist.inDB && <span className="text-[8px] text-red-500 dark:text-red-400">Sync Needed</span>}</div>
                                    </td>
                                    <td className="px-4 py-2"><span className="text-pink-600 dark:text-pink-500 font-bold">{artist.followers}</span></td>
                                    <td className="px-4 py-2 text-right">{artist.id && <button onClick={() => handleDeleteDbArtist(artist.id)} className="hover:text-red-500"><Trash2 size={14}/></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      <div className="mt-10 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-center gap-3">
         <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={20} />
         <p className="text-xs text-yellow-700 dark:text-yellow-500/80 font-mono">WARNING: Authorized personnel only. All actions are logged.</p>
      </div>
    </div>
  );
}

export default AdminDashboard;