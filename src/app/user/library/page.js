"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Globe, Music, Edit2, Trash2, Upload, X, Save, Image as ImageIcon, Disc, FileText, Music2 } from "lucide-react";
import useUI from "@/hooks/useUI";
import useUploadModal from "@/hooks/useUploadModal";
import usePlayer from "@/hooks/usePlayer";
// Import Cyber Components
import { GlitchText, HoloButton, GlitchButton, CyberButton, CyberCard, ScanlineOverlay } from "@/components/CyberComponents";
// Import AUTH & MODAL
import { useAuth } from "@/components/AuthWrapper";
import { useModal } from "@/context/ModalContext";
import BackButton from "@/components/BackButton";
// Import LYRICS EDIT MODAL
import LyricsEditModal from "@/components/LyricsEditModal";

// --- HELPERS ---
const extractAudioDuration = (file) => {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0);
        audio.src = URL.createObjectURL(file);
    });
};

// --- SKELETON COMPONENT ---
const ContentSkeleton = () => (
    <div className="w-full animate-pulse">
        <div className="flex flex-col md:flex-row gap-4 mb-8 border-b border-white/10 pb-4">
            <div className="h-10 w-64 bg-neutral-300 dark:bg-white/5"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[350px] bg-neutral-200 dark:bg-white/5 border border-neutral-300 dark:border-white/10"></div>
            ))}
        </div>
    </div>
);

// --- SUB-COMPONENT: USER SONG CARD (DEFINED OUTSIDE TO PREVENT FOCUS LOSS) ---
const UserSongCard = ({ 
    song, isEditing, isEditable, editForm, setEditForm, 
    saveEdit, cancelEditing, startEditing, openLyricsModal, 
    handleDeleteSong, setSelectedImage 
}) => {
    return (
        <CyberCard 
            className={`group relative p-0 bg-white dark:bg-neutral-900/40 transition-all duration-300 ${
                isEditing ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'hover:border-emerald-500/50'
            }`}
        >
            {/* IMAGE AREA */}
            <div className="relative w-full aspect-square bg-neutral-800 border-b border-neutral-300 dark:border-white/10 overflow-hidden group/img">
                {song.image_url ? (
                    <img 
                        src={song.image_url} 
                        alt={song.title} 
                        className={`w-full h-full object-cover transition-all duration-500 ${
                            isEditing ? 'opacity-40 grayscale blur-sm' : 'grayscale group-hover:grayscale-0 group-hover/img:scale-110'
                        }`} 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600"><Disc size={40} /></div>
                )}
                <ScanlineOverlay />

                {/* STATUS LABEL */}
                {isEditable && !isEditing && (
                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                        {song.is_denied ? (
                            <span className="bg-red-600 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 border border-red-400">TERMINATED</span>
                        ) : !song.is_verified ? (
                            <div className="flex flex-col gap-0.5">
                                <span className="bg-amber-500 text-black text-[9px] font-bold font-mono px-1.5 py-0.5 border border-amber-400 animate-pulse">AWAITING_AUTH</span>
                                <span className="text-[7px] font-mono text-amber-500 bg-black/70 px-1 border border-amber-500/20 uppercase tracking-tighter self-start">
                                    Req: {song.pending_action?.replace('_', ' ')}
                                </span>
                            </div>
                        ) : (
                            <span className={`text-black text-[9px] font-bold font-mono px-1.5 py-0.5 border ${
                                song.is_public ? 'bg-emerald-500 border-emerald-400' : 'bg-neutral-500 border-neutral-400'
                            }`}>
                                {song.is_public ? 'AUTHORIZED_PUB' : 'AUTHORIZED_PVT'}
                            </span>
                        )}
                    </div>
                )}

                {/* HOVER ACTIONS */}
                {isEditable && !isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-30">
                        <button onClick={() => startEditing(song)} className="p-2 bg-blue-600/90 text-white hover:bg-blue-500 border border-blue-400 transition-transform hover:scale-110 shadow-lg"><Edit2 size={18} /></button>
                        <button onClick={() => openLyricsModal(song)} className="p-2 bg-purple-600/90 text-white hover:bg-purple-500 border border-purple-400 transition-transform hover:scale-110 shadow-lg"><FileText size={18} /></button>
                        <button onClick={() => handleDeleteSong(song.id)} className="p-2 bg-red-600/90 text-white hover:bg-red-500 border border-red-400 transition-transform hover:scale-110 shadow-lg"><Trash2 size={18} /></button>
                    </div>
                )}

                {/* IMAGE UPLOAD OVERLAY */}
                {isEditing && (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition z-30">
                        <ImageIcon size={24} className="text-emerald-500 mb-1 animate-bounce"/>
                        <span className="text-[8px] font-mono uppercase bg-black/80 text-emerald-500 px-1 border border-emerald-500/30">CHANGE_COVER</span>
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
                            <input 
                                type="text" 
                                autoFocus
                                value={editForm.title} 
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                                className="w-full bg-black/20 border border-neutral-500 dark:border-white/20 p-1.5 text-xs font-mono focus:border-emerald-500 outline-none text-neutral-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-mono uppercase text-emerald-500">ARTIST_ID</label>
                            <input 
                                type="text" 
                                value={editForm.author} 
                                onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} 
                                className="w-full bg-black/20 border border-neutral-500 dark:border-white/20 p-1.5 text-xs font-mono focus:border-emerald-500 outline-none text-neutral-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditForm({ ...editForm, isPublic: true })} className={`flex-1 text-[9px] py-1 border rounded-none transition-all ${editForm.isPublic ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'text-neutral-500 border-neutral-600'}`}>PUBLIC</button>
                            <button onClick={() => setEditForm({ ...editForm, isPublic: false })} className={`flex-1 text-[9px] py-1 border rounded-none transition-all ${!editForm.isPublic ? 'bg-red-500 text-black border-red-500 font-bold' : 'text-neutral-500 border-neutral-600'}`}>PRIVATE</button>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <CyberButton onClick={saveEdit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 flex items-center justify-center gap-1 rounded-none"><Save size={10}/> SAVE</CyberButton>
                            <GlitchButton onClick={cancelEditing} className="flex-1 bg-neutral-700 hover:!text-white text-[10px] font-bold py-1 flex items-center justify-center gap-1 rounded-none"><X size={10}/> CANCEL</GlitchButton>
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
                            <span>:: {song.is_verified ? 'SYSTEM_SYNCED' : 'AWAITING_SYNC'}</span>
                            <span>{new Date(song.created_at).toLocaleDateString()}</span>
                        </div>
                    </>
                )}
            </div>
        </CyberCard>
    );
};

// --- MAIN PAGE COMPONENT ---
const MyUploadsPage = () => {
    const [songsUploads, setSongsUploads] = useState([]);
    const [loadingUploads, setLoadingUploads] = useState(true);

    // Edit State
    const [editingSong, setEditingSong] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', author: '', isPublic: false });
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [newDuration, setNewDuration] = useState(0);

    // UI State
    const [activeTab, setActiveTab] = useState('uploads');
    const [filter, setFilter] = useState('all');

    // Lyrics Modal State
    const [lyricsModalOpen, setLyricsModalOpen] = useState(false);
    const [selectedSongForLyrics, setSelectedSongForLyrics] = useState(null);

    const { alert, confirm } = useUI();
    const { onOpen } = useUploadModal();

    useEffect(() => { getMyUploads(); }, []);

    const getMyUploads = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) alert('Failed to load uploads', 'error');
        setSongsUploads(data || []);
        setLoadingUploads(false);
    };

    const handleDeleteSong = async (songId) => {
        if (!await confirm("WARNING: PERMANENT DELETION.", "DELETE_CONFIRMATION")) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('songs').delete().eq('id', songId).eq('user_id', user.id);
            if (error) throw error;
            setSongsUploads(songsUploads.filter(song => song.id !== songId));
            alert('Signal terminated.', 'success');
        } catch (err) { alert(err.message, 'error'); }
    };

    const startEditing = (song) => {
        setEditingSong(song.id);
        setEditForm({ title: song.title, author: song.author, isPublic: song.is_public ?? false });
    };

    const cancelEditing = () => {
        setEditingSong(null);
        setEditForm({ title: '', author: '', isPublic: false });
        setSelectedFile(null); setSelectedImage(null);
    };

    const saveEdit = async () => {
        if (!editForm.title.trim()) return alert('Title required', 'warning');
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const originalSong = songsUploads.find(s => s.id === editingSong);
            
            let updateData = { 
                title: editForm.title.trim(), 
                author: editForm.author?.trim() || 'Unknown',
                updated_at: new Date().toISOString()
            };

            // Logic yêu cầu đổi trạng thái
            if (originalSong.is_public !== editForm.isPublic) {
                updateData.is_verified = false; 
                updateData.pending_action = editForm.isPublic ? 'set_public' : 'set_private';
            }

            if (selectedFile || selectedImage) {
                const uniqueID = crypto.randomUUID();
                const safeTitle = editForm.title.trim().replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

                if (selectedFile) {
                    const { data: sData, error: sErr } = await supabase.storage.from('songs').upload(`song-${safeTitle}-${uniqueID}`, selectedFile);
                    if (sErr) throw sErr;
                    const { data: url } = supabase.storage.from('songs').getPublicUrl(sData.path);
                    updateData.song_url = url.publicUrl;
                    updateData.duration = newDuration;
                    updateData.is_verified = false;
                    updateData.pending_action = 'upload';
                }
                if (selectedImage) {
                    const { data: iData, error: iErr } = await supabase.storage.from('images').upload(`image-${safeTitle}-${uniqueID}`, selectedImage);
                    if (iErr) throw iErr;
                    const { data: url } = supabase.storage.from('images').getPublicUrl(iData.path);
                    updateData.image_url = url.publicUrl;
                }
            }

            // XÓA FIELD TẠM KHÔNG CÓ TRONG DB
            delete updateData.new_lyrics_content;

            const { data, error: dbError } = await supabase
                .from('songs')
                .update(updateData)
                .eq('id', editingSong)
                .eq('user_id', user.id)
                .select();

            if (dbError) throw dbError;

            setSongsUploads(songsUploads.map(s => s.id === editingSong ? { ...s, ...data[0] } : s));
            cancelEditing();
            
            if (updateData.is_verified === false) {
                alert('PROTOCOL_SENT: Yêu cầu đã được gửi tới Admin.', 'success');
            } else {
                alert('SYSTEM_UPDATED: Cập nhật thành công.', 'success');
            }

        } catch (err) { 
            console.error(err);
            alert(err.message, 'error'); 
        }
    };

    const openLyricsModal = (song) => {
        setSelectedSongForLyrics(song);
        setLyricsModalOpen(true);
    };

    const closeLyricsModal = () => {
        setLyricsModalOpen(false);
        setSelectedSongForLyrics(null);
    };

    const handleLyricsUpdate = () => getMyUploads();

    const filteredSongs = useMemo(() => {
        if (filter === 'public') return songsUploads.filter(s => s.is_public && s.is_verified);
        if (filter === 'private') return songsUploads.filter(s => (!s.is_public && s.is_verified) || (!s.is_verified && !s.is_denied));
        return songsUploads;
    }, [songsUploads, filter]);

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white p-6 pb-32 transition-colors duration-500 relative overflow-hidden h-full w-full">
            <div className="h-full w-full p-6 pb-[120px] overflow-y-auto custom-scrollbar">
                <div className="mb-3"><BackButton /></div>

                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3 uppercase">
                            <Music className="text-emerald-500" size={40}/>
                            <GlitchText text="MY_COLLECTION" />
                        </h1>
                        <div className="h-1 w-24 bg-emerald-500"></div>
                    </div>

                    <div className="flex border-b-2 border-neutral-300 dark:border-white/10">
                        <button onClick={() => { setActiveTab('uploads'); setFilter('all'); }} className={`px-6 py-3 text-xs font-mono font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'uploads' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/5'}`}>
                            UPLOADS
                            {activeTab === 'uploads' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 translate-y-full"></div>}
                        </button>
                    </div>
                </div>

                <div className="min-h-[300px]">
                    {loadingUploads ? <ContentSkeleton /> : (
                        songsUploads.length > 0 || activeTab === 'uploads' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 p-3 border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5">
                                    <div className="flex items-center gap-4 text-xs font-mono">
                                        <span className="text-neutral-500 uppercase tracking-widest border-r border-neutral-500 pr-4 mr-2">:: FILTER_MODE</span>
                                        <button onClick={() => setFilter('all')} className={`px-3 py-1 border transition-all ${filter === 'all' ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' : 'text-neutral-500 border-neutral-500 hover:border-emerald-500 hover:text-emerald-500'}`}>ALL</button>
                                        <button onClick={() => setFilter('public')} className={`px-3 py-1 border transition-all ${filter === 'public' ? 'bg-emerald-500 text-black border-emerald-500 font-bold' : 'text-neutral-500 border-neutral-500 hover:border-emerald-500 hover:text-emerald-500'}`}>PUBLIC</button>
                                        <button onClick={() => setFilter('private')} className={`px-3 py-1 border transition-all ${filter === 'private' ? 'bg-red-500 text-black border-red-500 font-bold' : 'text-neutral-500 border-neutral-500 hover:border-red-500 hover:text-red-500'}`}>PRIVATE</button>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 animate-pulse">SYSTEM_READY...</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <button onClick={onOpen} className="group relative flex flex-col items-center justify-center gap-4 p-4 border border-dashed border-neutral-400 dark:border-white/20 hover:border-emerald-500 bg-transparent hover:bg-emerald-500/5 transition-all cursor-pointer aspect-square">
                                        <div className="w-16 h-16 bg-neutral-200 dark:bg-white/5 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center text-neutral-400 border border-neutral-300 dark:border-white/10 rounded-none transition-colors"><Upload size={32}/></div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold font-mono uppercase text-neutral-600 dark:text-neutral-300 group-hover:text-emerald-500 tracking-wider">INITIATE_UPLOAD</p>
                                            <p className="text-[9px] font-mono text-neutral-400 mt-1 uppercase">:: ADD_DATA_TO_CORE ::</p>
                                        </div>
                                    </button>

                                    {filteredSongs.map(song => (
                                        <UserSongCard 
                                            key={song.id} 
                                            song={song} 
                                            isEditing={editingSong === song.id} 
                                            isEditable={true}
                                            editForm={editForm}
                                            setEditForm={setEditForm}
                                            saveEdit={saveEdit}
                                            cancelEditing={cancelEditing}
                                            startEditing={startEditing}
                                            openLyricsModal={openLyricsModal}
                                            handleDeleteSong={handleDeleteSong}
                                            setSelectedImage={setSelectedImage}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-60 text-neutral-500 border border-dashed border-neutral-300 dark:border-white/10 mt-10 uppercase tracking-[0.2em]">
                                <Music size={60} strokeWidth={1} />
                                <p>[ NO_UPLOADS_DETECTED ]</p>
                                <div onClick={onOpen}><GlitchButton className="text-xs py-2 px-8 border-emerald-500 text-emerald-500 bg-transparent hover:bg-emerald-500 hover:text-black">INITIALIZE_FIRST_UPLOAD</GlitchButton></div>
                            </div>
                        )
                    )}
                </div>
            </div>

            <LyricsEditModal isOpen={lyricsModalOpen} onClose={closeLyricsModal} song={selectedSongForLyrics} onUpdate={handleLyricsUpdate} />
        </div>
    );
};

export default MyUploadsPage;