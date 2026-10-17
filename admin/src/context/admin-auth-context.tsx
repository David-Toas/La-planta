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
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verify initial session & Supabase admin profile
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check live Supabase Auth session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email, role, vip_tier, avatar_url")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile?.role === "admin") {
            const user: AdminUser = {
              id: profile.id,
              name:
                profile.full_name ||
                session.user.email?.split("@")[0].replace(".", " ") ||
                "Administrator",
              email: profile.email || session.user.email || "",
              role: "admin",
              badge: "EXEC-HQ-01",
              accessLevel: "Fleet Administrator • All Hubs Access",
              avatarUrl:
                profile.avatar_url ||
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
            };
            setAdminUser(user);
            localStorage.setItem("laPlanta_adminUser", JSON.stringify(user));
            setLoading(false);
            return;
          }
        }

        // 2. If no valid Supabase admin session, clear any stale state
        localStorage.removeItem("laPlanta_adminUser");
        setAdminUser(null);
      } catch (err) {
        console.warn("[AdminAuth] Session init:", err);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

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

      // Check profile role in Supabase
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, vip_tier, avatar_url")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Unable to load operator credentials. Please contact IT.",
        };
      }

      if (profile.role === "admin") {
        const user: AdminUser = {
          id: profile.id,
          name: profile.full_name || email.split("@")[0].replace(".", " "),
          email: profile.email || email,
          role: "admin",
          badge: "EXEC-HQ-01",
          accessLevel: "Fleet Administrator • All Hubs Access",
          avatarUrl:
            profile.avatar_url ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        };
        setAdminUser(user);
        localStorage.setItem("laPlanta_adminUser", JSON.stringify(user));
        return { success: true };
      } else {
        // Authenticated user does not have admin role in profiles table
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
