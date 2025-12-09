"use client";

import { useEffect, useRef, useState } from "react";
import useAudioFilters from "@/hooks/useAudioFilters";

const SpectrumVisualizer = ({ isPlaying }) => {
  const { getFrequencyData } = useAudioFilters();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const [data, setData] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!isPlaying) {
        // Khi dừng, vẽ spectrum tĩnh hoặc mờ hơn
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const frequencyData = getFrequencyData();
      if (!frequencyData) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Nên có tối đa khoảng 32-64 bar để nhìn mượt
      const barCount = 64;
      const sliceWidth = canvas.width / barCount;
      const samplesPerBar = frequencyData.length / barCount;

      ctx.fillStyle = "rgba(0,0,0,0.1)"; // Alpha blending
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        // Trung bình cộng các frequency trong vùng bar
        let sum = 0;
        for (let j = 0; j < samplesPerBar; j++) {
          sum += frequencyData[i * samplesPerBar + j] || 0;
        }
        const avgVal = sum / samplesPerBar;

        // Chiều cao bar: 0-255 thành 0-canvas.height
        const barHeight = (avgVal / 255) * canvas.height;

        // Màu sắc gradient: Từ xanh lá (bass) sang đỏ (treble)
        const hue = (i / barCount) * 120 + 60; // 60-180: Vàng-Xanh lá - Hồng
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;

        // Vẽ bar từ đáy lên
        ctx.fillRect(
          i * sliceWidth,
          canvas.height - barHeight,
          sliceWidth - 1, // Khoảng cách giữa bars
          barHeight
        );
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getFrequencyData, isPlaying]);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="w-full h-20 bg-black/20 rounded-none border border-white/10 backdrop-blur-sm shadow-inner"
        width={400}
        height={80}
        style={{ display: "block" }}
      />
      <p className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider opacity-70">
        :: LIVE AUDIO SPECTRUM :: BEAT VISUAL ::
      </p>
    </div>
  );
};

export default SpectrumVisualizer;
