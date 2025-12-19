"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { 
  ShieldAlert, UploadCloud, Users, Trash2, TrendingUp, 
  Search, Loader2, RefreshCw, Music, ArrowLeft, Eraser, Mic2, Heart,
  Globe, Lock, Star, ArrowDownWideNarrow, ArchiveRestore, Skull, Activity, List, User, Wifi, WifiOff
} from "lucide-react";
import useUI from "@/hooks/useUI";
import useUploadModal from "@/hooks/useUploadModal"; 
import UploadModal from "@/components/UploadModal"; 
// Import Cyber Components
import { GlitchButton, CyberButton, GlitchText, CyberCard, NeonButton, ScanlineOverlay } from "@/components/CyberComponents";
// Import Hover Preview
import HoverImagePreview from "@/components/HoverImagePreview"; 

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

// --- COMPONENT: ACTIVITY STREAM ---
const ActivityStream = ({ items, getUploaderInfo }) => {
    const recentItems = items.slice(0, 20);
    const streamItems = recentItems.length < 10 
        ? [...recentItems, ...recentItems, ...recentItems, ...recentItems] 
        : [...recentItems, ...recentItems];

    if (items.length === 0) return null;

    return (
        <div className="w-full mb-10 relative group overflow-hidden py-6 border-y border-dashed border-neutral-300 dark:border-white/10 bg-neutral-50/50 dark:bg-white/5">
            <div className="absolute top-3 left-2 z-20 text-[9px] font-mono text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-white dark:bg-black px-2 border border-emerald-500/20 -translate-y-1/2 pointer-events-none">
                :: Live_Upload_Stream ::
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-100 dark:from-black to-transparent z-10 pointer-events-none"/>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-100 dark:from-black to-transparent z-10 pointer-events-none"/>
            
            <div className="flex gap-4 animate-flow-right w-max px-4 stream-track">
                {streamItems.map((song, idx) => {
                    const uploader = getUploaderInfo(song.user_id);
                    return (
                          <div key={`${song.id}-${idx}`} className="flex flex-col gap-2 p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 rounded-none w-[280px] shadow-sm hover:border-emerald-500 transition-colors group/card relative">
                             
                             <div className="flex items-start gap-3">
                                 <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative shrink-0 border border-neutral-300 dark:border-white/10 group-hover/card:border-emerald-500 transition-colors cursor-none">
                                     <HoverImagePreview 
                                        src={song.image_url} 
                                        alt={song.title}
                                        audioSrc={song.song_url} 
                                        className="w-full h-full"
                                        previewSize={200}
                                     >
                                         <div className="w-full h-full relative flex items-center justify-center">
                                              {song.image_url ? (
                                                 <img src={song.image_url} className="w-full h-full object-cover grayscale group-hover/card:grayscale-0 transition-all duration-500" alt={song.title}/>
                                              ) : (
                                                 <div className="w-full h-full flex items-center justify-center text-neutral-400"><Music size={16}/></div>
                                              )}
                                              <ScanlineOverlay />
                                         </div>
                                     </HoverImagePreview>
                                 </div>
                                 
                                 <div className="flex flex-col min-w-0 flex-1 justify-center">
                                     <span className="text-xs font-bold font-mono truncate text-neutral-900 dark:text-white uppercase group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-500 transition-colors" title={song.title}>
                                         {song.title}
                                     </span>
                                     <Link 
                                        href={`/artist/${encodeURIComponent(song.author)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] text-neutral-500 truncate font-mono hover:underline hover:text-emerald-500"
                                     >
                                         {song.author}
                                     </Link>
                                 </div>
                             </div>

                             <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200 dark:border-white/10 mt-1">
                                 <div className="flex items-center gap-2">
                                     <div className={`w-5 h-5 rounded-none overflow-hidden border flex items-center justify-center ${uploader.role === 'admin' ? 'border-yellow-500 bg-yellow-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
                                         {uploader.avatar_url ? (
                                             <img src={uploader.avatar_url} alt={uploader.name} className="w-full h-full object-cover"/>
                                         ) : (
                                             <User size={12} className={uploader.role === 'admin' ? 'text-yellow-600' : 'text-blue-600'}/>
                                         )}
                                     </div>

                                     <div className="flex flex-col">
                                         <span className={`text-[9px] font-bold uppercase leading-none ${uploader.role === 'admin' ? 'text-yellow-700 dark:text-yellow-500' : 'text-blue-700 dark:text-blue-400'}`}>
                                             {uploader.name.split(' ')[0]}
                                         </span>
                                         <span className="text-[8px] text-neutral-400 leading-none scale-90 origin-top-left">
                                             ID:{song.user_id ? song.user_id.slice(0,4) : 'SYS'}
                                         </span>
                                     </div>
                                 </div>

                                 <span className="text-[9px] text-neutral-400 font-mono bg-neutral-100 dark:bg-white/5 px-1">
                                     {new Date(song.created_at).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}
                                 </span>
                             </div>
                          </div>
                    )
                })}
            </div>

            <style jsx>{`
                @keyframes flowRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                .animate-flow-right { animation: flowRight 120s linear infinite; }
                .group:hover .stream-track { animation-play-state: paused !important; }
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
  const [stats, setStats] = useState({ totalUsers: 0, totalSongs: 0, totalArtists: 0, topSongs: [], topSearchedArtists: [] });
  
  const [usersList, setUsersList] = useState([]);
  const [allSongsList, setAllSongsList] = useState([]); 
  const [allArtistsList, setAllArtistsList] = useState([]); 
  const [fullArtistsList, setFullArtistsList] = useState([]); 
  const [popularArtistsList, setPopularArtistsList] = useState([]); 

  const [songSearchTerm, setSongSearchTerm] = useState("");
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [songSortType, setSongSortType] = useState('date'); 

  // --- ONLINE STATUS STATE ---
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // --- HELPER ---
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

  const fetchDashboardData = async () => {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        const { data: topSongs } = await supabase.from('songs').select('id, title, author, play_count, image_url').order('play_count', { ascending: false }).limit(10);
        
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

        setStats({ totalUsers: userCount || 0, totalSongs: songCount || 0, totalArtists: mergedArtists.length, topSongs: topSongs || [], topSearchedArtists: [] });
        
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
      if (!uploadModal.isOpen) fetchDashboardData();
  }, [uploadModal.isOpen]);

  // --- PRESENCE LOGIC (MERGED & FIXED) ---
  useEffect(() => {
    // 1. Tạo kênh
    const channel = supabase.channel('online-users', {
        config: { presence: { key: 'admin-dashboard' } },
    });

    // 2. Lắng nghe trạng thái
    channel
        .on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            const onlineIds = new Set();
            
            // Duyệt qua tất cả presence để lấy user_id
            for (const id in newState) {
                const users = newState[id];
                users.forEach(u => {
                    if (u.user_id) onlineIds.add(u.user_id);
                });
            }
            setOnlineUsers(onlineIds);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // 3. Track chính Admin (để user khác biết Admin đang online)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await channel.track({ user_id: user.id, online_at: new Date().toISOString(), role: 'admin' });
                }
            }
        });

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

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
        return new Date(b.created_at) - new Date(a.created_at);
    });

  const filteredArtists = fullArtistsList.filter((artist) => (artist.originalName || artist.name || "").toLowerCase().includes(artistSearchTerm.toLowerCase()));
  const filteredSearchLogs = allArtistsList.filter((log) => (log.artist_name || "").toLowerCase().includes(artistSearchTerm.toLowerCase()));

  // --- HANDLERS (Giữ nguyên) ---
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
      <UploadModal />
      
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
                <CyberButton onClick={() => uploadModal.onOpen()} className="flex items-center gap-2 text-xs py-2 px-4 h-auto rounded-none">
                    <UploadCloud size={14}/> UPLOAD_SONG
                </CyberButton>
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

      {currentView === 'dashboard' && <ActivityStream items={allSongsList} getUploaderInfo={getUploaderInfo} />}

      {/* DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <div className="animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <CyberCard className="p-6 rounded-none border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Activity size={40} className="text-emerald-500/20"/></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <ArchiveRestore size={18} className="text-emerald-500"/> SYSTEM_STATUS
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">[ OK ] Active & Running</p>
                </CyberCard>

                <CyberCard className="p-6 rounded-none border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><Users size={40} className="text-blue-500/20"/></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 flex items-center gap-2 uppercase tracking-wide">
                        <Users size={18} className="text-blue-500"/> TOTAL_USERS
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">
                        Registered Count: <span className="text-blue-600 dark:text-blue-400 font-bold text-lg ml-2">{stats.totalUsers}</span>
                    </p>
                </CyberCard>

                <CyberCard className="p-6 rounded-none border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 group hover:border-purple-500/50 transition-colors">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 uppercase tracking-wide">DB_METRICS</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono mb-4 border-b border-dashed border-neutral-300 dark:border-white/10 pb-2">
                        Songs: <span className="font-bold text-neutral-800 dark:text-white">{stats.totalSongs}</span> | Artists: <span className="font-bold text-neutral-800 dark:text-white">{stats.totalArtists}</span>
                    </p>
                    <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button onClick={() => setCurrentView('songs_list')} className="flex-1 text-[9px] uppercase tracking-wider bg-purple-500/10 hover:bg-purple-500 text-purple-600 dark:text-purple-300 hover:text-white px-2 py-1.5 rounded-none transition font-mono text-center border border-purple-500/20">ALL_SONGS</button>
                            <button onClick={() => setCurrentView('db_artists_list')} className="flex-1 text-[9px] uppercase tracking-wider bg-pink-500/10 hover:bg-pink-500 text-pink-600 dark:text-pink-300 hover:text-white px-2 py-1.5 rounded-none transition font-mono text-center border border-pink-500/20">ALL_ARTISTS</button>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setCurrentView('admin_uploads')} className="flex-1 text-[9px] uppercase tracking-wider bg-yellow-500/10 hover:bg-yellow-500 text-yellow-600 dark:text-yellow-300 hover:text-black px-2 py-1.5 rounded-none transition font-mono text-center flex items-center justify-center gap-1 border border-yellow-500/20"><Star size={10}/> ADMIN_UPLOADS</button>
                            <button onClick={() => setCurrentView('user_uploads')} className="flex-1 text-[9px] uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500 text-blue-600 dark:text-blue-300 hover:text-white px-2 py-1.5 rounded-none transition font-mono text-center flex items-center justify-center gap-1 border border-blue-500/20"><Globe size={10}/> USER_UPLOADS</button>
                          </div>
                    </div>
                </CyberCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* TOP SONGS */}
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none p-0 backdrop-blur-md overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center shrink-0">
                        <h4 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex gap-2 items-center">
                            <TrendingUp size={16} className="text-emerald-500" /> Top_5_Streamed
                        </h4>
                        <button onClick={() => { setSongSortType('plays'); setCurrentView('songs_list'); }} className="text-[9px] text-emerald-600 dark:text-emerald-500 hover:underline font-mono uppercase">VIEW_FULL</button>
                    </div>
                    <div className="p-0 overflow-y-auto custom-scrollbar">
                        {stats.topSongs.slice(0, 5).map((s, i) => (
                            <div key={s.id} className="group flex justify-between items-center text-xs font-mono p-3 border-b border-dashed border-neutral-200 dark:border-white/5 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition-colors relative">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-bold w-6 shrink-0 ${i < 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`}>#{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative flex items-center justify-center overflow-hidden">
                                        {s.image_url ? <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" /> : <Music size={14} className="text-neutral-400" />}
                                        <ScanlineOverlay />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={s.title}>{s.title}</span>
                                        <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">{s.author}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-2 shrink-0">
                                    <div className="h-[1px] w-4 bg-emerald-500/30 hidden sm:block"></div>
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 text-[10px]">{s.play_count}</span>
                                </div>
                            </div>
                        ))}
                        {stats.topSongs.length === 0 && <div className="p-4 text-center text-neutral-400 italic text-[10px]">No data available</div>}
                    </div>
                </CyberCard>

                {/* TOP ARTISTS */}
                <CyberCard className="bg-white/60 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none p-0 backdrop-blur-md overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center shrink-0">
                        <h4 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex gap-2 items-center">
                            <Mic2 size={16} className="text-pink-500" /> Top_5_Artists
                        </h4>
                        <button onClick={() => setCurrentView('db_artists_list')} className="text-[9px] text-pink-600 dark:text-pink-500 hover:underline font-mono uppercase">VIEW_FULL</button>
                    </div>
                    <div className="p-0 overflow-y-auto custom-scrollbar">
                        {popularArtistsList.slice(0, 5).map((artist, i) => (
                            <div key={i} className="group flex justify-between items-center text-xs font-mono p-3 border-b border-dashed border-neutral-200 dark:border-white/5 hover:bg-pink-500/5 dark:hover:bg-pink-500/10 transition-colors relative">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`text-[10px] font-bold w-6 shrink-0 ${i < 3 ? 'text-pink-600 dark:text-pink-400' : 'text-neutral-400'}`}>#{String(i + 1).padStart(2, '0')}</span>
                                    {/* FIX: Centering for Artist Image */}
                                    <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full flex items-center justify-center">
                                            {artist.image_url ? <img src={artist.image_url} alt={artist.originalName} className="w-full h-full object-cover" /> : <User size={14} className="text-neutral-400" />}
                                        </div>
                                        <ScanlineOverlay />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{artist.originalName}</span>
                                        {!artist.inDB && <span className="text-[8px] text-red-500 dark:text-red-400 border border-red-500/30 px-1 w-fit mt-0.5">SYNC_REQ</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-2 shrink-0">
                                    <div className="h-[1px] w-4 bg-pink-500/30 hidden sm:block"></div>
                                    <span className="text-pink-700 dark:text-pink-400 font-bold bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-500/20 px-2 py-0.5 text-[10px] flex items-center gap-1"><Heart size={8} fill="currentColor" /> {artist.followers}</span>
                                </div>
                            </div>
                        ))}
                        {popularArtistsList.length === 0 && <div className="p-4 text-center text-neutral-400 italic text-[10px]">No artist data</div>}
                    </div>
                </CyberCard>
            </div>

            {/* USER TABLE */}
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2"><List size={16} className="text-yellow-600 dark:text-yellow-500"/> User_Manifest_Log</h3>
                    <span className="text-[10px] text-neutral-500 font-mono bg-white dark:bg-black px-2 border border-neutral-300 dark:border-white/10">Count: {usersList.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 backdrop-blur-md border-b border-neutral-300 dark:border-white/10">
                            <tr><th className="px-6 py-3">Identity</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Date_Joined</th><th className="px-6 py-3 text-right">Cmd</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {usersList.map((user) => {
                                const isOnline = onlineUsers.has(user.id);
                                return (
                                    <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition">
                                        <td className="px-6 py-3 flex items-center gap-3 align-middle">
                                            {/* HOVER PREVIEW CHO USER LIST */}
                                            <div className="w-8 h-8 rounded-none bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 cursor-none relative">
                                                <HoverImagePreview src={user.avatar_url} alt={user.full_name} className="w-full h-full" previewSize={200} fallbackIcon="user">
                                                    <div className="w-full h-full relative flex items-center justify-center">
                                                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <Users size={12} className="text-neutral-400"/>}
                                                        <ScanlineOverlay />
                                                    </div>
                                                </HoverImagePreview>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-neutral-800 dark:text-neutral-200 font-bold">{user.full_name || "Unknown"}</span>
                                                {user.phone && <span className="text-[10px] text-neutral-500 dark:text-neutral-600 tracking-wider">{user.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 align-middle">
                                            <span className={`px-2 py-0.5 rounded-none text-[9px] uppercase border font-bold ${user.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 align-middle">
                                            {isOnline ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
                                                    <span className="text-[9px] font-bold tracking-wider">ONLINE</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-neutral-400">
                                                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-700 rounded-full"></div>
                                                    <span className="text-[9px] font-bold tracking-wider">OFFLINE</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 opacity-60 align-middle">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                                        <td className="px-6 py-3 text-right align-middle">
                                            {user.role !== 'admin' && (<button onClick={() => handleDeleteUser(user.id)} className="text-neutral-500 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded-none border border-transparent hover:border-red-500/20"><Trash2 size={14} /></button>)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      {/* SONG TABLES */}
      {isSongTableView && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest group border border-transparent hover:border-neutral-500 px-3 py-1 transition-all"><ArrowLeft size={14}/> RETURN_TO_BASE</button>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex bg-neutral-200 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none p-1">
                          <button onClick={() => setSongSortType('plays')} className={`px-3 py-1 text-[10px] rounded-none font-mono uppercase transition ${songSortType === 'plays' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>Top_Plays</button>
                          <button onClick={() => setSongSortType('date')} className={`px-3 py-1 text-[10px] rounded-none font-mono uppercase transition ${songSortType === 'date' ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>Newest_Uploads</button>
                    </div>
                    {currentView === 'songs_list' && <GlitchButton onClick={handleCleanupSongs} disabled={cleaning} className="bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 dark:hover:!text-white px-4 py-2 text-xs rounded-none">{cleaning ? <Loader2 className="animate-spin" size={14}/> : <Eraser size={14}/>} CLEANUP</GlitchButton>}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14}/>
                        <input value={songSearchTerm} onChange={(e) => setSongSearchTerm(e.target.value)} placeholder="SEARCH_TRACK_DB..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none pl-10 pr-10 py-2 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-purple-500 transition-colors uppercase placeholder:text-[10px]"/>
                        {songSearchTerm && <button onClick={() => setSongSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"><Eraser size={14}/></button>}
                    </div>
                </div>
            </div>
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2">{songViewIcon} {songViewTitle}</h3>
                    <span className="text-[10px] text-neutral-500 font-mono bg-white dark:bg-black px-2 border border-neutral-300 dark:border-white/10">Records: {filteredSongs.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md border-b border-neutral-300 dark:border-white/10">
                            <tr><th className="px-6 py-3">Track_ID</th><th className="px-6 py-3">Artist</th><th className="px-6 py-3">Uploader</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Plays <ArrowDownWideNarrow size={12} className="inline"/></th><th className="px-6 py-3 text-right">Cmd</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredSongs.map((song) => {
                                const uploader = getUploaderInfo(song.user_id);
                                return (
                                    <tr key={song.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition">
                                            <td className="px-6 py-3 flex items-center gap-3 align-middle">
                                                {/* HOVER PREVIEW CHO SONGS TABLE */}
                                                <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex-shrink-0 cursor-none relative">
                                                    <HoverImagePreview src={song.image_url} alt={song.title} audioSrc={song.song_url} className="w-full h-full" previewSize={200} fallbackIcon="disc">
                                                        <div className="w-full h-full relative flex items-center justify-center">
                                                            {song.image_url ? <img src={song.image_url} className="w-full h-full object-cover"/> : <Music size={12} className="m-auto text-neutral-400"/>}
                                                            <ScanlineOverlay />
                                                        </div>
                                                    </HoverImagePreview>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={s.title}>{song.title}</span>
                                                    <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">{song.author}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 align-middle uppercase">{song.author}</td>
                                            <td className="px-6 py-3 align-middle">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-none border font-bold uppercase ${uploader.role === 'admin' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' : 'bg-blue-500/10 border-blue-500/30 text-blue-600'}`}>
                                                    {uploader.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 align-middle font-bold text-[10px] uppercase">
                                                {song.is_public ? <span className="text-blue-500 flex items-center gap-1"><Globe size={12}/> PUB</span> : <span className="text-red-500 flex items-center gap-1"><Lock size={12}/> PVT</span>}
                                            </td>
                                            <td className="px-6 py-3 align-middle"><span className="text-emerald-600 dark:text-emerald-500 font-bold bg-emerald-500/10 px-2">{song.play_count}</span></td>
                                            <td className="px-6 py-3 text-right align-middle">
                                                <button onClick={() => handleDeleteSong(song.id)} className="text-neutral-500 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded-none border border-transparent hover:border-red-500/20"><Trash2 size={14} /></button>
                                            </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      {/* VIEW: ARTISTS LOGS */}
      {currentView === 'artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest group border border-transparent hover:border-neutral-500 px-3 py-1 transition-all"><ArrowLeft size={14}/> RETURN_TO_BASE</button>
                <div className="relative w-64"><Search className="absolute left-2 top-2 text-neutral-500" size={12}/><input value={artistSearchTerm} onChange={(e) => setArtistSearchTerm(e.target.value)} placeholder="SEARCH_LOGS..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none pl-8 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-blue-500 placeholder:text-[10px]"/></div>
            </div>
            <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 backdrop-blur-md border-b border-neutral-300 dark:border-white/10"><tr><th className="px-6 py-3">Keyword</th><th className="px-6 py-3">Count</th><th className="px-6 py-3 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredSearchLogs.map((artist, i) => (
                                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition"><td className="px-6 py-3"><span className="text-neutral-800 dark:text-neutral-200 font-bold uppercase">{artist.artist_name}</span></td><td className="px-6 py-3 text-blue-600 dark:text-blue-400 font-bold">{artist.search_count}</td><td className="px-6 py-3 text-right"><button onClick={() => handleDeleteSearch(artist.artist_name)} className="hover:text-red-500 p-2"><Trash2 size={14}/></button></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CyberCard>
        </div>
      )}

      {/* VIEW: DB ARTISTS LIST */}
      {currentView === 'db_artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest group border border-transparent hover:border-neutral-500 px-3 py-1 transition-all"><ArrowLeft size={14}/> RETURN_TO_BASE</button>
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
                                        {/* HOVER PREVIEW CHO DB ARTIST LIST */}
                                        <div className="w-8 h-8 rounded-none bg-neutral-200 dark:bg-neutral-800 overflow-hidden border border-neutral-300 dark:border-white/10 cursor-none relative">
                                            <HoverImagePreview src={artist.image_url} alt={artist.originalName} className="w-full h-full" previewSize={160} fallbackIcon="user">
                                                {/* FIX: Thêm 'flex items-center justify-center' */}
                                                <div className="w-full h-full relative flex items-center justify-center">
                                                    {artist.image_url ? <img src={artist.image_url} className="w-full h-full object-cover"/> : <User size={14} className="text-neutral-400"/>}
                                                    <ScanlineOverlay />
                                                </div>
                                            </HoverImagePreview>
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
    </div>
  );
}

export default AdminDashboard;