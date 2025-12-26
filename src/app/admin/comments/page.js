"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CyberCard, GlitchButton, ScanlineOverlay, GlitchText, NeonButton, CyberButton } from "@/components/CyberComponents";
import { ArrowLeft, Trash2, Eye, MessageSquare, User, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'song_comments' }, (payload) => {
        // Simple sync strategy: refetch on any change
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteComment = async (id) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const { error } = await supabase.from('song_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };
  const viewMessage = (comment) => {
    setSelected(comment);
    setModalOpen(true);
  };

  const groupedComments = comments.reduce((acc, comment) => {
    const songId = comment.song_id;
    if (!acc[songId]) {
      acc[songId] = {
        song: comment.songs,
        comments: []
      };
    }
    acc[songId].comments.push(comment);
    return acc;
  }, {});
  const songList = Object.values(groupedComments);

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-200 transition-colors duration-500 relative">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-300 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white uppercase flex items-center gap-3">
            <GlitchText text="Admin_Comments" />
          </h1>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 tracking-[0.3em] font-mono mt-2">:: COMMENT_MODERATION ::</p>
          <div className="mt-3">
            <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-mono text-xs uppercase tracking-widest border border-transparent hover:border-neutral-500 px-3 py-1 transition-all">
              <ArrowLeft size={14}/> RETURN
            </button>
          </div>
          
        </div>

        <div className="flex items-center gap-3">
        </div>
      </div>

      <CyberCard className="bg-white dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-none overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-neutral-300 dark:border-white/10 flex justify-between items-center">
          <h3 className="text-neutral-900 dark:text-white font-mono text-sm uppercase tracking-wider flex items-center gap-2"><MessageSquare size={16} className="text-sky-500" /> Comments_Log</h3>
        </div>

        <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full min-w-[900px] text-left text-xs font-mono text-neutral-600 dark:text-neutral-400 table-fixed">
            <thead className="bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-500 uppercase tracking-widest sticky top-0 backdrop-blur-md border-b border-neutral-300 dark:border-white/10">
              <tr>
                <th className="px-6 py-3 w-[30%]">Track</th>
                <th className="px-6 py-3 w-[20%]">Commenter</th>
                <th className="px-6 py-3">Comment</th>
                <th className="px-6 py-3 w-[18%]">Date</th>
                <th className="px-6 py-3 w-[10%] text-right">Cmd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-neutral-500">Loading comments...</td></tr>
              )}
              {!loading && songList.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-neutral-500">No comments found.</td></tr>
              )}

              {songList.map((songData) => {
                const isExpanded = expanded.has(songData.song.id);
                return (
                  <>
                    <tr key={songData.song.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition cursor-pointer" onClick={() => {
                      setExpanded(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(songData.song.id)) {
                          newSet.delete(songData.song.id);
                        } else {
                          newSet.add(songData.song.id);
                        }
                        return newSet;
                      });
                    }}>
                      <td className="px-6 py-3 align-middle min-w-0" colSpan={4}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden shrink-0 relative rounded-md">
                            {songData.song?.title ? <img src={songData.song?.image_url || ''} className="w-full h-full object-cover" alt=""/> : <MessageSquare size={14} className="text-neutral-400"/>}
                            <ScanlineOverlay />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-neutral-800 dark:text-neutral-200 font-bold">{songData.song?.title || '—'}</span>
                              <span className="text-[10px] text-neutral-500 px-2 py-0.5 bg-neutral-100 dark:bg-white/5 rounded-md">{songData.comments.length} comments</span>
                            </div>
                            <span className="truncate text-[10px] text-neutral-500">{songData.song?.author || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right align-middle shrink-0">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {isExpanded && songData.comments.map(comment => (
                      <tr key={comment.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition bg-neutral-100 dark:bg-neutral-900">
                        <td className="px-6 py-3 align-middle"></td>
                        <td className="px-6 py-3 align-middle">
                          <div className="max-w-[140px] truncate flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden border border-neutral-300 dark:border-white/10 relative flex-shrink-0">
                              {comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} className="w-full h-full object-cover"/> : <User size={14} className="text-neutral-400"/>}
                              <ScanlineOverlay />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold truncate">{comment.profiles?.full_name || 'Anonymous'}</span>
                              <span className="text-[10px] text-neutral-500">{String(comment.user_id).slice(0,8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 align-middle text-sm">
                          <div className="truncate" title={comment.content}>{comment.content}</div>
                        </td>
                        <td className="px-6 py-3 opacity-60 align-middle">{new Date(comment.created_at).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right align-middle shrink-0">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => viewMessage(comment)}
                              className="p-2 text-neutral-400 hover:text-emerald-500 transition-colors"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </CyberCard>

      {modalOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <CyberCard className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center">
                  {selected.songs?.image_url ? (
                    <img src={selected.songs.image_url} alt={selected.songs?.title || 'cover'} className="w-full h-full object-cover" />
                  ) : (
                    <MessageSquare size={28} className="text-neutral-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold font-mono">{selected.songs?.title || '—'}</h3>
                      <p className="text-[12px] text-neutral-500">{selected.songs?.author || ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-neutral-200 dark:bg-neutral-800 overflow-hidden border border-neutral-300 dark:border-white/10">
                        {selected.profiles?.avatar_url ? (
                          <img src={selected.profiles.avatar_url} alt={selected.profiles?.full_name || 'avatar'} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-neutral-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 mb-4 text-sm whitespace-pre-wrap">{selected.content}</div>

                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-neutral-500">{new Date(selected.created_at).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <GlitchButton onClick={() => { setModalOpen(false); setSelected(null); }} className="px-3 py-2">Close</GlitchButton>
                      <NeonButton onClick={() => {
                        if (!confirm('Xác nhận xóa bình luận này?')) return;
                        deleteComment(selected.id);
                        setModalOpen(false);
                        setSelected(null);
                      }} className="px-3 py-2 bg-red-600 text-white">Delete</NeonButton>
                    </div>
                  </div>
                </div>
              </div>
            </CyberCard>
          </div>
        </div>
      )}
    </div>
  );
}
