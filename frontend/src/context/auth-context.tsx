"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface GuestUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vipTier?: string;
  role?: "client" | "admin" | "driver";
  avatarUrl?: string;
  provider?: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: GuestUser | null;
  session: Session | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (userData: GuestUser) => void;
  logout: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string, name: string, phone?: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  updateProfile: (updates: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to format VIP Tier: by default users are "Member". Admin assigns VIP tiers.
const formatTier = (rawTier?: string | null): string => {
  if (!rawTier || rawTier.toLowerCase() === "standard" || rawTier.toLowerCase() === "member") {
    return "Member";
  }
  if (rawTier.toLowerCase() === "executive") return "VIP Executive";
  if (rawTier.toLowerCase() === "first_class") return "VIP First Class";
  if (rawTier.toLowerCase() === "diplomatic") return "VIP Diplomatic";
  return rawTier;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync Supabase auth user with public.profiles table
  const syncUserProfile = useCallback(async (sbUser: SupabaseUser, currentSession?: Session) => {
    try {
      // 1. Try to fetch profile from public.profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, vip_tier, role, avatar_url")
        .eq("id", sbUser.id)
        .maybeSingle();

      const fullName =
        profile?.full_name ||
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split("@")[0].replace(".", " ") ||
        "Member";

      const userData: GuestUser = {
        id: sbUser.id,
        name: fullName,
        email: sbUser.email || profile?.email || "",
        phone: profile?.phone || sbUser.user_metadata?.phone || undefined,
        vipTier: formatTier(profile?.vip_tier),
        role: profile?.role || (sbUser.user_metadata?.role as any) || "client",
        avatarUrl: profile?.avatar_url || sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture,
        provider: sbUser.app_metadata?.provider || "email",
      };

      setUser(userData);
      if (currentSession) setSession(currentSession);
      localStorage.setItem("laPlanta_guest", JSON.stringify(userData));
    } catch (err) {
      console.warn("[Auth] Failed to sync profile from Supabase, using metadata fallback:", err);
      const fallbackUser: GuestUser = {
        id: sbUser.id,
        name: sbUser.user_metadata?.full_name || sbUser.email?.split("@")[0] || "Member",
        email: sbUser.email || "",
        phone: sbUser.user_metadata?.phone || undefined,
        vipTier: "Member",
      };
      setUser(fallbackUser);
      localStorage.setItem("laPlanta_guest", JSON.stringify(fallbackUser));
    }
  }, []);

  // Listen to Supabase Auth State changes & Initial Session
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession);
      if (initSession?.user) {
        syncUserProfile(initSession.user, initSession);
      } else {
        // Fallback to cached local guest session if offline
        try {
          const stored = localStorage.getItem("laPlanta_guest");
          if (stored) setUser(JSON.parse(stored));
        } catch {}
      }
      setLoading(false);
    });

    // Listen to live auth changes (e.g. Google OAuth redirect, Sign in, Sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await syncUserProfile(newSession.user, newSession);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("laPlanta_guest");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserProfile]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Manual / Demo login
  const login = (userData: GuestUser) => {
    setUser(userData);
    try {
      localStorage.setItem("laPlanta_guest", JSON.stringify(userData));
    } catch {}
  };

  // Sign out from Supabase & clear state
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
    try {
      localStorage.removeItem("laPlanta_guest");
    } catch {}
  };

  // Email / Password Sign In
  const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await syncUserProfile(data.user, data.session);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  // Email / Password Sign Up
  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone || null,
            role: "client",
            vip_tier: "standard",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await syncUserProfile(data.user, data.session ?? undefined);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create account" };
    }
  };

  // Google OAuth Sign In
  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to initiate Google sign-in" };
    }
  };

  // Update Profile (e.g. adding phone number, updating name)
  const updateProfile = async (updates: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
  }): Promise<AuthResponse> => {
    try {
      if (!user?.id) {
        return { success: false, error: "No active user session." };
      }

      // 1. Update in Supabase profiles table
      const { error } = await supabase
        .from("profiles")
        .update({
          ...(updates.full_name ? { full_name: updates.full_name } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
          ...(updates.avatar_url ? { avatar_url: updates.avatar_url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.warn("[Auth] Profile update error in Supabase:", error.message);
      }

      // 2. Update local state
      const updatedUser: GuestUser = {
        ...user,
        name: updates.full_name || user.name,
        phone: updates.phone !== undefined ? updates.phone : user.phone,
        avatarUrl: updates.avatar_url || user.avatarUrl,
      };

      setUser(updatedUser);
      localStorage.setItem("laPlanta_guest", JSON.stringify(updatedUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update profile." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
