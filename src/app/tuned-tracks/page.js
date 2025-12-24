"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Play, Clock, Music2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import usePlayer from "@/hooks/usePlayer";
import useUI from "@/hooks/useUI";
import { CyberCard, HoloButton, ScanlineOverlay, HorizontalGlitchText } from "@/components/CyberComponents";
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
import HoverImagePreview from "@/components/HoverImagePreview";
import BackButton from "@/components/BackButton";

// --- SKELETON LOADER COMPONENT ---
const TunedTracksSkeleton = () => (
  <div className="w-full h-screen bg-neutral-100 dark:bg-black p-6 overflow-hidden animate-pulse">
    <div className="flex flex-col md:flex-row items-end gap-8 mb-10 mt-10">
      <div className="w-52 h-52 md:w-64 md:h-64 bg-neutral-300 dark:bg-white/10 shrink-0 border border-neutral-400 dark:border-white/20"></div>
      <div className="flex-1 w-full space-y-4 pb-2">
        <div className="h-4 w-32 bg-neutral-300 dark:bg-white/10"></div>
        <div className="h-12 w-3/4 bg-neutral-300 dark:bg-white/10"></div>
        <div className="h-4 w-1/2 bg-neutral-300 dark:bg-white/10"></div>
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 w-full bg-neutral-300 dark:bg-white/5 border border-neutral-200 dark:border-white/5"></div>
      ))}
    </div>
  </div>
);

export default function TunedTracksPage() {
  const router = useRouter();
  const { alert } = useUI();
  const player = usePlayer();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  const [songsTuned, setSongsTuned] = useState({});
  const [loadingTuned, setLoadingTuned] = useState(true);

  /* ==========================================================
      FETCH TUNED SONGS DATA (Grouped by User)
    ========================================================== */
  const getMyTunedSongs = async () => {
    try {
      const { data: userSettings } = await supabase
        .from('user_song_settings')
        .select('user_id, song_id, updated_at, song_title, song_author')
        .order('updated_at', { ascending: false });

      if (!userSettings || userSettings.length === 0) {
        setSongsTuned({}); setLoadingTuned(false); return;
      }

      const groupedByUser = userSettings.reduce((acc, setting) => {
        if (!acc[setting.user_id]) acc[setting.user_id] = [];
        acc[setting.user_id].push(setting);
        return acc;
      }, {});

      const allSongIds = [...new Set(userSettings.map(s => s.song_id))];

      // 1. Get from local DB
      const { data: localSongs } = await supabase
        .from('songs')
        .select('*')
        .in('id', allSongIds);

      const localSongsMap = new Map(localSongs?.map(song => [String(song.id), song]) || []);

      // 2. Fetch missing from Jamendo API (Code 2 logic)
      const missingSongIds = allSongIds.filter(id => !localSongsMap.has(String(id)));
      const CLIENT_ID = '3501caaa';
      const apiPromises = missingSongIds.map(async (id) => {
        try {
          const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${id}&include=musicinfo&audioformat=mp31`);
          const data = await res.json();
          if (data.results?.[0]) {
            const track = data.results[0];
            return {
              id: track.id,
              title: track.name,
              author: track.artist_name,
              song_url: track.audio,
              image_url: track.image || track.album_image,
              duration: track.duration
            };
          }
        } catch (e) { console.error(e); }
        return null;
      });

      const apiSongs = await Promise.all(apiPromises);
      const apiSongsMap = new Map(apiSongs.filter(s => s).map(s => [String(s.id), s]));

      const allSongsMap = new Map([...localSongsMap, ...apiSongsMap]);

      const finalGroupedSongs = {};
      for (const [userId, settings] of Object.entries(groupedByUser)) {
        finalGroupedSongs[userId] = settings.map(setting => {
          const song = allSongsMap.get(String(setting.song_id));
          return {
            id: setting.song_id,
            title: setting.song_title || song?.title || 'Unknown Title',
            author: setting.song_author || song?.author || 'Unknown Artist',
            song_url: song?.song_url,
            image_url: song?.image_url,
            duration: song?.duration || 0,
            tuned_at: setting.updated_at,
            user_id: userId
          };
        }).sort((a, b) => new Date(b.tuned_at) - new Date(a.tuned_at));
      }

      setSongsTuned(finalGroupedSongs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTuned(false);
    }
  };

  useEffect(() => { getMyTunedSongs(); }, []);

  /* ==========================================================
      HANDLERS
    ========================================================== */
  const formatDuration = (sec) => {
    if (!sec) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePlayCollection = (songs) => {
    if (!songs.length) return;
    if (!isAuthenticated) { openModal(); return; }

    const ids = songs.map(s => Number(s.id));
    if (typeof window !== 'undefined') {
      const songMap = {};
      songs.forEach(s => songMap[s.id] = s);
      window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }
    player.setIds(ids);
    player.setId(ids[0]);
  };

  if (loadingTuned) return <TunedTracksSkeleton />;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white p-4 md:p-6 pb-32 transition-colors duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <button onClick={() => router.back()} className="relative z-20 mb-6 group flex items-center gap-2 px-3 py-3 backdrop-blur-md border border-neutral-300 dark:border-white/10 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-300 font-mono text-[10px] font-bold tracking-widest uppercase">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 mb-10 relative z-10 animate-in slide-in-from-bottom-5 duration-700">
        <CyberCard className="p-0 shrink-0 border border-neutral-300 dark:border-white/10">
          <div className="relative w-48 h-48 md:w-64 md:h-64 overflow-hidden group bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <span className="text-6xl opacity-30 font-mono">🎛️</span>
            <ScanlineOverlay />
          </div>
        </CyberCard>

        <div className="flex flex-col gap-2 flex-1 pb-2 w-full items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-emerald-500 animate-pulse"></span>
            <p className="uppercase text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.3em]">TUNED_COLLECTION</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-mono tracking-tight mb-2 uppercase">
            <HorizontalGlitchText text="TUNED_TRACKS" />
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 italic font-mono text-sm max-w-2xl border-l-2 border-emerald-500/50 pl-3">
            "Your personalized audio adjustments across the grid."
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 uppercase tracking-widest mt-auto">
            <span className="flex items-center gap-1"><Music2 size={14}/> {Object.values(songsTuned).flat().length} TRACKS</span>
            <span>//</span>
            <span className="flex items-center gap-1"><Clock size={14}/> {new Date().toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-10 z-20 relative justify-center md:justify-start">
        <HoloButton onClick={() => handlePlayCollection(Object.values(songsTuned).flat())} className="px-8 bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:!bg-emerald-500 hover:!text-white">
          <Play size={18} fill="currentColor" className="mr-2" /> PLAY_ALL
        </HoloButton>
      </div>

      <div className="space-y-12">
        {Object.entries(songsTuned).map(([userId, userSongs]) => (
          <div key={userId} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-dashed border-emerald-500/30 pb-2">
                <div className="w-2 h-2 bg-emerald-500 rotate-45"></div>
                <h2 className="font-mono text-xs font-bold tracking-tighter text-neutral-500 uppercase">User_ID: {userId.slice(0, 8)}...</h2>
            </div>
            
            <CyberCard className="p-0 overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md border-neutral-200 dark:border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-sm">
                  <thead className="bg-neutral-200/50 dark:bg-black/40 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-widest">
                    <tr>
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4">Track_Title</th>
                      <th className="p-4 hidden md:table-cell">Artist</th>
                      <th className="p-4 text-center">Tuned_Date</th>
                      <th className="p-4 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                    {userSongs.map((song, index) => (
                      <tr key={song.id} onClick={() => handlePlayCollection([song])} className="group/song hover:bg-emerald-500/10 transition-colors cursor-pointer">
                        <td className="p-4 text-center text-neutral-400 group-hover/song:text-emerald-500">{index + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10 shrink-0 overflow-hidden border border-neutral-300 dark:border-white/10 group-hover/song:border-emerald-500">
                              <HoverImagePreview src={song.image_url || "/default_song.jpg"} alt={song.title} audioSrc={song.song_url} className="w-full h-full" previewSize={200} fallbackIcon="disc">
                                <div className="w-full h-full relative flex items-center justify-center">
                                  {song.image_url ? <Image src={song.image_url} fill alt={song.title} className="object-cover grayscale group-hover/song:grayscale-0 transition-all" /> : <Music2 size={16} />}
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/song:opacity-100 transition-opacity">
                                    <Play size={16} fill="white" className="text-white"/>
                                  </div>
                                </div>
                              </HoverImagePreview>
                            </div>
                            <span className="font-bold truncate max-w-[200px] uppercase group-hover/song:text-emerald-500 transition-colors">{song.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-neutral-500 hidden md:table-cell">{song.author}</td>
                        <td className="p-4 text-center text-xs opacity-60">{new Date(song.tuned_at).toLocaleDateString("vi-VN")}</td>
                        <td className="p-4 text-right opacity-60">{formatDuration(song.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CyberCard>
          </div>
        ))}

        {Object.keys(songsTuned).length === 0 && (
          <div className="text-center py-20 font-mono text-neutral-500 opacity-50 uppercase tracking-tighter">
            [EMPTY_DATABASE_RECORD] No tuned tracks found.
          </div>
        )}
      </div>
    </div>
  );
}