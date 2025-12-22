"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
    X, Save, Music, Loader2, Play, Pause, 
    ShieldCheck, ShieldX, Activity, FileText, Clock, Database, Edit3, Eye
} from "lucide-react";
import { 
    CyberCard, ScanlineOverlay, GlitchText, 
    CyberButton, GlitchButton, HoloButton, AudioVisualizer 
} from "./CyberComponents";
import Slider from "./Slider";

const parseSRT = (srtString) => {
    if (!srtString) return [];
    const cleanStr = srtString.replace(/\r\n/g, "\n").trim();
    const regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n([\s\S]*?)(?=\n{2,}|\n*$)/g;
    const lyrics = [];
    let match;
    while ((match = regex.exec(cleanStr)) !== null) {
        lyrics.push({ id: match[1], start: match[2], end: match[3], text: match[4].trim() });
    }
    return lyrics;
};

const TrackDetailModal = ({ song, isOpen, onClose, onUpdate, getUploaderInfo }) => {
    const [editData, setEditData] = useState({ title: "", author: "" });
    const [isSaving, setIsSaving] = useState(false);
    
    // Lyrics States
    const [rawLyrics, setRawLyrics] = useState(""); // Nội dung gốc để sửa
    const [parsedLyrics, setParsedLyrics] = useState([]);
    const [isEditingLyrics, setIsEditingLyrics] = useState(false); // Toggle chế độ sửa
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [lyricError, setLyricError] = useState(null);
    
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const fetchLyrics = async () => {
            if (!song?.lyric_url) { setRawLyrics(""); setParsedLyrics([]); return; }
            setIsLoadingLyrics(true);
            try {
                const response = await fetch(`${song.lyric_url}?t=${Date.now()}`);
                if (!response.ok) throw new Error();
                const text = await response.text();
                setRawLyrics(text);
                setParsedLyrics(parseSRT(text));
            } catch (err) {
                setLyricError("FETCH_ERROR");
            } finally {
                setIsLoadingLyrics(false);
            }
        };
        if (song && isOpen) {
            setEditData({ title: song.title || "", author: song.author || "" });
            fetchLyrics();
            setIsPlaying(false);
            setCurrentTime(0);
            setIsEditingLyrics(false); // Mặc định mở ra là chế độ xem
        }
    }, [song, isOpen]);

    // Cập nhật lại bản preview khi đang gõ lyrics trực tiếp
    const handleLyricsChange = (e) => {
        const newText = e.target.value;
        setRawLyrics(newText);
        setParsedLyrics(parseSRT(newText)); // Cập nhật preview thời gian thực
    };

    const handleSave = async () => {
        if (!song?.id) return;
        setIsSaving(true);
        try {
            // Gửi cả title, author và nội dung lyrics mới
            await onUpdate(song.id, { 
                title: editData.title, 
                author: editData.author,
                new_lyrics_content: rawLyrics // Thêm field này để xử lý ở file Admin
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !song) return null;
    const uploader = getUploaderInfo(song.user_id);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 bg-white/80 dark:bg-black/95 backdrop-blur-md transition-colors duration-300">
            {/* Modal Main Container */}
            <div className="w-full max-w-7xl h-[75vh] max-h-[92vh] flex flex-col relative overflow-hidden border border-emerald-600/30 dark:border-emerald-500/30 bg-white dark:bg-neutral-950 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_rgba(0,0,0,1)] transition-all">
                <ScanlineOverlay className="opacity-[0.03] dark:opacity-100" />
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-emerald-600/10 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 z-20 shrink-0">
                    <div className="flex flex-col">
                        <GlitchText 
                            text="TRACK_PROTOCOL_EDITOR" 
                            className="text-sm font-bold tracking-tighter text-emerald-700 dark:text-emerald-400" 
                        />
                        <span className="text-[8px] font-mono text-emerald-600/60 dark:text-emerald-500/60 leading-none uppercase">ROOT_ACCESS: ENABLED</span>
                    </div>
                    <HoloButton 
                        onClick={onClose} 
                        className="px-2 py-1 border-none bg-transparent hover:text-red-500 dark:text-neutral-400 transition-colors"
                    >
                        <X size={24}/>
                    </HoloButton>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 z-20 overflow-hidden">
                    
                    {/* Cột 1: Media Player */}
                    <div className="lg:col-span-3 p-5 border-r border-neutral-200 dark:border-white/5 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-neutral-50/50 dark:bg-black/40">
                        <div className="aspect-square w-full border border-emerald-600/20 dark:border-emerald-500/20 relative group overflow-hidden bg-neutral-200 dark:bg-neutral-900 shadow-inner">
                            <img src={song.image_url} alt="" className="w-full h-full object-cover opacity-80 dark:opacity-60 transition-opacity group-hover:opacity-100"/>
                            <div className="absolute bottom-4 left-4"><AudioVisualizer isPlaying={isPlaying} /></div>
                        </div>
                        
                        <div className="bg-white dark:bg-emerald-500/5 border border-emerald-600/10 dark:border-emerald-500/10 p-4 shrink-0 shadow-sm">
                            <button 
                                onClick={() => { if (isPlaying) audioRef.current.pause(); else audioRef.current.play(); setIsPlaying(!isPlaying); }} 
                                className="w-full h-12 flex items-center justify-center bg-emerald-600 text-white dark:text-black hover:bg-emerald-500 dark:hover:bg-emerald-400 mb-4 transition-all shadow-lg shadow-emerald-600/20"
                            >
                                {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1"/>}
                            </button>
                            <Slider 
                                value={currentTime} 
                                max={duration || 1} 
                                onChange={(v) => { audioRef.current.currentTime = v; setCurrentTime(v); }} 
                            />
                            <audio ref={audioRef} src={song.song_url} onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)} onLoadedMetadata={() => setDuration(audioRef.current.duration)} onEnded={() => setIsPlaying(false)} hidden />
                        </div>
                    </div>

                    {/* Cột 2: Edit Metadata */}
                    <div className="lg:col-span-3 p-5 border-r border-neutral-200 dark:border-white/5 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-black/20">
                        <div className="space-y-4">
                            <h3 className="text-xs font-mono text-blue-600 dark:text-blue-400 border-b border-blue-500/20 dark:border-blue-500/30 pb-2 flex items-center gap-2">
                                <Database size={12}/> METADATA_INTEGRITY
                            </h3>
                            <div className="bg-neutral-50 dark:bg-white/5 p-4 border border-neutral-200 dark:border-white/5 space-y-4">
                                <div>
                                    <label className="text-[9px] text-emerald-700 dark:text-emerald-500 font-mono mb-1 block uppercase font-bold">Track_Title</label>
                                    <input 
                                        className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-emerald-500/20 p-2 text-xs font-mono text-neutral-800 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-all" 
                                        value={editData.title} 
                                        onChange={(e) => setEditData({...editData, title: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-emerald-700 dark:text-emerald-500 font-mono mb-1 block uppercase font-bold">Artist_Identity</label>
                                    <input 
                                        className="w-full bg-white dark:bg-black border border-neutral-300 dark:border-emerald-500/20 p-2 text-xs font-mono text-neutral-800 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-all" 
                                        value={editData.author} 
                                        onChange={(e) => setEditData({...editData, author: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS: NÚT PHÊ DUYỆT */}
                        <div className="mt-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 shrink-0 shadow-inner">
                            <p className="text-[8px] font-mono text-neutral-500 dark:text-neutral-500 uppercase tracking-widest text-center mb-2">Decision_Matrix</p>
                            
                            <HoloButton 
                                onClick={handleSave} 
                                disabled={isSaving} 
                                className="w-full py-3 text-[10px] !bg-blue-600/10 dark:!bg-blue-600/20 !border-blue-600/30 dark:!border-blue-500/50 !text-blue-700 dark:!text-blue-400 hover:!bg-blue-600 hover:!text-white transition-all"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} SAVE_CHANGES
                            </HoloButton>

                            <div className="flex gap-2">
                                {song.is_verified === false && song.is_denied === false && (
                                    <CyberButton 
                                        onClick={() => onUpdate(song.id, { is_verified: true, title: editData.title, author: editData.author })} 
                                        className="flex-1 py-2 text-[10px] bg-emerald-600/10 dark:bg-emerald-500/20 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-500 hover:!bg-emerald-600 hover:!text-white"
                                    >
                                        <ShieldCheck size={12} className="mr-1"/> APPROVE
                                    </CyberButton>
                                )}

                                {!song.is_denied && (
                                    <GlitchButton 
                                        onClick={() => onUpdate(song.id, { is_public: false, is_denied: true, title: editData.title, author: editData.author })} 
                                        className="flex-1 py-2 text-[10px] bg-red-600/10 dark:bg-red-500/20 border-red-600 dark:border-red-500 text-red-700 dark:text-red-500 hover:!bg-red-600 hover:!text-white"
                                    >
                                        <ShieldX size={12} className="mr-1"/> DENY
                                    </GlitchButton>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cột 3: Lyrics Editor */}
                    <div className="lg:col-span-6 flex flex-col h-full bg-white dark:bg-black/60 overflow-hidden relative border-l border-neutral-200 dark:border-white/5">
                        <div className="flex border-b border-neutral-200 dark:border-white/10 shrink-0 bg-neutral-100 dark:bg-neutral-900/50">
                            <button 
                                onClick={() => setIsEditingLyrics(false)}
                                className={`flex-1 p-3 text-[10px] font-mono flex items-center justify-center gap-2 transition-all ${!isEditingLyrics ? 'bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-500' : 'text-neutral-500 hover:text-emerald-600'}`}
                            >
                                <Eye size={14}/> PREVIEW_STREAM
                            </button>
                            <button 
                                onClick={() => setIsEditingLyrics(true)}
                                className={`flex-1 p-3 text-[10px] font-mono flex items-center justify-center gap-2 transition-all ${isEditingLyrics ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-neutral-500 hover:text-blue-600'}`}
                            >
                                <Edit3 size={14}/> DIRECT_EDIT_SRT
                            </button>
                        </div>
                        
                        <div className="flex-1 min-h-0 overflow-hidden relative">
                            {isLoadingLyrics ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-emerald-600/30 dark:text-emerald-500/30">
                                    <Loader2 className="animate-spin" size={32}/>
                                    <p className="text-[10px] font-mono animate-pulse uppercase">Syncing_Data...</p>
                                </div>
                            ) : isEditingLyrics ? (
                                <div className="h-full w-full p-4 bg-white dark:bg-neutral-950/50">
                                    <textarea 
                                        value={rawLyrics}
                                        onChange={handleLyricsChange}
                                        spellCheck={false}
                                        className="w-full h-full bg-transparent text-neutral-800 dark:text-emerald-500/80 font-mono text-xs p-4 outline-none resize-none border border-neutral-200 dark:border-white/5 focus:border-blue-500/50 transition-all leading-relaxed custom-scrollbar"
                                        placeholder="Paste SRT or Lyrics here..."
                                    />
                                    <div className="absolute bottom-4 right-8 text-[8px] font-mono text-neutral-400 dark:text-neutral-600 bg-white/80 dark:bg-black/80 px-2 py-1 pointer-events-none border border-neutral-200 dark:border-transparent">
                                        UTF-8_ENCODING // RAW_TEXT_MODE
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto p-8 font-mono bg-white dark:bg-transparent custom-scrollbar">
                                    {parsedLyrics.length > 0 ? (
                                        <div className="space-y-6">
                                            {parsedLyrics.map((line, idx) => (
                                                <div key={idx} className="group border-l-2 border-emerald-600/10 dark:border-emerald-500/10 pl-5 py-1 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all">
                                                    <div className="text-[8px] text-emerald-600 dark:text-neutral-600 mb-1 font-bold flex items-center gap-2">
                                                        <Clock size={10}/> [{line.start}]
                                                    </div>
                                                    <p className="text-xs text-neutral-700 dark:text-neutral-400 group-hover:text-emerald-900 dark:group-hover:text-white leading-relaxed">{line.text}</p>
                                                </div>
                                            ))}
                                            <div className="h-20" />
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-neutral-400 dark:text-white text-center">
                                            <FileText size={48} className="mb-4"/>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em]">Data_Not_Found</p>
                                            <p className="text-[10px] mt-2 italic">Switch to Edit Mode to manually add lyrics.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackDetailModal;