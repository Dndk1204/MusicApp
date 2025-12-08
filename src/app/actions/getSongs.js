import { getJamendoTracks } from "@/lib/jamedoClient";

// Client ID của bạn (Lấy từ các file trước)
const CLIENT_ID = '3501caaa'; 

const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

const getSongs = async ({ title, artist, tag, boost, limit = 20 } = {}) => {
  
  const baseParams = {
    limit: limit,
    format: "jsonpretty",
    include: "musicinfo+lyrics",
    audioformat: "mp31",
  };

  if (tag) baseParams.tags = tag;
  if (boost) baseParams.boost = boost;

  let rawTracks = [];
  let artistsFound = []; 

  try {
      // --- TRƯỜNG HỢP 1: TÌM CHÍNH XÁC NGHỆ SĨ ---
      if (artist) {
          console.log(`>>> Fetching specific artist: ${artist}`);
          rawTracks = await getJamendoTracks({ 
              ...baseParams, 
              artist_name: artist 
          });
      }
      // --- TRƯỜNG HỢP 2: TÌM KIẾM TỔNG HỢP (Thanh Search) ---
      else if (title) {
          
          // 1. Gọi API tìm Bài hát (Giữ nguyên để lấy list nhạc)
          const tracksPromise = Promise.all([
              getJamendoTracks({ ...baseParams, namesearch: title }),
              getJamendoTracks({ ...baseParams, artist_name: title })
          ]);

          // 2. GỌI API TÌM NGHỆ SĨ RIÊNG BIỆT (FIX LỖI THIẾU ARTIST)
          // namesearch: tìm gần đúng tên nghệ sĩ
          const artistsPromise = fetch(`https://api.jamendo.com/v3.0/artists/?client_id=${CLIENT_ID}&format=jsonpretty&namesearch=${title}&limit=102&order=popularity_total`)
                                  .then(res => res.json())
                                  .catch(err => ({ results: [] }));

          // Chạy song song cả tìm nhạc và tìm nghệ sĩ
          const [[byNameSearch, byArtistName], artistApiResponse] = await Promise.all([
              tracksPromise,
              artistsPromise
          ]);

          // --- XỬ LÝ ARTIST ---
          // Ưu tiên lấy từ API Artist chuẩn vừa gọi
          if (artistApiResponse.results && artistApiResponse.results.length > 0) {
              artistsFound = artistApiResponse.results.map(a => ({
                  id: a.id,
                  name: a.name,
                  image: a.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop",
                  // Thêm followers nếu API trả về, hoặc mock data
                  followers: "Unknown" 
              }));
          } 
          
          // (Fallback) Nếu API Artist không ra gì, mới dùng cách cũ trích xuất từ bài hát
          if (artistsFound.length === 0 && byArtistName && byArtistName.length > 0) {
              const artistMap = new Map();
              byArtistName.forEach(track => {
                  if (!artistMap.has(track.artist_id)) {
                      artistMap.set(track.artist_id, {
                          id: track.artist_id,
                          name: track.artist_name,
                          image: track.image || track.album_image, 
                      });
                  }
              });
              artistsFound = Array.from(artistMap.values());
          }

          // --- XỬ LÝ SONGS ---
          const combined = [...(byNameSearch || []), ...(byArtistName || [])];
          const uniqueMap = new Map();
          combined.forEach(track => {
              if (!uniqueMap.has(track.id)) uniqueMap.set(track.id, track);
          });
          rawTracks = Array.from(uniqueMap.values());

      } 
      // --- TRƯỜNG HỢP 3: MẶC ĐỊNH ---
      else {
          if (!tag && !boost) baseParams.boost = "popularity_month";
          rawTracks = await getJamendoTracks(baseParams);
      }

      if (!rawTracks) rawTracks = [];

      const mappedSongs = rawTracks.map((track) => ({
        id: track.id,
        title: track.name,
        author: track.artist_name,
        song_path: track.audio,
        image_path: track.image || track.album_image || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        duration: formatDuration(track.duration),
        lyrics: track.musicinfo?.lyrics || null,
        user_id: 'jamendo_api'
      }));

      return { 
          songs: mappedSongs, 
          artists: artistsFound 
      };

  } catch (error) {
      console.error("GetSongs Error:", error);
      return { songs: [], artists: [] };
  }
};

export default getSongs;
