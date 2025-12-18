import { useCallback } from 'react';
import { Howler } from 'howler';

const useAudioFilters = () => {
  
  // --- 1. KHỞI TẠO GLOBAL NODES ---
  // Chạy 1 lần khi nhạc bắt đầu phát để "cắm dây" bộ lọc
  const initAudioNodes = useCallback(() => {
    // Nếu chưa có Context (nhạc chưa chạy) hoặc đã tạo rồi thì bỏ qua
    if (!Howler.ctx || !Howler.masterGain || Howler._eqNodes) return;

    try {
      const ctx = Howler.ctx;

      // Tạo 3 dải tần số (Bass - Mid - Treble)
      const bassNode = ctx.createBiquadFilter();
      bassNode.type = 'lowshelf';
      bassNode.frequency.value = 200; // Dưới 200Hz là Bass
      bassNode.gain.value = 0;

      const midNode = ctx.createBiquadFilter();
      midNode.type = 'peaking';
      midNode.frequency.value = 1000; // Khoảng 1000Hz là Mid
      midNode.Q.value = 1;
      midNode.gain.value = 0;

      const trebleNode = ctx.createBiquadFilter();
      trebleNode.type = 'highshelf';
      trebleNode.frequency.value = 3000; // Trên 3000Hz là Treble
      trebleNode.gain.value = 0;

      // --- ĐẤU DÂY (ROUTING) ---
      // Ngắt kết nối cũ (Master -> Loa)
      Howler.masterGain.disconnect();

      // Nối dây mới: Master -> Bass -> Mid -> Treble -> Loa
      Howler.masterGain.connect(bassNode);
      bassNode.connect(midNode);
      midNode.connect(trebleNode);
      trebleNode.connect(ctx.destination);

      // Lưu vào biến toàn cục của Howler để dùng ở mọi nơi
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

  // --- 2. CÁC HÀM ĐIỀU CHỈNH (Real-time) ---
  const setBass = (val) => {
    if (Howler._eqNodes?.bass) {
      // setTargetAtTime giúp chuyển âm mượt mà, không bị khựng
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

  // --- 3. HÀM LẤY GIÁ TRỊ HIỆN TẠI ---
  // Để đồng bộ giao diện khi mới vào trang
  const getSettings = () => {
    return {
      bass: Howler._eqNodes?.bass?.gain.value || 0,
      mid: Howler._eqNodes?.mid?.gain.value || 0,
      treble: Howler._eqNodes?.treble?.gain.value || 0
    };
  };

  // --- 4. VISUAL BEAT ANALYSIS ---
  // Tạo AnalyserNode để visualize spectrum
  const initAnalyzer = useCallback(() => {
    if (!Howler.ctx || !Howler.masterGain || Howler._analyzer) return;

    try {
      const ctx = Howler.ctx;
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 2048; // Độ phân giải spectrum, phổ biến: 256/512/1024/2048/4096
      analyzer.smoothingTimeConstant = 0.8; // Mượt hơn

      // Kết nối: ... -> Treble -> Analyzer -> Output
      // Đảm bảo Analyzer nằm sau EQ nodes
      if (Howler._eqNodes?.treble) {
        Howler._eqNodes.treble.disconnect();
        Howler._eqNodes.treble.connect(analyzer);
        analyzer.connect(ctx.destination);
      }

      // Lưu trữ
      Howler._analyzer = analyzer;
      console.log("🎵 Spectrum Analyzer Connected!");
    } catch (err) {
      console.error("❌ Init Analyzer Failed:", err);
    }
  }, []);

  // Lấy spectrum data
  const getFrequencyData = () => {
    if (!Howler._analyzer) return null;
    const bufferLength = Howler._analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    Howler._analyzer.getByteFrequencyData(dataArray);
    return dataArray;
  };

  return { initAudioNodes, setBass, setMid, setTreble, getSettings, initAnalyzer, getFrequencyData };
};

export default useAudioFilters;
