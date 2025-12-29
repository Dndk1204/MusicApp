"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  CyberCard, 
  GlitchButton, 
  ScanlineOverlay, 
  GlitchText, 
  HoloButton, 
} from "@/components/CyberComponents";
import { 
  ArrowLeft, Trash2, Eye, MessageSquare, 
  ChevronDown, ChevronUp, Music, ShieldAlert,
  Clock, User, Search
} from "lucide-react";

export default function AdminCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('song_comments')
        .select('*, profiles(id,full_name,avatar_url), songs(id,title,author,image_url)')
        .order('created_at', { ascending: false })
        .range(0, 1999);
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Fetch comments error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel('public:song_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'song_comments' }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const deleteComment = async (id) => {
    if (!confirm('Xác nhận xóa bình luận này?')) return;
    try {
      const { error } = await supabase.from('song_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      if (selected?.id === id) setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const viewMessage = (comment) => {
    setSelected(comment);
    setModalOpen(true);
  };

  const songList = useMemo(() => {
    const filtered = comments.filter(c => 
      c.songs?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped = filtered.reduce((acc, comment) => {
      const songId = comment.song_id;
      if (!acc[songId]) {
        acc[acc[songId] = { song: comment.songs, comments: [] }];
      }
      acc[songId].comments.push(comment);
      return acc;
    }, {});
    return Object.values(grouped);
  }, [comments, searchTerm]);

  const relatedComments = useMemo(() => {
    if (!selected) return [];
    return comments
      .filter(c => c.song_id === selected.song_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selected, comments]);

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-200 transition-colors duration-500 relative">
      
      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-300 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-neutral-900 dark:text-white uppercase">
            <GlitchText text="Review_Terminal" />
          </h1>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 tracking-[0.3em] font-mono mt-2 font-bold animate-pulse">
            :: DATA_LOG_MONITORING_ACTIVE ::
          </p>
          <button 
            onClick={() => router.push('/admin')} 
            className="mt-4 flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-mono text-xs uppercase tracking-widest border border-transparent hover:border-neutral-300 dark:hover:border-neutral-500 px-3 py-1 transition-all"
          >
            <ArrowLeft size={14}/> RETURN_TO_BASE
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14}/>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="FILTER_BY_TRACK_OR_MSG..."
            className="w-full bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/10 rounded-none pl-10 pr-4 py-2 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-emerald-500 transition-colors uppercase placeholder:text-[10px]"
          />
        </div>
      </div>

      {/* MAIN CONTENT TABLE */}
      <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex justify-between items-center">
          <h3 className="font-mono text-sm uppercase tracking-wider flex items-center gap-2 text-neutral-900 dark:text-white">
            <MessageSquare size={16} className="text-emerald-500" /> DATA_STREAM_LOG
          </h3>
          <span className="text-[10px] text-neutral-500 font-mono bg-white dark:bg-black px-2 border border-neutral-300 dark:border-white/10">
            TOTAL_ENTRIES: {comments.length}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full min-w-[900px] text-left text-xs font-mono table-fixed border-collapse">
            <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md border-b border-neutral-300 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 w-[35%]">TRACK_SOURCE</th>
                <th className="px-6 py-4 w-[20%]">SENDER_ID</th>
                <th className="px-6 py-4">CONTENT_PREVIEW</th>
                <th className="px-6 py-4 w-[12%] text-right">PROTOCOL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5 text-neutral-800 dark:text-neutral-300">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center animate-pulse text-emerald-500 tracking-[0.5em]">
                    DECODING_DATABASE...
                  </td>
                </tr>
              )}
              
              {songList.map((songData) => {
                const isExpanded = expanded.has(songData.song.id);
                return (
                  <React.Fragment key={songData.song.id}>
                    <tr 
                      className="group hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 transition cursor-pointer bg-white dark:bg-white/5"
                      onClick={() => {
                        setExpanded(prev => {
                          const newSet = new Set(prev);
                          isExpanded ? newSet.delete(songData.song.id) : newSet.add(songData.song.id);
                          return newSet;
                        });
                      }}
                    >
                      <td className="px-6 py-4" colSpan={3}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 shrink-0 relative overflow-hidden">
                            <img src={songData.song?.image_url} className={`w-full h-full object-cover transition-all duration-500 ${isExpanded ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} alt=""/>
                            <ScanlineOverlay />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-neutral-900 dark:text-emerald-400 uppercase tracking-tighter truncate">
                              {songData.song?.title}
                            </span>
                            <span className="text-[10px] text-neutral-500 italic truncate opacity-60">
                              {songData.song?.author}
                            </span>
                          </div>
                          <span className="ml-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] px-2 py-0.5 border border-emerald-500/20 font-bold">
                            {songData.comments.length} MSG
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-neutral-400 group-hover:text-emerald-500 transition-colors">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && songData.comments.map(comment => (
                      <tr key={comment.id} className="bg-neutral-50 dark:bg-black/40 border-l-4 border-emerald-500 animate-in slide-in-from-left-1 duration-300">
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-neutral-300 dark:bg-neutral-800 border border-emerald-500/30 shrink-0 overflow-hidden">
                              <img src={comment.profiles?.avatar_url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                            </div>
                            <span className="font-bold truncate text-[10px] text-neutral-800 dark:text-neutral-300 uppercase">
                              {comment.profiles?.full_name || "ANONYMOUS"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[11px] text-neutral-600 dark:text-neutral-400 italic truncate font-mono">
                          "{comment.content}"
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); viewMessage(comment); }} 
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 transition-colors border border-neutral-200 dark:border-white/10 hover:border-emerald-500/30 bg-white dark:bg-white/5"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteComment(comment.id); }} 
                              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-red-500 transition-colors border border-neutral-200 dark:border-white/10 hover:border-red-500/30 bg-white dark:bg-white/5"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CyberCard>

      {/* FOOTER WARNING */}
      <div className="mt-8 p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-none flex items-center gap-3">
        <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={20} />
        <p className="text-[10px] text-yellow-700 dark:text-yellow-500/80 font-mono tracking-[0.2em] uppercase">
          WARNING: SYSTEM_LOGS_ARE_READ_ONLY. DELETE_OPERATIONS_ARE_PERMANENT.
        </p>
      </div>

      {/* MODAL - REVIEW CONTEXT AREA */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          
          {/* Backdrop - Tối ưu cho cả 2 chế độ */}
          <div 
            className="absolute inset-0 bg-neutral-900/80 dark:bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={() => setModalOpen(false)}
          />
          
          {/* Modal Container (Cyber Brutalism) */}
          <div className="
            relative z-10 w-[95%] md:w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden
            bg-white dark:bg-black 
            border-2 border-neutral-400 dark:border-white/20 
            shadow-[0_0_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_50px_rgba(255,255,255,0.05)]
            rounded-none
          ">
            <ScanlineOverlay />
            
            {/* Decoration Corners (4 góc đặc trưng) */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-600 dark:border-emerald-500 pointer-events-none z-30"></div>

            {/* Header Section */}
            <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-white/10 p-5 md:p-6 text-center relative shrink-0">
                {/* Top Glow Line */}
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                
                {/* Icon Section */}
                <div className="w-12 h-12 mx-auto flex items-center justify-center mb-3 bg-neutral-200 dark:bg-white/5 border border-neutral-400 dark:border-white/20 rounded-none shadow-inner">
                    <MessageSquare size={24} className="text-emerald-600 dark:text-emerald-500" />
                </div>
                
                {/* Title Section */}
                <h2 className="text-lg md:text-xl font-bold font-mono tracking-widest text-neutral-900 dark:text-white uppercase">
                    <GlitchText text={`CONTEXT_REVIEW: ${selected.songs?.title}`} />
                </h2>
                
                <p className="text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase mt-1 opacity-70 text-neutral-500 dark:text-emerald-400/80">
                    :: ID_STRING: {selected.song_id} ::
                </p>

                {/* Close Button */}
                <button 
                    className="absolute top-2 right-2 p-2 text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300" 
                    onClick={() => setModalOpen(false)}
                >
                    <XIcon size={20} />
                </button>
            </div>

            {/* Body Section - Thread History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50/50 dark:bg-black/80 custom-scrollbar">
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500/50 mb-6 border-b border-emerald-500/20 pb-2 flex justify-between uppercase tracking-widest">
                <span>::: THREAD_HISTORY_INITIALIZED :::</span>
                <Clock size={12} />
              </div>
              
              {relatedComments.map((related) => {
                const isCurrent = related.id === selected.id;
                return (
                  <div 
                    key={related.id} 
                    className={`p-4 border-2 transition-all duration-500 ${
                      isCurrent 
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                      : "border-neutral-300 dark:border-white/5 bg-white dark:bg-white/5 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 border-2 overflow-hidden ${isCurrent ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-neutral-300 dark:border-white/20'}`}>
                          <img src={related.profiles?.avatar_url} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase tracking-tighter ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                            {related.profiles?.full_name || 'Anonymous_Unit'}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {new Date(related.created_at).toLocaleString('en-GB')}
                          </span>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[8px] font-black bg-emerald-500 text-black px-2 py-0.5 animate-pulse uppercase tracking-widest border border-black">
                          TARGET_SELECTION
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-sm font-mono leading-relaxed p-4 bg-white dark:bg-black/40 border-2 ${isCurrent ? "border-emerald-500 text-neutral-900 dark:text-emerald-50 shadow-inner" : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"}`}>
                      {related.content}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => deleteComment(related.id)}
                        className="flex items-center gap-2 text-[10px] font-bold text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 border-2 border-red-500/30 transition-all uppercase tracking-tighter"
                      >
                        <Trash2 size={12} /> PURGE_DATA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Section */}
            <div className="p-4 md:p-6 bg-neutral-100 dark:bg-neutral-900 border-t-2 border-neutral-300 dark:border-emerald-500/30 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
              <span className="text-emerald-600 dark:text-emerald-500 font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                Thread_Length: {relatedComments.length} units
              </span>
              
              <div className="flex gap-3 w-full md:w-auto">
                  <GlitchButton 
                    onClick={() => setModalOpen(false)} 
                    className="flex-1 md:flex-none px-8 py-3 text-xs !border-red-500 !text-red-500 dark:!border-red-400/70 dark:!text-red-400 hover:!text-red-500 dark:hover:!text-white"
                  >
                    TERMINATE_SESSION
                  </GlitchButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const XIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="square" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);