// /src/app/api/get-song/route.js

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Missing song id" },
        { status: 400 }
      );
    }

    const CLIENT_ID = "3501caaa"; // thay bằng client thật

    const apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&id=${id}&include=musicinfo+lyrics&audioformat=mp32`;

    const res = await fetch(apiUrl);

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch song from Jamendo" },
        { status: 500 }
      );
    }

    const data = await res.json();

    if (!data.results || !data.results[0]) {
      return Response.json(
        { error: "Song not found" },
        { status: 404 }
      );
    }

    const track = data.results[0];

    // Format đúng như Player của bạn
    const song = {
      id: Number(track.id),                           // 🟩 FIX QUAN TRỌNG — ép sang bigint
      title: track.name,
      author: track.artist_name,
      song_path: track.audio,
      image_path:
        track.image ||
        track.album_image ||
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60",
      duration: track.duration,
      lyrics: track.musicinfo?.lyrics || null,
      user_id: "jamendo_api"
    };

    return Response.json({ song }, { status: 200 });
  } catch (error) {
    console.error("API /get-song error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
