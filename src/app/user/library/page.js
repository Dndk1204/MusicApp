"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import { Loader2, Lock, Globe, Music, Edit2, Trash2, Upload } from "lucide-react";
import useUI from "@/hooks/useUI";
import Link from "next/link";

const MyUploadsPage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSong, setEditingSong] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', isPublic: false });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { alert, confirm } = useUI();

  useEffect(() => {
    getMyUploads();
  }, []);

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
      alert('Failed to load uploads', 'error');
    }

    setSongs(data || []);
    setLoading(false);
  };

  const handleDeleteSong = async (songId) => {
    const isConfirmed = await confirm(
      "Are you sure you want to delete this song? This action cannot be undone.",
      "DELETE_SONG"
    );

    if (!isConfirmed) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to delete songs', 'error');
        return;
      }

      // FIX: Added user_id filter to prevent unauthorized deletions
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId)
        .eq('user_id', user.id); // Security fix: only allow deleting own songs

      if (error) throw error;

      setSongs(songs.filter(song => song.id !== songId));
      alert('Song deleted successfully!', 'success');
    } catch (err) {
      alert('Failed to delete song', 'error');
    }
  };

  // Hàm này ít dùng trong UI hiện tại nhưng nên fix logic update luôn
  const handleTogglePublic = async (songId, newStatus) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to update privacy settings', 'error');
        return;
      }

      // FIX: Added user_id filter to prevent unauthorized privacy updates
      const { error } = await supabase
        .from('songs')
        .update({ is_public: newStatus })
        .eq('id', songId)
        .eq('user_id', user.id); // Security fix: only allow updating own songs

      if (error) throw error;

      setSongs(songs.map(song =>
        song.id === songId ? { ...song, is_public: newStatus } : song
      ));
    } catch (err) {
      alert('Failed to update privacy', 'error');
    }
  };

  const startEditing = (song) => {
    setEditingSong(song.id);
    // FIX 1: Dùng toán tử ?? false để xử lý trường hợp database trả về null
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
      alert('Song title cannot be empty', 'error');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to edit songs', 'error');
        return;
      }

      let updateData = {
        title: editForm.title.trim(),
        author: editForm.author?.trim() || 'Unknown',
        is_public: Boolean(editForm.isPublic) // Đảm bảo luôn là boolean
      };

      // Xử lý upload file (Giữ nguyên logic của bạn)
      if (selectedFile || selectedImage) {
        const uniqueID = crypto.randomUUID();
        const safeTitle = editForm.title.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

        if (selectedFile) {
          const songPath = `song-${safeTitle}-${uniqueID}`;
          const { data: songData, error: songError } = await supabase.storage
            .from('songs')
            .upload(songPath, selectedFile, { cacheControl: '3600', upsert: false });

          if (songError) throw new Error("Failed to upload song: " + songError.message);

          const { data: songUrlData } = supabase.storage.from('songs').getPublicUrl(songData.path);
          updateData.song_url = songUrlData.publicUrl;
        }

        if (selectedImage) {
          const imagePath = `image-${safeTitle}-${uniqueID}`;
          const { data: imageData, error: imageError } = await supabase.storage
            .from('images')
            .upload(imagePath, selectedImage, { cacheControl: '3600', upsert: false });

          if (imageError) throw new Error("Failed to upload image: " + imageError.message);

          const { data: imageUrlData } = supabase.storage.from('images').getPublicUrl(imageData.path);
          updateData.image_url = imageUrlData.publicUrl;
        }
      }

      // FIX 2 (QUAN TRỌNG): Thêm .select() vào cuối lệnh update.
      // Nếu không có .select(), Supabase trả về thành công ngay cả khi RLS chặn update.
      // FIX: Added user_id filter to ensure only the song owner can update their songs
      const { data, error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', editingSong)
        .eq('user_id', user.id) // Security fix: only allow updating own songs
        .select();

      if (error) throw error;

      // Kiểm tra xem có dòng nào thực sự được update không
      if (!data || data.length === 0) {
          throw new Error("Update failed. Row not found or permission denied.");
      }

      // Cập nhật state local bằng dữ liệu thật từ DB trả về (data[0])
      setSongs(songs.map(song =>
        song.id === editingSong
          ? { ...song, ...data[0] }
          : song
      ));

      // Reset form
      setSelectedFile(null);
      setSelectedImage(null);
      setEditingSong(null);
      alert('Song updated successfully!', 'success');
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update song: ' + err.message, 'error');
    }
  };

  const UserSongCard = ({ song, isEditing }) => (
    <div className="group relative bg-neutral-100/50 dark:bg-black/40 border border-neutral-200 dark:border-white/5 p-4 rounded-xl hover:border-emerald-500/50 transition cursor-pointer overflow-hidden flex flex-col gap-3 shadow-sm hover:shadow-md">
       {/* Public/Private Badge */}
       <div className="absolute top-2 right-2 z-20 flex gap-2">
         {(isEditing ? editForm.isPublic : song.is_public) ? (
           <div className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-mono">
             <Globe size={12} />
             Public
           </div>
         ) : (
           <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-mono">
             <Lock size={12} />
             Private
           </div>
         )}

         {/* Edit/Delete Buttons */}
         {!isEditing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                onClick={(e) => {
                    e.stopPropagation();
                    startEditing(song);
                }}
                className="bg-blue-500/90 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                title="Edit song"
                >
                <Edit2 size={14} />
                </button>
                <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSong(song.id);
                }}
                className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                title="Delete song"
                >
                <Trash2 size={14} />
                </button>
            </div>
         )}
       </div>

       {/* IMAGE */}
       <div className="relative w-full aspect-square bg-neutral-300 dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
          <img
            src={song.image_url || '/images/music-placeholder.png'}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
       </div>

       {/* INFO */}
       <div className="flex flex-col gap-1">
         {isEditing ? (
           <div className="space-y-2 p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
             <input
               type="text"
               value={editForm.title}
               onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
               className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:outline-none focus:border-emerald-500"
               placeholder="Song title"
             />
             <input
               type="text"
               value={editForm.author}
               onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
               className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded focus:outline-none focus:border-emerald-500"
               placeholder="Artist"
             />

             {/* Public/Private Toggle */}
             <div className="flex items-center gap-3 py-2">
               <label className="flex items-center gap-2 cursor-pointer group">
                 <input
                   type="radio"
                   // FIX 3: Thêm song.id vào name để tránh xung đột radio buttons
                   name={`visibility-${song.id}`}
                   value="true"
                   checked={editForm.isPublic === true}
                   onChange={(e) => {
                     setEditForm({ ...editForm, isPublic: true });
                   }}
                   className="accent-emerald-500 w-4 h-4 cursor-pointer"
                 />
                 <span className="text-xs text-white flex items-center gap-1 group-hover:text-emerald-400 transition"><Globe size={12}/> Public</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer group">
                 <input
                   type="radio"
                   // FIX 3: Thêm song.id vào name
                   name={`visibility-${song.id}`}
                   value="false"
                   checked={editForm.isPublic === false}
                   onChange={(e) => {
                     setEditForm({ ...editForm, isPublic: false });
                   }}
                   className="accent-red-500 w-4 h-4 cursor-pointer"
                 />
                 <span className="text-xs text-white flex items-center gap-1 group-hover:text-red-400 transition"><Lock size={12}/> Private</span>
               </label>
             </div>

             {/* File Uploads */}
             <div className="space-y-2">
               <div>
                 <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Song File (optional)</label>
                 <input
                   type="file"
                   accept="audio/*"
                   onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                   className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-400"
                 />
               </div>
               <div>
                 <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Cover Image (optional)</label>
                 <input
                   type="file"
                   accept="image/*"
                   onChange={(e) => setSelectedImage(e.target.files[0] || null)}
                   className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                 />
               </div>
             </div>

             <div className="flex gap-2">
               <button
                 onClick={(e) => {
                    e.stopPropagation();
                    saveEdit();
                 }}
                 className="bg-emerald-500 text-white px-3 py-1 rounded text-sm hover:bg-emerald-600 transition-colors"
               >
                 Save Changes
               </button>
               <button
                 onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                 }}
                 className="bg-neutral-500 text-white px-3 py-1 rounded text-sm hover:bg-neutral-600 transition-colors"
               >
                 Cancel
               </button>
             </div>
           </div>
         ) : (
           <>
             <h3 className="font-bold text-neutral-800 dark:text-white font-mono truncate text-lg">
               {song.title}
             </h3>
             <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate uppercase tracking-wider flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               <Link
                 href={`/artist/${encodeURIComponent(song.author)}`}
                 onClick={(e) => e.stopPropagation()}
                 className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
               >
                 {song.author}
               </Link>
             </div>
           </>
         )}
       </div>
    </div>
  );

  return (
     <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
        <div className="flex flex-col gap-y-2 p-6 pb-2">
            <h1 className="text-white text-3xl font-semibold">My Uploads</h1>
            <p className="text-neutral-400 text-sm">Manage your uploaded songs</p>
        </div>
        <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-emerald-500" size={48}/>
              </div>
            ) : (
                songs.length > 0 ? (
                    <div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 text-xs text-neutral-500 font-mono">
                            <span className="flex items-center gap-1"><Globe size={12} className="text-green-500"/> = Public</span>
                            <span className="flex items-center gap-1"><Lock size={12} className="text-red-500"/> = Private</span>
                            <span>• Hover cards to edit metadata, files, or visibility</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {songs.map((song) => (
                            <UserSongCard
                              key={song.id}
                              song={song}
                              isEditing={editingSong === song.id}
                            />
                          ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-500 py-20 gap-4">
                        <Music size={50} className="opacity-20"/>
                        <p>You haven't uploaded any songs yet.</p>
                        <Link
                          href="/upload"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Upload size={16} />
                          Upload Your First Song
                        </Link>
                    </div>
                )
            )}
        </div>
     </div>
  );
};

export default MyUploadsPage;
