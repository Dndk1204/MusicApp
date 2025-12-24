"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Music, User, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { ScanlineOverlay } from "@/components/CyberComponents";
import HoverImagePreview from "@/components/HoverImagePreview";
import TrackDetailModal from "./TrackDetailModal"; 

const ActivityStream = ({ items, getUploaderInfo, onUpdateSong }) => {
    const [selectedSong, setSelectedSong] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const recentItems = items.slice(0, 20);
    const streamItems = recentItems.length < 10 
        ? [...recentItems, ...recentItems, ...recentItems, ...recentItems] 
        : [...recentItems, ...recentItems];

    if (items.length === 0) return null;

    const handleCardClick = (song) => {
        setSelectedSong(song);
        setIsModalOpen(true);
    };

    // Helper để lấy style cho Tag trạng thái
    const getStatusDetails = (song) => {
        if (song.is_denied) return { 
            label: "DENIED", 
            color: "text-red-500 border-red-500/30 bg-red-500/10",
            icon: <ShieldAlert size={10} />
        };
        if (song.is_public) return { 
            label: "APPROVED", 
            color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
            icon: <ShieldCheck size={10} />
        };
        return { 
            label: "PENDING", 
            color: "text-amber-500 border-amber-500/30 bg-amber-500/10",
            icon: <Clock size={10} />
        };
    };

    return (
        <div className="w-full mb-10 relative group overflow-hidden py-6 border-y border-dashed border-neutral-300 dark:border-white/10 bg-neutral-50/50 dark:bg-white/5">
            <div className="absolute top-3 left-2 z-20 text-[9px] font-mono text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-white dark:bg-black px-2 border border-emerald-500/20 -translate-y-1/2 pointer-events-none">
                :: Live_Upload_Stream (Click_to_Inspect) ::
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-100 dark:from-black to-transparent z-10 pointer-events-none"/>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-100 dark:from-black to-transparent z-10 pointer-events-none"/>
            
            <div className="flex gap-4 animate-flow-right w-max px-4 stream-track">
                {streamItems.map((song, idx) => {
                    const uploader = getUploaderInfo(song.user_id);
                    const status = getStatusDetails(song);

                    return (
                        <div 
                            key={`${song.id}-${idx}`} 
                            onClick={() => handleCardClick(song)}
                            className="flex flex-col gap-2 p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 rounded-none w-[280px] shadow-sm hover:border-emerald-500 transition-colors group/card relative cursor-pointer"
                        >
                             {/* STATUS TAG - Góc trên bên phải */}
                             <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[8px] font-bold tracking-tighter z-20 ${status.color}`}>
                                 {status.icon}
                                 {status.label}
                             </div>

                             <div className="flex items-start gap-3">
                                 <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative shrink-0 border border-neutral-300 dark:border-white/10 group-hover/card:border-emerald-500 transition-colors">
                                     <HoverImagePreview 
                                        src={song.image_url} 
                                        alt={song.title}
                                        audioSrc={song.song_url} 
                                        className="w-full h-full"
                                        previewSize={200}
                                     >
                                          <div className="w-full h-full relative flex items-center justify-center">
                                               {song.image_url ? (
                                                   <img src={song.image_url} className="w-full h-full object-cover grayscale group-hover/card:grayscale-0 transition-all duration-500" alt={song.title}/>
                                               ) : (
                                                   <div className="w-full h-full flex items-center justify-center text-neutral-400"><Music size={16}/></div>
                                               )}
                                               <ScanlineOverlay />
                                          </div>
                                     </HoverImagePreview>
                                 </div>
                                 
                                 <div className="flex flex-col min-w-0 flex-1 justify-center pr-12"> {/* pr-12 để tránh đè lên tag status */}
                                     <span className="text-xs font-bold font-mono truncate text-neutral-900 dark:text-white uppercase group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-500 transition-colors">
                                         {song.title}
                                     </span>
                                     <span className="text-[10px] text-neutral-500 truncate font-mono">
                                         {song.author}
                                     </span>
                                 </div>
                             </div>

                             <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200 dark:border-white/10 mt-1">
                                 <div className="flex items-center gap-2">
                                     <div className={`w-5 h-5 rounded-none overflow-hidden border flex items-center justify-center ${uploader.role === 'admin' ? 'border-yellow-500 bg-yellow-500/10' : 'border-blue-500 bg-blue-500/10'}`}>
                                         {uploader.avatar_url ? (
                                             <img src={uploader.avatar_url} alt={uploader.name} className="w-full h-full object-cover"/>
                                         ) : (
                                             <div className="text-neutral-400"><User size={12}/></div>
                                         )}
                                     </div>
                                     <span className={`text-[9px] font-bold uppercase leading-none ${uploader.role === 'admin' ? 'text-yellow-700 dark:text-yellow-500' : 'text-blue-700 dark:text-blue-400'}`}>
                                         {uploader.name.split(' ')[0]}
                                     </span>
                                 </div>
                                 <span className="text-[9px] text-neutral-400 font-mono bg-neutral-100 dark:bg-white/5 px-1">
                                     {new Date(song.created_at).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>
                        </div>
                    )
                })}
            </div>

            <TrackDetailModal 
                song={selectedSong}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={onUpdateSong}
                getUploaderInfo={getUploaderInfo}
            />

            <style jsx>{`
                @keyframes flowRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                .animate-flow-right { animation: flowRight 120s linear infinite; }
                .group:hover .stream-track { animation-play-state: paused !important; }
            `}</style>
        </div>
    );
};

export default ActivityStream;