"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabaseClient";

// Create auth context to provide authentication state to components
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthWrapper = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let presenceChannel = null;

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle presence tracking
        if (session?.user) {
          // User logged in - track presence
          presenceChannel = supabase.channel('online-users', {
            config: {
              presence: {
                key: session.user.id,
              },
            },
          });

          presenceChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({
                user_id: session.user.id,
                online_at: new Date().toISOString()
              });
            }
          });
        } else {
          // User logged out - leave channel
          if (presenceChannel) {
            supabase.removeChannel(presenceChannel);
            presenceChannel = null;
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
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
