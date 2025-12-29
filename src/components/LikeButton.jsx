"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import useUI from "@/hooks/useUI";

const LikeButton = ({ songId, size = 20, className = "" }) => {
  const router = useRouter();
  const { alert } = useUI();

  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true); // Loading lần đầu
  const [isProcessing, setIsProcessing] = useState(false); // Loading khi bấm nút
  const [userId, setUserId] = useState(null);

  // 1. Lấy User ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getUser();
  }, []);

  // 2. Chỉ kiểm tra trạng thái User đã like chưa (Bỏ phần đếm số)
  useEffect(() => {
    const checkUserLikeStatus = async () => {
      if (!songId || !userId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('song_likes')
          .select('user_id')
          .eq('user_id', userId)
          .eq('song_id', songId)
          .maybeSingle();
        
        if (!error && data) {
          setIsLiked(true);
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error("Like check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserLikeStatus();
  }, [songId, userId]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("Please login to like songs.", "error", "ACCESS DENIED");
      return;
    }

    if (isProcessing) return;

    // Optimistic UI: Chỉ đảo ngược trạng thái trái tim
    const previousLiked = isLiked;
    setIsLiked(!isLiked);
    setIsProcessing(true);

    try {
      if (previousLiked) {
        // --- UNLIKE ---
        const { error } = await supabase
          .from('song_likes')
          .delete()
          .eq('user_id', userId)
          .eq('song_id', songId);
          
        if (error) throw error;
      } else {
        // --- LIKE ---
        const { error } = await supabase
          .from('song_likes')
          .insert({ user_id: userId, song_id: songId });
          
        if (error) {
             // Fallback RPC nếu insert lỗi
             const { error: rpcError } = await supabase.rpc('like_song', { 
                 p_user_id: userId, 
                 p_song_id: songId 
             });
             if (rpcError) throw rpcError;
        }
      }
      
      router.refresh();

    } catch (error) {
      console.error("Action failed:", error);
      setIsLiked(previousLiked); // Revert nếu lỗi
      alert("Failed to update like.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-1"><Loader2 size={size} className="animate-spin text-neutral-400" /></div>;
  }

  return (
    <button
      onClick={handleLike}
      className={`
        relative group flex items-center justify-center p-2 rounded-full transition-all duration-200
        hover:bg-neutral-200/50 dark:hover:bg-white/10 active:scale-95
        ${className}
      `}
      title={isLiked ? "Unlike" : "Like"}
    >
      <Heart
        size={size}
        fill={isLiked ? "#ef4444" : "none"} // Màu đỏ #ef4444
        className={`transition-colors duration-300 ${isLiked ? 'text-red-500' : 'text-neutral-400 group-hover:text-red-400'}`}
      />
    </button>
  );
};

export default LikeButton;