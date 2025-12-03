"use client";

import { useEffect, useState, useRef } from "react";
import { Howl } from "howler";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, AlignJustify, Plus, X
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import usePlayer from "@/hooks/usePlayer";
import useTrackStats from "@/hooks/useTrackStats";
import LikeButton from "./LikeButton";
import MediaItem from "./MediaItem";
import Slider from "./Slider";
import { AudioVisualizer } from "./CyberComponents";

const PlayerContent = ({ song, songUrl }) => {
  const player = usePlayer();
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  useTrackStats(song);

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);

  const isDraggingRef = useRef(false);
  const rafRef = useRef(null);

  const clampVolume = (val) => Math.max(0, Math.min(1, val));

  useEffect(() => {
    if (player.volume !== undefined) setVolume(player.volume);
  }, []);

  useEffect(() => {
    if (sound) sound.loop(player.repeatMode === 2);
  }, [player.repeatMode, sound]);

  const Icon = isPlaying ? Pause : Play;
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  // --- PLAYBACK LOGIC ---
  const onPlayNext = () => {
    if (player.ids.length === 0) return;
    const currentIndex = player.ids.findIndex((id) => id === player.activeId);

    if (player.isShuffle) {
      const available = player.ids.filter((id) => id !== player.activeId);
      if (available.length === 0) {
        const r = player.ids[Math.floor(Math.random() * player.ids.length)];
        player.setId(r);
      } else {
        const r = available[Math.floor(Math.random() * available.length)];
        player.setId(r);
      }
    } else {
      const next = player.ids[currentIndex + 1];
      if (!next) {
        if (player.repeatMode === 1) player.setId(player.ids[0]);
      } else player.setId(next);
    }
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) return;
    const prev = player.popHistory();
    if (prev) {
      player.setId(prev, true);
      return;
    }
    if (sound) {
      sound.seek(0);
      setSeek(0);
    }
  };

  useEffect(() => {
    if (sound) sound.unload();
    setIsLoading(true);
    setSeek(0);

    const initialVol = clampVolume(player.volume);

    const newSound = new Howl({
      src: [songUrl],
      format: ["mp3", "mpeg"],
      volume: initialVol,
      html5: true,
      preload: "metadata",
      onplay: () => {
        setIsPlaying(true);
        setDuration(newSound.duration());

        const updateSeek = () => {
          if (!isDraggingRef.current && newSound.playing()) {
            setSeek(newSound.seek());
          }
          rafRef.current = requestAnimationFrame(updateSeek);
        };
        updateSeek();
      },
      onpause: () => {
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      },
      onend: () => {
        setIsPlaying(false);
        setSeek(0);
        if (player.repeatMode !== 2) onPlayNext();
      },
      onload: () => {
        setDuration(newSound.duration());
        setIsLoading(false);
        setError(null);
        newSound.volume(initialVol);
      },
      onloaderror: (id, err) => {
        console.error("Howler Error:", err);
        setIsLoading(false);
      },
    });

    setSound(newSound);
    setVolume(initialVol);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      newSound.unload();
    };
  }, [songUrl]);

  const handlePlay = () => {
    if (!sound) return;
    !isPlaying ? sound.play() : sound.pause();
  };

  const handleVolumeChange = (value) => {
    let v = parseFloat(value);
    if (v > 1) v = v / 100;
    const safe = clampVolume(v);

    setVolume(safe);
    if (sound) sound.volume(safe);
    player.setVolume(safe);
    if (safe > 0) setPrevVolume(safe);
  };

  const toggleMute = () => {
    if (volume === 0) {
      const restore = prevVolume > 0 ? prevVolume : 1;
      handleVolumeChange(restore);
    } else {
      setPrevVolume(volume);
      handleVolumeChange(0);
    }
  };

  const handleSkipBackward = () => {
    if (!sound) return;
    const newSeek = Math.max(0, seek - 5);
    sound.seek(newSeek);
    setSeek(newSeek);
  };

  const handleSkipForward = () => {
    if (!sound) return;
    const newSeek = Math.min(duration, seek + 5);
    sound.seek(newSeek);
    setSeek(newSeek);
  };

  const handleSeekChange = (nv) => {
    isDraggingRef.current = true;
    setSeek(nv);
  };

  const handleSeekCommit = (nv) => {
    if (sound) sound.seek(nv);
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (sound && !isLoading) sound.play();
  }, [sound, isLoading]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const sec = Math.floor(s);
    const m = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${m}:${ss < 10 ? "0" + ss : ss}`;
  };

  // Logic Toggle Icon NowPlaying
  const toggleNowPlaying = () => {
    if (pathname === "/now-playing") {
      router.back(); // Nếu đang ở now-playing thì quay lại (hoặc push về home)
    } else {
      router.push("/now-playing");
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full gap-x-6 items-center">
      {error && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-xs py-1 px-3 rounded z-50 animate-bounce">
          [ERR]: {error}
        </div>
      )}

      {/* --- LEFT SECTION: Media Info + Actions --- */}
      <div className="flex w-full justify-start items-center">
        <div className="flex items-center gap-x-3 w-auto max-w-[300px] -translate-y-1.5">
          <MediaItem data={song} />
          
          <LikeButton songId={song?.id} />

          {/* UPDATED: Add to Playlist Button (Cyberpunk Style) */}
          <button
            onClick={() => {
              const normalizedSong = {
                title: song.title,
                author: song.artistsNames ?? song.author ?? null,
                song_url: song.streaming?.mp3 ?? song.song_url ?? null,
                image_url: song.thumbnailM ?? song.image_url ?? null,
                duration: song.duration ?? null,
                play_count: null,
                genre_id: null,
                author_id: null
              };

              router.push(
                "/add-to-playlist?song=" +
                encodeURIComponent(JSON.stringify(normalizedSong))
              );
            }}
            disabled={!song}
            className="
              relative group flex items-center justify-center h-8 w-8 
              border border-neutral-600 hover:border-emerald-500
              bg-white/5 hover:bg-emerald-500/10
              text-neutral-400 hover:text-emerald-500
              rounded-md transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Add to Playlist"
          >
            <Plus size={18} />
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
          </button>

          <div className="hidden sm:block ml-1">
            <AudioVisualizer isPlaying={isPlaying} />
          </div>
        </div>
      </div>

      {/* --- MOBILE CONTROLS --- */}
      <div className="flex md:hidden col-auto w-full justify-end items-center">
        <button
          onClick={handlePlay}
          disabled={!sound || isLoading}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-black shadow-md"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon size={20} fill="currentColor" />
          )}
        </button>
      </div>

      {/* --- CENTER SECTION: Player Controls --- */}
      <div className="hidden md:flex flex-col justify-center items-center w-full max-w-[722px] gap-y-1">
        <div className="flex items-center gap-x-4 translate-y-1">
          <button onClick={() => player.setIsShuffle(!player.isShuffle)} className={`transition ${player.isShuffle ? "text-emerald-600" : "text-neutral-400"}`}>
            <Shuffle size={16} />
          </button>

          <button onClick={onPlayPrevious} className="text-neutral-400 hover:scale-110">
            <SkipBack size={20} />
          </button>

          <button onClick={handleSkipBackward} className="text-neutral-400 hover:scale-110">
            <Rewind size={16} />
          </button>

          <button onClick={handlePlay} className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-white hover:scale-110 transition shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon size={18} fill="currentColor" />
            )}
          </button>

          <button onClick={handleSkipForward} className="text-neutral-400 hover:scale-110">
            <FastForward size={16} />
          </button>

          <button onClick={onPlayNext} className="text-neutral-400 hover:scale-110">
            <SkipForward size={20} />
          </button>

          <button
            onClick={() => player.setRepeatMode((player.repeatMode + 1) % 3)}
            className={`transition ${player.repeatMode !== 0 ? "text-emerald-600" : "text-neutral-400"}`}
          >
            {player.repeatMode === 2 ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        <div className="w-full flex items-center gap-x-2 -translate-y-2">
          <span className="text-[9px] font-mono min-w-[30px] text-right text-neutral-400">{formatTime(seek)}</span>
          <div className="flex-1">
            <Slider value={seek} max={duration || 100} onChange={handleSeekChange} onCommit={handleSeekCommit} />
          </div>
          <span className="text-[9px] font-mono min-w-[30px] text-neutral-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* --- RIGHT SECTION: Volume & View Switcher --- */}
      <div className="hidden md:flex w-full justify-end pr-2 pb-3">
        <div className="flex items-center gap-x-2 w-[150px]">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-emerald-600">
            <VolumeIcon size={20} />
          </button>

          <Slider value={volume} max={1} onChange={handleVolumeChange} />

          {/* UPDATED: Toggle Icon based on Pathname */}
          <button 
            onClick={toggleNowPlaying} 
            className="text-neutral-400 hover:text-emerald-600 p-1 rounded-md transition-colors"
            title={pathname === '/now-playing' ? "Close Player" : "Open Player"}
          >
            {pathname === '/now-playing' ? <X size={20} /> : <AlignJustify size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;