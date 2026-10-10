"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">


{/*  Top Navigation Bar  */}
<header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
  <div className="h-16 max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <a aria-label="Return to customer site" className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors" href="/">
        <span className="material-symbols-outlined text-[22px]">arrow_back</span>
      </a>
      <a href="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary text-secondary-fixed flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18 8.5v7l-6 3.75-6-3.75v-7l6-4.3z"></path></svg>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-base sm:text-lg tracking-tight text-primary leading-none font-serif">LA PLANTA</span>
          <span className="font-label-sm text-[10px] text-secondary uppercase tracking-[0.16em] mt-0.5">Admin Dispatch</span>
        </div>
      </a>
    </div>

    <div className="flex items-center gap-3">
      <a href="/guest-login" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs font-semibold uppercase tracking-wider transition-colors">
        <span className="material-symbols-outlined text-sm text-secondary">person</span>
        <span>Guest Sign In</span>
      </a>
    </div>
  </div>
</header>

<main className="flex flex-col relative w-full pt-16 bg-surface flex-grow min-h-screen items-center justify-center py-10 px-4 sm:px-6">
  
  <div className="w-full max-w-md flex flex-col gap-6 my-auto">
    
    {/*  Hero Header  */}
    <div className="relative w-full rounded-2xl overflow-hidden bg-primary shadow-xl p-6 sm:p-7 text-on-primary">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-secondary/20 blur-2xl pointer-events-none"></div>
      <div className="relative z-10 flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary-fixed font-label-sm text-[11px] uppercase tracking-wider self-start font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span> Lagos &amp; Abuja Dispatch
        </div>
        <h1 className="font-headline-md text-2xl sm:text-3xl font-serif text-on-primary font-normal leading-snug">
          Admin Command Login
        </h1>
        <p className="font-body-sm text-xs sm:text-sm text-primary-fixed-dim leading-relaxed">
          Authorized personnel only. Access live telematics tracking, fleet roster, digital handovers, and billing audit logs.
        </p>
      </div>
    </div>

    {/*  Main Login Card  */}
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xl border border-surface-container flex flex-col gap-5">
      
      {/*  Quick 1-Click Demo Login Trigger  */}
      <div className="p-3.5 rounded-xl bg-secondary-fixed/30 border border-secondary/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary text-secondary-fixed flex items-center justify-center text-xs font-bold shrink-0">
            <span className="material-symbols-outlined text-base text-secondary-fixed">shield_person</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-title-md text-xs text-primary font-semibold truncate">Dr. Adekunle B.</span>
            <span className="font-label-sm text-[10px] text-secondary truncate">Fleet Administrator • All Hubs Access</span>
          </div>
        </div>
        <button type="button" onClick={() => {}} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-on-primary font-label-sm text-xs font-semibold uppercase tracking-wider transition-all shadow-sm">
          1-Click Demo
        </button>
      </div>

      {/*  Status Notification  */}
      <div id="admin-auth-status" className="p-3.5 rounded-xl bg-surface-container flex items-center gap-2.5 hidden">
        <span className="material-symbols-outlined text-secondary text-lg" id="status-icon">sync</span>
        <span className="font-body-sm text-xs text-on-surface font-medium" id="status-text"></span>
      </div>

      {/*  Admin Login Form  */}
      <form className="flex flex-col gap-4" id="command-auth-form" onSubmit={(e) => e.preventDefault()}>
        {/*  Operator Email  */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="operator-email">
            Dispatcher / Operator Email
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">badge</span>
            <input className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface font-body-md text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary focus:bg-surface-container-lowest transition-all" id="operator-email" placeholder="e.g. adewale.k@laplanta-luxury.ng" required type="email" defaultValue="adewale.k@laplanta-luxury.ng" />
          </div>
        </div>

        {/*  Password  */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="security-passcode">
              Security Passcode
            </label>
            <button className="font-label-sm text-xs text-secondary hover:underline focus:outline-none" type="button" onClick={() => {}}>
              Reset Token
            </button>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">key</span>
            <input className="w-full h-12 pl-11 pr-12 bg-surface-container-low text-on-surface font-body-md text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary focus:bg-surface-container-lowest transition-all font-mono" id="security-passcode" placeholder="••••••••••••" required type="password" defaultValue="command-pass-2025" />
            <button aria-label="Toggle password visibility" className="absolute right-3 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface" onClick={() => {}} type="button">
              <span className="material-symbols-outlined text-lg" id="passcode-icon">visibility</span>
            </button>
          </div>
        </div>

        {/*  Remember Station  */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input defaultChecked className="w-4 h-4 rounded text-secondary focus:ring-0 accent-secondary cursor-pointer" type="checkbox" />
            <span className="font-body-sm text-xs text-on-surface-variant">Remember dispatch workstation</span>
          </label>
        </div>

        {/*  Submit Button  */}
        <button className="w-full h-12 mt-1 rounded-xl bg-primary hover:bg-secondary text-on-primary font-title-md text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] font-semibold" id="auth-submit-btn" type="submit">
          <span className="material-symbols-outlined text-lg">lock_open</span>
          <span>Access Command Cockpit</span>
        </button>
      </form>

      {/*  SSO Divider  */}
      <div className="relative flex items-center justify-center my-0.5">
        <div className="w-full h-px bg-surface-container"></div>
        <span className="absolute px-3 bg-surface-container-lowest font-label-sm text-[10px] tracking-widest text-outline uppercase font-semibold">
          OR VERIFY VIA DIRECTORY
        </span>
      </div>

      {/*  Google Workspace Enterprise SSO  */}
      <button className="w-full h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center gap-3 px-4 transition-colors border border-surface-container font-body-md text-sm font-semibold" onClick={() => {}} type="button">
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" fill="#4285F4"></path>
          <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853"></path>
          <path d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.17 0 9.99 0 12s.45 3.83 1.24 5.41l4.04-3.15z" fill="#FBBC05"></path>
          <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.84 3.6-4.99 6.72-4.99z" fill="#EA4335"></path>
        </svg>
        <span>Google Workspace SSO</span>
      </button>

    </div>

    {/*  Return / Switch Links  */}
    <div className="flex flex-col items-center gap-2 text-center text-xs text-on-surface-variant">
      <div className="flex items-center gap-4">
        <a href="/" className="hover:text-primary transition-colors">Main Website</a>
        <span>•</span>
        <a href="/guest-login" className="text-secondary font-semibold hover:underline">Guest &amp; VIP Login</a>
      </div>
      <span className="font-label-sm text-[11px] text-outline mt-1">
        La Planta Fleet Command Console v2.4 • Lagos &amp; Abuja Dispatch
      </span>
    </div>

  </div>

</main>




    </div>
  );
}
