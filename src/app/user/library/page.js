"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Globe, Music, Edit2, Trash2, Upload, X, Check, Save, Image as ImageIcon, FileAudio, LayoutGrid } from "lucide-react";
import useUI from "@/hooks/useUI";
import Link from "next/link";
import useUploadModal from "@/hooks/useUploadModal";
import { GlitchText, HoloButton, GlitchButton } from "@/components/CyberComponents";

// Function to extract audio duration
const extractAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };

    audio.onerror = () => {
      resolve(0); // Return 0 if can't extract duration
    };

    audio.src = URL.createObjectURL(file);
  });
};

// --- SKELETON COMPONENT (Loading effect) ---
const ContentSkeleton = () => {
  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Filter Bar Skeleton */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
         <div className="h-8 w-64 bg-neutral-200 dark:bg-white/5 rounded-lg animate-pulse"></div>
         <div className="h-4 w-32 bg-neutral-200 dark:bg-white/5 rounded animate-pulse md:ml-auto"></div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-white/5 bg-white/50 dark:bg-neutral-900/50 flex flex-col gap-3">
                <div className="w-full aspect-square bg-neutral-300 dark:bg-white/10 rounded-lg animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 h-5 w-16 bg-neutral-400 dark:bg-white/20 rounded"></div>
                </div>
                {/* Text Lines */}
                <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-neutral-300 dark:bg-white/10 rounded animate-pulse"></div>
                    <div className="h-3 w-1/2 bg-neutral-200 dark:bg-white/5 rounded animate-pulse"></div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-white/5 flex justify-between">
                      <div className="h-3 w-10 bg-neutral-200 dark:bg-white/5 rounded"></div>
                      <div className="h-3 w-12 bg-neutral-200 dark:bg-white/5 rounded"></div>
                </div>
            </div>
         ))}
      </div>
    </div>
  );
};

const MyUploadsPage = () => {
  // --- STATE ---
  const [songs, setSongs] = useState([]);
  const [songsUploads, setSongsUploads] = useState([]);
  const [songsTuned, setSongsTuned] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [loadingTuned, setLoadingTuned] = useState(true);

  // Edit State
  const [editingSong, setEditingSong] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', isPublic: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newDuration, setNewDuration] = useState(0);

  // UI State
  const [activeTab, setActiveTab] = useState('uploads');
  const [filter, setFilter] = useState('all');

  // --- HOOKS ---
  const { alert, confirm } = useUI();
  const { onOpen } = useUploadModal();

  useEffect(() => {
    getMyUploads();
  }, []);

  useEffect(() => {
    if (activeTab === 'tuned' && loadingTuned) {
      getMyTunedSongs();
    }
  }, [activeTab]);

  const getMyUploads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching uploads:', error);
      alert('Failed to load uploads', 'error', 'DB_ERROR');
    }

    setSongsUploads(data || []);
    setLoadingUploads(false);
  };

  const getMyTunedSongs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get playlists
    const { data: playlists, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('user_id', user.id);

    if (playlistError) {
      alert('Failed to load playlists', 'error');
      setLoadingTuned(false);
      return;
    }

    const playlistIds = playlists.map(p => p.id);
    if (playlistIds.length === 0) {
      setSongsTuned([]);
      setLoadingTuned(false);
      return;
    }

    // 2. Get song IDs
    const { data: playlistSongs, error: psError } = await supabase
      .from('playlist_songs')
      .select('song_id')
      .in('playlist_id', playlistIds);

    if (psError) {
      alert('Failed to load playlist songs', 'error');
      setLoadingTuned(false);
      return;
    }

    const songIds = [...new Set(playlistSongs.map(ps => ps.song_id))];
    if (songIds.length === 0) {
      setSongsTuned([]);
      setLoadingTuned(false);
      return;
    }

    // 3. Get Songs details (not owned by user)
    const { data: songs, error: songError } = await supabase
      .from('songs')
      .select('*')
      .in('id', songIds)
      .neq('user_id', user.id) // Exclude own songs
      .order('created_at', { ascending: false });

    if (songError) {
      alert('Failed to load tuned songs', 'error');
    }

    setSongsTuned(songs || []);
    setLoadingTuned(false);
  };

  // Handle selected file change for editing
  const handleSelectedFileChange = async (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    if (file) {
      try {
        const duration = await extractAudioDuration(file);
        setNewDuration(Math.floor(duration));
      } catch (error) {
        console.error("Error extracting duration:", error);
        setNewDuration(0);
      }
    } else {
      setNewDuration(0);
    }
  };

  const handleDeleteSong = async (songId) => {
    const isConfirmed = await confirm(
      "WARNING: This action will permanently delete the song from the database.",
      "DELETE_CONFIRMATION"
    );

    if (!isConfirmed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSongsUploads(songsUploads.filter(song => song.id !== songId));
      alert('Song deleted successfully!', 'success', 'DELETED');
    } catch (err) {
      alert(err.message, 'error', 'DELETE_FAILED');
    }
  };

  const startEditing = (song) => {
    setEditingSong(song.id);
    setEditForm({
      title: song.title,
      author: song.author,
      isPublic: song.is_public ?? false
    });
  };

  const cancelEditing = () => {
    setEditingSong(null);
    setEditForm({ title: '', author: '', isPublic: false });
    setSelectedFile(null);
    setSelectedImage(null);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) {
      alert('Song title cannot be empty', 'warning');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let updateData = {
        title: editForm.title.trim(),
        author: editForm.author?.trim() || 'Unknown',
        is_public: Boolean(editForm.isPublic)
      };

      // Handle duration if audio file is replaced
      if (selectedFile && newDuration > 0) {
        updateData.duration = newDuration;
      }

      // Handle Uploads
      if (selectedFile || selectedImage) {
        const uniqueID = crypto.randomUUID();
        const safeTitle = editForm.title.trim().replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

        if (selectedFile) {
          const songPath = `song-${safeTitle}-${uniqueID}`;
          const { data: songData, error: songError } = await supabase.storage
            .from('songs')
            .upload(songPath, selectedFile, { upsert: false });

          if (songError) throw new Error("Audio upload failed: " + songError.message);
          const { data: urlData } = supabase.storage.from('songs').getPublicUrl(songData.path);
          updateData.song_url = urlData.publicUrl;
        }

        if (selectedImage) {
          const imagePath = `image-${safeTitle}-${uniqueID}`;
          const { data: imageData, error: imageError } = await supabase.storage
            .from('images')
            .upload(imagePath, selectedImage, { upsert: false });

          if (imageError) throw new Error("Image upload failed: " + imageError.message);
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(imageData.path);
          updateData.image_url = urlData.publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', editingSong)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Update failed. Row not found or permission denied.");
      }

      setSongsUploads(songsUploads.map(song =>
        song.id === editingSong ? { ...song, ...data[0] } : song
      ));

      cancelEditing();
      alert('Song updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      alert(err.message, 'error', 'UPDATE_FAILED');
    }
  };

  // --- COMPUTED VALUES ---
  const currentSongs = activeTab === 'uploads' ? songsUploads : songsTuned;
  const isLoading = activeTab === 'uploads' ? loadingUploads : loadingTuned;
  const isEditable = activeTab === 'uploads';

  const filteredSongs = useMemo(() => {
    if (activeTab === 'tuned') {
      return [];
    }

    let result = songsUploads;
    if (filter === 'public') {
      result = result.filter(s => s.is_public);
    } else if (filter === 'private') {
      result = result.filter(s => !s.is_public);
    }
    return result;
  }, [songsUploads, filter, activeTab]);

  // --- COMPONENT: USER SONG CARD ---
  const UserSongCard = ({ song, isEditing, isEditable }) => (
    <div className={`
        group relative flex flex-col gap-3 p-4 rounded-xl transition-all duration-300
        bg-white dark:bg-neutral-900 border
        ${isEditing
            ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
            : 'border-neutral-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-lg'
        }
    `}>
       {/* IMAGE SECTION */}
       <div className={`
            relative w-full aspect-square rounded-lg overflow-hidden bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-white/10
            ${isEditing ? 'opacity-90' : 'group-hover:scale-[1.02] transition-transform duration-500'}
       `}>
          {song.image_url ? (
            <img src={song.image_url} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Music size={40} strokeWidth={1.5} />
            </div>
          )}

          {/* STATUS BADGE */}
          {isEditable && (
             <div className="absolute bottom-2 left-2 z-20">
                {(isEditing ? editForm.isPublic : song.is_public) ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 border border-emerald-500/50 text-emerald-400 text-[9px] font-mono font-bold uppercase backdrop-blur-md shadow-lg">
                    <Globe size={10} /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 border border-red-500/50 text-red-400 text-[9px] font-mono font-bold uppercase backdrop-blur-md shadow-lg">
                    <Lock size={10} /> Private
                  </span>
                )}
             </div>
          )}

          {/* ACTION BUTTONS */}
          {isEditable && !isEditing && (
             <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={() => startEditing(song)}
                    className="p-1.5 rounded-md bg-black/60 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white hover:border-blue-500 backdrop-blur-md transition shadow-lg"
                    title="Edit Metadata"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSong(song.id)}
                    className="p-1.5 rounded-md bg-black/60 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500 backdrop-blur-md transition shadow-lg"
                    title="Delete Song"
                  >
                    <Trash2 size={14} />
                  </button>
             </div>
          )}

          {/* EDIT IMAGE OVERLAY */}
          {isEditing && (
             <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/60 hover:bg-black/80 transition text-white border-2 border-dashed border-emerald-500/50 m-2 rounded-lg">
                <ImageIcon size={24} className="mb-1 text-emerald-500"/>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Change_Img</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedImage(e.target.files[0])} />
             </label>
          )}
       </div>

       {/* INFO / FORM SECTION */}
       <div className="flex flex-col gap-2">
         {isEditing ? (
           <div className="flex flex-col gap-3 pt-2 animate-in fade-in duration-300">
             {/* Title Input */}
             <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-500">Track_Title</label>
                <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-neutral-100 dark:bg-black/50 border border-neutral-300 dark:border-white/10 rounded px-2 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none transition"
                />
             </div>

             {/* Author Input */}
             <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400">Artist_ID</label>
                <input
                    type="text"
                    value={editForm.author}
                    onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                    className="w-full bg-neutral-100 dark:bg-black/50 border border-neutral-300 dark:border-white/10 rounded px-2 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none transition"
                />
             </div>

             {/* Visibility Toggle */}
             <div className="flex p-1 bg-neutral-100 dark:bg-black/50 rounded-lg border border-neutral-300 dark:border-white/10 mt-1">
                 <label className={`flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-all ${editForm.isPublic ? 'bg-white dark:bg-emerald-500/20 shadow-sm text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                    <input type="radio" name={`vis-${song.id}`} checked={editForm.isPublic} onChange={() => setEditForm({...editForm, isPublic: true})} className="hidden"/>
                    <Globe size={12}/> <span className="text-[10px] font-mono uppercase">Public</span>
                 </label>
                 <label className={`flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-all ${!editForm.isPublic ? 'bg-white dark:bg-red-500/20 shadow-sm text-red-600 dark:text-red-400 font-bold border border-red-500/20' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                    <input type="radio" name={`vis-${song.id}`} checked={!editForm.isPublic} onChange={() => setEditForm({...editForm, isPublic: false})} className="hidden"/>
                    <Lock size={12}/> <span className="text-[10px] font-mono uppercase">Private</span>
                 </label>
             </div>

             {/* Audio Upload */}
             <label className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-white/5 rounded border border-dashed border-neutral-300 dark:border-white/10 cursor-pointer hover:border-emerald-500 transition">
                <FileAudio size={14} className="text-neutral-500"/>
                <span className="text-[10px] font-mono text-neutral-500 truncate">
                    {selectedFile ? selectedFile.name : "REPLACE_AUDIO_FILE..."}
                </span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleSelectedFileChange} />
             </label>

             {/* Action Buttons */}
             <div className="flex gap-2 mt-1">
                <button onClick={saveEdit} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 shadow-md hover:shadow-emerald-500/20 transition-all">
                    <Save size={12}/> Save
                </button>
                <button onClick={cancelEditing} className="flex-1 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 border border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-300 py-1.5 rounded text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 transition-colors">
                    <X size={12}/> Cancel
                </button>
             </div>
           </div>
         ) : (
           <>
             <h3 className="font-bold font-mono text-neutral-900 dark:text-white truncate pt-2" title={song.title}>
               {song.title}
             </h3>
             <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="truncate">{song.author}</span>
             </div>

             {/* Read-only Audio File Indicator */}
             <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 dark:border-white/10 flex justify-between items-center text-[9px] font-mono text-neutral-400">
                <span>MP3 / WAV</span>
                <span>{new Date(song.created_at).toLocaleDateString()}</span>
             </div>
           </>
         )}
       </div>
    </div>
  );

  // --- RENDER ---
  return (
    <div className="h-full w-full p-4 md:p-6 pb-[120px] overflow-y-auto bg-neutral-100 dark:bg-black transition-colors duration-500">

       {/* HEADER SECTION */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-neutral-300 dark:border-white/10 pb-6">
          <div className="space-y-2">
             <h1 className="text-3xl md:text-4xl font-black font-mono tracking-tighter text-neutral-900 dark:text-white">
                <GlitchText text="MY_COLLECTION" />
             </h1>
             <p className="text-xs font-mono text-emerald-600 dark:text-emerald-500 tracking-[0.2em] uppercase">
                // Manage your personal uploads & tuned tracks
             </p>
          </div>

          <div className="flex bg-neutral-200 dark:bg-white/5 p-1 rounded-lg">
             <button
                onClick={() => { setActiveTab('uploads'); setFilter('all'); }}
                className={`px-4 py-2 rounded-md text-xs font-mono font-bold uppercase transition-all
                ${activeTab === 'uploads'
                   ? 'bg-white dark:bg-emerald-500 text-black dark:text-white shadow-md'
                   : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
             >
                My Uploads
             </button>
             <button
                onClick={() => { setActiveTab('tuned'); setFilter('all'); }}
                className={`px-4 py-2 rounded-md text-xs font-mono font-bold uppercase transition-all
                ${activeTab === 'tuned'
                   ? 'bg-white dark:bg-emerald-500 text-black dark:text-white shadow-md'
                   : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'}`}
             >
                Tuned Songs
             </button>
          </div>
       </div>

       {/* CONTENT GRID */}
       <div className="min-h-[300px]">
          {isLoading ? (
             <ContentSkeleton />
          ) : (
             currentSongs.length > 0 || activeTab === 'uploads' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {activeTab === 'uploads' && (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          {/* Filter Buttons */}
                          <div className="flex p-1 bg-neutral-200 dark:bg-white/5 rounded-lg w-fit border border-neutral-300 dark:border-white/10">
                              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${filter === 'all' ? 'bg-white dark:bg-neutral-800 shadow-sm text-black dark:text-white font-bold' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>
                                  <LayoutGrid size={12} className="inline mr-1 mb-0.5"/> All ({songsUploads.length})
                              </button>
                              <button onClick={() => setFilter('public')} className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${filter === 'public' ? 'bg-white dark:bg-neutral-800 shadow-sm text-emerald-600 dark:text-emerald-500 font-bold' : 'text-neutral-500 hover:text-emerald-500'}`}>
                                  <Globe size={12} className="inline mr-1 mb-0.5"/> Public ({songsUploads.filter(s => s.is_public).length})
                              </button>
                              <button onClick={() => setFilter('private')} className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${filter === 'private' ? 'bg-white dark:bg-neutral-800 shadow-sm text-red-600 dark:text-red-500 font-bold' : 'text-neutral-500 hover:text-red-500'}`}>
                                  <Lock size={12} className="inline mr-1 mb-0.5"/> Private ({songsUploads.filter(s => !s.is_public).length})
                              </button>
                          </div>

                          <span className="hidden md:inline text-[10px] font-mono text-neutral-400 uppercase tracking-wide opacity-50">HOVER CARD TO RECONFIGURE</span>
                      </div>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {/* Song Cards */}
                      {filteredSongs.map((song) => (
                         <UserSongCard
                           key={song.id}
                           song={song}
                           isEditing={editingSong === song.id}
                           isEditable={isEditable}
                         />
                      ))}

                      {/* Upload Button */}
                      {activeTab === 'uploads' && (
                         <button onClick={onOpen} className="group flex flex-col items-center justify-center gap-4 p-4 py-[9rem] rounded-xl border-2 border-dashed border-neutral-300 dark:border-white/10 hover:border-emerald-500 bg-transparent hover:bg-emerald-500/5 transition-all cursor-pointer min-h-[300px]">
                            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/5 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-neutral-400 transition-colors shadow-sm">
                                <Upload size={24}/>
                            </div>
                            <span className="text-xs font-mono font-bold uppercase text-neutral-500 group-hover:text-emerald-500 tracking-wider">Initialize Upload</span>
                         </button>
                      )}
                   </div>

                   {/* Empty Filter State */}
                   {filteredSongs.length === 0 && filter !== 'all' && (
                       <div className="py-20 text-center text-neutral-500 dark:text-neutral-600 font-mono text-xs uppercase">
                           [NO_RESULTS_FOR_FILTER: {filter}]
                       </div>
                   )}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 text-neutral-500">
                    <Music size={60} strokeWidth={1} />
                    <p className="font-mono text-sm uppercase tracking-widest">
                        {activeTab === 'uploads' ? "NO_UPLOADS_DETECTED" : "NO_TUNED_DATA_FOUND"}
                    </p>
                    {activeTab === 'uploads' && (
                        <button onClick={onOpen} className="text-xs py-2 px-6">
                            <GlitchButton>UPLOAD_FIRST_TRACK</GlitchButton>
                        </button>
                    )}
                </div>
             )
          )}
       </div>

    </div>
  );
};

export default MyUploadsPage;
