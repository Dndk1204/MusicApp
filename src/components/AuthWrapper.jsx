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
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // 2. Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // ĐÃ XÓA LOGIC PRESENCE TẠI ĐÂY ĐỂ TRÁNH XUNG ĐỘT
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;