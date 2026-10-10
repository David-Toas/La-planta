"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { adminApi } from "@/lib/api";

type TabType = "overview" | "map" | "fleet" | "handover" | "drivers" | "vip" | "revenue";

interface FleetVehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  plate_number: string;
  status: string;
  current_hub?: string;
  battery_percent?: number;
  driver_name?: string;
  color?: string;
}

interface DriverItem {
  id: string;
  full_name: string;
  phone: string;
  badge_number?: string;
  rating?: number;
  status?: string;
  assigned_vehicle?: string;
  current_client?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  vip_tier?: string;
  role?: string;
  created_at?: string;
  avatar_url?: string;
}

export default function AdminDashboardPage() {
  const { adminUser, logout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [backendHealth, setBackendHealth] = useState<string>("connecting");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Live Data States
  const [overviewKpis, setOverviewKpis] = useState<any>(null);
  const [fleetList, setFleetList] = useState<FleetVehicle[]>([]);
  const [driverList, setDriverList] = useState<DriverItem[]>([]);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [fleetFilter, setFleetFilter] = useState<"all" | "active" | "reserve">("all");

  // Interaction States
  const [isPinging, setIsPinging] = useState(false);
  const [pingAlert, setPingAlert] = useState<string | null>(null);

  // VIP Update State
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [vipFeedback, setVipFeedback] = useState<{ id: string; text: string } | null>(null);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastCorridor, setBroadcastCorridor] = useState("Lagos & Abuja All Corridors");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Initial Fetch & Live Polling
  useEffect(() => {
    // 1. Health check
    adminApi.getHealth().then((res) => {
      setBackendHealth(res?.status === "ok" ? "online" : "offline");
    });

    // 2. Overview KPIs
    adminApi.getOverview().then((res) => {
      if (res?.success && res.kpis) {
        setOverviewKpis(res.kpis);
      }
    });

    // 3. Fleet
    adminApi.getFleet().then((res) => {
      if (res?.success && res.vehicles) {
        setFleetList(res.vehicles);
      }
    });

    // 4. Drivers
    adminApi.getDrivers().then((res) => {
      if (res?.success && res.drivers) {
        setDriverList(res.drivers);
      }
    });

    // 5. Users for VIP management
    adminApi.getUsers().then((res) => {
      if (res?.success && res.users) {
        setUserList(res.users);
      }
    });
  }, []);

  // Ping Tracker action
  const handleAdminPing = async () => {
    setIsPinging(true);
    const res = await adminApi.pingTracker("TRK-892-SIM");
    if (res?.success) {
      setPingAlert(`✓ Sent "WHERE#" ping to SIM ${res.simPhone || "+2348037294810"} (Express :4000 ACK)`);
    } else {
      setPingAlert(`Notice: ${res?.error || "Dispatched"}`);
    }
    setIsPinging(false);
    setTimeout(() => setPingAlert(null), 5000);
  };

  // Admin VIP Tier Update handler
  const handleUpdateTier = async (userId: string, newTier: string) => {
    setUpdatingUserId(userId);
    setVipFeedback(null);
    const res = await adminApi.updateUserVipTier(userId, newTier);
    setUpdatingUserId(null);
    if (res?.success) {
      // Update local state
      setUserList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, vip_tier: newTier } : u))
      );
      setVipFeedback({
        id: userId,
        text: `✓ Tier successfully updated to ${newTier.toUpperCase()}`,
      });
      setTimeout(() => setVipFeedback(null), 4000);
    } else {
      setVipFeedback({
        id: userId,
        text: `Error: ${res?.error || "Failed to update"}`,
      });
    }
  };

  // Fleet broadcast handler
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    const res = await adminApi.broadcastNotice(broadcastMsg, broadcastCorridor);
    if (res?.success) {
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setIsBroadcastModalOpen(false);
        setBroadcastMsg("");
      }, 2000);
    }
  };

  // Filtered fleet
  const displayedFleet = fleetList.filter((v) => {
    if (fleetFilter === "active") return v.status === "in_transit" || v.status === "reserved";
    if (fleetFilter === "reserve") return v.status === "available";
    return true;
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* OPERATIONS SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-surface-container-lowest border-r border-surface-container flex flex-col justify-between z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-xl lg:shadow-none`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand & Console Title */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-surface-container shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-md shrink-0">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18 8.5v7l-6 3.75-6-3.75v-7l6-4.3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg text-primary tracking-tight font-bold leading-none">
                  LA PLANTA
                </span>
                <span className="text-[10px] tracking-widest uppercase text-secondary font-semibold mt-1">
                  ADMIN CONSOLE
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Regional Status Badge */}
          <div className="p-3.5 mx-3 mt-3 rounded-xl bg-surface-container-low border border-surface-container/70 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
                <span className="text-[11px] uppercase tracking-wider text-primary font-bold">
                  LOS &amp; ABV DISPATCH
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                14 EN ROUTE
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>Backend :4000</span>
              <span
                className={`font-semibold uppercase ${
                  backendHealth === "online" ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                ● {backendHealth}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                  Operations Modules
                </span>
                <span className="text-[9px] bg-secondary-container/60 text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">
                  Live
                </span>
              </div>

              {/* Sub-Nav 1: Overview */}
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "overview"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "overview" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    dashboard
                  </span>
                  <span>Overview &amp; KPIs</span>
                </div>
                {activeTab === "overview" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse" />
                )}
              </button>

              {/* Sub-Nav 2: Live Map */}
              <button
                onClick={() => {
                  setActiveTab("map");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "map"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "map" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    share_location
                  </span>
                  <span>Live GPS Map</span>
                </div>
                <span className="text-[10px] text-secondary font-semibold bg-surface-container px-1.5 py-0.5 rounded">
                  14 PING
                </span>
              </button>

              {/* Sub-Nav 3: Fleet */}
              <button
                onClick={() => {
                  setActiveTab("fleet");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "fleet"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "fleet" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    directions_car
                  </span>
                  <span>Fleet Inventory</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-semibold">
                  18 Units
                </span>
              </button>

              {/* Sub-Nav 4: Handover Queue */}
              <button
                onClick={() => {
                  setActiveTab("handover");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "handover"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "handover" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    fact_check
                  </span>
                  <span>Handover &amp; Checks</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                  ACTIVE
                </span>
              </button>

              {/* Sub-Nav 5: Chauffeurs */}
              <button
                onClick={() => {
                  setActiveTab("drivers");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "drivers"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "drivers" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    supervised_user_circle
                  </span>
                  <span>Chauffeur Roster</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-semibold">
                  14 Duty
                </span>
              </button>

              {/* Sub-Nav 6: VIP Management (Crucial User Requirement) */}
              <button
                onClick={() => {
                  setActiveTab("vip");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "vip"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "vip" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    workspace_premium
                  </span>
                  <span>VIP Members Admin</span>
                </div>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                  TIERS
                </span>
              </button>

              {/* Sub-Nav 7: Revenue */}
              <button
                onClick={() => {
                  setActiveTab("revenue");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "revenue"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "revenue" ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    payments
                  </span>
                  <span>Revenue &amp; Invoices</span>
                </div>
                <span className="text-[10px] text-secondary font-bold font-mono">
                  ₦84.2M
                </span>
              </button>
            </div>

            {/* General Navigation Separator */}
            <div className="pt-2 pb-1 border-t border-surface-container">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold px-3 block mb-1">
                External Links
              </span>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-secondary">
                    home
                  </span>
                  <span>Client Website (:3000)</span>
                </div>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
              <a
                href="http://localhost:3000/fleet"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-secondary">
                    garage
                  </span>
                  <span>Fleet Catalog</span>
                </div>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="p-3.5 border-t border-surface-container bg-surface-container-low/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  alt="Admin"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-secondary/40"
                  src={
                    adminUser?.avatarUrl ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                  }
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-primary font-semibold truncate leading-tight">
                  {adminUser?.name || "Dr. Adekunle B."}
                </span>
                <span className="text-[10px] text-secondary truncate">
                  Fleet Administrator
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-destructive hover:bg-surface-container transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen bg-surface">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-20 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              className="lg:hidden p-2 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl text-primary font-semibold">
                  Admin Command Cockpit
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />{" "}
                  LIVE
                </span>
              </div>
              <span className="text-xs text-on-surface-variant hidden md:block">
                Autonomous telematics monitoring, chauffeur dispatch &amp; VIP tier control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Ping SIM Tracker Button (Express :4000) */}
            <button
              onClick={handleAdminPing}
              disabled={isPinging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-white font-semibold hover:bg-secondary/90 transition-all text-xs shadow-sm disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-sm ${
                  isPinging ? "animate-spin" : ""
                }`}
              >
                {isPinging ? "sync" : "satellite_alt"}
              </span>
              <span>{isPinging ? "Pinging :4000..." : "Test SIM Ping"}</span>
            </button>

            {/* Broadcast Button */}
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>Broadcast</span>
            </button>
          </div>
        </header>

        {/* Quick Horizontal Sub-Navigation Pills */}
        <div className="sticky top-20 z-20 bg-surface-container-low/95 backdrop-blur-md border-b border-surface-container px-4 sm:px-8 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              <span>Operations Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "map"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                share_location
              </span>
              <span>Live GPS Map (14)</span>
            </button>
            <button
              onClick={() => setActiveTab("fleet")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "fleet"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                directions_car
              </span>
              <span>Fleet Register (18)</span>
            </button>
            <button
              onClick={() => setActiveTab("handover")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "handover"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                fact_check
              </span>
              <span>Handover Queue</span>
            </button>
            <button
              onClick={() => setActiveTab("drivers")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "drivers"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                supervised_user_circle
              </span>
              <span>Chauffeur Roster (14)</span>
            </button>
            <button
              onClick={() => setActiveTab("vip")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "vip"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-amber-600">
                workspace_premium
              </span>
              <span>VIP Tier Admin</span>
            </button>
            <button
              onClick={() => setActiveTab("revenue")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "revenue"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                payments
              </span>
              <span>Revenue &amp; Invoices</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          {/* Real-time Ping Alert Banner */}
          {pingAlert && (
            <div className="w-full bg-primary text-secondary-fixed px-4 py-3 rounded-xl text-xs font-mono flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary-fixed">
                  cell_tower
                </span>
                <span>{pingAlert}</span>
              </div>
              <button
                onClick={() => setPingAlert(null)}
                className="text-secondary-fixed/70 hover:text-secondary-fixed"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: OPERATIONS OVERVIEW & KPIS */}
          {activeTab === "overview" && (
            <section className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Telematics Status Ribbon */}
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-4 border border-surface-container/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
                    </span>
                    <span className="text-xs uppercase tracking-wider text-primary font-bold">
                      Lagos &amp; Abuja Telematics Dispatch
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      | Live Feed
                    </span>
                  </div>
                  <div className="hidden sm:inline-block h-4 w-[1px] bg-surface-container" />
                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full text-xs text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      sensors
                    </span>
                    <span>14 Active Trackers Monitored</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      satellite_alt
                    </span>
                    GPS Accuracy: 99.8%
                  </span>
                </div>
              </div>

              {/* KPI Cards Quartet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Cars on Trip */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Cars on Trip
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        directions_car
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {overviewKpis?.carsOnTrip?.active || 11}{" "}
                      <span className="text-sm text-on-surface-variant font-normal">
                        / {overviewKpis?.carsOnTrip?.total || 18}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                      {overviewKpis?.carsOnTrip?.percentage || 61}% Active
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span>
                      {overviewKpis?.carsOnTrip?.reserveCount || 7} In Reserve
                    </span>
                    <span className="text-primary font-semibold">Ready</span>
                  </div>
                </div>

                {/* Card 2: Today's Transfers */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Today&apos;s Transfers
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        flight_takeoff
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">04</span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      En Route &amp; Ready
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>2 VIP Airport Meet &amp; Greets</span>
                  </div>
                </div>

                {/* Card 3: Monthly Revenue */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Monthly Revenue
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        payments
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary font-mono">
                      {overviewKpis?.revenue?.amountFormatted || "₦84,250,000"}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="text-emerald-700 font-medium">
                      100% Upfront Settled
                    </span>
                    <span className="text-secondary font-semibold">+14.2%</span>
                  </div>
                </div>

                {/* Card 4: Drivers on Duty */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Drivers on Duty
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        supervised_user_circle
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {overviewKpis?.driversOnDuty?.active || 14}{" "}
                      <span className="text-sm text-on-surface-variant font-normal">
                        / 18
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      All Vetted
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Lead: Emmanuel Okafor</span>
                    <span className="text-secondary font-semibold">5.0 ★</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab("map")}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-secondary-fixed/40 text-secondary flex items-center justify-center material-symbols-outlined text-xl">
                      share_location
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-primary">
                        Live GPS Corridor Map
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Monitor active vehicles en route to guests
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    Open Telematics Map →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("vip")}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center material-symbols-outlined text-xl">
                      workspace_premium
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-primary">
                        VIP Membership Management
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Promote client accounts to VIP statuses
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    Manage VIP Accounts →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("handover")}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center material-symbols-outlined text-xl">
                      fact_check
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-primary">
                        Vehicle Handover Sign-off
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Review pre-trip &amp; post-trip inspections
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    Inspect Handover Queue →
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: LIVE GPS MAP */}
          {activeTab === "map" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-secondary font-semibold">
                    Live Telematics Corridor
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Road Corridor Fleet Monitoring (Lagos &amp; Abuja)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                    GPS Accuracy: 99.8%
                  </span>
                </div>
              </div>

              {/* Map Canvas */}
              <div
                className="relative w-full h-[480px] sm:h-[520px] rounded-xl overflow-hidden bg-cover bg-center shadow-inner"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAN1OwOgub9651Bb5KmJaZF2apbxPMYhED1jOthp4kgwa8ao5FNIH0SkLpMqhdxydeuNthQvFZwfQKWk48uVG0i_bDQmKbS4kOBUqhyY0Er0gmhJadjY9wTCRmiPowl7YB1y2M2DPrw2clomENBX9DuBZJUTYYz6gIZt3fAZWkG6PqqSrmi4zt_82KKbVpwZe7rV_1qO5dGJDsQtJuksJ4h10bwE6pKNcX5aUyW7g8sFuquz_XyD7AK')",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-primary/40 backdrop-blur-[1px]" />

                {/* Pin 1: Airport Corridor */}
                <div className="absolute top-16 left-12 sm:left-24 group cursor-pointer z-10">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-secondary opacity-60" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary shadow-lg" />
                  </div>
                  <div className="absolute left-6 -top-2 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3 shadow-xl w-60 border border-surface-container">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary">
                      <span>LP-03 • ON TRIP</span>
                      <span className="text-primary font-bold">AIRPORT</span>
                    </div>
                    <div className="text-sm text-primary font-semibold mt-1">
                      Toyota Land Cruiser 300
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
                      <span>Driver: Segun Alabi</span>
                      <span className="text-secondary font-medium">54 km/h</span>
                    </div>
                  </div>
                </div>

                {/* Pin 2: Range Rover Victoria Island */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-primary shadow-xl ring-2 ring-secondary" />
                  </div>
                  <div className="absolute left-7 -top-6 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3.5 shadow-xl w-64 border border-surface-container">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary">
                      <span>LP-02 • ACTIVE CHARTER</span>
                      <span className="text-primary font-bold">VICTORIA ISLAND</span>
                    </div>
                    <div className="text-sm text-primary font-semibold mt-1">
                      Range Rover Autobiography
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center justify-between mt-1">
                      <span className="font-medium text-primary">
                        Dr. Adekunle Balogun
                      </span>
                      <span className="text-secondary font-semibold">ETA: 17m</span>
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center justify-between mt-0.5">
                      <span>Emmanuel Okafor</span>
                      <span className="text-primary font-mono text-[11px]">
                        LAG-892-XZ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pin 3: Ikoyi */}
                <div className="absolute bottom-20 right-16 sm:right-32 group cursor-pointer z-10">
                  <div className="relative flex items-center justify-center">
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary shadow-lg" />
                  </div>
                  <div className="absolute right-6 -top-2 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3 shadow-xl w-56 text-right border border-surface-container">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary">
                      <span className="text-primary font-bold">LP-01 • READY</span>
                      <span>IKOYI</span>
                    </div>
                    <div className="text-sm text-primary font-semibold mt-1">
                      Mercedes-Benz S580
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      Driver: Babatunde Adeleke
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-primary/80 backdrop-blur-md rounded-lg px-4 py-2 text-white text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-base">
                      near_me
                    </span>
                    <span>Continuous GPS Telematics</span>
                  </div>
                  <button
                    onClick={handleAdminPing}
                    className="px-3 py-1 rounded bg-secondary text-white font-semibold hover:bg-secondary/90 transition-colors"
                  >
                    Trigger Ping Update
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: FLEET INVENTORY REGISTER */}
          {activeTab === "fleet" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Fleet Register
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Executive Vehicle Fleet (18 Units)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-surface-container text-xs">
                    <button
                      onClick={() => setFleetFilter("all")}
                      className={`px-2.5 py-1 rounded-md font-semibold ${
                        fleetFilter === "all"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant"
                      }`}
                    >
                      All (18)
                    </button>
                    <button
                      onClick={() => setFleetFilter("active")}
                      className={`px-2.5 py-1 rounded-md font-semibold ${
                        fleetFilter === "active"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant"
                      }`}
                    >
                      Active (11)
                    </button>
                    <button
                      onClick={() => setFleetFilter("reserve")}
                      className={`px-2.5 py-1 rounded-md font-semibold ${
                        fleetFilter === "reserve"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant"
                      }`}
                    >
                      Reserve (7)
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-on-surface-variant uppercase tracking-wider bg-surface-container-low/70">
                      <th className="py-3 px-4 rounded-l-lg">Unit ID</th>
                      <th className="py-3 px-4">Vehicle Model</th>
                      <th className="py-3 px-4">Plate No</th>
                      <th className="py-3 px-4">Operational Status</th>
                      <th className="py-3 px-4">Assigned Chauffeur</th>
                      <th className="py-3 px-4">Fuel / Battery</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">Hub</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container/50">
                    {displayedFleet.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-primary">
                          {v.id.toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-primary">
                          {v.make} {v.model}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-secondary font-semibold">
                          {v.plate_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              v.status === "in_transit"
                                ? "bg-secondary-container text-on-secondary-container"
                                : v.status === "reserved"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {v.status === "in_transit"
                              ? "On Trip"
                              : v.status === "reserved"
                              ? "Reserved"
                              : "Available"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface font-medium">
                          {v.driver_name || "Unassigned"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `${v.battery_percent || 85}%` }}
                              />
                            </div>
                            <span>{v.battery_percent || 85}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right text-on-surface-variant">
                          {v.current_hub || "Lagos Base"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: HANDOVER & INSPECTION QUEUE */}
          {activeTab === "handover" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Key Handover Queue
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Digital Handover &amp; Inspection Queue
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  1 Inspection Ready for Sign-off
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Handover Card 1 */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
                        LP
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary font-semibold">
                            Booking #LP-8842
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                            READY AT VALET
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          Guest: Dr. Adekunle Balogun • VIP Client
                        </span>
                      </div>
                    </div>
                    <span className="text-secondary font-mono font-semibold text-xs">
                      17:25 WAT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-lowest p-2.5 rounded-lg">
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Vehicle
                      </span>
                      <span className="font-semibold text-primary">
                        Range Rover Autobiography
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Assigned Chauffeur
                      </span>
                      <span className="font-semibold text-primary">
                        Emmanuel Okafor
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between text-[11px]">
                      <span>Location: The Wheatbaker Hotel, Ikoyi</span>
                      <span className="text-emerald-700 font-semibold">
                        4/4 Photos Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="http://localhost:3000/reservation-pass"
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        qr_code_2
                      </span>
                      View QR Pass
                    </a>
                    <a
                      href="http://localhost:3000/handover-inspection"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-secondary transition-colors"
                    >
                      Launch Inspection Console →
                    </a>
                  </div>
                </div>

                {/* Handover Card 2 */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold text-sm">
                        ABV
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary font-semibold">
                            Booking #LP-8850
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                            AIRPORT PICKUP
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          Guest: Chief O. Fernandez
                        </span>
                      </div>
                    </div>
                    <span className="text-secondary font-mono font-semibold text-xs">
                      19:15 WAT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low p-2.5 rounded-lg">
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Vehicle
                      </span>
                      <span className="font-semibold text-primary">
                        Toyota LC 300 VXR
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Assigned Chauffeur
                      </span>
                      <span className="font-semibold text-primary">
                        Segun Alabi
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between text-[11px]">
                      <span>Location: Nnamdi Azikiwe VIP Wing</span>
                      <span className="text-secondary font-semibold">
                        Flight: BA 083 (Tracked)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-on-surface-variant">
                      Chauffeur staged at terminal
                    </span>
                    <button
                      onClick={handleAdminPing}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      Ping Tracker
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: CHAUFFEUR ROSTER */}
          {activeTab === "drivers" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Driver Management
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Chauffeur Duty Roster (14 Active on Shift)
                  </h3>
                </div>
                <button
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold transition-colors"
                >
                  Broadcast Notice
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {driverList.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          alt={d.full_name}
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-primary font-semibold truncate">
                          {d.full_name}
                        </span>
                        <span className="text-xs text-secondary font-semibold">
                          {d.rating || 5.0} ★ • Senior Chauffeur
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-on-surface-variant space-y-1">
                      <div className="flex justify-between">
                        <span>Assigned:</span>{" "}
                        <span className="font-medium text-primary truncate max-w-[140px]">
                          {d.assigned_vehicle || "Standby"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shift:</span>{" "}
                        <span className="text-emerald-700 font-semibold">
                          {d.status || "Active On Shift"}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
                      <a
                        href={`tel:${d.phone}`}
                        className="text-secondary hover:underline font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          call
                        </span>
                        Call
                      </a>
                      <span className="text-primary font-mono">{d.badge_number || "CH-400"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 6: VIP MEMBER MANAGEMENT (CRITICAL USER REQUIREMENT) */}
          {activeTab === "vip" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container/40 flex flex-col gap-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-700 font-bold">
                    User Governance &amp; Privilege Protocol
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-primary font-semibold mt-0.5">
                    Client Membership &amp; VIP Status Administration
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
                    Newly registered users default to <strong>Member</strong> status. Only fleet administrators can promote clients to VIP tiers based on annual charters and security profile requirements.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                  <span className="material-symbols-outlined text-base text-amber-600">
                    shield
                  </span>
                  <span>Admin Privilege Only</span>
                </div>
              </div>

              {/* User Directory Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-on-surface-variant uppercase tracking-wider bg-surface-container-low/70">
                      <th className="py-3 px-4 rounded-l-lg">Client Name</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Current Tier</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">
                        Change / Promote VIP Tier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container/50">
                    {userList.map((u) => {
                      const currentTier = u.vip_tier || "standard";
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-surface-container-low/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-primary">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-primary">
                                {u.full_name ? u.full_name.charAt(0).toUpperCase() : "M"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-primary">
                                  {u.full_name || "Registered Member"}
                                </span>
                                <span className="text-[10px] text-on-surface-variant">
                                  UUID: {u.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-on-surface">
                            {u.phone || <span className="text-on-surface-variant italic">No phone yet</span>}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                currentTier === "standard" || currentTier === "member"
                                  ? "bg-surface-container text-on-surface"
                                  : currentTier === "executive"
                                  ? "bg-secondary-fixed text-on-secondary-fixed"
                                  : currentTier === "first_class"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-purple-100 text-purple-900"
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">
                                verified
                              </span>
                              {currentTier === "standard" || currentTier === "member"
                                ? "Member"
                                : currentTier === "executive"
                                ? "VIP Executive"
                                : currentTier === "first_class"
                                ? "VIP First Class"
                                : "VIP Diplomatic"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                disabled={updatingUserId === u.id}
                                value={currentTier}
                                onChange={(e) => handleUpdateTier(u.id, e.target.value)}
                                className="h-8 px-2.5 rounded-lg bg-surface-container-low border border-surface-container text-xs font-semibold text-primary focus:outline-none focus:border-secondary cursor-pointer disabled:opacity-50"
                              >
                                <option value="standard">Member (Default)</option>
                                <option value="executive">VIP Executive</option>
                                <option value="first_class">VIP First Class</option>
                                <option value="diplomatic">VIP Diplomatic</option>
                              </select>
                              {vipFeedback && vipFeedback.id === u.id && (
                                <span className="text-[11px] font-medium text-emerald-700 animate-in fade-in">
                                  {vipFeedback.text}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 7: REVENUE & INVOICES */}
          {activeTab === "revenue" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Financial Ledger
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Settlement Audit &amp; Revenue Ledger
                  </h3>
                </div>
                <span className="text-xs text-on-surface-variant">
                  Billing Cycle: Oct 2026
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    Gross Charter Billings
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    ₦84,250,000
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      trending_up
                    </span>{" "}
                    +14.2% month-on-month
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    100% Upfront Verified Settlements
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    ₦84,250,000
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    Zero Outstanding Receivables
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    VIP Escort &amp; Tarmac Add-on Volume
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    ₦12,480,000
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    24 Escort Charters Completed
                  </span>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-surface-container-lowest border-t border-surface-container px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">
                La Planta Fleet Command Console
              </span>
              <span>•</span>
              <span>Version 2.4 (Lagos &amp; Abuja Dispatch)</span>
            </div>
            <div className="flex items-center gap-4">
              <span>&copy; 2026 La Planta Luxury Car Hire Ltd.</span>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors underline"
              >
                Public Website (:3000)
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/70 backdrop-blur-sm"
            onClick={() => setIsBroadcastModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container p-6 flex flex-col gap-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  campaign
                </span>
                <h3 className="font-serif text-lg text-primary font-semibold">
                  Fleet Chauffeur Broadcast
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-emerald-600">
                  check_circle
                </span>
                <span>Broadcast message dispatched to 14 active chauffeurs!</span>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Target Operational Corridor
                  </label>
                  <select
                    value={broadcastCorridor}
                    onChange={(e) => setBroadcastCorridor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container font-medium text-xs"
                  >
                    <option>Lagos &amp; Abuja All Corridors</option>
                    <option>Lagos VI &amp; Lekki Corridor</option>
                    <option>Lagos MMA Airport Corridor</option>
                    <option>Abuja FCT Central Corridor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Broadcast Message / Advisory
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="e.g. VIP convoy staging at Wings Tower valet forecourt. Maintain defensive protocol..."
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-secondary text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all shadow-md mt-2"
                >
                  Dispatch Advisory Notice
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

