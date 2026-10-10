"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { backendApi } from "@/lib/api";

export default function AdminCommandPage() {
  const [isPinging, setIsPinging] = useState(false);
  const [pingAlert, setPingAlert] = useState<string | null>(null);

  const handleAdminPing = async () => {
    setIsPinging(true);
    const res = await backendApi.pingTracker("TRK-892-SIM");
    if (res?.success) {
      setPingAlert(`✓ Sent "WHERE#" ping to SIM ${res.simPhone || "+2348037294810"} (Port 4000 ACK)`);
    } else {
      setPingAlert(`Notice: ${res?.error || "Dispatched"}`);
    }
    setIsPinging(false);
    setTimeout(() => setPingAlert(null), 5000);
  };
  return (
    <div className="min-h-screen bg-surface flex flex-col">


{/*  Mobile Sidebar Backdrop Overlay  */}
<div id="sidebar-overlay" className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-40 hidden transition-opacity lg:hidden" onClick={() => {}}></div>

{/*  DEDICATED OPERATIONS SIDEBAR WITH SUB-NAVIGATIONS & GENERAL NAVIGATIONS  */}
<aside id="admin-sidebar" className="fixed top-0 left-0 bottom-0 w-64 bg-surface-container-lowest border-r border-surface-container flex flex-col justify-between z-50 transition-transform duration-300 -translate-x-full lg:translate-x-0 shadow-xl lg:shadow-none">
  {/*  Sidebar Scrollable Container  */}
  <div className="flex flex-col flex-1 overflow-hidden">
    
    {/*  Sidebar Brand & Mode Tag  */}
    <div className="h-20 px-6 flex items-center justify-between border-b border-surface-container shrink-0">
      <a href="/admin-command" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-sm shrink-0">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18 8.5v7l-6 3.75-6-3.75v-7l6-4.3z"></path></svg>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-serif leading-none">LA PLANTA</span>
          <span className="font-label-sm text-[10px] tracking-widest uppercase text-secondary font-semibold mt-1">ADMIN CONSOLE</span>
        </div>
      </a>
      <button className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low" onClick={() => {}} type="button" aria-label="Close Sidebar">
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>

    {/*  Live Regional Status Badge  */}
    <div className="p-3.5 mx-3 mt-3 rounded-xl bg-surface-container-low border border-surface-container/70 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-bold">LOS &amp; ABV DISPATCH</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">14 EN ROUTE</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
        <span>GPS Accuracy: 99.8%</span>
        <span className="text-secondary font-mono font-medium">09:42 WAT</span>
      </div>
    </div>

    {/*  Navigation Scroll Area  */}
    <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
      
      {/*  SUB-NAVIGATIONS: ADMIN DASHBOARD SECTIONS  */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-secondary font-bold">Admin Sub-Navigations</span>
          <span className="font-label-sm text-[9px] bg-secondary-container/60 text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">Console</span>
        </div>

        {/*  Sub-Nav 1: Operations Overview  */}
        <button onClick={() => {}} id="nav-btn-overview" className="admin-nav-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary text-on-primary font-title-md text-xs sm:text-body-sm shadow-sm transition-all text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary-fixed">dashboard</span>
            <span>Overview &amp; KPIs</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
        </button>

        {/*  Sub-Nav 2: Live GPS Telematics Map  */}
        <button onClick={() => {}} id="nav-btn-map" className="admin-nav-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">share_location</span>
            <span>Live GPS Map</span>
          </div>
          <span className="font-label-sm text-[10px] text-secondary font-semibold bg-surface-container px-1.5 py-0.5 rounded">14 PING</span>
        </button>

        {/*  Sub-Nav 3: Fleet Inventory Register  */}
        <button onClick={() => {}} id="nav-btn-fleet" className="admin-nav-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">directions_car</span>
            <span>Fleet Inventory</span>
          </div>
          <span className="font-label-sm text-[10px] text-on-surface-variant font-semibold">18 Units</span>
        </button>

        {/*  Sub-Nav 4: Handover & Inspection Console  */}
        <button onClick={() => {}} id="nav-btn-handover" className="admin-nav-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">fact_check</span>
            <span>Handover &amp; Checks</span>
          </div>
          <span className="font-label-sm text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">ACTIVE</span>
        </button>

        {/*  Sub-Nav 5: Chauffeur & Driver Roster  */}
        <button onClick={() => {}} id="nav-btn-drivers" className="admin-nav-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">supervised_user_circle</span>
            <span>Chauffeur Roster</span>
          </div>
          <span className="font-label-sm text-[10px] text-on-surface-variant font-semibold">14 Duty</span>
        </button>

        {/*  Sub-Nav 6: Revenue & Settlement Audit  */}
        <button onClick={() => {}} id="nav-btn-revenue" className="admin-nav-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">payments</span>
            <span>Revenue &amp; Invoices</span>
          </div>
          <span className="font-label-sm text-[10px] text-secondary font-bold font-mono">₦84.2M</span>
        </button>
      </div>

      {/*  SEPARATOR WITH CLEAR VISUAL DISTINCTION  */}
      <div className="pt-2 pb-1">
        <div className="h-[1px] bg-surface-container w-full"></div>
      </div>

      {/*  GENERAL NAVIGATIONS: PUBLIC PLATFORM & GUEST PAGES  */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">General Navigations</span>
          <span className="font-label-sm text-[9px] text-on-surface-variant/70 uppercase">Public / Guest</span>
        </div>

        {/*  General Link 1: Customer Homepage  */}
        <a href="/" className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">home</span>
            <span>Customer Homepage</span>
          </div>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">open_in_new</span>
        </a>

        {/*  General Link 2: Fleet Catalog  */}
        <a href="/fleet" className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">garage</span>
            <span>Fleet Catalog</span>
          </div>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">open_in_new</span>
        </a>

        {/*  General Link 3: Vehicle Spec Configurator  */}
        <a href="/vehicle-details" className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">tune</span>
            <span>Range Rover Details</span>
          </div>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">open_in_new</span>
        </a>

        {/*  General Link 4: Guest VIP Account  */}
        <a href="/account" className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">badge</span>
            <span>Guest Account Portal</span>
          </div>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">open_in_new</span>
        </a>

        {/*  General Link 5: Digital QR Pass  */}
        <a href="/reservation-pass" className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-title-md text-xs sm:text-body-sm transition-colors">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-secondary">qr_code_2</span>
            <span>Digital Guest Pass</span>
          </div>
          <span className="material-symbols-outlined text-sm text-on-surface-variant">open_in_new</span>
        </a>
      </div>

    </nav>
  </div>

  {/*  Sidebar Bottom Admin User Profile Card  */}
  <div className="p-3.5 border-t border-surface-container bg-surface-container-low/60 shrink-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <img alt="Admin Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-secondary/40" src="https://lh3.googleusercontent.com/aida/AEtjO1WYXdvzJzo6cdN3Gyr3nvgR3mArcOVJbzV2a2r96N7t0H1XUriC_a07oOlFU4iuU3lN8kO7a-_iNYYjNxJRBrpgUbGSqplOpFpKevda5JMNXPX6gpWgeDRQC34asiCnsma5ULpvQJ_0Q3yhAzGh8meMqkte3w60aA1D8VrHzxxo5EK9meIadYg6K_BxH7EajFwuHZYZVupzK3_O29mQMnNSEWjFWp5oC7jkoW4If_OoAowSPaE0simNCc" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest"></span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-title-md text-body-sm text-primary font-semibold truncate leading-tight">Dr. Adekunle B.</span>
          <span className="font-label-sm text-[10px] text-secondary truncate">Fleet Administrator</span>
        </div>
      </div>
      <button onClick={() => {}} title="Sign Out & Return to Login" className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors" type="button">
        <span className="material-symbols-outlined text-lg">logout</span>
      </button>
    </div>
  </div>
</aside>

{/*  MAIN CONTENT WRAPPER (PADDING LEFT ON DESKTOP lg:pl-64)  */}
<div className="lg:pl-64 flex flex-col flex-1 min-h-screen bg-surface">
  
  {/*  TOP ADMINISTRATIVE APP BAR  */}
  <header className="sticky top-0 z-30 h-20 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container px-4 sm:px-8 flex items-center justify-between gap-4">
    {/*  Left: Mobile Toggle & Page Title  */}
    <div className="flex items-center gap-3 sm:gap-4">
      <button className="lg:hidden p-2 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container transition-colors" onClick={() => {}} type="button" aria-label="Toggle Navigation Sidebar">
        <span className="material-symbols-outlined text-2xl">menu</span>
      </button>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-lg sm:text-title-lg text-primary font-serif font-semibold">Admin Command Center</span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> LIVE
          </span>
        </div>
        <span className="font-body-sm text-xs text-on-surface-variant hidden md:block">Real-time GPS tracking, vehicle handovers &amp; executive fleet coordination</span>
      </div>
    </div>

    {/*  Right: Search, Currency, Quick Actions, Profile  */}
    <div className="flex items-center gap-3">
      {/*  Search Bar  */}
      <div className="hidden xl:flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 gap-2 border border-surface-container">
        <span className="material-symbols-outlined text-secondary text-sm">search</span>
        <input className="bg-transparent border-none text-body-sm text-primary focus:outline-none w-52 placeholder-on-surface-variant text-xs" placeholder="Search plate, driver, guest..." type="text" />
      </div>

      {/*  Currency Switcher  */}
      <div className="hidden sm:flex items-center bg-surface-container-low rounded-full p-0.5 border border-surface-container">
        <button className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label-sm text-xs font-semibold shadow-sm" type="button">NGN ₦</button>
        <button className="px-2.5 py-1 rounded-full text-on-surface-variant hover:text-on-surface font-label-sm text-xs transition-colors" type="button">USD $</button>
      </div>

      {/*  Emergency Desk Link  */}
      <a href="tel:+23418885275" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-secondary-fixed hover:text-on-secondary-fixed text-on-surface font-label-sm text-xs font-semibold transition-colors">
        <span className="material-symbols-outlined text-secondary text-sm">call</span>
        <span>+234 1 888 5275</span>
      </a>

      {/*  Notifications Icon with Badge  */}
      <div className="relative">
        <button type="button" className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" title="System Notifications">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary"></span>
        </button>
      </div>

      {/*  Quick Link to Customer Website  */}
      <a href="/" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-xs uppercase tracking-wider font-semibold transition-colors">
        <span className="material-symbols-outlined text-sm">visibility</span>
        <span>View Site</span>
      </a>
    </div>
  </header>

  {/*  SUB-NAVIGATION HORIZONTAL PILL BAR (Quick Jump & Filter)  */}
  <div className="sticky top-20 z-20 bg-surface-container-low/95 backdrop-blur-md border-b border-surface-container px-4 sm:px-8 py-2.5 overflow-x-auto">
    <div className="flex items-center gap-2 min-w-max">
      <button onClick={() => {}} id="tab-btn-overview" className="admin-tab-pill px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">dashboard</span>
        <span>Operations Overview</span>
      </button>
      <button onClick={() => {}} id="tab-btn-map" className="admin-tab-pill px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-xs font-medium transition-all flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">share_location</span>
        <span>Live GPS Map (14)</span>
      </button>
      <button onClick={() => {}} id="tab-btn-fleet" className="admin-tab-pill px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-xs font-medium transition-all flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">directions_car</span>
        <span>Fleet Inventory (18)</span>
      </button>
      <button onClick={() => {}} id="tab-btn-handover" className="admin-tab-pill px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-xs font-medium transition-all flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">fact_check</span>
        <span>Handover Queue</span>
      </button>
      <button onClick={() => {}} id="tab-btn-drivers" className="admin-tab-pill px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-xs font-medium transition-all flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">supervised_user_circle</span>
        <span>Chauffeur Roster (14)</span>
      </button>
      <button onClick={() => {}} id="tab-btn-revenue" className="admin-tab-pill px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-xs font-medium transition-all flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-secondary">payments</span>
        <span>Revenue &amp; Invoices</span>
      </button>
    </div>
  </div>

  {/*  MAIN OPERATIONAL CONTENT  */}
  <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl w-full mx-auto">
    
    {/*  SUB-SECTION 1: OVERVIEW & KPIS  */}
    <section id="section-overview" className="flex flex-col gap-6">
      
      {/*  Command Telematics Status Ribbon  */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-4 border border-surface-container/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
            </span>
            <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">Lagos Operations Center (LOS)</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">| 09:42 WAT</span>
          </div>
          <div className="hidden sm:inline-block h-4 w-[1px] bg-surface-container"></div>
          <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full text-xs text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm">sensors</span>
            <span>14 Vehicles Monitored</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary-container/40 px-3 py-1 rounded-full text-xs text-on-secondary-container">
            <span className="material-symbols-outlined text-secondary text-sm">traffic</span>
            <span>Lagos Island &amp; VI: Nominal Flow</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
          <button
            onClick={handleAdminPing}
            disabled={isPinging}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-on-secondary font-semibold hover:bg-secondary/90 transition-all active:scale-95 disabled:opacity-50 text-[11px] shadow-sm"
          >
            <span className={`material-symbols-outlined text-sm ${isPinging ? "animate-spin" : ""}`}>
              {isPinging ? "sync" : "satellite_alt"}
            </span>
            <span>{isPinging ? "Pinging :4000..." : "Test SIM Ping (Port 4000)"}</span>
          </button>
          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-secondary text-sm">satellite_alt</span> Telematics: Active</span>
          <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-secondary text-sm">verified</span> VIP Protocol: Cleared</span>
        </div>
      </div>

      {pingAlert && (
        <div className="w-full bg-primary text-secondary-fixed px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-secondary-fixed">cell_tower</span>
            <span>{pingAlert}</span>
          </div>
          <button onClick={() => setPingAlert(null)} className="text-secondary-fixed/70 hover:text-secondary-fixed">✕</button>
        </div>
      )}

      {/*  KPI Performance Quartet (4 Cards)  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/*  Card 1: Cars on Trip  */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Cars on Trip</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-lg">directions_car</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-primary leading-none">11 <span className="text-base text-on-surface-variant font-normal">/ 18</span></span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-semibold">61% Active</span>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>7 Vehicles in Reserve</span>
            <span className="text-primary font-semibold">Ready for Dispatch</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{"width": "61%"}}></div>
          </div>
        </div>

        {/*  Card 2: Today's Transfers  */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Today's Transfers</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-lg">flight_takeoff</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-primary leading-none">04</span>
            <span className="text-xs text-on-surface-variant font-medium">Completed &amp; En Route</span>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>2 Airport VIP Meet &amp; Greets</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{"width": "75%"}}></div>
          </div>
        </div>

        {/*  Card 3: Monthly Revenue  */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Monthly Revenue</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-lg">payments</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-md text-2xl font-bold text-primary leading-none">₦84,250,000</span>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <span className="material-symbols-outlined text-xs">check_circle</span> 100% Upfront Paid
            </span>
            <span className="text-secondary font-semibold">+14% vs Aug</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{"width": "84%"}}></div>
          </div>
        </div>

        {/*  Card 4: Active Chauffeurs on Duty  */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Drivers on Duty</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-lg">supervised_user_circle</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-2xl font-bold text-primary leading-none">14 <span className="text-base text-on-surface-variant font-normal">/ 18</span></span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-[10px] font-semibold">All Vetted</span>
          </div>
          <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Lead: Emmanuel Okafor</span>
            <span className="text-secondary font-semibold">Rating: 5.0 ★</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{"width": "78%"}}></div>
          </div>
        </div>
      </div>

      {/*  Quick Action / Dispatch Toolbar  */}
      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm border border-surface-container/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-title-md text-xs sm:text-body-sm hover:bg-secondary transition-all shadow-sm" onClick={() => {}} type="button">
            <span className="material-symbols-outlined text-base">directions_car</span>
            <span>+ Add / Edit Vehicle</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container text-on-surface font-title-md text-xs sm:text-body-sm hover:bg-surface-container-high transition-colors" onClick={() => {}} type="button">
            <span className="material-symbols-outlined text-secondary text-base">campaign</span>
            <span>Broadcast Driver Notice</span>
          </button>
          <a href="/handover-inspection" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-title-md text-xs sm:text-body-sm transition-colors">
            <span className="material-symbols-outlined text-secondary text-base">fact_check</span>
            <span>Verify Handover (#LP-8842)</span>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface font-title-md text-xs sm:text-body-sm transition-colors" onClick={() => {}} type="button">
            <span className="material-symbols-outlined text-base">file_download</span>
            <span>Export Audit (CSV)</span>
          </button>
          <button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors" onClick={() => {}} title="Refresh Feeds" type="button">
            <span className="material-symbols-outlined text-base">refresh</span>
          </button>
        </div>
      </div>
    </section>

    {/*  SUB-SECTION 2: LIVE GPS TELEMATICS MAP  */}
    <section id="section-map" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container/40">
        <div>
          <span className="font-label-sm text-[11px] uppercase tracking-widest text-secondary font-semibold">Sub-Navigation View • Live Tracking</span>
          <h2 className="font-headline-sm text-xl text-primary font-serif font-semibold">Active Road Corridor Telematics (Lagos &amp; Abuja)</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-surface-container text-xs">
            <button className="px-2.5 py-1 rounded-md bg-surface-container-lowest text-primary font-semibold shadow-sm" type="button">Lagos Corridor</button>
            <button className="px-2.5 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors" type="button">Abuja Sector</button>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-xs font-semibold">
            GPS Lock: 99.8%
          </span>
        </div>
      </div>

      {/*  Map Display Container  */}
      <div className="relative w-full h-[480px] sm:h-[540px] rounded-xl overflow-hidden bg-cover bg-center shadow-inner" style={{"backgroundImage": "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAN1OwOgub9651Bb5KmJaZF2apbxPMYhED1jOthp4kgwa8ao5FNIH0SkLpMqhdxydeuNthQvFZwfQKWk48uVG0i_bDQmKbS4kOBUqhyY0Er0gmhJadjY9wTCRmiPowl7YB1y2M2DPrw2clomENBX9DuBZJUTYYz6gIZt3fAZWkG6PqqSrmi4zt_82KKbVpwZe7rV_1qO5dGJDsQtJuksJ4h10bwE6pKNcX5aUyW7g8sFuquz_XyD7AK')"}}>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-primary/40 backdrop-blur-[1px]"></div>
        
        {/*  Live Map Ambient SVG Grid  */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="40" id="admin-map-grid" patternUnits="userSpaceOnUse" width="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fedeb2" stroke-opacity="0.3" strokeWidth="0.3"></path>
            </pattern>
          </defs>
          <rect fill="url(#admin-map-grid)" height="100%" width="100%"></rect>
        </svg>

        {/*  Vehicle 1 Pin: Airport Corridor (Land Cruiser)  */}
        <div className="absolute top-16 left-12 sm:left-24 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-secondary opacity-60"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary shadow-lg"></span>
          </div>
          <div className="absolute left-6 -top-2 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3 shadow-xl w-60 pointer-events-auto border border-surface-container">
            <div className="flex items-center justify-between text-xs font-semibold text-secondary">
              <span>LP-03 • ON TRIP</span>
              <span className="text-primary font-bold">AIRPORT CORRIDOR</span>
            </div>
            <div className="font-title-md text-sm text-primary font-semibold mt-1">Toyota Land Cruiser 300</div>
            <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
              <span>Driver: Segun Alabi</span>
              <span className="text-secondary font-medium">54 km/h • MMA2</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-surface-container flex items-center justify-between">
              <a href="/live-tracking" className="text-secondary hover:underline font-label-sm text-[11px] font-semibold">Track GPS →</a>
              <span className="text-on-surface-variant text-[11px]">Plate: KJA-551-ZZ</span>
            </div>
          </div>
        </div>

        {/*  Vehicle 2 Pin: Victoria Island (Range Rover - Dr. Adekunle Balogun)  */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-primary opacity-50"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-primary shadow-xl"></span>
          </div>
          <div className="absolute left-7 -top-6 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl w-64 pointer-events-auto border border-surface-container">
            <div className="flex items-center justify-between text-xs font-semibold text-secondary">
              <span>LP-02 • ACTIVE CHARTER</span>
              <span className="text-primary font-bold">VICTORIA ISLAND</span>
            </div>
            <div className="font-title-md text-sm text-primary font-semibold mt-1">Range Rover Autobiography</div>
            <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
              <span className="font-medium text-primary">Dr. Adekunle Balogun</span>
              <span className="text-secondary font-semibold">ETA: 18m</span>
            </div>
            <div className="text-xs text-on-surface-variant flex items-center justify-between mt-0.5">
              <span>Driver: Emmanuel Okafor</span>
              <span className="text-primary font-mono text-[11px]">LAG-892-XZ</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-surface-container flex items-center justify-between">
              <a href="/live-tracking" className="text-secondary hover:underline font-label-sm text-xs font-semibold">Live GPS Telematics</a>
              <a href="/handover-inspection" className="text-primary hover:underline font-label-sm text-xs font-semibold">Handover Console →</a>
            </div>
          </div>
        </div>

        {/*  Vehicle 3 Pin: The Wheatbaker Ikoyi (Mercedes S580)  */}
        <div className="absolute bottom-20 right-16 sm:right-32 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary shadow-lg"></span>
          </div>
          <div className="absolute right-6 -top-2 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3 shadow-xl w-56 pointer-events-auto text-right border border-surface-container">
            <div className="flex items-center justify-between text-xs font-semibold text-secondary">
              <span className="text-primary font-bold">LP-01 • AVAILABLE</span>
              <span>IKOYI</span>
            </div>
            <div className="font-title-md text-sm text-primary font-semibold mt-1">Mercedes-Benz S580</div>
            <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
              <span className="text-secondary font-medium">B. Adeleke</span>
              <span>The Wheatbaker</span>
            </div>
            <div className="mt-2 pt-1.5 border-t border-surface-container flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold">Ready for Charter</span>
              <a href="/fleet" className="text-secondary hover:underline font-semibold">View Spec →</a>
            </div>
          </div>
        </div>

        {/*  Bottom Controls Bar inside Map  */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-primary/80 backdrop-blur-md rounded-lg px-4 py-2 text-on-primary flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">near_me</span>
            <span className="font-medium">Live Fleet Location Feed</span>
            <span className="hidden sm:inline text-on-primary/40">•</span>
            <span className="hidden sm:inline text-on-primary/80">Continuous GPS Telematics</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded bg-surface-container-lowest/20 hover:bg-surface-container-lowest/40 text-on-primary transition-colors" onClick={() => {}} type="button">Recenter View</button>
            <a href="/live-tracking" className="px-3 py-1 rounded bg-secondary text-on-secondary font-semibold hover:bg-secondary/90 transition-colors">Expand Full Map</a>
          </div>
        </div>
      </div>
    </section>

    {/*  SUB-SECTION 3: MASTER FLEET INVENTORY REGISTER  */}
    <section id="section-fleet" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
        <div>
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-semibold">Sub-Navigation View • Fleet Register</span>
          <h3 className="font-headline-sm text-xl text-primary font-serif font-semibold">Executive Fleet Status &amp; Telematics (18 Units)</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-surface-container-low rounded-lg px-3 py-1.5 flex items-center gap-2 border border-surface-container">
            <span className="material-symbols-outlined text-secondary text-sm">search</span>
            <input className="bg-transparent border-none text-xs text-primary focus:outline-none w-40 placeholder-on-surface-variant" placeholder="Search plate or driver..." type="text" />
          </div>
          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-surface-container text-xs">
            <button className="px-2.5 py-1 rounded-md bg-surface-container-lowest text-primary font-semibold shadow-sm" type="button">All (18)</button>
            <button className="px-2.5 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors" type="button">Active (11)</button>
            <button className="px-2.5 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors" type="button">Reserve (7)</button>
          </div>
        </div>
      </div>

      {/*  Table Container  */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left font-body-sm text-sm">
          <thead>
            <tr className="text-on-surface-variant font-label-sm text-xs uppercase tracking-wider bg-surface-container-low/70">
              <th className="py-3 px-4 rounded-l-lg">Unit ID</th>
              <th className="py-3 px-4">Vehicle Model</th>
              <th className="py-3 px-4">Plate No</th>
              <th className="py-3 px-4">Operational Status</th>
              <th className="py-3 px-4">Assigned Driver</th>
              <th className="py-3 px-4">Fuel / Battery</th>
              <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container/50">
            {/*  Row 1: LP-01  */}
            <tr className="hover:bg-surface-container-low/50 transition-colors">
              <td className="py-3.5 px-4 font-semibold text-primary">LP-01</td>
              <td className="py-3.5 px-4 font-medium text-primary">Mercedes-Benz S580 4MATIC</td>
              <td className="py-3.5 px-4 font-mono text-xs text-secondary font-semibold">ABC-104-LA</td>
              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>Available (Ikoyi)
                </span>
              </td>
              <td className="py-3.5 px-4 text-on-surface">Babatunde Adeleke</td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{"width": "88%"}}></div>
                  </div>
                  <span className="font-label-sm text-xs">88%</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <button className="text-secondary hover:underline font-label-sm text-xs font-semibold" onClick={() => {}} type="button">Edit Vehicle</button>
              </td>
            </tr>

            {/*  Row 2: LP-02 (Active on Trip with Dr. Adekunle Balogun)  */}
            <tr className="hover:bg-surface-container-low/50 transition-colors bg-secondary-container/10">
              <td className="py-3.5 px-4 font-semibold text-primary">LP-02</td>
              <td className="py-3.5 px-4 font-medium text-primary">
                <a href="/vehicle-details" className="hover:underline flex items-center gap-1 font-semibold">
                  <span>Range Rover Autobiography LWB</span>
                  <span className="material-symbols-outlined text-xs text-secondary">open_in_new</span>
                </a>
              </td>
              <td className="py-3.5 px-4 font-mono text-xs text-secondary font-semibold">LAG-892-XZ</td>
              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>On Trip (Dr. Balogun)
                </span>
              </td>
              <td className="py-3.5 px-4 font-semibold text-primary">Emmanuel Okafor</td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{"width": "74%"}}></div>
                  </div>
                  <span className="font-label-sm text-xs">74%</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <a href="/handover-inspection" className="text-primary hover:text-secondary font-label-sm text-xs font-semibold underline">Handover</a>
                  <a href="/live-tracking" className="text-secondary hover:underline font-label-sm text-xs font-semibold">Track GPS</a>
                </div>
              </td>
            </tr>

            {/*  Row 3: LP-03  */}
            <tr className="hover:bg-surface-container-low/50 transition-colors">
              <td className="py-3.5 px-4 font-semibold text-primary">LP-03</td>
              <td className="py-3.5 px-4 font-medium text-primary">Toyota Land Cruiser 300 VXR</td>
              <td className="py-3.5 px-4 font-mono text-xs text-secondary font-semibold">KJA-551-ZZ</td>
              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>On Trip (Airport)
                </span>
              </td>
              <td className="py-3.5 px-4 text-on-surface">Segun Alabi</td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{"width": "95%"}}></div>
                  </div>
                  <span className="font-label-sm text-xs">95%</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <a href="/live-tracking" className="text-secondary hover:underline font-label-sm text-xs font-semibold">Track GPS</a>
              </td>
            </tr>

            {/*  Row 4: LP-04  */}
            <tr className="hover:bg-surface-container-low/50 transition-colors">
              <td className="py-3.5 px-4 font-semibold text-primary">LP-04</td>
              <td className="py-3.5 px-4 font-medium text-primary">Cadillac Escalade ESV Premium</td>
              <td className="py-3.5 px-4 font-mono text-xs text-secondary font-semibold">APP-208-YY</td>
              <td className="py-3.5 px-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>Scheduled (Abuja)
                </span>
              </td>
              <td className="py-3.5 px-4 text-on-surface">Godwin Chukwu</td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{"width": "82%"}}></div>
                  </div>
                  <span className="font-label-sm text-xs">82%</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right">
                <button className="text-secondary hover:underline font-label-sm text-xs font-semibold" onClick={() => {}} type="button">Edit Vehicle</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    {/*  SUB-SECTION 4: HANDOVER & INSPECTION QUEUE  */}
    <section id="section-handover" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
        <div>
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-semibold">Sub-Navigation View • Key Handovers</span>
          <h3 className="font-headline-sm text-xl text-primary font-serif font-semibold">Handover &amp; Inspection Queue</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-xs font-semibold">
            1 Immediate Inspection Pending
          </span>
          <a href="/handover-inspection" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-xs font-semibold hover:bg-secondary transition-colors">
            <span>Open Inspection Console</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>

      {/*  Handover Active Dispatch Cards  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/*  Active Handover Card 1  */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                LP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-sm text-primary font-semibold">Booking #LP-8842</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">READY AT VALET</span>
                </div>
                <span className="text-xs text-on-surface-variant">Guest: Dr. Adekunle Balogun • VIP Client</span>
              </div>
            </div>
            <span className="text-secondary font-mono font-semibold text-xs">17:25 WAT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-lowest p-2.5 rounded-lg">
            <div>
              <span className="text-on-surface-variant block text-[10px] uppercase">Vehicle</span>
              <span className="font-semibold text-primary">Range Rover Auto.</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px] uppercase">Assigned Chauffeur</span>
              <span className="font-semibold text-primary">Mr. Emmanuel Okafor</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between">
              <span className="text-on-surface-variant text-[11px]">Location: The Wheatbaker Hotel, Ikoyi</span>
              <span className="text-emerald-700 font-semibold text-[11px]">Photos: 4/4 Verified</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a href="/reservation-pass" className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">qr_code_2</span> View Pass
            </a>
            <a href="/handover-inspection" className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-secondary transition-colors flex items-center gap-1">
              <span>Start Sign-off</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          </div>
        </div>

        {/*  Handover Card 2: Upcoming Airport Reception  */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold text-sm">
                ABV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title-md text-sm text-primary font-semibold">Booking #LP-8850</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">AIRPORT PICKUP</span>
                </div>
                <span className="text-xs text-on-surface-variant">Guest: Chief O. Fernandez • Airport Protocol</span>
              </div>
            </div>
            <span className="text-secondary font-mono font-semibold text-xs">19:15 WAT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low p-2.5 rounded-lg">
            <div>
              <span className="text-on-surface-variant block text-[10px] uppercase">Vehicle</span>
              <span className="font-semibold text-primary">Toyota LC 300 VXR</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px] uppercase">Assigned Chauffeur</span>
              <span className="font-semibold text-primary">Mr. Segun Alabi</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between">
              <span className="text-on-surface-variant text-[11px]">Location: Nnamdi Azikiwe VIP Annex</span>
              <span className="text-secondary font-semibold text-[11px]">Flight: BA 083 (Tracked)</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-on-surface-variant text-xs">Driver en route to terminal</span>
            <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors" type="button">
              Notify Chauffeur
            </button>
          </div>
        </div>
      </div>
    </section>

    {/*  SUB-SECTION 5: CHAUFFEUR & DRIVER ROSTER  */}
    <section id="section-drivers" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
        <div>
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-semibold">Sub-Navigation View • Driver Management</span>
          <h3 className="font-headline-sm text-xl text-primary font-serif font-semibold">Chauffeur Duty Roster (14 Active on Shift)</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {}} className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-xs font-semibold hover:bg-surface-container-high transition-colors" type="button">
            Manage Shift Rosters
          </button>
        </div>
      </div>

      {/*  Driver Cards Grid  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/*  Driver 1: Emmanuel Okafor  */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container">
              <img className="w-full h-full object-cover" alt="Emmanuel Okafor" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKbjhRjrCmhkNlNkML6SVprykttgquwqWvriXkbf51jsmHySi6yGrZW7ZJSluSjBFkdDZ8NJ2TismICR836d98noMAJJdUUZZjpt0JxtEM9FxNzWymZH9c00BiE4llpKb4bXYsZuCuoikHPm85V8b8o3PtMiKGswUciXjbf9vpKSFsjNerRJ0f54oAOGAH-IAOK5c1Z6j0A2AlKQ8TETBHFXSM3YMTFoUIS7sSk1WZ4TEyd_pRdrRQ" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full ring-2 ring-surface-container-lowest"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-sm text-primary font-semibold truncate">Emmanuel Okafor</span>
              <span className="text-xs text-secondary font-semibold">5.0 ★ • Senior Chauffeur</span>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant space-y-1">
            <div className="flex justify-between"><span>Assigned:</span> <span className="font-medium text-primary">Range Rover (LAG-892-XZ)</span></div>
            <div className="flex justify-between"><span>Guest:</span> <span className="font-medium text-primary">Dr. Adekunle Balogun</span></div>
            <div className="flex justify-between"><span>Shift:</span> <span className="text-emerald-700 font-semibold">Active On Trip</span></div>
          </div>
          <div className="pt-2 border-t border-surface-container flex items-center justify-between">
            <a href="tel:+23418885275" className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">call</span> Call
            </a>
            <a href="/live-tracking" className="text-primary hover:underline text-xs font-semibold">Track GPS →</a>
          </div>
        </div>

        {/*  Driver 2: Babatunde Adeleke  */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container">
              <img className="w-full h-full object-cover" alt="Babatunde Adeleke" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3Rf9gJkihhp91K2SQUots7gYDkTjCeOLY0WTHKQYk2XWq7JYKB8Kdsc-voiLW1jKwKRerx8fmgWlsTZrLXWXoiY4g7Q-rMa0CejldlOVf6Vyz0cvvJNffyOVJ1_N5rXluusiH5mXiKRHNjpDJZ2nGZ7gw3mjm5nlgaKGH1cy76BVRn-ot2o0FMHC1NxHwDY0CNZ1aBkY_6bGLkht1gWXmB_DrAz_cDMfNxvdH5uL9C2DGR19QaDB8" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-sm text-primary font-semibold truncate">Babatunde Adeleke</span>
              <span className="text-xs text-secondary font-semibold">4.9 ★ • Executive Lead</span>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant space-y-1">
            <div className="flex justify-between"><span>Assigned:</span> <span className="font-medium text-primary">Mercedes S580 (ABC-104)</span></div>
            <div className="flex justify-between"><span>Base:</span> <span className="font-medium text-primary">The Wheatbaker Ikoyi</span></div>
            <div className="flex justify-between"><span>Shift:</span> <span className="text-primary font-semibold">On Standby (Ready)</span></div>
          </div>
          <div className="pt-2 border-t border-surface-container flex items-center justify-between">
            <a href="tel:+23418885275" className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">call</span> Call
            </a>
            <span className="text-emerald-700 font-semibold text-xs">Available</span>
          </div>
        </div>

        {/*  Driver 3: Segun Alabi  */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container">
              <img className="w-full h-full object-cover" alt="Segun Alabi" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZP6guV8VQUcpcoXuyQdctvwhwtwGoK5vA5kU8f0hi35_3Lj30r1A69H3EZUCkJbGPkialrd4TKt6bpq6X2E0Q87cDtg431RWkhEqDtgSOP7z_JHwqtua3Uu04Ye4LJvVVfulcXyOyntrW5lU45BRMlkyXkcoJgmqDfmcJGilhjeO2GPKhGkhC8JaK4WbGf8gUhegn2sfMY09E2-u3xUsbILUO8DUzT-gkw2gqeU0GHj1AxDyI3GW8" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-sm text-primary font-semibold truncate">Segun Alabi</span>
              <span className="text-xs text-secondary font-semibold">4.9 ★ • Escort Protocol</span>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant space-y-1">
            <div className="flex justify-between"><span>Assigned:</span> <span className="font-medium text-primary">Toyota LC 300 (KJA-551)</span></div>
            <div className="flex justify-between"><span>Corridor:</span> <span className="font-medium text-primary">Lagos MMA2 Airside</span></div>
            <div className="flex justify-between"><span>Shift:</span> <span className="text-emerald-700 font-semibold">Active On Trip</span></div>
          </div>
          <div className="pt-2 border-t border-surface-container flex items-center justify-between">
            <a href="tel:+23418885275" className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">call</span> Call
            </a>
            <a href="/live-tracking" className="text-primary hover:underline text-xs font-semibold">Track GPS →</a>
          </div>
        </div>

        {/*  Driver 4: Godwin Chukwu  */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container">
              <img className="w-full h-full object-cover" alt="Godwin Chukwu" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfd_rPLrTsKMRJd_s4OLUxH0T6MV9dtN2aIf_A_Pag2q8giG4GvDp1fWHwAaDSV86yMNCeTW9zqLsSdOTB3beVJLcwF_en28eQ6gj_yxGl2rWpGgWBTJr0kH6iyBGxg3qw-sAHKyeidzuRBLHzrR_mrp9q-lVD3et2ZTlHvJagOy82o0oNHZWu2YrVGr7rraCBj6YfopTSLg90fmNmHlte4qn8VO2IMAkNxnvucf8VB-mNEzGcityR" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-sm text-primary font-semibold truncate">Godwin Chukwu</span>
              <span className="text-xs text-secondary font-semibold">5.0 ★ • Abuja Lead</span>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant space-y-1">
            <div className="flex justify-between"><span>Assigned:</span> <span className="font-medium text-primary">Escalade ESV (APP-208)</span></div>
            <div className="flex justify-between"><span>Base:</span> <span className="font-medium text-primary">Maitama Presidential Hub</span></div>
            <div className="flex justify-between"><span>Shift:</span> <span className="text-on-surface-variant font-medium">Scheduled (19:00)</span></div>
          </div>
          <div className="pt-2 border-t border-surface-container flex items-center justify-between">
            <a href="tel:+23418885275" className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">call</span> Call
            </a>
            <span className="text-secondary font-semibold text-xs">Standby</span>
          </div>
        </div>
      </div>
    </section>

    {/*  SUB-SECTION 6: REVENUE & FINANCIAL AUDIT SUMMARY  */}
    <section id="section-revenue" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
        <div>
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-semibold">Sub-Navigation View • Financial Ledger</span>
          <h3 className="font-headline-sm text-xl text-primary font-serif font-semibold">Settlement Audit &amp; Revenue Ledger</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">Billing Cycle: Oct 2026</span>
          <button onClick={() => {}} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-xs font-semibold hover:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Download Audit</span>
          </button>
        </div>
      </div>

      {/*  Financial Metric Highlights  */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-medium">Gross Charter Billings</span>
          <span className="font-headline-md text-2xl font-bold text-primary font-mono">₦84,250,000</span>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span> +14.2% month-on-month
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-medium">100% Upfront Verified Settlements</span>
          <span className="font-headline-md text-2xl font-bold text-primary font-mono">₦84,250,000</span>
          <span className="text-[11px] text-secondary font-semibold">Zero Outstanding Receivables</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-medium">VIP Escort &amp; Tarmac Add-on Volume</span>
          <span className="font-headline-md text-2xl font-bold text-primary font-mono">₦12,480,000</span>
          <span className="text-[11px] text-on-surface-variant">24 Escort Charters Completed</span>
        </div>
      </div>
    </section>

  </main>

  {/*  Clean Enterprise Admin Footer Bar  */}
  <footer className="mt-auto bg-surface-container-lowest border-t border-surface-container px-6 py-4">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant font-body-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-primary">La Planta Fleet Command Console</span>
        <span>•</span>
        <span>Version 2.4 (Lagos &amp; Abuja Dispatch)</span>
      </div>
      <div className="flex items-center gap-4">
        <span>&copy; 2025 La Planta Luxury Car Hire Ltd.</span>
        <a href="/" className="hover:text-primary transition-colors underline">Public Website</a>
        <a href="tel:+23418885275" className="hover:text-primary transition-colors">Direct Desk: +234 1 888 5275</a>
      </div>
    </div>
  </footer>
</div>

{/*  Interactive Tab & Sidebar Toggle Scripts  */}



    </div>
  );
}
