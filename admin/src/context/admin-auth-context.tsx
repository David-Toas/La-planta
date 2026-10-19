"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
  badge: string;
  accessLevel: string;
  avatarUrl?: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  login: (
    email: string,
    passcode: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithGoogleIdToken: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper: Verify if user has role === 'admin' in profiles table
  const verifyAndSetAdmin = async (sessionUser: any): Promise<boolean> => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, vip_tier, avatar_url")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        const user: AdminUser = {
          id: profile.id,
          name:
            profile.full_name ||
            sessionUser.user_metadata?.full_name ||
            sessionUser.email?.split("@")[0].replace(".", " ") ||
            "Administrator",
          email: profile.email || sessionUser.email || "",
          role: "admin",
          badge: "EXEC-HQ-01",
          accessLevel: "Fleet Administrator • All Hubs Access",
          avatarUrl:
            profile.avatar_url ||
            sessionUser.user_metadata?.avatar_url ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        };
        setAdminUser(user);
        localStorage.setItem("laPlanta_adminUser", JSON.stringify(user));
        return true;
      } else {
        localStorage.removeItem("laPlanta_adminUser");
        setAdminUser(null);
        return false;
      }
    } catch (err) {
      console.warn("[AdminAuth] Verify admin notice:", err);
      return false;
    }
  };

  // Verify initial session & Supabase admin profile with live listener
  useEffect(() => {
    // 1. Check live initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await verifyAndSetAdmin(session.user);
      } else {
        setAdminUser(null);
        localStorage.removeItem("laPlanta_adminUser");
      }
      setLoading(false);
    });

    // 2. Real-time auth listener for Google OAuth redirect & session changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const isAdmin = await verifyAndSetAdmin(session.user);
        if (!isAdmin && event === "SIGNED_IN") {
          // If a non-admin Google user logs in, sign them out from admin console
          await supabase.auth.signOut();
        }
      } else if (event === "SIGNED_OUT") {
        setAdminUser(null);
        localStorage.removeItem("laPlanta_adminUser");
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "http://localhost:3001";

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
      return {
        success: false,
        error: err.message || "Failed to initiate Google sign-in",
      };
    }
  };

  const signInWithGoogleIdToken = async (idToken: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const isAdmin = await verifyAndSetAdmin(data.user);
        if (!isAdmin) {
          await supabase.auth.signOut();
          return {
            success: false,
            error:
              "Access Denied: This Google account does not have administrator privileges. Please contact an existing administrator to grant you access.",
          };
        }
        return { success: true };
      }

      return { success: false, error: "Authentication failed" };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to sign in with Google",
      };
    }
  };

  const login = async (email: string, passcode: string) => {
    if (!email || !passcode) {
      return {
        success: false,
        error: "Please enter both operator email and passcode.",
      };
    }

    // Try Supabase Auth strictly
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: passcode,
        });

      if (authError || !authData?.user) {
        return {
          success: false,
          error: authError?.message || "Invalid operator email or passcode.",
        };
      }

      const isAdmin = await verifyAndSetAdmin(authData.user);
      if (isAdmin) {
        return { success: true };
      } else {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Access Denied: Your account does not have administrator privileges.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Authentication failed. Please verify credentials.",
      };
    }
  };

  const logout = async () => {
    setAdminUser(null);
    try {
      localStorage.removeItem("laPlanta_adminUser");
      localStorage.removeItem("laPlanta_admin_last_activity");
      await supabase.auth.signOut();
    } catch {}
    router.push("/login");
  };

  // 10-Minute Inactivity Auto-Logout Security Watcher
  useEffect(() => {
    if (!adminUser) return;

    try {
      if (!localStorage.getItem("laPlanta_admin_last_activity")) {
        localStorage.setItem(
          "laPlanta_admin_last_activity",
          Date.now().toString(),
        );
      }
    } catch {}

    let lastThrottle = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 2000) {
        lastThrottle = now;
        try {
          localStorage.setItem("laPlanta_admin_last_activity", now.toString());
        } catch {}
      }
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true }),
    );

    const interval = setInterval(() => {
      let lastActive = Date.now();
      try {
        const stored = localStorage.getItem("laPlanta_admin_last_activity");
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) lastActive = parsed;
        }
      } catch {}

      if (Date.now() - lastActive >= 10 * 60 * 1000) {
        logout();
      }
    }, 2000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [adminUser]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        login,
        signInWithGoogle,
        signInWithGoogleIdToken,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
