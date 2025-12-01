"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import getSongs from "@/app/actions/getSongs";

const AddToPlaylist = ({ playlistId }) => {
  const [open, setOpen] = useState(false);
  const [allSongs, setAllSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Load danh sách bài hát từ Jamendo
  useEffect(() => {
    if (!open) return;

    const fetchSongs = async () => {
      setLoadingSongs(true);

      const songs = await getSongs();
      const normalized = songs.map((s) => ({
        ...s,
        id: Number(s.id), // always bigint OK
      }));

      setAllSongs(normalized);
      setLoadingSongs(false);
    };

    fetchSongs();
  }, [open]);

  // Hàm thêm bài hát
  const handleAdd = async (song) => {
    if (!playlistId || !song?.id) {
      console.error("Missing playlistId or song id");
      return;
    }

    console.log("ADDING:", { playlistId, song });

    /** 1️⃣ Kiểm tra bài hát đã nằm trong bảng songs chưa */
    const { data: existingSong, error: checkError } = await supabase
      .from("songs")
      .select("id")
      .eq("id", song.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking song:", checkError);
      alert("Lỗi kiểm tra bài hát!");
      return;
    }

    /** 2️⃣ Nếu chưa có → chèn */
    if (!existingSong) {
      const { error: insertSongError } = await supabase
        .from("songs")
        .insert({
          id: song.id,
          title: song.title,
          song_url: song.song_path,
          image_url: song.image_path,
          author_id: null,
          genre_id: null,
          play_count: 0,
          duration: 0,
        });

      if (insertSongError) {
        console.error("Insert song error:", insertSongError);
        alert("Không thể thêm bài hát vào database.");
        return;
      }
    }

    /** 3️⃣ Thêm vào playlist_songs */
    const { error: insertPLSError } = await supabase
      .from("playlist_songs")
      .insert({
        playlist_id: playlistId,
        song_id: song.id,
      });

    if (insertPLSError) {
      console.error("Insert playlist_songs error:", insertPLSError);
      alert("Không thể thêm vào playlist. Có thể bài hát đã tồn tại!");
      return;
    }

    alert(`Đã thêm: ${song.title}`);
    setOpen(false);
  };

  return (
    <>
      {/* Nút mở modal */}
      <button
        onClick={() => setOpen(true)}
        className="bg-neutral-700 hover:bg-neutral-600 px-6 py-2 rounded-full transition"
      >
        + Thêm bài hát
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 w-[400px] max-h-[80vh] overflow-y-auto rounded-lg p-6 shadow-xl">
            
            <h2 className="text-lg font-semibold mb-4">
              Chọn bài hát để thêm
            </h2>

            {loadingSongs ? (
              <p className="text-neutral-400">Đang tải danh sách bài hát...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {allSongs.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAdd(s)}
                    className="p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition text-left"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full p-2 bg-red-500 rounded hover:bg-red-400 transition"
            >
              Đóng
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default AddToPlaylist;
