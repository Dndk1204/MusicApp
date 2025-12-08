"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Components
import MediaItem from "@/components/MediaItem";
import Image from "@/components/Image";

// Icons
import { Clock, Music, Disc, ArrowLeft, MoreVertical, PlayCircle, PauseCircle } from "lucide-react";

// Hooks
import usePlayer from "@/hooks/usePlayer";
import useUI from "@/hooks/useUI";

const UserProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const player = usePlayer();
  const { alert } = useUI();

  const [user, setUser] = useState(null);
  const [userSongs, setUserSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [activeTab, setActiveTab] = useState('songs');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Helper format time
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Flatten danh sách bài hát từ playlists nếu cần
  const getPlaylistSongs = async (playlistId) => {
    // Implement nếu cần
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user?.id);
    };
    getCurrentUser();

    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Lấy thông tin profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.id)
          .single();

        if (profileError || !profile) {
          alert("User not found", "error");
          router.push('/');
          return;
        }

        setUser(profile);

        // Lấy bài hát user đã upload (public)
        const { data: songs, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .eq('user_id', params.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (!songsError) {
          setUserSongs(songs || []);
        }

        // Lấy playlists của user (public)
        const { data: playlists, error: playlistsError } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', params.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (!playlistsError) {
          setUserPlaylists(playlists || []);
        }

      } catch (err) {
        console.error('Error fetching user profile:', err);
        alert("Failed to load user profile", "error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUserProfile();
    }
  }, [params.id]);

  const handlePlaySong = (song) => {
    // Set song to player with playlist context if needed
    player.setIds([song.id]);
    player.setId(song.id);
  };

  const handlePlaylistClick = (playlist) => {
    // Navigate to playlist page or handle
    router.push(`/playlist?id=${playlist.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 dark:bg-black animate-pulse">
        <div className="w-32 h-32 rounded-full bg-neutral-300 dark:bg-neutral-800 mb-4"></div>
        <div className="h-8 w-48 bg-neutral-300 dark:bg-neutral-800 rounded mb-2"></div>
        <div className="h-4 w-32 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-100 dark:bg-black">
        <p className="text-neutral-500 font-mono">User not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black">
      {/* Header with back button */}
      <div className="flex items-center gap-4 p-6 border-b border-neutral-200 dark:border-white/10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          USER PROFILE
        </h1>
      </div>

      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

        <div className="px-6 pb-6 relative">
          <div className="flex items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mr-6">
              <img
                src={user.avatar_url || "/images/default-avatar.png"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-black font-mono text-neutral-900 dark:text-white mb-2">
                {user.full_name || user.username || "Anonymous User"}
              </h2>
              <p className="text-emerald-600 dark:text-emerald-400 font-mono text-sm uppercase tracking-widest">
                {user.bio || "Music lover"}
              </p>

              <div className="flex gap-6 mt-4 text-sm font-mono text-neutral-600 dark:text-neutral-400">
                <div className="text-center">
                  <div className="font-bold text-neutral-900 dark:text-white">{userSongs.length}</div>
                  <div>Songs</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-neutral-900 dark:text-white">{userPlaylists.length}</div>
                  <div>Playlists</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit profile if current user */}
          {currentUser === params.id && (
            <button
              onClick={() => router.push('/user/library')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 font-mono text-xs uppercase tracking-wider"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6">
        <div className="flex border-b border-neutral-200 dark:border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex-1 py-4 text-sm font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'songs'
                ? 'text-emerald-600 dark:text-emerald-500 border-b-2 border-emerald-500'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Music size={16} className="inline mr-2" />
            Songs ({userSongs.length})
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 py-4 text-sm font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'playlists'
                ? 'text-emerald-600 dark:text-emerald-500 border-b-2 border-emerald-500'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Disc size={16} className="inline mr-2" />
            Playlists ({userPlaylists.length})
          </button>
        </div>

        {/* Songs Tab */}
        {activeTab === 'songs' && (
          <div className="space-y-4">
            {userSongs.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 font-mono">
                <Music size={48} className="mx-auto mb-4 opacity-50" />
                <p>No public songs uploaded yet</p>
              </div>
            ) : (
              userSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 p-4 bg-white/50 dark:bg-neutral-900/50 rounded-xl hover:bg-white/70 dark:hover:bg-neutral-900/70 transition-colors cursor-pointer group border border-neutral-200 dark:border-white/10"
                  onClick={() => handlePlaySong(song)}
                >
                  <div className="relative">
                    <img
                      src={song.image_url || "/images/default_song.png"}
                      alt={song.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />

                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle size={24} className="text-white" fill="white" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold font-mono text-lg text-neutral-900 dark:text-white truncate">
                      {song.title}
                    </h3>
                    <p className="text-emerald-600 dark:text-emerald-400 font-mono uppercase text-sm tracking-wider">
                      {song.author}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {formatDuration(song.duration)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlaylists.length === 0 ? (
              <div className="col-span-full text-center py-12 text-neutral-500 font-mono">
                <Disc size={48} className="mx-auto mb-4 opacity-50" />
                <p>No public playlists created yet</p>
              </div>
            ) : (
              userPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-white/50 dark:bg-neutral-900/50 rounded-xl p-4 hover:bg-white/70 dark:hover:bg-neutral-900/70 transition-colors cursor-pointer border border-neutral-200 dark:border-white/10"
                  onClick={() => handlePlaylistClick(playlist)}
                >
                  <div className="aspect-square bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg mb-3 flex items-center justify-center">
                    <Disc size={48} className="text-white opacity-80" />
                  </div>

                  <h3 className="font-bold font-mono text-neutral-900 dark:text-white truncate mb-1">
                    {playlist.name}
                  </h3>

                  <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
                    {playlist.songs?.length || 0} songs
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
