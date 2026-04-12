"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { RoleKey } from "@/lib/roles";

export type MemberProfile = {
  id: string;
  role: RoleKey;
  display_name: string;
  email: string | null;
  player_id: string | null;
  coach_id: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => {
    try {
      return getSupabaseClient();
    } catch (error) {
      return null;
    }
  }, []);

  const loadProfile = async (userId: string) => {
    if (!supabase) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("member_profiles")
      .select("id, role, display_name, email, player_id, coach_id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as MemberProfile);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession ?? null);
      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      }
      setLoading(false);
    };

    init();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn: async (email, password) => {
        if (!supabase) {
          return { error: "Supabase client not configured." };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      signUp: async (email, password) => {
        if (!supabase) {
          return { error: "Supabase client not configured." };
        }
        const { error } = await supabase.auth.signUp({ email, password });
        return error ? { error: error.message } : {};
      },
      signOut: async () => {
        if (!supabase) {
          return;
        }
        await supabase.auth.signOut();
      },
      refreshProfile: async () => {
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      },
    }),
    [session, profile, loading, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
