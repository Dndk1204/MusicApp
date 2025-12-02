import { supabase } from "@/lib/supabaseClient";

export async function addSongToPlaylist(song, playlistId) {
  // 1. Lấy user
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { error: "NOT_AUTHENTICATED" };

  // 2. Kiểm tra bài hát đã tồn tại chưa
  const { data: existed, error: checkError } = await supabase
    .from("songs")
    .select("id")
    .eq("id", song.id)
    .maybeSingle();

  if (checkError) return { error: checkError };

  // 3. Nếu chưa có thì insert vào songs
  if (!existed) {
    const { error: insertSongError } = await supabase
      .from("songs")
      .insert({
        id: song.id,
        title: song.title,
        artist: song.artist,
        image_url: song.image_url,
        duration: song.duration,
        user_id: session.user.id
      });

    if (insertSongError) {
      console.error("Insert song failed:", insertSongError);
      return { error: insertSongError };
    }
  }

  // 4. Insert vào playlist_songs
  const { error: playlistError } = await supabase
    .from("playlist_songs")
    .insert({
      playlist_id: playlistId,
      song_id: song.id
    });

  if (playlistError) {
    return { error: playlistError };
  }

  return { success: true };
}
