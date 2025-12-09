"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Heart } from "lucide-react";
import useUI from "@/hooks/useUI";

const LikeButton = ({ songId }) => {
  const router = useRouter();
  const { alert } = useUI();
  
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState(null);

  // 1. Kiểm tra trạng thái Like khi load
  useEffect(() => {
    const checkUserAndStatus = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            setUserId(session.user.id);
            
            const { data, error } = await supabase
                .from('liked_songs')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('song_id', songId)
                .single();

            if (!error && data) {
                setIsLiked(true);
            }
        }
    };

    if (songId) checkUserAndStatus();
  }, [songId]);

  // 2. Xử lý Click
  const handleLike = async (e) => {
    e.stopPropagation(); // Ngăn click xuyên qua (ví dụ nếu đặt trong thẻ bài hát)

    if (!userId) {
        alert("LOGIN_REQUIRED_FOR_ACTION", "error");
        return;
    }

    // Optimistic UI (Cập nhật giao diện ngay lập tức)
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
        if (previousState) {
            // Unlike
            const { error } = await supabase
                .from('liked_songs')
                .delete()
                .eq('user_id', userId)
                .eq('song_id', songId);
            
            if (error) throw error;
        } else {
            // Like
            const { error } = await supabase
                .from('liked_songs')
                .insert({
                    song_id: songId,
                    user_id: userId
                });
            
            if (error) throw error;
            alert("SAVED_TO_FAVORITES", "success");
        }
        
        router.refresh();
    } catch (error) {
        // Revert nếu lỗi
        setIsLiked(previousState);
        console.error(error);
        alert("ACTION_FAILED", "error");
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`
        group relative flex items-center justify-center p-2 rounded-none transition-all duration-300
        border border-transparent hover:border-red-500/50 hover:bg-red-500/10
        ${isLiked ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
      `}
      title={isLiked ? "REMOVE_FAVORITE" : "ADD_TO_FAVORITES"}
    >
      <Heart 
        size={18} 
        className={`
            transition-all duration-300
            ${isLiked 
                ? "fill-red-600 text-red-600 dark:text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110" 
                : "text-neutral-300 group-hover:text-red-500"
            }
        `}
      />
      
      {/* Glitch Effect on Hover (Optional Decoration) */}
      <div className="absolute inset-0 border border-red-400/20 opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-all duration-300 pointer-events-none"></div>
    </button>
  );
};

export default LikeButton;