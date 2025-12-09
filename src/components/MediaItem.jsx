"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import Link from "next/link";

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; // Already formatted from Jamendo
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const MediaItem = ({ data, onClick }) => {
  const imageUrl = useLoadImage(data);

  return (
    <div 
      className="
        flex items-center gap-x-2 cursor-default w-full p-1.5 rounded-md 
        /* Giảm padding p-2 -> p-1.5, gap-3 -> gap-2 */
        hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 
        transition
      "
    >
      {/* 1. ẢNH BÌA: Giảm size 48px -> 40px */}
      <Link 
        href="/now-playing" 
        className="relative rounded-md min-h-[40px] min-w-[40px] overflow-hidden cursor-pointer hover:opacity-80 transition shadow-sm"
      >
        <Image
          fill
          src={imageUrl || "/images/liked.png"}
          alt="Media Item"
          className="object-cover"
        />
      </Link>

      <div className="flex flex-col gap-y-0.5 overflow-hidden"> {/* Giảm gap-y-1 -> 0.5 */}
        {/* 2. TÊN BÀI HÁT: text-sm */}
        <Link 
            href="/now-playing"
            className="
                text-sm truncate cursor-pointer hover:underline transition font-mono
                text-neutral-900 hover:text-emerald-600 
                dark:text-white dark:hover:text-emerald-500
            "
        >
            {data.title}
        </Link>
        
        {/* 3. TÊN NGHỆ SĨ: text-xs */}
        <Link
            href={`/artist/${encodeURIComponent(data.author)}`}
            className="
                text-xs truncate cursor-pointer hover:underline transition font-mono
                text-neutral-500 hover:text-neutral-900
                dark:text-neutral-400 dark:hover:text-white
            "
        >
            {data.author}
        </Link>
        {formatDuration(data.duration) && (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-mono truncate uppercase">
            {formatDuration(data.duration)}
          </span>
        )}
      </div>
    </div>
  );
}
 
export default MediaItem;
