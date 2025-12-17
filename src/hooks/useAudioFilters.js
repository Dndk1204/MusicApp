import { useCallback } from 'react';
import { Howler } from 'howler';

const useAudioFilters = () => {
  
  // --- 1. KHỞI TẠO GLOBAL NODES ---
  const initAudioNodes = useCallback(() => {
    // Nếu chưa có Context hoặc đã tạo EQ rồi thì bỏ qua
    if (!Howler.ctx || !Howler.masterGain || Howler._eqNodes) return;

    try {
      const ctx = Howler.ctx;

      // Tạo 3 dải tần số
      const bassNode = ctx.createBiquadFilter();
      bassNode.type = 'lowshelf';
      bassNode.frequency.value = 200;
      bassNode.gain.value = 0;

      const midNode = ctx.createBiquadFilter();
      midNode.type = 'peaking';
      midNode.frequency.value = 1000;
      midNode.Q.value = 1;
      midNode.gain.value = 0;

      const trebleNode = ctx.createBiquadFilter();
      trebleNode.type = 'highshelf';
      trebleNode.frequency.value = 3000;
      trebleNode.gain.value = 0;

      // --- ĐẤU DÂY (ROUTING) ---
      // Chuỗi: Input -> Bass -> Mid -> Treble -> Destination
      
      // 1. Ngắt kết nối mặc định (nếu có)
      Howler.masterGain.disconnect();

      // 2. Kết nối theo chuỗi
      // Lưu ý: Đối với html5:true, input sẽ được nối thủ công qua connectHTML5
      // Đối với html5:false, input là masterGain
      Howler.masterGain.connect(bassNode); 
      bassNode.connect(midNode);
      midNode.connect(trebleNode);
      trebleNode.connect(ctx.destination);

      // Lưu biến toàn cục
      Howler._eqNodes = {
        bass: bassNode,
        mid: midNode,
        treble: trebleNode
      };

      console.log("🎛️ Equalizer Connected Successfully!");
    } catch (err) {
      console.error("❌ Init EQ Failed:", err);
    }
  }, []);

  // --- 2. HÀM KẾT NỐI HTML5 AUDIO (QUAN TRỌNG CHO BACKGROUND PLAY) ---
  const connectHTML5 = useCallback((howlInstance) => {
    // Chỉ chạy nếu đã có EQ nodes và Howl instance
    if (!Howler.ctx || !Howler._eqNodes || !howlInstance) return;

    // Lấy thẻ <audio> thực sự từ Howler
    const sound = howlInstance._sounds[0];
    
    // Kiểm tra xem có phải là HTML5 Audio Node không
    if (sound && sound._node && !sound._webAudio) { 
        const audioTag = sound._node;

        // ⚠️ QUAN TRỌNG: Setting này cho phép Web Audio API đọc dữ liệu từ server khác (CORS)
        // Nếu server nhạc (Jamendo/Supabase) không cho phép, Visualizer sẽ không chạy (nhưng nhạc vẫn kêu).
        audioTag.crossOrigin = "anonymous";

        try {
            // Kiểm tra xem thẻ này đã được kết nối chưa để tránh lỗi duplicate
            if (audioTag._isConnectedToWebAudio) return;

            const ctx = Howler.ctx;
            const source = ctx.createMediaElementSource(audioTag);
            
            // Nối nguồn nhạc (Audio Tag) vào đầu chuỗi EQ (Bass Node)
            source.connect(Howler._eqNodes.bass);
            
            // Đánh dấu đã kết nối
            audioTag._isConnectedToWebAudio = true;
            
            console.log("🔗 HTML5 Audio Bridged to Equalizer!");
        } catch (e) {
            console.warn("⚠️ Audio Source connection warning:", e);
        }
    }
  }, []);

  // --- 3. CÁC HÀM ĐIỀU CHỈNH ---
  const setBass = (val) => {
    if (Howler._eqNodes?.bass) {
      Howler._eqNodes.bass.gain.setTargetAtTime(val, Howler.ctx.currentTime, 0.1);
    }
  };

  const setMid = (val) => {
    if (Howler._eqNodes?.mid) {
      Howler._eqNodes.mid.gain.setTargetAtTime(val, Howler.ctx.currentTime, 0.1);
    }
  };

  const setTreble = (val) => {
    if (Howler._eqNodes?.treble) {
      Howler._eqNodes.treble.gain.setTargetAtTime(val, Howler.ctx.currentTime, 0.1);
    }
  };

  // --- 4. HÀM LẤY GIÁ TRỊ ---
  const getSettings = () => {
    return {
      bass: Howler._eqNodes?.bass?.gain.value || 0,
      mid: Howler._eqNodes?.mid?.gain.value || 0,
      treble: Howler._eqNodes?.treble?.gain.value || 0
    };
  };

  // --- 5. VISUALIZER ---
  const initAnalyzer = useCallback(() => {
    if (!Howler.ctx || !Howler._eqNodes?.treble || Howler._analyzer) return;

    try {
      const ctx = Howler.ctx;
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 2048; 
      analyzer.smoothingTimeConstant = 0.8; 

      // Ngắt kết nối Treble -> Destination cũ
      Howler._eqNodes.treble.disconnect();
      
      // Nối lại: Treble -> Analyzer -> Destination
      Howler._eqNodes.treble.connect(analyzer);
      analyzer.connect(ctx.destination);

      Howler._analyzer = analyzer;
      console.log("🎵 Spectrum Analyzer Connected!");
    } catch (err) {
      console.error("❌ Init Analyzer Failed:", err);
    }
  }, []);

  const getFrequencyData = () => {
    if (!Howler._analyzer) return null;
    const bufferLength = Howler._analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    Howler._analyzer.getByteFrequencyData(dataArray);
    return dataArray;
  };

  return { 
      initAudioNodes, 
      connectHTML5, // <--- Xuất hàm này ra
      setBass, setMid, setTreble, 
      getSettings, 
      initAnalyzer, 
      getFrequencyData 
  };
};

export default useAudioFilters;