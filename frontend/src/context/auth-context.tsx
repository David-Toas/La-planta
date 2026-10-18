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

// Security Inactivity Configuration
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 Minutes
const WARNING_WINDOW_MS = 60 * 1000; // 60 Seconds warning window

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuestUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Security: Inactivity Tracker States
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState(60);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

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

  const openAuthModal = useCallback(() => {
    console.log("[AuthContext] openAuthModal triggered");
    if (typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search;
      if (current && !current.includes("/guest-login") && !current.includes("/account")) {
        sessionStorage.setItem("laPlanta_current_page", current);
      }
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    console.log("[AuthContext] closeAuthModal triggered");
    setIsAuthModalOpen(false);
    if (typeof window !== "undefined") {
      const protectedPaths = [
        "/account",
        "/checkout",
        "/reservation-pass",
        "/live-tracking",
        "/handover-inspection",
      ];
      const current = window.location.pathname;
      if (
        protectedPaths.some((p) => current === p || current.startsWith(p + "/")) &&
        !user
      ) {
        window.location.href = "/";
      }
    }
  }, [user]);

  // Manual / Demo login
  const login = (userData: GuestUser) => {
    setUser(userData);
    try {
      localStorage.setItem("laPlanta_guest", JSON.stringify(userData));
    } catch {}
  };

  // Sign out from Supabase & clear state
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
    setShowInactivityWarning(false);
    try {
      localStorage.removeItem("laPlanta_guest");
      localStorage.removeItem("laPlanta_last_activity");
    } catch {}
    // If currently on a protected route like /account, navigate to /
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/account")) {
      window.location.href = "/";
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    try {
      localStorage.setItem("laPlanta_last_activity", Date.now().toString());
    } catch {}
    setShowInactivityWarning(false);
  }, []);

  // Auto-dismiss session expired notice after 8 seconds
  useEffect(() => {
    if (sessionExpiredNotice) {
      const timer = setTimeout(() => setSessionExpiredNotice(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpiredNotice]);

  // 10-Minute Inactivity Auto-Logout Security Watcher
  useEffect(() => {
    if (!user) {
      setShowInactivityWarning(false);
      return;
    }

    // Set initial activity time
    try {
      const existing = localStorage.getItem("laPlanta_last_activity");
      if (!existing) {
        localStorage.setItem("laPlanta_last_activity", Date.now().toString());
      }
    } catch {}

    let lastThrottle = Date.now();
    const registerUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 2 seconds
      if (now - lastThrottle > 2000) {
        lastThrottle = now;
        try {
          localStorage.setItem("laPlanta_last_activity", now.toString());
        } catch {}
      }
      // If warning modal was open, user activity automatically resets it
      setShowInactivityWarning(false);
    };

    const userActivityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    userActivityEvents.forEach((evt) => {
      window.addEventListener(evt, registerUserActivity, { passive: true });
    });

    // Check inactivity every second
    const interval = setInterval(() => {
      let lastActive = Date.now();
      try {
        const stored = localStorage.getItem("laPlanta_last_activity");
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) lastActive = parsed;
        }
      } catch {}

      const elapsed = Date.now() - lastActive;
      const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;

      if (remainingMs <= 0) {
        // Exceeded 10 minutes: Terminate session
        setShowInactivityWarning(false);
        setSessionExpiredNotice(true);
        logout();
      } else if (remainingMs <= WARNING_WINDOW_MS) {
        // Under 60 seconds left: display countdown warning modal
        const secondsLeft = Math.ceil(remainingMs / 1000);
        setInactivitySecondsLeft(secondsLeft);
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
    }, 1000);

    // Also check immediately when window / tab gains focus (e.g. laptop opened after 10 min)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        let lastActive = Date.now();
        try {
          const stored = localStorage.getItem("laPlanta_last_activity");
          if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed)) lastActive = parsed;
          }
        } catch {}

        if (Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          setShowInactivityWarning(false);
          setSessionExpiredNotice(true);
          logout();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      userActivityEvents.forEach((evt) => {
        window.removeEventListener(evt, registerUserActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [user, logout]);

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

        // Dispatch VIP Welcome Transactional Email
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        fetch(`${backendUrl}/api/email/welcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: name,
            email,
            vipTier: "Member",
            bookingPin: "#LP-8910",
          }),
        }).catch((e) =>
          console.warn("[Auth Email Warning] Welcome email trigger bypassed:", e.message)
        );
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create account" };
    }
  };

  // Google OAuth Sign In
  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      // Resolve current origin dynamically (supports Vercel preview, test production, and localhost)
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "https://laplanta.ng";

      const callbackUrl = `${origin.replace(/\/$/, "")}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
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

      {/* Security: 10-Minute Inactivity Warning Modal (Shown in the last 60 seconds) */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0c0f17] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl animate-pulse">
                lock_clock
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Security Protocol
              </span>
              <h3 className="font-serif text-2xl font-bold text-white">
                Session Timeout Warning
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-sm mt-1">
                For your account privacy and financial security, your active session will terminate due to 10 minutes of inactivity in:
              </p>
            </div>

            <div className="w-full py-4 px-6 rounded-2xl bg-white/[0.04] border border-amber-500/20 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold text-amber-400 tracking-wider">
                00:{inactivitySecondsLeft.toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                seconds
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
              <button
                onClick={resetInactivityTimer}
                type="button"
                className="w-full py-3.5 px-5 rounded-xl bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Stay Signed In</span>
              </button>

              <button
                onClick={() => {
                  setShowInactivityWarning(false);
                  logout();
                }}
                type="button"
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-stone-300 text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Logout Notification Banner */}
      {sessionExpiredNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] max-w-md w-[92%] p-4 rounded-2xl bg-[#0c0f17]/95 border border-amber-500/40 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">lock_clock</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white">Session Terminated</span>
              <span className="text-[11px] text-stone-300">
                Signed out after 10 minutes of inactivity.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSessionExpiredNotice(false);
              openAuthModal();
            }}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      )}
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
