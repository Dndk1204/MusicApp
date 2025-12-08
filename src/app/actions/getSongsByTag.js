const getSongsByTag = async (tag) => {
  if (!tag) return [];

  // Client ID của bạn (lấy từ file cũ qua)
  const CLIENT_ID = '3501caaa'; 

  try {
    console.log(`>>> Đang lọc theo thể loại: "${tag}"`);

    // --- CẤU TRÚC URL TÌM THEO TAG ---
    // tags: Tìm chính xác từ khóa trong danh sách tag của bài hát
    // boost=popularity_month: Ưu tiên bài hot trong tháng
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&tags=${encodeURIComponent(tag)}&include=musicinfo&audioformat=mp31&boost=popularity_month`;
    
    const response = await fetch(url);

    if (!response.ok) {
        console.error(">>> Lỗi API Jamendo:", response.status);
        return [];
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return [];
    }

    // Map dữ liệu y hệt như hàm search cũ để không lỗi giao diện
    return data.results.map((track) => ({
      id: track.id,
      title: track.name,
      author: track.artist_name,
      song_path: track.audio,       
      image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", 
      duration: formatDuration(track.duration), 
      user_id: 'jamendo_api'       
    }));

  } catch (error) {
    console.error(">>> Get By Tag Exception:", error);
    return [];
  }
};

const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

export default getSongsByTag;
