"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Globe, Music, Edit2, Trash2, Upload, X, Save, Image as ImageIcon, FileAudio, FileText, LayoutGrid, Disc } from "lucide-react";
import useUI from "@/hooks/useUI";
import useUploadModal from "@/hooks/useUploadModal";
// Import Full Cyber Components
import { GlitchText, HoloButton, GlitchButton, CyberButton, CyberCard, ScanlineOverlay } from "@/components/CyberComponents";

// Function to extract audio duration
const extractAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
};

// --- SKELETON COMPONENT (CYBER STYLE) ---
const ContentSkeleton = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="flex flex-col md:flex-row gap-4 mb-8 border-b border-white/10 pb-4">
         <div className="h-10 w-64 bg-neutral-300 dark:bg-white/5 rounded-none"></div>
         <div className="h-8 w-32 bg-neutral-200 dark:bg-white/5 rounded-none md:ml-auto"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[300px] bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10"></div>
         ))}
      </div>
    </div>
  );
};

const MyUploadsPage = () => {
  // --- STATE ---
  const [songsUploads, setSongsUploads] = useState([]);
  const [songsTuned, setSongsTuned] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [loadingTuned, setLoadingTuned] = useState(true);

  // Edit State
  const [editingSong, setEditingSong] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', isPublic: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLyricFile, setSelectedLyricFile] = useState(null);
  const [newDuration, setNewDuration] = useState(0);

  // UI State
  const [activeTab, setActiveTab] = useState('uploads');
  const [filter, setFilter] = useState('all');

  // --- HOOKS ---
  const { alert, confirm } = useUI();
  const { onOpen } = useUploadModal();

  useEffect(() => { getMyUploads(); }, []);
  useEffect(() => { if (activeTab === 'tuned' && loadingTuned) getMyTunedSongs(); }, [activeTab]);

  const getMyUploads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) alert('Failed to load uploads', 'error');
    setSongsUploads(data || []);
    setLoadingUploads(false);
  };

  const getMyTunedSongs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: playlists } = await supabase.from('playlists').select('id').eq('user_id', user.id);
    const playlistIds = playlists?.map(p => p.id) || [];
    
    if (playlistIds.length === 0) {
        setSongsTuned([]); setLoadingTuned(false); return;
    }

    const { data: playlistSongs } = await supabase.from('playlist_songs').select('song_id').in('playlist_id', playlistIds);
    const songIds = [...new Set(playlistSongs?.map(ps => ps.song_id))];
    
    if (songIds.length === 0) {
        setSongsTuned([]); setLoadingTuned(false); return;
    }

    const { data: songs } = await supabase.from('songs').select('*').in('id', songIds).neq('user_id', user.id).order('created_at', { ascending: false });
    setSongsTuned(songs || []);
    setLoadingTuned(false);
  };

  // const handleSelectedFileChange = async (e) => {
  //   const file = e.target.files[0];
  //   setSelectedFile(file);
  //   if (file) {
  //     try { const duration = await extractAudioDuration(file); setNewDuration(Math.floor(duration)); } 
  //     catch (error) { setNewDuration(0); }
  //   } else { setNewDuration(0); }
  // };

  const handleDeleteSong = async (songId) => {
    if (!await confirm("WARNING: PERMANENT DELETION.", "DELETE_CONFIRMATION")) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('songs').delete().eq('id', songId).eq('user_id', user.id);
      if (error) throw error;
      setSongsUploads(songsUploads.filter(song => song.id !== songId));
      alert('Deleted successfully.', 'success');
    } catch (err) { alert(err.message, 'error'); }
  };

  const startEditing = (song) => {
    setEditingSong(song.id);
    setEditForm({ title: song.title, author: song.author, isPublic: song.is_public ?? false });
  };

  const cancelEditing = () => {
    setEditingSong(null);
    setEditForm({ title: '', author: '', isPublic: false });
    setSelectedFile(null); setSelectedImage(null); setSelectedLyricFile(null);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return alert('Title required', 'warning');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let updateData = { title: editForm.title.trim(), author: editForm.author?.trim() || 'Unknown', is_public: Boolean(editForm.isPublic) };
      if (selectedFile && newDuration > 0) updateData.duration = newDuration;

      let uniqueID, safeTitle;
      if (selectedFile || selectedImage || selectedLyricFile) {
        uniqueID = crypto.randomUUID();
        safeTitle = editForm.title.trim().replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

        if (selectedFile) {
          const { data: sData, error: sErr } = await supabase.storage.from('songs').upload(`song-${safeTitle}-${uniqueID}`, selectedFile);
          if (sErr) throw sErr;
          const { data: url } = supabase.storage.from('songs').getPublicUrl(sData.path);
          updateData.song_url = url.publicUrl;
        }
        if (selectedImage) {
          const { data: iData, error: iErr } = await supabase.storage.from('images').upload(`image-${safeTitle}-${uniqueID}`, selectedImage);
          if (iErr) throw iErr;
          const { data: url } = supabase.storage.from('images').getPublicUrl(iData.path);
          updateData.image_url = url.publicUrl;
        }
        if (selectedLyricFile) {
          const fileExt = selectedLyricFile.name.split('.').pop() || 'txt';
          const lyricPath = `lyric-${safeTitle}-${uniqueID}.${fileExt}`;
          const { data: lyricData, error: lyricError } = await supabase.storage.from('songs').upload(lyricPath, selectedLyricFile);
          if (lyricError) throw lyricError;
          const { data: lyricUrl } = supabase.storage.from('songs').getPublicUrl(lyricData.path);
          updateData.lyric_url = lyricUrl.publicUrl;
        }
      }

      const { data, error } = await supabase.from('songs').update(updateData).eq('id', editingSong).eq('user_id', user.id).select();
      if (error || !data) throw error || new Error("Update failed");

      setSongsUploads(songsUploads.map(s => s.id === editingSong ? { ...s, ...data[0] } : s));
      cancelEditing();
      alert('System updated.', 'success');
    } catch (err) { alert(err.message, 'error'); }
  };

  const currentSongs = activeTab === 'uploads' ? songsUploads : songsTuned;
  const isLoading = activeTab === 'uploads' ? loadingUploads : loadingTuned;
  const isEditable = activeTab === 'uploads';

  const filteredSongs = useMemo(() => {
    if (activeTab === 'tuned') return songsTuned;
    if (filter === 'public') return songsUploads.filter(s => s.is_public);
    if (filter === 'private') return songsUploads.filter(s => !s.is_public);
    return songsUploads;
  }, [songsUploads, songsTuned, filter, activeTab]);

  // --- COMPONENT: USER SONG CARD (CYBER BRUTALISM & HOVER FIX) ---
  const UserSongCard = ({ song, isEditing, isEditable }) => (
    <CyberCard 
        className={`
            group relative p-0 bg-white dark:bg-neutral-900/40 
            ${isEditing ? 'border-emerald-500 ring-1 ring-emerald-500' : 'hover:border-emerald-500/50'}
        `}
    >
       {/* IMAGE AREA */}
       {/* group/img: dùng để điều khiển hiệu ứng khi hover vào ảnh
          group (ở CyberCard): dùng để điều khiển hiệu ứng khi hover vào card
       */}
       <div className="relative w-full aspect-square bg-neutral-800 border-b border-neutral-300 dark:border-white/10 overflow-hidden group/img">
          {song.image_url ? (
            <img 
                src={song.image_url} 
                alt={song.title} 
                className={`
                    w-full h-full object-cover transition-all duration-500 
                    ${isEditing 
                        ? 'opacity-50 grayscale' 
                        : 'grayscale group-hover:grayscale-0 group-hover/img:scale-110 group-hover/img:blur-[2px]' 
                    }
                `} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600"><Disc size={40} /></div>
          )}
          
          <ScanlineOverlay />

          {/* STATUS LABEL */}
          {isEditable && !isEditing && (
             <div className="absolute top-2 left-2 z-20">
                {song.is_public ? (
                  <span className="bg-emerald-500 text-black text-[9px] font-bold font-mono px-1.5 py-0.5 border border-emerald-400">PUB</span>
                ) : (
                  <span className="bg-red-500 text-black text-[9px] font-bold font-mono px-1.5 py-0.5 border border-red-400">PVT</span>
                )}
             </div>
          )}

          {/* HOVER ACTIONS (Chỉ hiện khi hover vào ảnh - group-hover/img) */}
          {isEditable && !isEditing && (
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-none z-30">
                  <button onClick={() => startEditing(song)} className="p-2 bg-blue-600/90 text-white hover:bg-blue-500 border border-blue-400 transition-transform hover:scale-110 shadow-lg">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDeleteSong(song.id)} className="p-2 bg-red-600/90 text-white hover:bg-red-500 border border-red-400 transition-transform hover:scale-110 shadow-lg">
                    <Trash2 size={18} />
                  </button>
             </div>
          )}

          {/* UPLOAD OVERLAY (WHEN EDITING) */}
          {isEditing && (
             <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition z-30">
                <ImageIcon size={24} className="text-emerald-500 mb-1 animate-bounce"/>
                <span className="text-[8px] font-mono uppercase bg-black/80 text-emerald-500 px-1">CHANGE_IMG</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedImage(e.target.files[0])} />
             </label>
          )}
       </div>

       {/* INFO AREA */}
       <div className="p-4 flex flex-col gap-2">
         {isEditing ? (
           <div className="flex flex-col gap-3 animate-in fade-in">
             <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase text-emerald-500">TITLE_DATA</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full bg-black/20 border border-neutral-500 dark:border-white/20 p-1.5 text-xs font-mono focus:border-emerald-500 outline-none text-neutral-900 dark:text-white rounded-none"/>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase text-neutral-500">ARTIST_ID</label>
                <input type="text" value={editForm.author} onChange={(e) => setEditForm({...editForm, author: e.target.value})} className="w-full bg-black/20 border border-neutral-500 dark:border-white/20 p-1.5 text-xs font-mono focus:border-emerald-500 outline-none text-neutral-900 dark:text-white rounded-none"/>
             </div>
             <div className={`relative p-3 rounded-none border-2 border-dashed transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center gap-2 ${selectedLyricFile ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/5' : 'border-neutral-300 bg-white hover:bg-neutral-50 hover:border-purple-500/50 dark:border-white/20 dark:bg-black/30 dark:hover:bg-white/5'}`}>
                <div className={`p-2 rounded-none border ${selectedLyricFile ? 'border-purple-500 bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'border-neutral-300 bg-neutral-100 text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 group-hover:text-purple-500 group-hover:border-purple-500'}`}>
                  <FileText size={20} />
                </div>
                <span className={`text-[9px] font-mono text-center truncate w-full uppercase ${selectedLyricFile ? 'text-purple-700 dark:text-purple-400 font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {selectedLyricFile ? selectedLyricFile.name : "SELECT_LYRICS (.SRT)"}
                </span>
                <input type="file" accept=".srt,.txt" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedLyricFile(e.target.files[0])} />
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setEditForm({...editForm, isPublic: true})} className={`flex-1 text-[9px] py-1 border rounded-none ${editForm.isPublic ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'text-neutral-500 border-neutral-600'}`}>PUBLIC</button>
                 <button onClick={() => setEditForm({...editForm, isPublic: false})} className={`flex-1 text-[9px] py-1 border rounded-none ${!editForm.isPublic ? 'bg-red-500 text-black border-red-500 font-bold' : 'text-neutral-500 border-neutral-600'}`}>PRIVATE</button>
             </div>
             <div className="flex gap-2 mt-1">
                <CyberButton onClick={saveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 flex items-center justify-center gap-1 rounded-none"><Save size={10}/> SAVE</CyberButton>
                <GlitchButton onClick={cancelEditing} className="flex-1 bg-neutral-700 hover:bg-neutral-600 hover:!text-white text-[10px] font-bold py-1 flex items-center justify-center gap-1 rounded-none"><X size={10}/> CANCEL</GlitchButton>
             </div>
           </div>
         ) : (
           <>
             <div className="flex justify-between items-start">
                 <div className="min-w-0">
                    <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate uppercase group-hover:text-emerald-500 transition-colors" title={song.title}>{song.title}</h3>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">{song.author}</p>
                 </div>
             </div>
             <div className="pt-2 mt-1 border-t border-dashed border-neutral-300 dark:border-white/10 flex justify-between items-center text-[9px] font-mono text-neutral-400">
                <span>:: AUDIO_FILE</span>
                <span>{new Date(song.created_at).toLocaleDateString()}</span>
             </div>
           </>
         )}
       </div>
    </CyberCard>
  );

  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black transition-colors duration-500">
       
       {/* HEADER */}
       <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col gap-2">
             <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                <Music className="text-emerald-500" size={40}/>
                <GlitchText text="MY_COLLECTION" />
             </h1>
             <div className="h-1 w-24 bg-emerald-500"></div>
          </div>

          {/* TABS */}
          <div className="flex border-b-2 border-neutral-300 dark:border-white/10">
             <button onClick={() => { setActiveTab('uploads'); setFilter('all'); }} className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'uploads' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'}`}>
                UPLOADS
                {activeTab === 'uploads' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 translate-y-full"></div>}
             </button>
             <button onClick={() => { setActiveTab('tuned'); setFilter('all'); }} className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'tuned' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'}`}>
                TUNED_TRACKS
                {activeTab === 'tuned' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 translate-y-full"></div>}
             </button>
          </div>
       </div>

       <div className="min-h-[300px]">
          {isLoading ? <ContentSkeleton /> : (
             currentSongs.length > 0 || activeTab === 'uploads' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {/* FILTER BAR (TECH TOOLBAR) */}
                   {activeTab === 'uploads' && (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 p-3 border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5">
                          <div className="flex items-center gap-4 text-xs font-mono">
                              <span className="text-neutral-500 uppercase tracking-widest border-r border-neutral-500 pr-4 mr-2">:: FILTER_MODE</span>
                              <button onClick={() => setFilter('all')} className={`px-3 py-1 border transition-all ${filter === 'all' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black border-transparent' : 'text-neutral-500 border-neutral-500 hover:border-emerald-500 hover:text-emerald-500'}`}>ALL</button>
                              <button onClick={() => setFilter('public')} className={`px-3 py-1 border transition-all ${filter === 'public' ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'text-neutral-500 border-neutral-500 hover:border-emerald-500 hover:text-emerald-500'}`}>PUBLIC</button>
                              <button onClick={() => setFilter('private')} className={`px-3 py-1 border transition-all ${filter === 'private' ? 'bg-red-500 text-black border-red-500 font-bold' : 'text-neutral-500 border-neutral-500 hover:border-red-500 hover:text-red-500'}`}>PRIVATE</button>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 animate-pulse">SYSTEM_READY...</span>
                      </div>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {/* Upload Button Card (Cyber Style) */}
                      {activeTab === 'uploads' && (
                         <button onClick={onOpen} className="group relative w-[272px] flex flex-col items-center justify-center gap-4 p-4 border border-dashed border-neutral-400 dark:border-white/20 hover:border-emerald-500 bg-transparent hover:bg-emerald-500/5 transition-all cursor-pointer aspect-square min-h-[377px]">
                            <div className="w-20 h-20 bg-neutral-200 dark:bg-white/5 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center text-neutral-400 transition-colors border border-neutral-300 dark:border-white/10 group-hover:border-emerald-400 rounded-none">
                                <Upload size={32}/>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold font-mono uppercase text-neutral-600 dark:text-neutral-300 group-hover:text-emerald-500 tracking-wider">INITIATE_UPLOAD</p>
                                <p className="text-[9px] font-mono text-neutral-400 mt-1">:: ADD_DATA_TO_CORE ::</p>
                            </div>
                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neutral-400 group-hover:border-emerald-500 transition-colors"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neutral-400 group-hover:border-emerald-500 transition-colors"></div>
                         </button>
                      )}

                      {filteredSongs.map(song => (
                         <UserSongCard key={song.id} song={song} isEditing={editingSong === song.id} isEditable={isEditable}/>
                      ))}
                   </div>
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-60 text-neutral-500 border border-dashed border-neutral-300 dark:border-white/10 mt-10">
                    <Music size={60} strokeWidth={1} />
                    <p className="font-mono text-sm uppercase tracking-[0.2em]">{activeTab === 'uploads' ? "[ NO_UPLOADS_DETECTED ]" : "[ NO_TUNED_DATA_FOUND ]"}</p>
                    {activeTab === 'uploads' && (
                        <div onClick={onOpen}>
                            <GlitchButton className="text-xs py-2 px-8 border-emerald-500 text-emerald-500 bg-transparent hover:bg-emerald-500 hover:text-black rounded-none">
                                INITIALIZE_FIRST_UPLOAD
                            </GlitchButton>
                        </div>
                    )}
                </div>
             )
          )}
       </div>
    </div>
  );
};

export default MyUploadsPage;
