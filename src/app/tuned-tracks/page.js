"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Play, Clock, Music2 } from "lucide-react";
import usePlayer from "@/hooks/usePlayer";
// IMPORT HOOK UI & COMPONENTS
import useUI from "@/hooks/useUI";
import { CyberCard, HoloButton, ScanlineOverlay, HorizontalGlitchText } from "@/components/CyberComponents";
// IMPORT AUTH & MODAL
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
// IMPORT HOVER PREVIEW
import HoverImagePreview from "@/components/HoverImagePreview";
import BackButton from "@/components/BackButton";

// --- SKELETON LOADER COMPONENT ---
const TunedTracksSkeleton = () => {
  return (
    <div className="w-full h-screen bg-neutral-100 dark:bg-black p-6 overflow-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row items-end gap-8 mb-10 mt-10">
            <div className="w-52 h-52 md:w-64 md:h-64 bg-neutral-300 dark:bg-white/10 shrink-0 border border-neutral-400 dark:border-white/20"></div>
            <div className="flex-1 w-full space-y-4 pb-2">
                <div className="h-4 w-32 bg-neutral-300 dark:bg-white/10"></div>
                <div className="h-12 w-3/4 bg-neutral-300 dark:bg-white/10"></div>
                <div className="h-4 w-1/2 bg-neutral-300 dark:bg-white/10"></div>
                <div className="h-4 w-48 bg-neutral-300 dark:bg-white/10 mt-auto"></div>
            </div>
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-4 mb-10">
            <div className="h-10 w-32 bg-neutral-300 dark:bg-white/10"></div>
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-white/5">
                    <div className="w-8 h-8 bg-neutral-300 dark:bg-white/10"></div>
                    <div className="w-10 h-10 bg-neutral-300 dark:bg-white/10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 bg-neutral-300 dark:bg-white/10"></div>
                        <div className="h-3 w-24 bg-neutral-300 dark:bg-white/10"></div>
                    </div>
                    <div className="w-12 h-4 bg-neutral-300 dark:bg-white/10"></div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default function TunedTracksPage() {
  const { alert } = useUI();
  const player = usePlayer();
  const { isAuthenticated } = useAuth();
  const { openModal } = useModal();

  const [songsTuned, setSongsTuned] = useState([]);
  const [loadingTuned, setLoadingTuned] = useState(true);

  /* ==========================================================
      FETCH TUNED SONGS DATA
    ========================================================== */
  const getMyTunedSongs = async () => {
    // Get all song IDs and their tuned dates for all users
    const { data: userSettings } = await supabase
      .from('user_song_settings')
      .select('user_id, song_id, updated_at, song_title, song_author')
      .order('updated_at', { ascending: false });

    if (!userSettings || userSettings.length === 0) {
        setSongsTuned([]); setLoadingTuned(false); return;
    }

    // Group by user_id
    const groupedByUser = userSettings.reduce((acc, setting) => {
      if (!acc[setting.user_id]) {
        acc[setting.user_id] = [];
      }
      acc[setting.user_id].push(setting);
      return acc;
    }, {});

    // Get unique song IDs
    const allSongIds = [...new Set(userSettings.map(setting => setting.song_id))];

    // First, try to get songs from local database
    const { data: localSongs } = await supabase
      .from('songs')
      .select('*')
      .in('id', allSongIds);

    const localSongsMap = new Map(localSongs?.map(song => [song.id, song]) || []);

    // For songs not in local database, fetch from API
    const apiPromises = [];
    const missingSongIds = allSongIds.filter(id => !localSongsMap.has(id));

    for (const songId of missingSongIds) {
      apiPromises.push(
        fetch(`/api/get-song?id=${songId}`)
          .then(res => res.json())
          .then(data => data.song ? { ...data.song, id: Number(songId) } : null)
          .catch(err => {
            console.error(`Failed to fetch song ${songId} from API:`, err);
            return null;
          })
      );
    }

    const apiSongs = await Promise.all(apiPromises);
    const apiSongsMap = new Map(apiSongs.filter(song => song).map(song => [song.id, song]));

    // Combine all songs
    const allSongsMap = new Map([...localSongsMap, ...apiSongsMap]);

    // Create final grouped data
    const finalGroupedSongs = {};
    for (const [userId, settings] of Object.entries(groupedByUser)) {
      finalGroupedSongs[userId] = settings.map(setting => {
        const song = allSongsMap.get(setting.song_id);
        if (song) {
          return {
            ...song,
            tuned_at: setting.updated_at,
            user_id: userId
          };
        }
        // Fallback for songs that couldn't be fetched
        return {
          id: setting.song_id,
          title: setting.song_title || 'Unknown Title',
          author: setting.song_author || 'Unknown Artist',
          tuned_at: setting.updated_at,
          user_id: userId,
          image_url: null,
          duration: 0
        };
      }).sort((a, b) => new Date(b.tuned_at) - new Date(a.tuned_at));
    }

    setSongsTuned(finalGroupedSongs);
    setLoadingTuned(false);
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

  const handlePlayTunedPlaylist = () => {
    const allSongs = Object.values(songsTuned).flat();
    if (!allSongs.length) return;

    if (!isAuthenticated) {
      openModal();
      return;
    }

    const ids = allSongs.map((song) => Number(song.id));
    if (typeof window !== 'undefined') {
      const songMap = {};
      allSongs.forEach(song => songMap[song.id] = song);
      window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }

    player.setIds(ids);
    player.setId(ids[0]);
  };

  const handlePlayUserSongs = (userSongs) => {
    if (!userSongs.length) return;

    if (!isAuthenticated) {
      openModal();
      return;
    }

    const ids = userSongs.map((song) => Number(song.id));
    if (typeof window !== 'undefined') {
      const songMap = {};
      userSongs.forEach(song => songMap[song.id] = song);
      window.__SONG_MAP__ = { ...window.__SONG_MAP__, ...songMap };
    }

    player.setIds(ids);
    player.setId(ids[0]);
  };

  /* ==========================================================
      RENDERING
    ========================================================== */
  if (loadingTuned) {
    return <TunedTracksSkeleton />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white p-6 pb-32 transition-colors duration-500 relative overflow-hidden">
      <div className="mb-3">
        <BackButton /> 
      </div>
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-end gap-8 mb-10 relative z-10 animate-in slide-in-from-bottom-5 duration-700">

        {/* Cover Image Wrapper (CyberCard + Scanline) */}
        <CyberCard className="p-0 rounded-none shadow-2xl shadow-emerald-500/10 shrink-0 border border-neutral-300 dark:border-white/10">
            <div className="relative w-52 h-52 md:w-64 md:h-64 overflow-hidden group bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center cursor-none">
                <div className="w-full h-full relative">
                    <span className="text-6xl font-bold opacity-30 font-mono flex items-center justify-center h-full w-full">🎛️</span>
                    <ScanlineOverlay />
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
            </div>
        </CyberCard>

        {/* Info */}
        <div className="flex flex-col gap-2 flex-1 pb-2 w-full">
          <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 animate-pulse rounded-none"></span>
              <p className="uppercase text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.3em]">
                TUNED_COLLECTION
              </p>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-mono tracking-tight mb-2 uppercase break-words line-clamp-2">
            <HorizontalGlitchText text="TUNED_TRACKS" />
          </h1>

          <p className="text-neutral-600 dark:text-neutral-400 italic font-mono text-sm max-w-2xl border-l-2 border-emerald-500/50 pl-3 mb-4">
            "Your personalized audio adjustments across all playlists."
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest mt-auto">
            <span className="flex items-center gap-1"><Music2 size={14}/> {Object.keys(songsTuned).length} USERS</span>
            <span>//</span>
            <span className="flex items-center gap-1"><Clock size={14}/> LAST_SYNC: {new Date().toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (HoloButton) */}
      <div className="flex flex-wrap gap-4 mb-10 z-20 relative">
        <HoloButton
            onClick={handlePlayTunedPlaylist}
            className="px-8 bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
        >
          <Play size={18} fill="currentColor" className="mr-2" /> PLAY_ALL
        </HoloButton>
      </div>

      {/* USER SECTIONS */}
      <div className="space-y-8">
        {Object.entries(songsTuned).map(([userId, userSongs]) => (
          <CyberCard key={userId} className="overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-none border-neutral-200 dark:border-white/10">
            {/* User Header */}
            

            {/* Song List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead className="bg-neutral-100/50 dark:bg-black/20 text-neutral-500 dark:text-neutral-400 uppercase text-[10px] tracking-widest border-b border-neutral-200 dark:border-white/5">
                  <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4">Track_Title</th>
                    <th className="p-4 hidden md:table-cell">Artist</th>
                    <th className="p-4 text-center">Tuned_Date</th>
                    <th className="p-4 text-right">Duration</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {userSongs.map((song, index) => (
                    <tr
                      key={`${userId}-${song.id}`}
                      onClick={() => {
                        if (!isAuthenticated) {
                          openModal();
                          return;
                        }
                        const ids = userSongs.map((s) => Number(s.id));
                        player.setIds(ids);
                        player.setId(Number(song.id));
                      }}
                      className="group/song hover:bg-emerald-500/10 transition-colors duration-200 cursor-pointer"
                    >
                      <td className="p-4 text-center text-neutral-400 group-hover/song:text-emerald-500">
                        {index + 1}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-none border border-neutral-300 dark:border-white/10 group-hover/song:border-emerald-500 transition-colors bg-neutral-200 dark:bg-black cursor-none">
                            <HoverImagePreview
                              src={song.image_url || "/default_song.jpg"}
                              alt={song.title}
                              audioSrc={song.song_url}
                              className="w-full h-full"
                              previewSize={200}
                              fallbackIcon="disc"
                            >
                              <div className="w-full h-full relative flex items-center justify-center">
                                {song.image_url ? (
                                  <Image
                                    src={song.image_url}
                                    fill
                                    alt={song.title}
                                    className="object-cover group-hover/song:scale-110 transition-transform duration-500 grayscale group-hover/song:grayscale-0"
                                  />
                                ) : (
                                  <Music2 size={16} className="text-neutral-400" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/song:opacity-100 transition-opacity">
                                  <Play size={16} fill="white" className="text-white"/>
                                </div>
                              </div>
                            </HoverImagePreview>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-neutral-800 dark:text-white group-hover/song:text-emerald-500 transition-colors truncate max-w-[150px] md:max-w-xs uppercase">
                              {song.title}
                            </span>
                            <span className="text-xs text-neutral-500 md:hidden truncate">{song.author}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-neutral-500 dark:text-neutral-400 group-hover/song:text-white transition-colors hidden md:table-cell">
                        {song.author}
                      </td>

                      <td className="p-4 text-center font-mono text-neutral-500 group-hover/song:text-emerald-500">
                        {song.tuned_at ? new Date(song.tuned_at).toLocaleDateString("vi-VN") : "--/--/--"}
                      </td>

                      <td className="p-4 text-right font-mono text-neutral-500 group-hover/song:text-emerald-500">
                        {formatDuration(song.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CyberCard>
        ))}

        {Object.keys(songsTuned).length === 0 && (
          <div className="text-center py-16">
            <div className="text-neutral-400 italic font-mono text-sm">
              [EMPTY_DATA] No tuned tracks found. Start adjusting EQ settings on your favorite songs!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
