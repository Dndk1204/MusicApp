"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabaseClient";

// Khởi tạo Auth Context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthWrapper = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lấy session ban đầu khi load trang
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Auth Error:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // ĐÃ XÓA LOGIC PRESENCE TẠI ĐÂY ĐỂ TRÁNH XUNG ĐỘT VỚI ADMIN DASHBOARD
      }
    );

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
  if (!user) return;

  const channel = supabase.channel('online-users', {
    config: { 
      presence: { key: user.id } // Đảm bảo key chính là ID bạn thấy ở console
    },
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id, // Gửi kèm user_id vào metadata
        online_at: new Date().toISOString(),
      });
    }
  });

  return () => { supabase.removeChannel(channel); };
}, [user]);

  return (
    <AuthContext.Provider value={{ session, user, loading, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;