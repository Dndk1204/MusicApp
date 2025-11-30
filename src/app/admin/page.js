"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  ShieldAlert, UploadCloud, Activity, Users, Trash2, TrendingUp, 
  Search, Loader2, RefreshCw, Music, ArrowLeft, Eraser, Mic2 
} from "lucide-react";
import useUI from "@/hooks/useUI";
import { GlitchButton, HoloButton } from "@/components/CyberComponents";

const AdminDashboard = () => {
  const router = useRouter();
  const { alert, confirm } = useUI();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingArtists, setSyncingArtists] = useState(false); 
  const [cleaning, setCleaning] = useState(false); 
  
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

  const fetchDashboardData = async () => {
    try {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true });
        const { count: artistCount } = await supabase.from('artists').select('*', { count: 'exact', head: true });
        
        const { data: topSongs } = await supabase.from('songs').select('id, title, author, play_count').order('play_count', { ascending: false }).limit(3);
        const { data: topArtists } = await supabase.from('artist_search_counts').select('artist_name, search_count').order('search_count', { ascending: false }).limit(3);
        
        const { data: allUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        const { data: allSongs } = await supabase.from('songs').select('*').order('created_at', { ascending: false });
        const { data: allSearchLogs } = await supabase.from('artist_search_counts').select('*').order('search_count', { ascending: false });
        const { data: allDbArtists } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
        const { data: popularArtists } = await supabase.from('artists').select('*').order('created_at', { ascending: false }).limit(5);

        setStats({ 
            totalUsers: userCount || 0, 
            totalSongs: songCount || 0, 
            totalArtists: artistCount || 0,
            topSongs: topSongs || [], 
            topSearchedArtists: topArtists || [] 
        });
        setUsersList(allUsers || []);
        setAllSongsList(allSongs || []);
        setAllArtistsList(allSearchLogs || []);
        setFullArtistsList(allDbArtists || []);
        setPopularArtistsList(popularArtists || []);
    } catch (error) {
        console.error("System Error:", error);
    }
  };

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

  // --- FIX LỖI Ở ĐÂY: Thêm (song.field || "") để tránh null ---
  const filteredSongs = allSongsList.filter((song) => 
    (song.title || "").toLowerCase().includes(songSearchTerm.toLowerCase()) ||
    (song.author || "").toLowerCase().includes(songSearchTerm.toLowerCase())
  );

  const filteredArtists = fullArtistsList.filter((artist) => 
    (artist.name || "").toLowerCase().includes(artistSearchTerm.toLowerCase())
  );

  // --- HANDLERS ---
  const handleSyncMusic = async () => {
    const isConfirmed = await confirm("Execute sync protocol for 100 tracks from Jamendo API?", "SYNC_CONFIRMATION");
    if (!isConfirmed) return;
    setSyncing(true);
    try {
        const CLIENT_ID = '3501caaa'; 
        let allTracks = [];
        const offsets = [0, 20, 40, 60, 80]; 
        const fetchPromises = offsets.map(offset => 
            fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&include=musicinfo&order=popularity_week&offset=${offset}`).then(res => res.json())
        );
        const responses = await Promise.all(fetchPromises);
        responses.forEach(data => { if (data.results) allTracks = [...allTracks, ...data.results]; });
        if (allTracks.length > 0) {
            const songsToUpsert = allTracks.map(track => ({
                title: track.name,
                author: track.artist_name,
                song_url: track.audio,
                image_url: track.image,
                duration: track.duration,
            }));
            const { error } = await supabase.from('songs').upsert(songsToUpsert, { onConflict: 'song_url', ignoreDuplicates: false });
            if (error) throw error;
            alert(`Successfully synced ${songsToUpsert.length} tracks.`, "success", "SYNC_COMPLETE");
            await fetchDashboardData(); 
        }
    } catch (error) { alert("Error: " + error.message, "error", "SYNC_FAILED"); } finally { setSyncing(false); }
  };

  const handleSyncArtists = async () => {
    const isConfirmed = await confirm("Update data for top 50 artists?", "SYNC_ARTISTS");
    if (!isConfirmed) return;
    setSyncingArtists(true);
    try {
        const CLIENT_ID = '3501caaa'; 
        const res = await fetch(`https://api.jamendo.com/v3.0/artists/?client_id=${CLIENT_ID}&format=jsonpretty&limit=50&order=popularity_total`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const artistsToUpsert = data.results.map(artist => ({ name: artist.name, image_url: artist.image }));
            const { error } = await supabase.from('artists').upsert(artistsToUpsert, { onConflict: 'name', ignoreDuplicates: false });
            if (error) throw error;
            alert(`Updated info for ${artistsToUpsert.length} artists.`, "success", "ARTIST_SYNC_DONE");
            await fetchDashboardData(); 
        }
    } catch (error) { alert("Error: " + error.message, "error", "SYNC_FAILED"); } finally { setSyncingArtists(false); }
  };

  const handleCleanupSongs = async () => {
    const isConfirmed = await confirm("Remove duplicate songs?", "CLEANUP_WARNING");
    if (!isConfirmed) return;
    setCleaning(true);
    try {
        const { error } = await supabase.rpc('cleanup_duplicate_songs');
        if (error) throw error;
        alert("Duplicate songs removed.", "success", "CLEANUP_SUCCESS");
        await fetchDashboardData(); 
    } catch (error) { alert(error.message, "error", "CLEANUP_ERROR"); } finally { setCleaning(false); }
  };

  const handleCleanupArtists = async () => {
    const isConfirmed = await confirm("Remove duplicate artists?", "CLEANUP_WARNING");
    if (!isConfirmed) return;
    setCleaning(true);
    try {
        const { error } = await supabase.rpc('cleanup_duplicate_artists'); 
        if (error) throw error;
        alert("Duplicate artists removed.", "success", "CLEANUP_SUCCESS");
        await fetchDashboardData(); 
    } catch (error) { alert(error.message, "error", "CLEANUP_ERROR"); } finally { setCleaning(false); }
  };

  const handleDeleteUser = async (userId) => {
    const isConfirmed = await confirm("Delete this user?", "DELETE_USER");
    if(!isConfirmed) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if(!error) {
        setUsersList(usersList.filter(u => u.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        alert("User deleted.", "success");
    } else alert(error.message, "error");
  };

  const handleDeleteSong = async (songId) => {
    const isConfirmed = await confirm("Remove this track?", "DELETE_SONG");
    if(!isConfirmed) return;
    const { error } = await supabase.from('songs').delete().eq('id', songId);
    if(!error) {
        setAllSongsList(allSongsList.filter(s => s.id !== songId));
        setStats(prev => ({ ...prev, totalSongs: prev.totalSongs - 1 }));
        alert("Song removed.", "success");
    } else alert(error.message, "error");
  };

  const handleDeleteSearch = async (artistName) => {
    const isConfirmed = await confirm(`Clear history for "${artistName}"?`, "DELETE_LOG");
    if(!isConfirmed) return;
    const { error } = await supabase.from('artist_search_counts').delete().eq('artist_name', artistName);
    if(!error) setAllArtistsList(allArtistsList.filter(a => a.artist_name !== artistName));
    else alert(error.message, "error");
  };

  const handleDeleteDbArtist = async (id) => {
    const isConfirmed = await confirm("Remove artist?", "DELETE_ARTIST");
    if(!isConfirmed) return;
    const { error } = await supabase.from('artists').delete().eq('id', id);
    if(!error) {
        setFullArtistsList(fullArtistsList.filter(a => a.id !== id));
        setPopularArtistsList(popularArtistsList.filter(a => a.id !== id));
        setStats(prev => ({ ...prev, totalArtists: prev.totalArtists - 1 }));
        alert("Artist removed.", "success");
    } else alert(error.message, "error");
  };

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-500 font-mono gap-4">
        <Loader2 className="animate-spin" size={32} />
        <p className="animate-pulse tracking-widest text-xs">INITIALIZING_SYSTEM...</p>
    </div>
  );

  return (
    <div className="h-full w-full p-4 pb-[100px] overflow-y-auto bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 border-b border-neutral-200 dark:border-white/5 pb-4">
        <div>
            <h1 className="text-2xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">ADMIN_CONTROL</h1>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-500 tracking-[0.3em] font-mono mt-1 animate-pulse">:: ROOT_ACCESS ::</p>
        </div>
        {currentView === 'dashboard' && (
            <div className="flex gap-2 flex-wrap">
                <HoloButton 
                    onClick={handleSyncMusic} 
                    disabled={syncing} 
                    className="bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded text-[10px] py-1.5 px-3"
                >
                    {syncing ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14} className="group-hover:rotate-180 transition duration-500"/>} {syncing ? "SYNC..." : "SYNC_SONGS"}
                </HoloButton>

                <HoloButton 
                    onClick={handleSyncArtists} 
                    disabled={syncingArtists} 
                    className="bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 rounded text-[10px] py-1.5 px-3"
                >
                    {syncingArtists ? <Loader2 className="animate-spin" size={14}/> : <Mic2 size={14}/>} {syncingArtists ? "SYNC..." : "SYNC_ARTISTS"}
                </HoloButton>
            </div>
        )}
      </div>

      {/* VIEW 1: DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Card 1 */}
                <div className="group transition-all duration-300 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 backdrop-blur-xl rounded-xl p-4 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-emerald-500/5 hover:shadow-md dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"><UploadCloud size={18} /></div><span className="text-[9px] font-mono text-neutral-500 uppercase">Mod_01</span></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-base mb-1">CONTENT_MGR</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[10px] font-mono">[STATUS: {syncing ? 'BUSY' : 'READY'}]</p>
                </div>
                {/* Card 2 */}
                <div className="bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 backdrop-blur-xl rounded-xl p-4 opacity-90">
                    <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-500"><Users size={18} /></div><span className="text-[9px] font-mono text-neutral-500 uppercase">Mod_02</span></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-base mb-1">USER_DB</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[10px] font-mono">Total Users: <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.totalUsers}</span></p>
                </div>
                {/* Card 3 */}
                <div onClick={() => setCurrentView('songs_list')} className="cursor-pointer group bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 backdrop-blur-xl rounded-xl p-4 opacity-90 hover:bg-purple-500/5 hover:border-purple-500/50 transition-all">
                    <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-500"><Activity size={18} /></div><span className="text-[9px] font-mono text-neutral-500 uppercase">Metrics</span></div>
                    <h3 className="text-neutral-900 dark:text-white font-mono text-base mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400">DB_METRICS</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[10px] font-mono mb-2">Songs: <span className="text-purple-600 dark:text-purple-400 font-bold">{stats.totalSongs}</span> | Artists: <span className="text-pink-600 dark:text-pink-400 font-bold">{stats.totalArtists}</span></p>
                    <div className="flex gap-2">
                          <button onClick={(e) => {e.stopPropagation(); setCurrentView('songs_list')}} className="text-[9px] bg-purple-500/20 hover:bg-purple-500 text-purple-700 dark:text-purple-300 hover:text-white px-2 py-0.5 rounded transition">SONGS</button>
                          <button onClick={(e) => {e.stopPropagation(); setCurrentView('db_artists_list')}} className="text-[9px] bg-pink-500/20 hover:bg-pink-500 text-pink-700 dark:text-pink-300 hover:text-white px-2 py-0.5 rounded transition">ARTISTS</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Top Songs */}
                <div className="bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl p-4 backdrop-blur-md">
                    <h4 className="text-neutral-900 dark:text-white font-mono text-xs mb-3 flex items-center gap-2 uppercase tracking-wider text-opacity-80"><TrendingUp size={14} className="text-emerald-500"/> Top_Streamed</h4>
                    <div className="space-y-2">
                        {stats.topSongs.length === 0 ? <p className="text-neutral-500 text-[10px] font-mono">[NO_DATA]</p> : stats.topSongs.map((song, i) => (
                            <div key={song.id} className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-200 dark:border-white/5 pb-1 last:border-0">
                                <div className="flex items-center gap-2"><span className="text-emerald-600 dark:text-emerald-500">0{i+1}</span><span className="text-neutral-700 dark:text-neutral-300 truncate w-32">{song.title}</span></div><span className="text-neutral-500">{song.play_count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Top Artists */}
                <div className="relative group bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl p-4 backdrop-blur-md hover:border-blue-500/30 transition">
                    <button onClick={() => setCurrentView('artists_list')} className="absolute top-3 right-3 text-[9px] font-mono text-blue-600 dark:text-blue-500 hover:!text-white bg-blue-500/10 hover:bg-blue-500 px-2 py-0.5 rounded transition">LOGS</button>
                    <h4 className="text-neutral-900 dark:text-white font-mono text-xs mb-3 flex items-center gap-2 uppercase tracking-wider text-opacity-80"><Search size={14} className="text-blue-500"/> Top_Searched</h4>
                    <div className="space-y-2">
                        {stats.topSearchedArtists.length === 0 ? <p className="text-neutral-500 text-[10px] font-mono">[NO_DATA]</p> : stats.topSearchedArtists.map((artist, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-200 dark:border-white/5 pb-1 last:border-0">
                                <div className="flex items-center gap-2"><span className="text-blue-600 dark:text-blue-500">0{i+1}</span><span className="text-neutral-700 dark:text-neutral-300 truncate w-32">{artist.artist_name}</span></div><span className="text-neutral-500">{artist.search_count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Popular Artists DB */}
            <div className="relative group bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl p-4 backdrop-blur-md hover:border-pink-500/30 transition mb-6">
                <h4 className="text-neutral-900 dark:text-white font-mono text-xs mb-3 flex items-center gap-2 uppercase tracking-wider text-opacity-80"><Mic2 size={14} className="text-pink-500"/> Popular_Artists_DB</h4>
                <div className="space-y-2">
                    {popularArtistsList.length === 0 ? <p className="text-neutral-600 dark:text-neutral-400 text-[10px] font-mono">[NO_DATA_SYNCED]</p> : popularArtistsList.slice(0, 3).map((artist, i) => (
                        <div key={artist.id} className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-200 dark:border-white/5 pb-1 last:border-0">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 flex items-center justify-center shrink-0">
                                    {artist.image_url ? (
                                        <img src={artist.image_url} className="w-full h-full object-cover" alt={artist.name} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                    ) : null}
                                    <Mic2 size={8} className="text-neutral-500" style={{ display: artist.image_url ? 'none' : 'block' }}/>
                                </div>
                                <span className="text-neutral-800 dark:text-neutral-300 truncate w-32">{artist.name}</span>
                            </div>
                            <button onClick={() => handleDeleteDbArtist(artist.id)} className="text-neutral-500 hover:text-red-500 transition"><Trash2 size={10}/></button>
                        </div>
                    ))}
                </div>
                <button onClick={() => setCurrentView('db_artists_list')} className="absolute top-3 right-3 text-[9px] font-mono text-blue-600 dark:text-blue-500 hover:!text-white bg-blue-500/10 hover:bg-blue-500 px-2 py-0.5 rounded transition">VIEW_ALL</button>
            </div>

            {/* USER TABLE (COMPACT) */}
            <div className="bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="px-4 py-2 border-b border-neutral-200 dark:border-white/5 bg-neutral-200/50 dark:bg-white/5 flex justify-between items-center"><h3 className="text-neutral-900 dark:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2"><Users size={14} className="text-yellow-500"/> User_Manifest</h3><span className="text-[9px] text-neutral-500 font-mono">Count: {usersList.length}</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-500 uppercase tracking-widest"><tr><th className="px-4 py-2">Identity</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {usersList.map((user) => (
                                <tr key={user.id} className="hover:bg-white dark:hover:bg-white/5 transition duration-200">
                                    <td className="px-4 py-2 flex items-center gap-2"><div className="w-6 h-6 rounded bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 overflow-hidden flex items-center justify-center">{user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <Users size={10}/>}</div><div className="flex flex-col"><span className="text-neutral-800 dark:text-neutral-200">{user.full_name || "Unknown"}</span></div></td>
                                    <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded text-[9px] border ${user.role === 'admin' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'}`}>{user.role === 'admin' ? 'ADMIN' : 'USER'}</span></td>
                                    <td className="px-4 py-2 opacity-60">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-2 text-right">{user.role !== 'admin' && (<button onClick={() => handleDeleteUser(user.id)} className="text-neutral-500 hover:text-red-500 transition p-1 hover:bg-red-500/10 rounded"><Trash2 size={12} /></button>)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 2: SONGS LIST (COMPACT) */}
      {currentView === 'songs_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                <button onClick={() => { setCurrentView('dashboard'); setSongSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-white transition font-mono text-xs group"><ArrowLeft size={14} className="group-hover:-translate-x-1 transition"/> RETURN</button>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* SỬ DỤNG GLITCH BUTTON CHO CLEANUP */}
                    <GlitchButton 
                        onClick={handleCleanupSongs} 
                        disabled={cleaning} 
                        className="px-3 py-1.5 rounded text-[10px] border-red-500/50 bg-red-500/10 text-red-500"
                    >
                        {cleaning ? <Loader2 className="animate-spin" size={12}/> : <Eraser size={12}/>} CLEANUP
                    </GlitchButton>
                    <div className="relative w-full md:w-64"><Search className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" size={12}/><input value={songSearchTerm} onChange={(e) => setSongSearchTerm(e.target.value)} placeholder="SEARCH..." className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-md pl-8 pr-8 py-1.5 text-[10px] font-mono text-neutral-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-white/5 transition"/>{songSearchTerm && (<button onClick={() => setSongSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"><Eraser size={12}/></button>)}</div>
                </div>
            </div>
            {/* Table... (Giữ nguyên) */}
            <div className="bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md"><tr><th className="px-4 py-2">Track</th><th className="px-4 py-2">Artist</th><th className="px-4 py-2">Plays</th><th className="px-4 py-2 text-right">Cmd</th></tr></thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredSongs.map((song) => (
                                <tr key={song.id} className="hover:bg-white dark:hover:bg-white/5 transition">
                                    <td className="px-4 py-2 flex items-center gap-2"><div className="w-6 h-6 rounded bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/10 overflow-hidden flex-shrink-0">{song.image_url ? <img src={song.image_url} className="w-full h-full object-cover"/> : <Music size={10}/>}</div><span className="text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">{song.title}</span></td>
                                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{song.author}</td>
                                    <td className="px-4 py-2"><span className="text-emerald-600 dark:text-emerald-500 font-bold">{song.play_count}</span></td>
                                    <td className="px-4 py-2 text-right"><button onClick={() => handleDeleteSong(song.id)} className="text-neutral-500 hover:text-red-500 transition p-1 hover:bg-red-500/10 rounded"><Trash2 size={12} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 3: ARTISTS SEARCH LOGS (COMPACT) */}
      {currentView === 'artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setCurrentView('dashboard')} className="mb-3 flex items-center gap-2 text-neutral-400 hover:text-white transition font-mono text-xs group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition"/> RETURN
            </button>
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                        <Search size={14} className="text-blue-500"/> Search_Query_Log
                    </h3>
                    <span className="text-[9px] text-neutral-500 font-mono">Unique: {allArtistsList.length}</span>
                </div>
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-left text-[10px] font-mono text-neutral-400">
                        <thead className="bg-black/40 text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-4 py-2">Rank</th>
                                <th className="px-4 py-2">Keyword</th>
                                <th className="px-4 py-2">Count</th>
                                <th className="px-4 py-2 text-right">Cmd</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {allArtistsList.map((artist, i) => (
                                <tr key={i} className="hover:bg-white/5 transition">
                                    <td className="px-4 py-2 text-neutral-500">#{i+1}</td>
                                    <td className="px-4 py-2"><span className="text-neutral-200 font-bold">{artist.artist_name}</span></td>
                                    <td className="px-4 py-2"><span className="text-blue-400">{artist.search_count}</span></td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => handleDeleteSearch(artist.artist_name)} className="text-neutral-600 hover:text-red-500 transition p-1 hover:bg-red-500/10 rounded">
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* VIEW 4: DB ARTISTS LIST (COMPACT) */}
      {currentView === 'db_artists_list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                <button onClick={() => { setCurrentView('dashboard'); setArtistSearchTerm(""); }} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-white transition font-mono text-xs group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition"/> RETURN
                </button>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* SỬ DỤNG GLITCH BUTTON CHO CLEANUP */}
                    <GlitchButton 
                        onClick={handleCleanupArtists} 
                        disabled={cleaning} 
                        className="px-3 py-1.5 rounded text-[10px] border-red-500/50 bg-red-500/10 text-red-500"
                    >
                        {cleaning ? <Loader2 className="animate-spin" size={12}/> : <Eraser size={12}/>} CLEANUP
                    </GlitchButton>

                    <div className="relative w-full md:w-56">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" size={12}/>
                        <input 
                            value={artistSearchTerm} 
                            onChange={(e) => setArtistSearchTerm(e.target.value)} 
                            placeholder="SEARCH_ARTIST..." 
                            className="w-full bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-md pl-8 pr-8 py-1.5 text-[10px] font-mono text-neutral-900 dark:text-white outline-none focus:border-pink-500 focus:bg-white dark:focus:bg-white/5 transition"
                        />
                        {artistSearchTerm && (
                            <button onClick={() => setArtistSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white">
                                <Eraser size={12}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Compact */}
            <div className="bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-3 border-b border-neutral-200 dark:border-white/5 bg-neutral-200/50 dark:bg-white/5 flex justify-between items-center">
                    <h3 className="text-neutral-900 dark:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                        <Mic2 size={14} className="text-pink-500"/> DB_Artists
                    </h3>
                    <span className="text-[9px] text-neutral-500 font-mono">Total: {fullArtistsList.length}</span>
                </div>
                
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-left text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
                        <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-4 py-2">Img</th>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2 text-right">Cmd</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                            {filteredArtists.map((artist) => (
                                <tr key={artist.id} className="hover:bg-white dark:hover:bg-white/5 transition">
                                    <td className="px-4 py-2">
                                        <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative group">
                                            {artist.image_url ? (
                                                <img 
                                                    src={artist.image_url} 
                                                    className="w-full h-full object-cover" 
                                                    alt={artist.name}
                                                    onError={(e) => { e.target.style.display = 'none'; }} 
                                                />
                                            ) : null}
                                            <Mic2 size={10} className={`text-neutral-500 absolute ${artist.image_url ? '-z-10' : ''}`} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2"><span className="text-neutral-800 dark:text-neutral-200 font-bold">{artist.name}</span></td>
                                    <td className="px-4 py-2 opacity-60">{new Date(artist.created_at).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => handleDeleteDbArtist(artist.id)} className="text-neutral-500 hover:text-red-500 transition p-1 hover:bg-red-500/10 rounded">
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-6 p-2 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-center gap-2">
         <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={16} />
         <p className="text-[10px] text-yellow-700 dark:text-yellow-500/80 font-mono">WARNING: Authorized personnel only.</p>
      </div>
    </div>
  );
}

export default AdminDashboard;