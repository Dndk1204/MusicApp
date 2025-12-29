"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Components
import { GlitchText, CyberCard, CyberButton, ScanlineOverlay, GlitchButton, HoloButton } from "@/components/CyberComponents";
import FollowButton from "@/components/FollowButton"; 
import HoverImagePreview from "@/components/HoverImagePreview"; 

// Icons
import { Play, Music, Disc, ArrowLeft, Edit3, Heart, User, Camera, Save, X, Loader2, FileText, LayoutGrid, Lock, Mail, Phone } from "lucide-react";

// Hooks
import usePlayer from "@/hooks/usePlayer";
import useUI from "@/hooks/useUI"; 
import Link from "next/link"; 

// --- HELPER FUNCTIONS ---
const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const formatDuration = (sec) => {
  if (!sec || sec === "--:--") return "";
  if (typeof sec === 'string') return sec; 
  const s = Math.floor(Number(sec) % 60);
  const m = Math.floor(Number(sec) / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// --- SKELETON LOADING COMPONENT ---
const UserProfileSkeleton = () => {
    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-black pb-[100px] animate-pulse">
            {/* Hero Skeleton */}
            <div className="relative">
                <div className="h-40 md:h-56 w-full bg-neutral-300 dark:bg-neutral-900 border-b border-white/10"></div>
                <div className="px-4 md:px-6 pb-20 relative max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-24 gap-4 md:gap-8">
                        <div className="relative w-32 h-32 md:w-48 md:h-48 bg-neutral-300 dark:bg-neutral-800 border-4 border-black dark:border-neutral-900 shrink-0"></div>
                        <div className="flex-1 w-full mb-2 space-y-4 flex flex-col items-center md:items-start">
                            <div className="h-8 md:h-10 w-2/3 md:w-1/3 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                            <div className="h-4 w-1/2 md:w-1/4 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                            <div className="h-16 w-full bg-neutral-200 dark:bg-neutral-900/50 rounded-none"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Skeleton */}
            <div className="border-y border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 mb-8 h-14"></div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-4">
                <div className="flex gap-4 mb-6 overflow-hidden">
                    <div className="h-10 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                    <div className="h-10 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                    <div className="h-10 w-24 bg-neutral-300 dark:bg-neutral-800 rounded-none"></div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 w-full bg-neutral-200 dark:bg-neutral-900 rounded-none"></div>
                ))}
            </div>
        </div>
    );
};

// --- COMPONENT: EDIT PROFILE MODAL (FULL CLICKABLE AREA) ---
const EditProfileModal = ({ user, email, onClose, onUpdate }) => {
    const { alert: showAlert } = useUI();
    const [isLoading, setIsLoading] = useState(false);
    
    const [fullName, setFullName] = useState(user.full_name || "");
    const [phone, setPhone] = useState(user.phone || ""); 
    const [bio, setBio] = useState(user.bio || "");
    
    const [avatarFile, setAvatarFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    
    const [avatarPreview, setAvatarPreview] = useState(user.avatar_url);
    const [bannerPreview, setBannerPreview] = useState(user.banner_url);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        if (type === 'avatar') {
            setAvatarFile(file);
            setAvatarPreview(previewUrl);
        } else {
            setBannerFile(file);
            setBannerPreview(previewUrl);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let newAvatarUrl = user.avatar_url;
            let newBannerUrl = user.banner_url;
            const uniqueID = generateUniqueId();

            if (avatarFile) {
                const path = `avatar-${user.id}-${uniqueID}`;
                const { data, error } = await supabase.storage.from('images').upload(path, avatarFile);
                if (error) throw new Error("Avatar upload failed");
                const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(data.path);
                newAvatarUrl = publicUrl.publicUrl;
            }

            if (bannerFile) {
                const path = `banner-${user.id}-${uniqueID}`;
                const { data, error } = await supabase.storage.from('images').upload(path, bannerFile);
                if (error) throw new Error("Banner upload failed");
                const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(data.path);
                newBannerUrl = publicUrl.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    phone: phone, 
                    bio: bio,
                    avatar_url: newAvatarUrl,
                    banner_url: newBannerUrl
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            onUpdate(); 
            onClose();
            showAlert("PROFILE_DATA_SYNCED", "success");
        } catch (error) {
            console.error(error);
            showAlert(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full h-[90vh] md:h-auto md:max-w-2xl bg-white dark:bg-black border-t-2 md:border-2 border-emerald-600/50 dark:border-emerald-500/50 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_60px_rgba(16,185,129,0.15)] relative flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar rounded-t-2xl md:rounded-none">
            
            {/* Thanh hiệu ứng trên cùng */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-transparent to-emerald-500 z-30"></div>
            
            {/* Header: Đổi bg và border */}
            <div className="p-5 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-20">
                <div>
                    <h2 className="text-xl font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                        <Edit3 size={20} className="text-emerald-600 dark:text-emerald-500"/> CONFIG_PROFILE
                    </h2>
                    <p className="text-[10px] text-neutral-500 font-mono tracking-widest mt-1">:: ROOT_ACCESS ::</p>
                </div>
                <button onClick={onClose} className="text-neutral-400 hover:text-red-500 transition hover:rotate-90">
                    <X size={24}/>
                </button>
            </div>
            
            {/* Body Content */}
            <div className="p-6 space-y-8 bg-white dark:bg-black/50 pb-32 md:pb-6">
                
                {/* 1. Banner Edit */}
                <div className="space-y-2 group">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-600 font-bold flex items-center gap-2">
                        <LayoutGrid size={12}/> Banner_Config
                    </label>
                    <label className="relative h-32 md:h-40 w-full bg-neutral-100 dark:bg-neutral-900/50 border-2 border-dashed border-neutral-300 dark:border-neutral-700 group-hover:border-emerald-500/50 transition-colors overflow-hidden cursor-pointer block">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                        {bannerPreview ? (
                            <img src={bannerPreview} className="w-full h-full object-cover opacity-80 dark:opacity-70 group-hover:opacity-40 transition-opacity" alt="Banner"/>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-300 dark:text-neutral-700">
                                <LayoutGrid size={48} strokeWidth={1} />
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/40 backdrop-blur-sm">
                            <div className="bg-white dark:bg-black text-emerald-600 dark:text-emerald-500 border border-emerald-500 px-6 py-3 text-xs font-mono font-bold hover:bg-emerald-500 hover:text-white dark:hover:text-black transition-all flex items-center gap-2">
                                <Camera size={16}/> CHANGE_BANNER
                            </div>
                        </div>
                    </label>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* 2. Avatar Edit */}
                    <div className="space-y-2 group shrink-0 flex flex-col items-center md:items-start">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-600 font-bold flex items-center gap-2">
                            <User size={12}/> Avatar_ID
                        </label>
                        <label className="relative w-32 h-32 bg-neutral-100 dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-600 group-hover:border-emerald-500/50 transition-colors overflow-hidden cursor-pointer block rounded-full md:rounded-none shadow-inner">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                            {avatarPreview ? (
                                <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar"/>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                                    <User size={40} />
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                                <Camera size={32} className="text-emerald-500" />
                            </div>
                        </label>
                    </div>

                    {/* 3. Text Inputs */}
                    <div className="flex-1 space-y-4 w-full">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono pb-1 uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold flex items-center gap-2">
                                <Mail size={12}/> Email_Address (LOCKED)
                            </label>
                            <div className="relative">
                                <input 
                                    value={email || ""} 
                                    readOnly 
                                    className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 pl-4 text-sm font-mono text-neutral-400 dark:text-neutral-500 cursor-not-allowed rounded-none" 
                                />
                                <Lock size={16} className="absolute right-3 top-4 text-neutral-300 dark:text-neutral-600"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold">Display_Name</label>
                                <input 
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)} 
                                    className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-700 p-3 pl-4 text-sm font-mono text-neutral-900 dark:text-white focus:border-emerald-500 outline-none transition-all rounded-none placeholder:text-neutral-300 dark:placeholder:text-neutral-800" 
                                    placeholder="ENTER_NAME..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold">Phone_Number</label>
                                <input 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-700 p-3 pl-4 text-sm font-mono text-neutral-900 dark:text-white focus:border-emerald-500 outline-none transition-all rounded-none placeholder:text-neutral-300 dark:placeholder:text-neutral-800" 
                                    placeholder="+84..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold flex items-center gap-2">
                                <FileText size={12}/> Bio_Data
                            </label>
                            <div className="relative group">
                                <textarea 
                                    value={bio} 
                                    onChange={(e) => setBio(e.target.value)} 
                                    rows={4} 
                                    className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-700 p-3 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:border-emerald-500 outline-none transition-all rounded-none placeholder:text-neutral-300 dark:placeholder:text-neutral-800 resize-none leading-relaxed" 
                                    placeholder="ENTER_BIO_DESCRIPTION..."
                                />
                                <span className="absolute bottom-2 right-2 text-[9px] text-neutral-400 dark:text-neutral-600 font-mono">
                                    {bio.length} CHARS
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 flex flex-col md:flex-row gap-4 justify-between items-center sticky bottom-0 z-20">
                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono tracking-widest hidden md:block uppercase">:: READY_TO_COMMIT ::</span>
                <div className="flex gap-3 w-full md:w-auto">
                    <GlitchButton 
                        onClick={onClose} 
                        className="px-4 md:px-6 py-3 md:py-2 text-xs font-mono font-bold border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-500/10 dark:hover:text-white transition-all flex-1 md:flex-initial text-center justify-center uppercase"
                    >
                        Discard
                    </GlitchButton>
                    <CyberButton 
                        onClick={handleSave} 
                        disabled={isLoading} 
                        className="px-4 md:px-6 py-3 md:py-2 text-xs flex-1 md:flex-initial justify-center"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> WRITING...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Save size={14}/> COMMIT_CHANGES</span>
                        )}
                    </CyberButton>
                </div>
            </div>
        </div>
    </div>
);
}

// --- COMPONENT: ARTIST CARD (WITH HOVER PREVIEW) ---
const ArtistCardView = ({ name, image, onUnfollow }) => (
  <CyberCard className="p-0 hover:bg-white/80 dark:hover:bg-neutral-800/40 transition cursor-pointer group border border-neutral-200 dark:border-white/5 hover:border-emerald-500/30 bg-white dark:bg-neutral-900/20">
     <div className="flex items-center justify-between gap-3 p-3 w-full">
         <Link href={`/artist/${encodeURIComponent(name)}`} className="flex-1 flex items-center gap-3 min-w-0 group/link">
            {/* HOVER PREVIEW CHO ARTIST */}
            <div className="w-12 h-12 shrink-0 border border-neutral-300 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800 relative cursor-none">
                <HoverImagePreview 
                    src={image} 
                    alt={name} 
                    className="w-full h-full"
                    previewSize={200}
                    fallbackIcon="user"
                >
                    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                         {image ? (
                            <img src={image} className="w-full h-full object-cover grayscale group-hover/link:grayscale-0 transition-all duration-500" alt={name}/>
                         ) : (
                            <User size={20} className="text-neutral-400 group-hover/link:text-emerald-500 transition-colors"/>
                         )}
                         <ScanlineOverlay />
                    </div>
                </HoverImagePreview>
            </div>

            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono truncate group-hover/link:text-emerald-500 transition-colors uppercase">
                  {name}
               </h3>
               <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Artist</p>
            </div>
         </Link>
         
         <div className="shrink-0 z-20 relative">
             <FollowButton 
                artistName={name} 
                artistImage={image} 
                onFollowChange={(isFollowing) => !isFollowing && onUnfollow(name)} 
             />
         </div>
     </div>
  </CyberCard>
);

// --- COMPONENT: SONG ROW ---
const SongRow = ({ song, onClick }) => (
    <div 
      data-song-json={JSON.stringify(song)} 
      onClick={onClick} 
      className="group flex items-center gap-4 p-3 bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-pointer"
    >
      <div className="relative w-12 h-12 bg-neutral-200 dark:bg-neutral-800 shrink-0 border border-neutral-300 dark:border-white/10">
         <HoverImagePreview 
            src={song.image_url || song.image_path || '/images/music-placeholder.png'} 
            alt={song.title}
            audioSrc={song.song_path || song.song_url} 
            className="w-full h-full cursor-none"
            previewSize={240}
            fallbackIcon="user"
          >
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                {song.image_url || song.image_path ? (
                    <img src={song.image_url || song.image_path} alt={song.title} className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                ) : (
                    <Music size={18} className="text-neutral-400"/>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} className="text-white"/>
                </div>
                <ScanlineOverlay />
            </div>
         </HoverImagePreview>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold font-mono text-sm text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">
          {song.title}
        </h3>
        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
          {song.author}
        </p>
        <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block md:hidden">
             {formatDuration(song.duration ? formatDuration(song.duration) : "00:00")}
        </p>
      </div>
      <div className="text-right flex items-center gap-4">
         <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden md:block">
             {formatDuration(song.duration ? formatDuration(song.duration) : "00:00")}
         </p>
         <span className={`text-[10px] font-mono px-2 py-1 border ${song.is_public ? 'border-blue-500/30 text-blue-600 dark:text-blue-400' : 'border-red-500/30 text-red-600 dark:text-red-400'}`}>
            {song.is_public ? "PUB" : "PVT"}
         </span>
      </div>
    </div>
);

// --- MAIN PAGE ---
const UserProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const player = usePlayer();
    const { alert } = useUI();

    const [user, setUser] = useState(null); 
    const [profile, setProfile] = useState(null); 
    const [userSongs, setUserSongs] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [followedArtists, setFollowedArtists] = useState([]); 
    
    const [activeTab, setActiveTab] = useState('uploads'); 
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false); 

    const isOwner = user?.id === params.id;

    // --- Data Fetching ---
    const fetchPlaylists = async (userId) => {
        const { data } = await supabase
            .from('playlists')
            .select('*, playlist_songs(count)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (data) setUserPlaylists(data);
    };
    
    const fetchSongs = async (userId, isProfileOwner) => {
        let query = supabase.from('songs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (!isProfileOwner) { query = query.eq('is_public', true).not('is_denied', 'is', true); }
        const { data } = await query;
        if (data) setUserSongs(data);
    };

    const fetchFollowing = async (userId) => {
        const { data } = await supabase.from('following_artists').select('artist_name, artist_image').eq('user_id', userId).order('created_at', { ascending: false });
        if (data) setFollowedArtists(data);
    }

    const fetchUserProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const sessionUser = session?.user;
            setUser(sessionUser);

            const isProfileOwner = sessionUser?.id === params.id;

            const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', params.id).single();
            if (error || !profileData) { setLoading(false); return; }
            setProfile(profileData);

            await Promise.all([
                fetchSongs(params.id, isProfileOwner),
                fetchPlaylists(params.id),
                fetchFollowing(params.id) 
            ]);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            setLoading(true);
            fetchUserProfile();
        }
        
        // Realtime Subscription
        const channel = supabase.channel(`realtime_profile_${params.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists', filter: `user_id=eq.${params.id}` }, () => fetchPlaylists(params.id))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'songs', filter: `user_id=eq.${params.id}` }, () => fetchSongs(params.id, user?.id === params.id))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'following_artists', filter: `user_id=eq.${params.id}` }, () => fetchFollowing(params.id)) 
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${params.id}` }, (payload) => {
                setProfile(payload.new); 
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [params.id, user?.id]);

    const handlePlaySong = (song) => {
        player.setIds(userSongs.map(s => s.id)); 
        player.setId(song.id);
    };

    const handleUnfollow = (artistName) => {
        setFollowedArtists(prev => prev.filter(a => a.artist_name !== artistName));
    };

    const handleProfileUpdate = () => fetchUserProfile();

    // --- RENDER ---
    if (loading) return <UserProfileSkeleton />;

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white pb-[100px]">
            
            {/* 1. HERO SECTION */}
            <div className="relative">
                <div className="h-40 md:h-56 w-full dark:bg-neutral-900 bg-neutral-300 relative overflow-hidden border-b border-white/10 group">
                    {profile.banner_url ? (
                        <img src={profile.banner_url} alt="Banner" className="w-full h-full grayscale group-hover:grayscale-0 object-cover opacity-80 transition-all duration-1000" />
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/50 to-neutral-900/75 z-0"></div>
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 z-0">
                                <LayoutGrid className="w-20 h-20 md:w-[120px] md:h-[120px]" strokeWidth={0.5} />
                            </div>
                        </>
                    )}
                    <ScanlineOverlay />
                </div>
                <button onClick={() => router.back()} className="absolute top-4 left-4 md:top-6 md:left-6 p-2 md:p-3 bg-black/50 hover:bg-emerald-500 hover:text-white text-white border border-white/20 transition-colors z-20 group rounded-none"><ArrowLeft size={20} className="group-hover:!-translate-x-1 !transition-transform"/></button>

                <div className="px-4 md:px-6 pb-12 md:pb-20 relative max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-24 gap-4 md:gap-8">
                        
                        {/* Avatar Main */}
                        <div className="relative z-[10] w-32 h-32 md:w-48 md:h-48 bg-black border-4 border-black dark:border-neutral-900 shadow-[0_10px_40px_rgba(0,0,0,0.5)] shrink-0 overflow-hidden group rounded-full md:rounded-none">
                             <HoverImagePreview 
                                src={profile.avatar_url} 
                                alt={profile.full_name} 
                                className="w-full h-full cursor-none"
                                previewSize={240}
                                fallbackIcon="user"
                             >
                                <div className="w-full h-full relative">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"/>
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                                            <User size={64} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <ScanlineOverlay />
                                </div>
                             </HoverImagePreview>

                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500 z-20 pointer-events-none hidden md:block"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500 z-20 pointer-events-none hidden md:block"></div>
                        </div>

                        <div className="flex-1 w-full mb-2">
                            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 text-center md:text-left">
                                <div>
                                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:translate-y-3 items-center md:items-start">
                                        <h1 className="flex text-2xl md:text-6xl font-black font-mono tracking-tighter uppercase mb-1 md:mb-2 text-neutral-900 dark:text-white drop-shadow-lg">
                                            <GlitchText text={profile.full_name || "UNKNOWN_USER"} />
                                        </h1>
                                        <div className="flex items-center gap-3 md:translate-y-[0.62rem] text-[10px] md:text-xs font-mono tracking-widest text-emerald-900 dark:text-emerald-300 uppercase mb-2">
                                            <span className="dark:bg-emerald-500/10 px-2 py-0.5 border dark:border-emerald-300 border-emerald-900 bg-emerald-900/10">{profile.role === 'admin' ? ':: ADMIN ::' : ':: USER ::'}</span>
                                            <span className="opacity-100 hidden md:inline">ID_{profile.id.slice(0, 6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    {/* Info Box */}
                                    <div className="inline-flex flex-col md:translate-y-2 gap-2 mt-2 bg-black/5 md:bg-black/40 backdrop-blur-md border-0 md:border border-white/10 p-0 md:p-3 w-fit items-center md:items-start">
                                        {isOwner ? (
                                            <>
                                                <div className="flex items-center gap-2 text-xs font-mono dark:text-neutral-300 text-neutral-200">
                                                    <Mail size={12} className="text-emerald-700 md:text-emerald-300"/>
                                                    <span className="text-emerald-700 dark:text-emerald-500 font-bold hidden md:inline">EMAIL:</span> {user?.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-mono dark:text-neutral-300 text-neutral-200">
                                                    <Phone size={12} className="text-emerald-700 md:text-emerald-300"/>
                                                    <span className="text-emerald-700 dark:text-emerald-500 font-bold hidden md:inline">PHONE:</span> {profile.phone || "N/A"}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 disabled text-[10px] font-mono text-neutral-500 dark:text-neutral-400 opacity-70">
                                                <Lock size={10}/> <span className="tracking-widest">[INFO_LOCKED]</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Bio */}
                                    {profile.bio && (
                                        <p className="mt-3 md:absolute md:left-6 md:translate-y-1 text-sm md:text-[16px] font-mono text-neutral-700 dark:text-neutral-300 max-w-xl leading-relaxed md:border-l-2 md:border-emerald-500/50 md:pl-3 italic md:not-italic">
                                            "{profile.bio}"
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 flex-col md:flex-row">
                                    {isOwner && (
                                        <>
                                            <CyberButton onClick={() => setShowEditModal(true)} className="px-6 py-3 md:py-2 text-xs border-emerald-500 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all w-full md:w-auto justify-center">
                                                <Edit3 size={14} className="mr-2"/> CONFIG
                                            </CyberButton>
                                            <CyberButton onClick={() => router.push(`/user/library`)} className="px-6 py-3 md:py-2 text-xs border-emerald-500 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all w-full md:w-auto justify-center">
                                                <Music size={14} className="mr-2"/> LIBRARY
                                            </CyberButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS BAR (SCROLLABLE ON MOBILE) */}
            <div className="border-y border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 mb-6 md:mb-8">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-8 md:gap-12 text-xs md:text-sm font-mono uppercase tracking-wider overflow-x-auto whitespace-nowrap custom-scrollbar">
                    <div className="flex items-center gap-2">
                        <span className="text-neutral-500 dark:text-neutral-400">Uploads:</span>
                        <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">{userSongs.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-neutral-500 dark:text-neutral-400">Playlists:</span>
                        <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">{userPlaylists.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-neutral-500 dark:text-neutral-400">Following:</span>
                        <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">{followedArtists.length}</span>
                    </div>
                </div>
            </div>

            {/* 3. CONTENT TABS */}
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex border-b border-neutral-200 dark:border-white/10 mb-6 overflow-x-auto whitespace-nowrap gap-2 md:gap-0 no-scrollbar">
                    <button onClick={() => setActiveTab('uploads')} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-mono font-bold tracking-widest transition-all relative shrink-0 ${activeTab === 'uploads' ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                        {activeTab === 'uploads' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                        <Music size={14} className="md:w-4 md:h-4" /> UPLOADS
                    </button>
                    
                    <button onClick={() => setActiveTab('playlists')} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-mono font-bold tracking-widest transition-all relative shrink-0 ${activeTab === 'playlists' ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                        {activeTab === 'playlists' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                        <Disc size={14} className="md:w-4 md:h-4" /> PLAYLISTS
                    </button>

                    <button onClick={() => setActiveTab('following')} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-mono font-bold tracking-widest transition-all relative shrink-0 ${activeTab === 'following' ? 'text-neutral-900 dark:text-white bg-neutral-200 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}>
                        {activeTab === 'following' && <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                        <Heart size={14} className="md:w-4 md:h-4" /> FOLLOWING
                    </button>
                </div>

                <div className="animate-in fade-in zoom-in duration-500">
                    
                    {/* UPLOADS TAB */}
                    {activeTab === 'uploads' && (
                        <div className="space-y-2">
                            {userSongs.length > 0 ? (
                                userSongs.map(song => (
                                    <SongRow key={song.id} song={song} onClick={() => handlePlaySong(song)} />
                                ))
                            ) : (
                                <div className="col-span-full py-16 md:py-20 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-300 dark:border-white/10">
                                    <Music size={40} className="opacity-30"/>
                                    <p className="font-mono italic text-xs tracking-widest">[NO_UPLOADS_YET]</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PLAYLISTS TAB */}
                    {activeTab === 'playlists' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                            {userPlaylists.length > 0 ? (
                                userPlaylists.map(pl => (
                                    <Link href={`/playlist?id=${pl.id}`} key={pl.id}>
                                        <CyberCard className="group h-full p-0 hover:border-emerald-500/50 transition cursor-pointer relative bg-white dark:bg-neutral-900/40 rounded-none">
                                            <div className="relative aspect-square w-full bg-neutral-800 overflow-hidden group/img border-b border-neutral-300 dark:border-white/10">
                                                {pl.cover_url ? (
                                                    <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-300 to-neutral-200 dark:from-neutral-800 dark:to-black">
                                                        <Disc size={32} className="text-neutral-500 dark:text-neutral-600"/>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                     <Play size={32} className="text-white drop-shadow-lg"/>
                                                </div>
                                                <ScanlineOverlay />
                                            </div>
                                            <div className="p-2 md:p-3">
                                                <h3 className="font-bold text-xs md:text-sm text-neutral-900 dark:text-white font-mono truncate group-hover:text-emerald-500 transition uppercase">{pl.name}</h3>
                                                
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-[8px] md:text-[10px] text-neutral-500 font-mono uppercase tracking-wider">Playlist</p>
                                                    {pl.playlist_songs && pl.playlist_songs[0]?.count !== undefined && (
                                                        <span className="text-[8px] md:text-[9px] bg-neutral-200 dark:bg-white/10 px-1 py-0.5 text-neutral-500 rounded-none">
                                                            {pl.playlist_songs[0].count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CyberCard>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-16 md:py-20 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-300 dark:border-white/10">
                                    <Disc size={40} className="opacity-30"/>
                                    <p className="font-mono italic text-xs tracking-widest">[NO_PLAYLISTS_CREATED]</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FOLLOWING TAB */}
                    {activeTab === 'following' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {followedArtists.length > 0 ? (
                                followedArtists.map((artist, idx) => (
                                    <ArtistCardView key={idx} name={artist.artist_name} image={artist.artist_image} onUnfollow={handleUnfollow}/>
                                ))
                            ) : (
                                <div className="col-span-full py-16 md:py-20 flex flex-col items-center justify-center text-neutral-400 gap-2 border border-dashed border-neutral-300 dark:border-white/10">
                                    <Heart size={40} className="opacity-30"/>
                                    <p className="font-mono italic text-xs tracking-widest">[NOT_FOLLOWING_ANYONE]</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {showEditModal && profile && user && (
                <EditProfileModal 
                    user={profile} 
                    email={user.email} 
                    onClose={() => setShowEditModal(false)} 
                    onUpdate={handleProfileUpdate}
                />
            )}

        </div>
    );
};

export default UserProfilePage;