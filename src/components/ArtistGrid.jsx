"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Mic2, User } from "lucide-react";
import FollowButton from "@/components/FollowButton";
// Import HoverImagePreview (Đảm bảo đường dẫn đúng với cấu trúc dự án của bạn)
import HoverImagePreview from "@/components/HoverImagePreview";
// Import Cyber Components
import { CyberCard, HoloButton, ScanlineOverlay } from "@/components/CyberComponents";

const ArtistGrid = ({ artists }) => {
  const INITIAL_COUNT = 9;
  const LOAD_MORE_COUNT = 9;
  
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const showMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

  const visibleArtists = artists.slice(0, visibleCount);
  const hasMore = visibleCount < artists.length;

  if (!artists || artists.length === 0) return null;

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* HEADER SECTION */}
        <div className="flex items-center justify-between mb-4 border-b border-neutral-300 dark:border-white/10 pb-2">
            <h2 className="text-sm font-bold font-mono text-neutral-900 dark:text-white tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500"></span>
                ARTISTS_MATCHED
            </h2>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-white/10 px-2 py-0.5">
                CNT: {artists.length}
            </span>
        </div>
        
        {/* GRID HIỂN THỊ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleArtists.map((artist) => (
                <Link 
                    key={artist.id} 
                    href={`/artist/${encodeURIComponent(artist.name)}`}
                    className="block h-full"
                >
                    <CyberCard className="
                        group h-full p-0 
                        bg-white/80 dark:bg-neutral-900/40 
                        border border-neutral-300 dark:border-white/10 
                        hover:border-emerald-500/50 dark:hover:border-emerald-500/50
                        transition-all duration-300 cursor-pointer
                    ">
                        <div className="flex items-center gap-0 h-full">
                            
                            {/* CỘT TRÁI: ẢNH (Vuông vức + Scanline + Hover Preview) */}
                            <HoverImagePreview 
                                src={artist.image} 
                                alt={artist.name}
                                className="relative w-20 h-full shrink-0 border-r hover:cursor-none border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 overflow-hidden group/img min-h-[5rem]"
                                previewSize={240} // Kích thước ảnh to khi hover
                                fallbackIcon="user"
                            >
                                {artist.image ? (
                                    <Image 
                                        src={artist.image} 
                                        alt={artist.name} 
                                        fill 
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                                        <Mic2 size={20} />
                                    </div>
                                )}
                                {/* Hiệu ứng quét */}
                                <ScanlineOverlay />
                            </HoverImagePreview>

                            {/* CỘT PHẢI: INFO */}
                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0"> 
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate uppercase">
                                            {artist.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono tracking-wider opacity-70">
                                                :: ID_{artist.id.toString().slice(0,4)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Nút Follow (Ngăn chặn click link cha) */}
                                    <div onClick={(e) => e.preventDefault()} className="shrink-0 z-20">
                                        <FollowButton 
                                            artistName={artist.name} 
                                            artistImage={artist.image} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CyberCard>
                </Link>
            ))}
        </div>

        {/* NÚT LOAD MORE (Holo Button) */}
        {hasMore && (
            <div className="flex justify-center mt-8 border-t border-dashed border-neutral-300 dark:border-white/10 pt-6">
                <HoloButton 
                    onClick={showMore}
                    className="flex items-center gap-2 px-8 py-2 text-xs border-neutral-400 dark:border-white/20 text-neutral-600 dark:text-neutral-300"
                >
                    LOAD_MORE_DATA <ChevronDown size={14}/>
                </HoloButton>
            </div>
        )}
    </div>
  );
};

export default ArtistGrid;