import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  client: SupabaseClient;
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);
const safeAuthFallback: AuthState = {
  client: supabase,
  user: null,
  session: null,
  isAdmin: false,
  loading: false,
  signIn: async () => ({ error: "Authentication is temporarily unavailable." }),
  signOut: async () => {},
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await refreshAdmin(s.user.id);
      setLoading(false);

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => { refreshAdmin(newSession.user.id); }, 0);
        } else {
          setIsAdmin(false);
        }
      });
      unsub = () => data.subscription.unsubscribe();
    })().catch((e) => {
      console.error("Auth init failed:", e);
      setLoading(false);
    });
    return () => { unsub?.(); };
  }, []);

  const refreshAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) {
        console.warn("Admin check failed:", error.message);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
    } catch (e) {
      console.warn("Admin check error:", e);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ client: supabase, user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    console.error("useAuth called outside AuthProvider; using safe fallback state.");
    return safeAuthFallback;
  }
  return ctx;
}
