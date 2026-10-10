"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  login: (email: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  loginDemoAdmin: () => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("laPlanta_adminUser");
      if (stored) {
        setAdminUser(JSON.parse(stored));
      } else {
        // Default to Demo Admin for easy local access
        const defaultAdmin: AdminUser = {
          id: "admin-001",
          name: "Dr. Adekunle B.",
          email: "adewale.k@laplanta-luxury.ng",
          role: "admin",
          badge: "EXEC-DISPATCH-01",
          accessLevel: "Fleet Administrator • All Hubs Access",
          avatarUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        };
        setAdminUser(defaultAdmin);
        localStorage.setItem("laPlanta_adminUser", JSON.stringify(defaultAdmin));
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, passcode: string) => {
    if (!email || !passcode) {
      return { success: false, error: "Please enter both operator email and passcode." };
    }
    const user: AdminUser = {
      id: "admin-" + Date.now(),
      name: email.split("@")[0].replace(".", " "),
      email,
      role: "admin",
      badge: "DISPATCH-OPS",
      accessLevel: "Executive Administrator",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    };
    setAdminUser(user);
    try {
      localStorage.setItem("laPlanta_adminUser", JSON.stringify(user));
    } catch {}
    return { success: true };
  };

  const loginDemoAdmin = () => {
    const demo: AdminUser = {
      id: "admin-master-001",
      name: "Dr. Adekunle B.",
      email: "adewale.k@laplanta-luxury.ng",
      role: "admin",
      badge: "EXEC-HQ-01",
      accessLevel: "Fleet Administrator • All Hubs Access",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    };
    setAdminUser(demo);
    try {
      localStorage.setItem("laPlanta_adminUser", JSON.stringify(demo));
    } catch {}
    router.push("/");
  };

  const logout = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem("laPlanta_adminUser");
    } catch {}
    router.push("/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        login,
        loginDemoAdmin,
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

