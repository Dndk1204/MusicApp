"use client";

import * as RadixSlider from "@radix-ui/react-slider";

// Thêm prop `onCommit` và `disabled` vào đây
const Slider = ({ value = 0, max = 1, onChange, onCommit, disabled }) => {
  
  const handleChange = (newValue) => {
    onChange?.(newValue[0]);
  };

  // --- FIX: Hàm xử lý khi thả chuột ra ---
  const handleCommit = (newValue) => {
    onCommit?.(newValue[0]);
  };

  const step = max === 1 ? 0.01 : 1;

  return (
    <RadixSlider.Root
      className={`
        relative flex items-center select-none touch-none w-full h-10 group
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      defaultValue={[0]}
      value={[value]}
      onValueChange={handleChange}
      onValueCommit={handleCommit} // <--- QUAN TRỌNG NHẤT: Gắn sự kiện thả tay
      max={max}
      step={step}
      disabled={disabled}
      aria-label="Slider"
    >
      {/* TRACK: Thanh nền */}
      <RadixSlider.Track 
        className="
          relative grow rounded-full h-[4px] 
          bg-neutral-400/50 dark:bg-neutral-800
          transition-all group-hover:h-[6px]
        "
      >
        {/* RANGE: Phần đã chạy */}
        <RadixSlider.Range 
          className="
            absolute rounded-full h-full 
            bg-emerald-500 group-hover:bg-emerald-400
            transition-colors
          " 
        />
      </RadixSlider.Track>
      
      {/* THUMB: Cục tròn để kéo */}
      {/* Ẩn đi nếu đang disabled (đang loading) */}
      {!disabled && (
        <RadixSlider.Thumb 
            className="
            block w-3 h-3 
            bg-white 
            rounded-full 
            shadow-[0_2px_5px_rgba(0,0,0,0.5)] 
            
            /* Hover vào thanh slider thì cục này to ra */
            transition-transform duration-200
            group-hover:scale-125
            
            focus:outline-none focus:ring-0
            cursor-grab active:cursor-grabbing
            " 
            aria-label="Thumb"
        />
      )}
    </RadixSlider.Root>
  );
};

export default Slider;