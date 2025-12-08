const getSongsByTitle = async (title) => {
  
  if (!title) {
    console.log("Search: Không có từ khóa title");
    return [];
  }

  const cleanTitle = title.trim();
  
  // Dùng Client ID chính xác từ file JamendoClient của bạn
  const CLIENT_ID = '3501caaa'; 
  
  try {
    console.log(`>>> Đang tìm kiếm: "${cleanTitle}" với Client ID: ${CLIENT_ID}`);

    // URL tìm kiếm theo tên bài hát (namesearch)
    // namesearch giúp tìm gần đúng tên bài hát
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&namesearch=${encodeURIComponent(cleanTitle)}&include=musicinfo&audioformat=mp31`;
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(">>> LỖI API JAMENDO:", response.status, errorText);
        return [];
    }

    const data = await response.json();

    if (data.headers && data.headers.status === 'failed') {
        console.error(">>> API TỪ CHỐI:", data.headers.error_message);
        return [];
    }

    // --- LOGIC DỰ PHÒNG (FALLBACK) ---
    // Nếu tìm theo tên bài hát không ra kết quả, thử tìm theo tên Nghệ sĩ (Artist)
    if (!data.results || data.results.length === 0) {
        console.warn(">>> Namesearch trả về 0. Đang thử tìm theo Artist...");
        
        // Đổi sang tìm theo artist_name
        const artistUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&artist_name=${encodeURIComponent(cleanTitle)}&include=musicinfo&audioformat=mp31`;
        
        const artistRes = await fetch(artistUrl);
        
        if (!artistRes.ok) return []; // Nếu lỗi thì dừng luôn

        const artistData = await artistRes.json();

        if (artistData.results && artistData.results.length > 0) {
             console.log(`>>> Tìm thấy ${artistData.results.length} bài (theo tên Nghệ sĩ).`);
             return mapSongs(artistData.results);
        }
        
        return []; // Không tìm thấy gì cả
    }

    console.log(`>>> Tìm thấy ${data.results.length} bài (theo tên Bài hát).`);
    return mapSongs(data.results);

  } catch (error) {
    console.error(">>> Search Exception:", error);
    return [];
  }
};

// Hàm map dữ liệu để chuẩn hóa đầu ra cho giao diện
const mapSongs = (results) => {
    return results.map((track) => ({
      id: track.id,
      title: track.name,
      author: track.artist_name,
      song_path: track.audio,       
      // Ưu tiên lấy ảnh album, nếu không có lấy ảnh track, không có nữa thì dùng ảnh placeholder
      image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", 
      duration: formatDuration(track.duration), 
      user_id: 'jamendo_api'       
    }));
}

// Hàm format giây thành phút:giây (ví dụ: 205s -> 03:25)
const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

export default getSongsByTitle;
