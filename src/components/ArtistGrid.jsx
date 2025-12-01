"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import FollowButton from "@/components/FollowButton";
import { HoloButton } from "@/components/CyberComponents"; // Dùng nút đẹp nếu muốn

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
        <h2 className="text-lg font-bold font-mono text-neutral-700 dark:text-neutral-300 mb-4 tracking-widest">
            ARTISTS MATCHED ({artists.length})
        </h2>
        
        {/* Grid hiển thị */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleArtists.map((artist) => (
                <Link 
                    key={artist.id} 
                    href={`/artist/${encodeURIComponent(artist.name)}`}
                    className="group flex items-center gap-4 bg-white/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/10 backdrop-blur-xl rounded-xl p-4 hover:bg-white/90 dark:hover:bg-neutral-800/60 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                >
                    <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white dark:border-neutral-700 group-hover:scale-105 transition shrink-0">
                        <Image src={artist.image} alt={artist.name} fill className="object-cover"/>
                    </div>
                    <div className="flex-1 min-w-0"> 
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-mono group-hover:text-emerald-500 transition truncate">
                            {artist.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-neutral-200 dark:bg-white/10 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400 font-mono">ARTIST</span>
                        </div>
                    </div>
                    <div onClick={(e) => e.preventDefault()}>
                        <FollowButton 
                            artistName={artist.name} 
                            artistImage={artist.image} 
                        />
                    </div>
                </Link>
            ))}
        </div>

        {/* Nút Xem thêm */}
        {hasMore && (
            <div className="flex justify-center mt-6">
                <button 
                    onClick={showMore}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-neutral-200 dark:bg-white/10 border border-neutral-300 dark:border-white/10 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-xs font-mono text-neutral-600 dark:text-neutral-300 shadow-sm"
                >
                    LOAD MORE ARTISTS <ChevronDown size={14}/>
                </button>
            </div>
        )}
    </div>
  );
};

export default ArtistGrid;