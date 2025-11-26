"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Play, Loader2, Clock, Music, ListMusic, AlertCircle } from "lucide-react";
import usePlayer from "@/hooks/usePlayer"; // Import hook player để phát nhạc

const PlaylistPage = () => {
  const params = useParams();
  const playlistName = decodeURIComponent(params.name);
  
  const player = usePlayer(); // Hook player
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Lấy thông tin Playlist
        const { data: playlistData, error: plError } = await supabase
          .from("playlists")
          .select("*")
          .eq("name", playlistName)
          .single();
          
        if (plError || !playlistData) throw new Error("PLAYLIST_NOT_FOUND");

        setPlaylist(playlistData);

        // 2. Lấy danh sách bài hát
        // FIX LỖI: Bỏ .order("created_at") vì DB chưa có cột này
        const { data: playlistSongs, error: psError } = await supabase
          .from("playlist_songs")
          .select("*, songs(*)")
          .eq("playlist_id", playlistData.id);
          // .order("created_at", { ascending: true }); <--- Đã bỏ dòng này

        if (psError) throw psError;

        // Map dữ liệu
        const mappedSongs = playlistSongs.map((ps) => ps.songs).filter(Boolean);
        setSongs(mappedSongs);

      } catch (err) {
        console.error(err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playlistName]);

  // Hàm xử lý khi bấm nút Play All
  const handlePlayAll = () => {
    if (songs.length === 0) return;
    // Set bài đầu tiên làm active
    player.setId(songs[0].id);
    // Set danh sách bài hát vào player (Logic này cần hỗ trợ bên usePlayer, tạm thời play bài đầu)
    
    // Lưu danh sách bài hát vào window để Player component đọc được (Hack nhẹ để đồng bộ)
    const songMap = {};
    songs.forEach(song => songMap[song.id] = song);
    window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    
    // Nếu player hỗ trợ setIds (phát danh sách) thì gọi:
    const ids = songs.map(s => s.id);
    player.setIds(ids); 
  };

  // Hàm xử lý khi bấm vào từng bài
  const handlePlaySong = (id) => {
    // Cập nhật map bài hát toàn cục
    const songMap = {};
    songs.forEach(song => songMap[song.id] = song);
    window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    
    player.setId(id);
    // Cập nhật playlist queue
    const ids = songs.map(s => s.id);
    player.setIds(ids);
  };

  // --- LOADING STATE ---
  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center gap-x-2 text-emerald-600 dark:text-emerald-500 font-mono animate-pulse">
            <Loader2 className="animate-spin" /> LOADING_DATA_STREAM...
        </div>
    </div>
  );

  // --- ERROR STATE ---
  if (error || !playlist) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-red-500 font-mono">
        <AlertCircle size={40} />
        <p className="uppercase tracking-widest">ERROR: {error || "Playlist does not exist"}</p>
        <button onClick={() => window.history.back()} className="text-white underline hover:text-emerald-400">
            [GO_BACK]
        </button>
    </div>
  );

  return (
    <div className="w-full h-full p-6 pb-[120px] overflow-y-auto">
      
      {/* --- HEADER PLAYLIST --- */}
      <div className="flex flex-col md:flex-row gap-8 items-end mb-8 pb-8 border-b border-neutral-200 dark:border-white/10">
        
        {/* Ảnh bìa Playlist */}
        <div className="group relative w-52 h-52 shrink-0 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] dark:shadow-[0_0_30px_rgba(16,185,129,0.1)] border border-neutral-200 dark:border-white/10">
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-400 dark:from-neutral-800 dark:to-black flex items-center justify-center">
                <span className="text-6xl font-bold font-mono text-neutral-400 dark:text-neutral-700 select-none">
                    {playlist.name.charAt(0).toUpperCase()}
                </span>
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
        </div>

        <div className="flex-1 flex flex-col gap-2 mb-2">
          <p className="text-xs font-mono text-emerald-500 tracking-widest uppercase mb-1">
            :: PRIVATE_PLAYLIST ::
          </p>
          <h1 className="text-4xl md:text-7xl font-bold font-mono text-neutral-800 dark:text-white tracking-tighter drop-shadow-md">
            {playlist.name}
          </h1>
          
          <div className="flex items-center gap-x-2 text-sm font-mono text-neutral-500 dark:text-neutral-400 mt-2">
             <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center">
                <span className="text-[10px]">U</span>
             </div>
             <span className="text-neutral-800 dark:text-white font-bold">You</span>
             <span>•</span>
             <span>{songs.length} songs</span>
          </div>

          {/* Nút Play */}
          <button 
             onClick={handlePlayAll}
             className="mt-6 bg-emerald-500 text-black font-bold font-mono rounded-full px-8 py-3 w-max flex items-center gap-x-2 hover:scale-105 hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
             <Play size={20} fill="black" />
             PLAY_ALL
          </button>
        </div>
      </div>

      {/* --- DANH SÁCH BÀI HÁT --- */}
      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 font-mono gap-4">
           <ListMusic size={50} />
           <p>[PLAYLIST_EMPTY]</p>
           <p className="text-xs">Go to Library to add some tracks.</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Table Header */}
          <div className="grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 border-b border-neutral-200 dark:border-white/10 text-neutral-500 font-mono text-xs tracking-widest uppercase mb-2 sticky top-0 bg-transparent backdrop-blur-md z-10">
             <div>#</div>
             <div>Title</div>
             <div className="hidden md:block">Details</div>
             <div className="flex justify-end"><Clock size={16}/></div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col gap-y-1">
             {songs.map((song, idx) => (
                <div 
                   key={song.id}
                   onClick={() => handlePlaySong(song.id)}
                   className="group grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-3 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/5 transition items-center cursor-pointer border border-transparent hover:border-neutral-300 dark:hover:border-white/5"
                >
                   {/* Index */}
                   <div className="text-neutral-500 font-mono text-sm group-hover:text-emerald-500">
                      {idx + 1}
                   </div>

                   {/* Title & Image */}
                   <div className="flex items-center gap-x-4">
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-neutral-300 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                         {song.image_path ? (
                            <img src={song.image_path} alt={song.title} className="w-full h-full object-cover"/>
                         ) : (
                            <Music size={18} className="text-neutral-500"/>
                         )}
                         {/* Play Overlay */}
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Play size={16} fill="white" className="text-white"/>
                         </div>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                         <span className="text-neutral-800 dark:text-white font-mono font-bold truncate text-sm">{song.title}</span>
                         <span className="text-neutral-500 text-xs font-mono truncate">{song.author}</span>
                      </div>
                   </div>

                   {/* Details (Hidden on mobile) */}
                   <div className="hidden md:flex flex-col justify-center">
                      <span className="text-neutral-500 text-xs font-mono truncate">ID: {song.id.slice(0,8)}...</span>
                   </div>

                   {/* Duration */}
                   <div className="flex justify-end text-sm text-neutral-500 font-mono">
                      {song.duration || "--:--"}
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistPage;