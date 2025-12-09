"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
// Import HoloButton để tái sử dụng style nếu muốn, hoặc dùng class trực tiếp
import { HoloButton } from "@/components/CyberComponents";

const FollowButton = ({ artistName, artistImage, onFollowChange }) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Kiểm tra trạng thái Follow
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
          .from('following_artists')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('artist_name', artistName)
          .single();

        if (data) setIsFollowing(true);
      } catch (error) {
        // Không tìm thấy => chưa follow
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [artistName]);

  const handleFollow = async (e) => {
    e.preventDefault(); 
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("ACCESS DENIED: PLEASE LOGIN TO FOLLOW");
        return;
    }

    // Optimistic UI
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    try {
        if (previousState) {
            // Unfollow
            const { error } = await supabase
                .from('following_artists')
                .delete()
                .eq('user_id', session.user.id)
                .eq('artist_name', artistName);
            
            if (error) throw error;
            if (onFollowChange) onFollowChange(false); 
        } else {
            // Follow
            const { error } = await supabase
                .from('following_artists')
                .insert({
                    user_id: session.user.id,
                    artist_name: artistName,
                    artist_image: artistImage
                });
            
            if (error) throw error;
            if (onFollowChange) onFollowChange(true);
        }
        router.refresh();
    } catch (error) {
        console.error("Follow Error:", error);
        setIsFollowing(previousState); 
        alert("SYSTEM ERROR: ACTION FAILED");
    }
  };

  if (loading) return (
    <div className="w-24 h-8 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 animate-pulse rounded-none" />
  );

  return (
    <button
      onClick={handleFollow}
      className={`
        relative group flex items-center justify-center gap-2 px-4 py-1.5 
        font-mono text-[10px] font-bold tracking-widest uppercase transition-all duration-200 z-20 rounded-none border
        
        ${isFollowing 
            ? 'bg-emerald-500 text-black border-emerald-500 hover:bg-red-500 hover:!text-white hover:border-red-500' 
            : 'bg-transparent text-emerald-600 dark:text-emerald-400 border-emerald-500 hover:bg-emerald-500 hover:!text-white'
        }
      `}
    >
      {isFollowing ? (
        <>
            {/* Trạng thái bình thường: CHECK + FOLLOWING */}
            <span className="flex items-center gap-2 group-hover:hidden">
                <Check size={12} strokeWidth={3} /> FOLLOWING
            </span>

            {/* Trạng thái Hover: X + UNFOLLOW */}
            <span className="hidden group-hover:flex items-center gap-2">
                <X size={12} strokeWidth={3} /> UNFOLLOW
            </span>
        </>
      ) : (
        <>
            <Heart size={12} fill={isFollowing ? "currentColor" : "none"} /> 
            <span>FOLLOW</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;