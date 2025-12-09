"use client";

import * as RadixSlider from "@radix-ui/react-slider";

const Slider = ({ value = 0, max = 1, onChange, onCommit, disabled }) => {
  
  const handleChange = (newValue) => {
    onChange?.(newValue[0]);
  };

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
      onValueCommit={handleCommit}
      max={max}
      step={step}
      disabled={disabled}
      aria-label="Slider"
    >
      {/* TRACK: Thanh nền (Vuông vức, màu tối) */}
      <RadixSlider.Track 
        className="
          relative grow rounded-none h-[2px] 
          bg-neutral-300 dark:bg-neutral-800
          group-hover:h-[4px] transition-all duration-300
          border-x border-neutral-400 dark:border-white/20
        "
      >
        {/* RANGE: Phần đã chạy (Màu Emerald, phát sáng nhẹ) */}
        <RadixSlider.Range 
          className="
            absolute rounded-none h-full 
            bg-emerald-600 dark:bg-emerald-500 
            group-hover:bg-emerald-400
            transition-colors
            shadow-[0_0_10px_rgba(16,185,129,0.5)]
          " 
        />
      </RadixSlider.Track>
      
      {/* THUMB: Cục vuông để kéo (Tech Style) */}
      {!disabled && (
        <RadixSlider.Thumb 
            className="
            block w-3 h-3 
            rounded-none /* Vuông góc */
            bg-neutral-900 dark:bg-white 
            border border-emerald-500 
            shadow-[0_0_10px_rgba(16,185,129,0.8)] 
            
            /* Hover Effect */
            transition-transform duration-200
            group-hover:scale-125
            
            focus:outline-none focus:ring-1 focus:ring-emerald-500
            cursor-grab active:cursor-grabbing
            " 
            aria-label="Thumb"
        />
      )}
    </RadixSlider.Root>
  );
};

export default Slider;