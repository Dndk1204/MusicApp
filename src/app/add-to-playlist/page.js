"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Music2,
  Loader2,
  Check,
  Disc,
  X,
  ListPlus,
} from "lucide-react";

// Cyber UI
import useLoadImage from "@/hooks/useLoadImage";
import {
  GlitchText,
  GlitchButton,
  CyberButton,
} from "@/components/CyberComponents";
import useUI from "@/hooks/useUI";

export default function AddToPlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alert } = useUI();

  /* -------------------------------------------------------
      URL PARAMS
  ------------------------------------------------------- */
  const songParam = searchParams.get("song");
  const songId = searchParams.get("song_id");

  /* -------------------------------------------------------
      STATES
  ------------------------------------------------------- */
  const [song, setSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);
  const [disabledPlaylists, setDisabledPlaylists] = useState([]);

  /* -------------------------------------------------------
      LOAD IMAGE
  ------------------------------------------------------- */
  const hookImage = useLoadImage(song);
  let displayImage = hookImage;

  if (!displayImage && song) {
    if (song.image_url?.startsWith("http")) displayImage = song.image_url;
    else if (song.image_path?.startsWith("http")) displayImage = song.image_path;
    else if (song.final_image?.startsWith("http")) displayImage = song.final_image;
    else if (song.image_path || song.image_url) {
      const raw = song.image_path || song.image_url;
      const fixed = raw.replace("public/", "");
      const { data } = supabase.storage.from("images").getPublicUrl(fixed);
      if (data?.publicUrl) displayImage = data.publicUrl;
    }
    if (!displayImage) displayImage = "/default-cover.png";
  }

  /* -------------------------------------------------------
      FETCH SONG
  ------------------------------------------------------- */
  useEffect(() => {
    const loadSong = async () => {
      if (songParam) {
        try {
          const s = JSON.parse(decodeURIComponent(songParam));
          setSong({ ...s, image_path: s.image_path || s.image_url });
          return;
        } catch (err) { console.error("Param parse error:", err); }
      }

      if (!songId) return;

      const { data: dbSong } = await supabase.from("songs").select("*").eq("id", songId).maybeSingle();

      if (dbSong) {
        setSong({ ...dbSong, image_path: dbSong.image_url || dbSong.image_path });
        return;
      }

      try {
        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=3501caaa&format=jsonpretty&id=${songId}`);
        const json = await res.json();
        const tr = json?.results?.[0];
        if (!tr) {
          // SỬA: Dùng alert thay vì setMessage
          alert("SONG_NOT_FOUND_API", "error");
          return;
        }

        const apiSong = {
          id: tr.id,
          title: tr.name,
          author: tr.artist_name,
          duration: tr.duration,
          image_url: tr.image,
          image_path: tr.image,
          song_url: tr.audio,
        };
        setSong(apiSong);
        await supabase.from("songs").upsert({
          id: apiSong.id,
          title: apiSong.title,
          author: apiSong.author,
          duration: apiSong.duration,
          image_url: apiSong.image_url,
          song_url: apiSong.song_url,
          external_id: tr.id.toString(),
        });
      } catch (err) {
        console.error("API Error", err);
        // SỬA: Dùng alert thay vì setMessage
        alert("API_CONNECTION_FAILED", "error");
      }
    };
    loadSong();
  }, [songParam, songId]);

  /* -------------------------------------------------------
      FETCH PLAYLISTS
  ------------------------------------------------------- */
  useEffect(() => {
    const loadPlaylists = async () => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess?.session?.user;

      if (!user || !song?.id) {
        setPlaylists([]);
        setDisabledPlaylists([]);
        setLoading(false);
        return;
      }

      // 1️⃣ Fetch playlists của user
      const { data: pls } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      // 2️⃣ Fetch playlist đã có bài hát này
      const { data: exists } = await supabase
        .from("playlist_songs")
        .select("playlist_id")
        .eq("song_id", song.id)
        .in(
          "playlist_id",
          (pls || []).map((p) => p.id)
        );

      const disabledIds = exists?.map((x) => x.playlist_id) || [];

      setPlaylists(pls || []);
      setDisabledPlaylists(disabledIds);
      setLoading(false);
    };
    loadPlaylists();
  }, [song?.id]);

  const toggleSelect = (id) => {
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  /* -------------------------------------------------------
      ADD SONG TO MULTIPLE PLAYLISTS
  ------------------------------------------------------- */
  const handleAddMulti = async () => {
    if (!song?.id) return;

    if (selected.length === 0) {
      alert("NO_TARGET_SELECTED", "error");
      return;
    }

    setAdding(true);

    try {
      /* ===============================
        1️⃣ AUTH
      =============================== */
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("PLEASE_LOGIN", "error");
        return;
      }

      /* ===============================
        2️⃣ CHECK DUPLICATE
      =============================== */
      const { data: existing, error: existErr } = await supabase
        .from("playlist_songs")
        .select("playlist_id")
        .eq("song_id", song.id)
        .in("playlist_id", selected);

      if (existErr) throw existErr;

      const existedIds = existing?.map(x => x.playlist_id) || [];
      const targets = selected.filter(id => !existedIds.includes(id));

      if (targets.length === 0) {
        alert("TRACK_ALREADY_EXISTS", "warning");
        return;
      }

      /* ===============================
        3️⃣ INSERT
      =============================== */
      const rows = targets.map(pid => ({
        playlist_id: pid,
        song_id: song.id,
        added_at: new Date()
      }));

      const { error: insertErr } = await supabase
        .from("playlist_songs")
        .insert(rows);

      if (insertErr) throw insertErr;

      /* ===============================
        4️⃣ SUCCESS
      =============================== */
      alert(
        `SUCCESS: INJECTED TO ${targets.length} PLAYLIST(S)`,
        "success"
      );

      setTimeout(() => router.back(), 600);

    } catch (err) {
      console.error("ADD_TO_PLAYLIST_FAILED:", err);
      alert(err.message || "PERMISSION_DENIED", "error");
    } finally {
      setAdding(false);
    }
  };


  /* -------------------------------------------------------
      UI
  ------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
      <div
        className="
          !w-[60vh] max-w-xl h-[70vh] flex flex-col relative overflow-hidden
          bg-white dark:bg-black
          border-2 border-neutral-400 dark:border-white/20
          shadow-[0_0_40px_rgba(0,0,0,0.5)] dark:shadow-[0_0_40px_rgba(255,255,255,0.05)]
        "
      >
        {/* HEADER */}
        <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-3 md:p-5 flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-3">
            <ListPlus className="text-emerald-600 dark:text-emerald-500" size={18} />
            <h1 className="text-base md:text-xl font-bold font-mono uppercase tracking-widest text-neutral-900 dark:text-white">
              <GlitchText text="ADD_TO_PLAYLIST" />
            </h1>
          </div>

          <button
            onClick={() => router.back()}
            className="text-neutral-500 hover:text-red-500 transition hover:rotate-90 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/50 dark:bg-black/80 p-4 md:p-6 custom-scrollbar">
          
          {/* SONG INFO */}
          <div
            className="
              flex items-center gap-3 mb-4 md:mb-8 p-2 md:p-4
              bg-white dark:bg-neutral-900
              border border-neutral-300 dark:border-white/10 shadow-md
              relative group
            "
          >
            <div className="w-10 h-10 md:w-16 md:h-16 bg-neutral-200 dark:bg-neutral-800 border border-neutral-400 dark:border-white/20 overflow-hidden shrink-0">
              {displayImage ? (
                <img src={displayImage} alt="Cover" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition"/>
              ) : (
                <Music2 className="text-neutral-500 m-auto" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[8px] md:text-[10px] font-mono text-emerald-600 uppercase tracking-widest mb-0.5">
                Target_File
              </p>
              <div className="font-bold text-neutral-900 dark:text-white truncate text-sm md:text-lg font-mono uppercase">
                {song?.title || "Unknown Song"}
              </div>
              <div className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono uppercase">
                {song?.author || "Unknown Artist"}
              </div>
            </div>
          </div>

          {/* PLAYLISTS LIST */}
          <h2 className="font-bold font-mono text-[10px] md:text-xs uppercase tracking-widest text-neutral-500 mb-2 px-1">
            Select_Directory
          </h2>

          {loading ? (
            <div className="flex flex-col items-center py-6 text-neutral-500">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <span className="text-[10px] font-mono mt-2 animate-pulse">LOADING...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-6 border border-dashed">
              <Disc size={24} className="mx-auto text-neutral-400 mb-2" />
              <p className="text-[10px] font-mono text-neutral-500 uppercase">NO_PLAYLISTS_FOUND</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-2">
              {playlists.map((pl) => {
                const isSelected = selected.includes(pl.id);
                const isDisabled = disabledPlaylists.includes(pl.id);

                return (
                  <button
                    key={pl.id}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) toggleSelect(pl.id);
                    }}
                    className={`
                      group flex justify-between items-center p-3 border transition relative
                      ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed bg-neutral-200 dark:bg-neutral-800"
                          : isSelected
                          ? "bg-emerald-500/10 border-emerald-500"
                          : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-white/10 hover:border-emerald-500/50"
                      }
                    `}
                  >
                    <span
                      className={`
                        text-sm font-mono
                        ${
                          isDisabled
                            ? "text-neutral-400 italic"
                            : isSelected
                            ? "font-bold text-emerald-700 dark:text-emerald-400"
                            : "text-neutral-700 dark:text-neutral-300"
                        }
                      `}
                    >
                      {pl.name}
                      {isDisabled && " (Already added)"}
                    </span>

                    <div
                      className={`
                        w-5 h-5 border flex items-center justify-center
                        ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-neutral-400 dark:border-neutral-600 bg-neutral-100 dark:bg-black"
                        }
                      `}
                    >
                      {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-neutral-100 dark:bg-neutral-900 p-3 md:p-4 border-t border-neutral-300 dark:border-white/10 flex justify-between items-center shrink-0">
          <div className="text-[10px] font-mono text-neutral-500 uppercase flex flex-col">
            <span>TARGETS:</span>
            <div className="text-emerald-600 dark:text-emerald-500 font-bold text-base md:text-lg leading-none">
              {selected.length}
            </div>
          </div>

          <div className="flex gap-2 md:gap-3">
            <GlitchButton
              onClick={() => router.back()}
              className="text-[10px] md:text-xs px-3 md:px-4 py-2 border-red-400 text-red-500 dark:text-white"
            >
              ABORT
            </GlitchButton>

            <CyberButton
              onClick={handleAddMulti}
              disabled={adding || selected.length === 0}
              className="text-[10px] md:text-xs px-4 md:px-6 py-2"
            >
              {adding ? "ADDING..." : "CONFIRM"}
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}