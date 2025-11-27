import { getJamendoTracks } from "@/lib/jamedoClient";

// Hàm format thời gian
const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

const getSongs = async ({ title, tag, boost, limit = 20 } = {}) => {
  // console.log(`Fetching... [Title: ${title}] [Tag: ${tag}]`);

  // 1. Cấu hình tham số cơ bản
  const baseParams = {
    limit: limit, 
    format: "jsonpretty",
    include: "musicinfo",
    audioformat: "mp32",
  };

  if (tag) baseParams.tags = tag;
  if (boost) baseParams.boost = boost;

  // Mảng chứa kết quả thô từ API
  let rawTracks = [];

  // --- LOGIC TÌM KIẾM THÔNG MINH ---
  if (title) {
      // Nếu có từ khóa -> Gọi song song 2 API để tìm cho kỹ
      // 1. Tìm theo tên bài (namesearch - tìm mờ)
      // 2. Tìm theo tên chính xác của Nghệ sĩ (artist_name)
      const [byNameSearch, byArtistName] = await Promise.all([
          getJamendoTracks({ ...baseParams, namesearch: title }),
          getJamendoTracks({ ...baseParams, artist_name: title })
      ]);

      // Gộp 2 mảng lại (Ưu tiên kết quả tìm theo Tên bài trước)
      const combined = [
          ...(byNameSearch || []), 
          ...(byArtistName || [])
      ];

      // Lọc trùng lặp (Deduplicate) dựa trên ID bài hát
      // Dùng Map để giữ lại bài xuất hiện đầu tiên
      const uniqueMap = new Map();
      combined.forEach(track => {
          if (!uniqueMap.has(track.id)) {
              uniqueMap.set(track.id, track);
          }
      });

      rawTracks = Array.from(uniqueMap.values());

  } else {
      // Nếu không có từ khóa title -> Tìm bình thường theo Tag hoặc Boost
      if (!tag && !boost) baseParams.boost = "popularity_month"; // Mặc định hot nhất tháng
      rawTracks = await getJamendoTracks(baseParams);
  }

  // 3. Xử lý kết quả trả về
  if (!rawTracks || rawTracks.length === 0) {
    console.log("No tracks found.");
    return [];
  }

  // 4. Map dữ liệu về chuẩn App
  return rawTracks.map((track) => ({
    id: track.id,
    title: track.name,
    author: track.artist_name,
    song_path: track.audio,
    image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    duration: formatDuration(track.duration),
    user_id: 'jamendo_api'
  }));
};

export default getSongs;