"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const { login, loginDemoAdmin } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("adewale.k@laplanta-luxury.ng");
  const [passcode, setPasscode] = useState("command-pass-2025");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const res = await login(email, passcode);
    setLoading(false);
    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.error || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col gap-6 my-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18 8.5v7l-6 3.75-6-3.75v-7l6-4.3z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-lg text-primary tracking-tight font-serif font-bold leading-none">
                LA PLANTA
              </span>
              <span className="font-label-sm text-[10px] text-secondary uppercase tracking-[0.2em] font-semibold mt-0.5">
                ADMIN CONSOLE
              </span>
            </div>
          </div>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors"
          >
            <span>Public Site</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        </div>

        {/* Hero Card */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-primary shadow-xl p-6 sm:p-7 text-white">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/20 text-secondary-fixed text-[11px] uppercase tracking-wider self-start font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse" />
              Lagos &amp; Abuja Dispatch Cockpit
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug">
              Operations Login
            </h1>
            <p className="text-xs text-white/70 leading-relaxed">
              Authorized fleet controllers only. Coordinate GPS telematics, chauffeur rosters, valet handovers, and VIP client memberships.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xl border border-surface-container flex flex-col gap-5">
          {/* Quick 1-Click Demo Login Trigger */}
          <div className="p-3.5 rounded-xl bg-secondary-fixed/30 border border-secondary/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary text-secondary-fixed flex items-center justify-center text-xs font-bold shrink-0">
                <span className="material-symbols-outlined text-base">
                  shield_person
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-primary font-semibold truncate">
                  Dr. Adekunle B.
                </span>
                <span className="text-[10px] text-secondary truncate">
                  Fleet Administrator • All Hubs Access
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={loginDemoAdmin}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            >
              1-Click Demo
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Operator / Dispatcher Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                  badge
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary"
                  placeholder="e.g. adewale.k@laplanta-luxury.ng"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Security Passcode
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                  key
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 bg-surface-container-low text-on-surface text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-1 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                lock_open
              </span>
              <span>{loading ? "Verifying..." : "Access Command Cockpit"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

