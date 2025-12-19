"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import getAlbumTracks from "@/app/actions/getAlbumTracks";
import SongSection from "@/components/SongSection";
import { Disc, Loader2, Play, ArrowLeft } from "lucide-react";
import Image from "next/image";
// Import Cyber Components
import { DecoderText, GlitchText, CyberCard, ScanlineOverlay } from "@/components/CyberComponents";
import BackButton from "@/components/BackButton";

// --- COMPONENT SKELETON (CYBER STYLE) ---
const AlbumSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-8 p-6 pb-[120px] animate-pulse bg-neutral-100 dark:bg-black transition-colors duration-500">
       {/* Header Skeleton */}
       <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-8 pb-8 border-b border-neutral-300 dark:border-white/10">
           {/* Cover Image */}
           <div className="relative w-48 h-48 md:w-52 md:h-52 shrink-0 bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-white/20 rounded-none"></div>
           
           {/* Info */}
           <div className="flex-1 mb-2 w-full flex flex-col gap-4 items-center md:items-start">
               <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div> 
               <div className="h-10 md:h-12 w-3/4 md:w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div> 
               <div className="h-6 w-48 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div> 
           </div>
       </div>

       {/* Tracklist Skeleton */}
       <div className="flex flex-col gap-y-4">
           <div className="h-6 w-32 bg-neutral-300 dark:bg-neutral-800 rounded-none mb-2"></div>
           {/* List Items */}
           {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex items-center gap-4 p-3 bg-white/50 dark:bg-white/5 border border-neutral-200 dark:border-white/5 h-20 rounded-none">
                   <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-800 shrink-0 rounded-none"></div>
                   <div className="flex-1 flex flex-col gap-2">
                       <div className="h-4 w-1/3 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                       <div className="h-3 w-1/4 bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

const AlbumPage = () => {
  const params = useParams();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadData = async () => {
          setLoading(true);
          const tracks = await getAlbumTracks(params.id);
          setSongs(tracks);
          setLoading(false);
      };
      loadData();
  }, [params.id]);

  if (loading) return <AlbumSkeleton />;

  // Lấy thông tin album từ bài đầu tiên (giả định các bài cùng album có metadata giống nhau phần này)
  const albumInfo = songs[0] || {};

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8 p-4 md:p-6 pb-[120px] bg-neutral-100 dark:bg-black min-h-screen transition-colors duration-500">
      
      <div className="mb-2 md:mb-3">
          <BackButton /> 
      </div>

       {/* HEADER ALBUM (CYBER STYLE) */}
       <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end mb-8 pb-8 border-b border-neutral-300 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Cover Image Wrapper */}
        <CyberCard className="p-0 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] shrink-0 border border-neutral-400 dark:border-white/20">
            <div className="relative w-48 h-48 md:w-52 md:h-52 group bg-neutral-800 flex items-center justify-center overflow-hidden">
                {albumInfo.image_path ? (
                    <Image 
                        src={albumInfo.image_path} 
                        alt="Cover" 
                        fill 
                        className="object-cover group-hover:scale-110 transition duration-700 grayscale group-hover:grayscale-0"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Disc size={60} className="text-neutral-600"/>
                    </div>
                )}
                
                {/* Overlay & Decor */}
                <ScanlineOverlay />
                <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-mono px-1 z-20">ALBUM_ID: {params.id}</div>
                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>
            </div>
        </CyberCard>

        {/* Info Panel - Center on Mobile, Left on Desktop */}
        <div className="flex-1 mb-2 w-full text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2 w-full justify-center md:justify-start border-b border-dashed border-neutral-300 dark:border-white/10 pb-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse rounded-none"></span>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.5em] uppercase font-bold">
                    :: ALBUM_DETAILS ::
                </p>
            </div>

            <h1 className="text-3xl md:text-6xl font-black font-mono text-neutral-900 dark:text-white tracking-tighter uppercase mb-2 leading-none w-full break-words">
                <GlitchText text={albumInfo.album_name || "ALBUM_TRACKS"} />
            </h1>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-2">
                <p className="text-xs md:text-sm lg:text-lg font-mono text-neutral-600 dark:text-neutral-400 flex items-center gap-2 border border-neutral-300 dark:border-white/20 px-3 py-1 bg-white dark:bg-white/5 w-fit">
                    <span className="text-[9px] md:text-[10px] uppercase text-neutral-400">ARTIST_REF:</span>
                    <span className="font-bold text-neutral-900 dark:text-white uppercase truncate max-w-[150px] md:max-w-none">{albumInfo.author || "UNKNOWN"}</span>
                </p>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                    TOTAL_TRACKS: {songs.length}
                </span>
            </div>
        </div>
      </div>

      {/* TRACKLIST */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[300px]">
          <SongSection title="TRACKLIST_DATA" songs={songs} />
      </div>

    </div>
  );
};

export default AlbumPage;