"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Check } from "lucide-react";

const FollowButton = ({ artistName, artistImage }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Kiểm tra trạng thái Follow khi load
  useEffect(() => {
    const checkFollow = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('following_artists')
          .select('*')
          .eq('user_id', user.id)
          .eq('artist_name', artistName)
          .single();
        setIsFollowing(!!data);
      }
      setLoading(false);
    };
    checkFollow();
  }, [artistName]);

  // 2. Xử lý khi bấm nút
  const handleFollow = async (e) => {
    // QUAN TRỌNG: Ngăn không cho sự kiện click lan ra thẻ cha (thẻ Link chuyển trang)
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login to follow artists.");

    // Optimistic UI: Đổi màu ngay lập tức cho mượt
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);

    try {
        if (newStatus) {
            // Follow
            await supabase.from('following_artists').insert({
                user_id: user.id,
                artist_name: artistName,
                artist_image: artistImage
            });
        } else {
            // Unfollow
            await supabase.from('following_artists').delete()
                .eq('user_id', user.id)
                .eq('artist_name', artistName);
        }
    } catch (error) {
        console.error(error);
        // Nếu lỗi thì revert lại
        setIsFollowing(!newStatus);
    }
  };

  if (loading) return <div className="w-8 h-8" />; // Placeholder khi đang load

  return (
    <button
      onClick={handleFollow}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold transition-all duration-300 z-20
        ${isFollowing 
            ? 'bg-transparent border border-emerald-500 text-emerald-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500' 
            : 'bg-emerald-500 text-black hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
        }
      `}
    >
      {isFollowing ? (
        <>
            <Check size={14} className="group-hover:hidden" /> 
            <span>FOLLOWING</span>
        </>
      ) : (
        <>
            <Heart size={14} fill="currentColor" /> 
            <span>FOLLOW</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;