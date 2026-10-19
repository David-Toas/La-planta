"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function AuthGuard({
  children,
  fallbackTitle = "Executive Sign-In Required",
  fallbackDescription = "This VIP reservation portal is restricted to authenticated La Planta Prime clients. Please sign in or register to access your itinerary and digital voucher.",
}: AuthGuardProps) {
  const router = useRouter();
  const { user, loading, openAuthModal, isAuthModalOpen } = useAuth();
  const [modalPrompted, setModalPrompted] = useState(false);

  useEffect(() => {
    const hasLocalUser =
      typeof window !== "undefined" && !!localStorage.getItem("laPlanta_guest");
    if (
      !loading &&
      !user &&
      !hasLocalUser &&
      !modalPrompted &&
      typeof window !== "undefined"
    ) {
      const destination = window.location.pathname + window.location.search;
      sessionStorage.setItem("laPlanta_intended_destination", destination);
      openAuthModal();
      setModalPrompted(true);
    }
  }, [loading, user, modalPrompted, openAuthModal]);

  // If user closes the auth modal without signing in, redirect to homepage immediately
  useEffect(() => {
    if (modalPrompted && !isAuthModalOpen && !user && !loading) {
      router.push("/");
    }
  }, [modalPrompted, isAuthModalOpen, user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-surface px-4 py-20">
        <div className="w-12 h-12 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
        <p className="font-serif text-sm text-primary tracking-wide">
          Authenticating Executive Credentials...
        </p>
      </div>
    );
  }

  // Unauthenticated fallback view
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-surface px-4 py-16">
        <div className="max-w-md w-full bg-surface-container-lowest border border-black/[0.06] rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-widest font-bold text-secondary">
              VIP Private Client Portal
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              {fallbackTitle}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {fallbackDescription}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              type="button"
              onClick={openAuthModal}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-primary hover:bg-secondary text-secondary-fixed hover:text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              <span>Sign In / Register</span>
            </button>
            <Link
              href="/fleet"
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs uppercase tracking-wider transition-all text-center"
            >
              Explore Fleet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

