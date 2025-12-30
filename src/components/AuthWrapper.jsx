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
  
  // Thêm state lưu danh sách người online toàn cục
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // 1. Lấy session ban đầu
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

    // 2. Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // 3. LOGIC PRESENCE (Chuyển tất cả về đây)
  useEffect(() => {
    if (!user) return;

    // Tạo channel duy nhất
    const channel = supabase.channel('online-users', {
      config: { 
        presence: { key: user.id } 
      },
    });

    // Hàm xử lý khi danh sách online thay đổi
    const handlePresenceSync = () => {
        const newState = channel.presenceState();
        const onlineIds = new Set();
        
        Object.keys(newState).forEach((key) => {
            newState[key].forEach((presence) => {
                if (presence.user_id) {
                    onlineIds.add(String(presence.user_id));
                }
            });
        });
        
        setOnlineUsers(new Set(onlineIds));
        // console.log("GLOBAL PRESENCE SYNC:", onlineIds);
    };

    channel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'join' }, handlePresenceSync)
      .on('presence', { event: 'leave' }, handlePresenceSync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => { 
        // Chỉ remove khi user logout hoặc unmount hẳn app
        supabase.removeChannel(channel); 
    };
  }, [user]);

  return (
    // Truyền onlineUsers xuống cho các component con (như AdminDashboard)
    <AuthContext.Provider value={{ session, user, loading, isAuthenticated: !!session, onlineUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;