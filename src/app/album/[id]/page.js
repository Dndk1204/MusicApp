"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import getAlbumTracks from "@/app/actions/getAlbumTracks";
import SongSection from "@/components/SongSection";
import { Disc, Loader2 } from "lucide-react";
import Image from "next/image";
import { DecoderText, GlitchText } from "@/components/CyberComponents";

// --- COMPONENT SKELETON CHO ALBUM ---
const AlbumSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-8 p-6 pb-[120px] animate-pulse bg-neutral-100 dark:bg-black transition-colors duration-500">
       {/* Header Skeleton */}
       <div className="flex flex-col md:flex-row gap-8 items-end mb-8 pb-8 border-b border-neutral-300 dark:border-white/10">
           {/* Cover Image */}
           <div className="relative w-52 h-52 shrink-0 rounded-lg bg-neutral-300 dark:bg-neutral-800"></div>
           
           {/* Info */}
           <div className="flex-1 mb-2 w-full flex flex-col gap-4">
               <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-800 rounded"></div> {/* Label */}
               <div className="h-12 w-3/4 md:w-1/2 bg-neutral-300 dark:bg-neutral-800 rounded-md"></div> {/* Title */}
               <div className="h-6 w-48 bg-neutral-300 dark:bg-neutral-800 rounded"></div> {/* Author */}
           </div>
       </div>

       {/* Tracklist Skeleton */}
       <div className="flex flex-col gap-y-4">
           <div className="h-6 w-32 bg-neutral-300 dark:bg-neutral-800 rounded mb-2"></div>
           {/* List Items */}
           {[1, 2, 3, 4, 5].map((i) => (
               <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-neutral-200 dark:border-white/5 h-20">
                   <div className="w-12 h-12 rounded-md bg-neutral-300 dark:bg-neutral-800 shrink-0"></div>
                   <div className="flex-1 flex flex-col gap-2">
                       <div className="h-4 w-1/3 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
                       <div className="h-3 w-1/4 bg-neutral-200 dark:bg-neutral-900 rounded"></div>
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
          // Thêm delay giả nếu muốn test hiệu ứng (xóa khi chạy thật)
          // await new Promise(r => setTimeout(r, 500));

          const tracks = await getAlbumTracks(params.id);
          setSongs(tracks);
          setLoading(false);
      };
      loadData();
  }, [params.id]);

  // --- THAY THẾ LOADER CŨ BẰNG SKELETON ---
  if (loading) return <AlbumSkeleton />;

  // Lấy thông tin album từ bài đầu tiên
  const albumInfo = songs[0] || {};

  return (
    <div className="w-full flex flex-col gap-8 p-6 pb-[120px] bg-neutral-100 dark:bg-black min-h-screen transition-colors duration-500">
      
       {/* HEADER ALBUM */}
       <div className="flex flex-col md:flex-row gap-8 items-end mb-8 pb-8 border-b border-neutral-200 dark:border-white/10">
        <div className="relative w-52 h-52 shrink-0 rounded-lg overflow-hidden shadow-2xl group">
            {albumInfo.image_path ? (
                <Image 
                    src={albumInfo.image_path} 
                    alt="Cover" 
                    fill 
                    className="object-cover group-hover:scale-110 transition duration-700"
                />
            ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <Disc size={60} className="text-neutral-600"/>
                </div>
            )}
            {/* Glitch overlay nhẹ */}
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition duration-300 mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="flex-1 mb-2">
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-500 tracking-widest uppercase mb-1">
                :: ALBUM_DETAILS ::
            </p>
            <h1 className="text-4xl md:text-6xl font-bold font-mono text-neutral-900 dark:text-white tracking-tighter">
                {/* Tên album lấy từ metadata bài hát, nếu không có thì fallback */}
                <GlitchText text={albumInfo.album_name || "ALBUM TRACKS"} />
            </h1>
            <p className="text-lg font-mono text-neutral-600 dark:text-neutral-400 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                {albumInfo.author || "Unknown Artist"}
            </p>
        </div>
      </div>

      {/* TRACKLIST */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <SongSection title="Tracklist" songs={songs} />
      </div>

    </div>
  );
};

export default AlbumPage;