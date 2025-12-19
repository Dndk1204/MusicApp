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
    let channel = null;

    // Create a presence channel for the given user (client-unique key)
    const createPresenceFor = async (u) => {
      if (!u) return;
      try {
        const clientKey = `${u.id}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        // remove old channel if exists
        if (channel) {
          try { await supabase.removeChannel(channel); } catch (e) { }
          channel = null;
        }

        channel = supabase.channel('online-users', {
          config: { presence: { key: clientKey } },
        });

        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              await channel.track({ user_id: u.id, online_at: new Date().toISOString() });
            } catch (err) {
              console.warn('Presence track failed', err);
            }
          }
        });
      } catch (err) {
        console.warn('Failed to create presence channel', err);
      }
    };

    // 1. Lấy session ban đầu khi load trang
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        createPresenceFor(session.user);
      }
    };

    getInitialSession();

    // 2. Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          createPresenceFor(session.user);
        }

        if (event === 'SIGNED_OUT') {
          if (channel) {
            try { await supabase.removeChannel(channel); } catch (e) { }
            channel = null;
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) { }
        channel = null;
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;