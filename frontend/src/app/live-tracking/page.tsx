"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { backendApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function LiveTrackingPage() {
  const { session } = useAuth();
  const [backendHealth, setBackendHealth] = useState<{ status: string; uptime?: number } | null>(null);
  // Live telematics simulation state
  const [speed, setSpeed] = useState(42);
  const [etaMinutes, setEtaMinutes] = useState(17);
  const [etaSeconds, setEtaSeconds] = useState(48);
  const [simPingCountdown, setSimPingCountdown] = useState(24);
  const [isPingingSim, setIsPingingSim] = useState(false);
  const [lastPingTime, setLastPingTime] = useState("Just now (17:11:04 WAT)");
  const [gpsCoordinates, setGpsCoordinates] = useState({
    lat: "6.4475° N",
    lng: "3.4243° E",
  });
  const [pingSuccessNotice, setPingSuccessNotice] = useState<string | null>(
    null,
  );

  // Map view & interactive states
  const [mapMode, setMapMode] = useState<"vector" | "satellite" | "traffic">(
    "vector",
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCentered, setIsCentered] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(
    "falomo",
  );

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isSimDiagnosticOpen, setIsSimDiagnosticOpen] = useState(false);
  const [isCallDriverModalOpen, setIsCallDriverModalOpen] = useState(false);

  // Vehicle progress simulation along trajectory (0 = Wings Towers, 0.5 = Falomo, 1.0 = Wheatbaker)
  const [progress, setProgress] = useState(0.48);

  // Live countdown timer for ETA & auto-ping
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setEtaMinutes((prevMin) => (prevMin > 0 ? prevMin - 1 : 0));
        return 59;
      });

      // Fluctuate speed realistically between 38 and 46 km/h
      setSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        const newSpeed = Math.round(prev + delta);
        return Math.min(Math.max(newSpeed, 36), 49);
      });

      // Decrement SIM ping countdown
      setSimPingCountdown((prev) => {
        if (prev <= 1) {
          // Simulated auto-ping response received from SIM tracker
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} WAT`;
          setLastPingTime(`Auto-synced at ${timeStr}`);
          return 30; // reset 30s demo cycle
        }
        return prev - 1;
      });

      // Slowly advance car along the route
      setProgress((prev) => {
        if (prev >= 0.95) return 0.95;
        return prev + 0.0008;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute vehicle SVG position on the quadratic bezier curve
  // Curve: P0=(260, 520), P1=(340, 430), P2=(460, 340), P3=(680, 160)
  // Simplified piecewise interpolation for smooth motion
  const getVehicleCoordinates = (t: number) => {
    // 0 to 0.5: (260, 520) -> (460, 340)
    // 0.5 to 1: (460, 340) -> (680, 160)
    let x, y;
    if (t <= 0.5) {
      const localT = t / 0.5;
      // Quadratic Bezier from 260,520 through 340,430 to 460,340
      x =
        (1 - localT) * (1 - localT) * 260 +
        2 * (1 - localT) * localT * 340 +
        localT * localT * 460;
      y =
        (1 - localT) * (1 - localT) * 520 +
        2 * (1 - localT) * localT * 430 +
        localT * localT * 340;
    } else {
      const localT = (t - 0.5) / 0.5;
      // Linear/Gentle curve to 680, 160
      x = 460 + localT * (680 - 460);
      y = 340 - localT * (340 - 160);
    }
    return { x, y };
  };

  const vehiclePos = getVehicleCoordinates(progress);

  // Check Telematics Backend health on mount
  useEffect(() => {
    backendApi.getHealth().then((health) => {
      setBackendHealth(health);
    });
  }, []);

  // Manual trigger to ping SIM card tracker via Standalone Backend API
  const handlePingSimTracker = async () => {
    if (isPingingSim) return;
    setIsPingingSim(true);
    setPingSuccessNotice(
      "Dispatching encrypted GSM ping to Telematics Backend (Port 4000)..."
    );

    try {
      const response = await backendApi.pingTracker(
        "TRK-892-SIM",
        session?.access_token
      );

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} WAT`;

      if (response && response.success) {
        setLastPingTime(`Manual ping ACK at ${timeStr}`);
        setSimPingCountdown(30);

        // Micro update GPS coordinates to reflect live movement
        setGpsCoordinates({
          lat: `6.44${75 + Math.floor(Math.random() * 5)}° N`,
          lng: `3.42${43 + Math.floor(Math.random() * 5)}° E`,
        });

        setPingSuccessNotice(
          `✓ Backend ACK: ${response.message} • Provider: ${response.dispatch?.provider || "GSM SMS Gateway"}`
        );
      } else {
        setPingSuccessNotice(
          `Notice: ${response?.error || "Backend reached but response pending"}`
        );
      }
    } catch (err: any) {
      setPingSuccessNotice(`Backend communication notice: ${err.message || "Failed to reach Port 4000"}`);
    } finally {
      setIsPingingSim(false);
      setTimeout(() => setPingSuccessNotice(null), 6000);
    }
  };

  // Copy shareable live link
  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(
        "https://laplantaprime.com/live-tracking?pass=LP-8842&sec=auth_98c2f",
      );
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-20rem)]">
        <div className="flex flex-col w-full">
          {/* Live Journey Status Ribbon */}
          <div className="w-full bg-surface-container-low/90 border-b border-border backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              {/* Breadcrumb & Pass Ident */}
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-semibold text-on-surface border border-border"
                  href="/reservation-pass"
                >
                  <span className="material-symbols-outlined text-base">
                    arrow_back
                  </span>
                  <span>Pass #LP-8842</span>
                </Link>

                <div className="h-4 w-px bg-border hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">
                    EN ROUTE • LIVE GPS TELEMATICS ACTIVE
                  </span>
                </div>
              </div>

              {/* Telemetry Strip & Quick Ping Action */}
              <div className="flex items-center gap-6 text-xs">
                {/* ETA */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-lg">
                      schedule
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-on-surface-variant text-[10px] uppercase font-semibold tracking-wider">
                      ESTIMATED ARRIVAL
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {etaMinutes}m{" "}
                      {etaSeconds < 10 ? `0${etaSeconds}` : etaSeconds}s away{" "}
                      <span className="text-secondary font-normal text-xs">
                        (17:28 WAT)
                      </span>
                    </span>
                  </div>
                </div>

                {/* SIM Poller Control */}
                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border">
                  <button
                    onClick={handlePingSimTracker}
                    disabled={isPingingSim}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white font-medium text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${isPingingSim ? "animate-spin" : ""}`}
                    >
                      {isPingingSim ? "sync" : "satellite_alt"}
                    </span>
                    <span>
                      {isPingingSim ? "Dispatching..." : "Ping Tracker"}
                    </span>
                  </button>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      Auto-ping in {simPingCountdown}s
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      API: {backendHealth?.status === "ok" ? "Port 4000 Live" : "Standalone :4000"}
                    </span>
                  </div>
                </div>

                {/* Starlink Wi-Fi */}
                <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-border">
                  <span className="material-symbols-outlined text-secondary text-base">
                    wifi
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-on-surface-variant text-[10px] uppercase font-semibold">
                      AMENITIES
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      Starlink Wi-Fi 240 Mbps
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIM Ping Status Alert Banner (if recently triggered) */}
          {pingSuccessNotice && (
            <div className="bg-emerald-900 text-emerald-100 text-xs px-4 py-2 flex items-center justify-center gap-2 transition-all">
              <span className="material-symbols-outlined text-sm text-emerald-300">
                verified
              </span>
              <span className="font-medium">{pingSuccessNotice}</span>
              <button
                onClick={() => setPingSuccessNotice(null)}
                className="ml-4 text-emerald-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Primary Interactive Tracking Area */}
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT DISPATCH & PROTOCOL PANEL (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-5 w-full">
                {/* Live Journey Progression Stepper */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                        Trip Progress
                      </span>
                      <h2 className="text-lg font-serif font-bold text-primary">
                        Falomo Passage
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-secondary font-bold text-xs">
                      STAGE 2 / 3
                    </span>
                  </div>

                  {/* Trip Stepper */}
                  <div className="relative pl-6 flex flex-col gap-5">
                    {/* Continuous vertical track */}
                    <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-stone-200"></div>

                    {/* Step 1: Complete */}
                    <div
                      onClick={() => setSelectedWaypoint("wings")}
                      className="relative flex items-start gap-3 cursor-pointer group"
                    >
                      <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-4 ring-white">
                        <span className="material-symbols-outlined text-xs">
                          check
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            16:45 WAT
                          </span>
                          <span className="text-on-surface-variant text-xs group-hover:text-secondary transition-colors">
                            • The Wings Towers, Victoria Island
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          Departure confirmed. White-glove pre-inspection
                          complete.
                        </span>
                      </div>
                    </div>

                    {/* Step 2: In-transit Active */}
                    <div
                      onClick={() => setSelectedWaypoint("falomo")}
                      className="relative flex items-start gap-3 cursor-pointer group"
                    >
                      <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white ring-4 ring-amber-100 shadow-sm animate-pulse">
                        <span className="material-symbols-outlined text-xs">
                          navigation
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-secondary">
                            17:11 WAT
                          </span>
                          <span className="text-xs font-bold text-primary group-hover:text-secondary transition-colors">
                            Falomo Bridge Crossing
                          </span>
                        </div>
                        <span className="text-xs text-on-surface font-medium">
                          Speed:{" "}
                          <span className="font-bold text-primary">
                            {speed} km/h
                          </span>{" "}
                          • Cruising towards Alfred Rewane Rd.
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Estimated Arrival */}
                    <div
                      onClick={() => setSelectedWaypoint("wheatbaker")}
                      className="relative flex items-start gap-3 opacity-80 cursor-pointer group"
                    >
                      <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-stone-600 ring-4 ring-white">
                        <span className="material-symbols-outlined text-xs">
                          flag
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">
                            17:28 WAT (Est.)
                          </span>
                          <span className="text-on-surface-variant text-xs group-hover:text-secondary transition-colors">
                            • The Wheatbaker Ikoyi
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          4 Onitolo Rd, Ikoyi. Designated valet forecourt
                          staging.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Handover Verification Banner */}
                  <div className="bg-surface-container-low rounded-xl p-3.5 flex items-start gap-3 border border-border">
                    <span className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5">
                      qr_code_scanner
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                        Vehicle Handover Verification
                      </span>
                      <p className="text-xs text-on-surface-variant">
                        Present your Digital QR Pass{" "}
                        <Link
                          href="/reservation-pass"
                          className="text-secondary font-bold hover:underline"
                        >
                          #LP-8842
                        </Link>{" "}
                        to Driver Emmanuel for contactless luggage intake.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                      Assigned Executive Chauffeur
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-on-surface font-medium bg-surface-container px-2.5 py-0.5 rounded-full border border-border">
                      <span className="material-symbols-outlined text-xs text-secondary">
                        verified
                      </span>
                      Vetted VIP Chauffeur
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-border">
                      <img
                        className="w-full h-full object-cover"
                        alt="Emmanuel Okafor - Executive Chauffeur"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKbjhRjrCmhkNlNkML6SVprykttgquwqWvriXkbf51jsmHySi6yGrZW7ZJSluSjBFkdDZ8NJ2TismICR836d98noMAJJdUUZZjpt0JxtEM9FxNzWymZH9c00BiE4llpKb4bXYsZuCuoikHPm85V8b8o3PtMiKGswUciXjbf9vpKSFsjNerRJ0f54oAOGAH-IAOK5c1Z6j0A2AlKQ8TETBHFXSM3YMTFoUIS7sSk1WZ4TEyd_pRdrRQ"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-base font-bold text-primary truncate">
                        Emmanuel Okafor
                      </h3>
                      <span className="text-xs text-on-surface-variant">
                        Senior Chauffeur &amp; Protocol Lead
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-amber-600 font-bold">
                          5.0 ★
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          • 1,420+ VIP Completed Trips
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Snapshot */}
                  <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">
                          directions_car
                        </span>
                        <Link
                          href="/vehicle-details"
                          className="hover:underline text-xs font-bold text-primary"
                        >
                          Range Rover Autobiography • LAG-892-XZ
                        </Link>
                      </div>
                      <span className="text-[11px] text-secondary font-mono font-bold bg-white px-2 py-0.5 rounded border border-border">
                        {etaMinutes} mins
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                      <div className="bg-white py-1.5 px-2 rounded border border-border">
                        <span className="text-on-surface-variant text-[10px] block">
                          Class
                        </span>
                        <span className="text-primary font-bold">
                          Executive SUV
                        </span>
                      </div>
                      <div className="bg-white py-1.5 px-2 rounded border border-border">
                        <span className="text-on-surface-variant text-[10px] block">
                          Battery/Fuel
                        </span>
                        <span className="text-emerald-700 font-bold">
                          88% (420 km)
                        </span>
                      </div>
                      <div className="bg-white py-1.5 px-2 rounded border border-border">
                        <span className="text-on-surface-variant text-[10px] block">
                          Cabin Climate
                        </span>
                        <span className="text-primary font-bold">
                          21°C Dual-Zone
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => setIsCallDriverModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary text-white font-medium text-xs hover:bg-secondary transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">
                        call
                      </span>
                      <span>Call Driver</span>
                    </button>
                    <a
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-xs border border-border transition-all active:scale-95"
                      href="https://wa.me/23418885275?text=Hello%20La%20Planta%20Prime,%20inquiry%20regarding%20en-route%20trip%20LP-8842"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-base text-emerald-600">
                        chat
                      </span>
                      <span>WhatsApp VIP</span>
                    </a>
                  </div>

                  {/* Action Triggers */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-surface hover:bg-surface-container-high transition-colors text-left text-xs font-medium text-on-surface border border-border"
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">
                          share_location
                        </span>
                        Share Live Trip Tracking Link
                      </span>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">
                        chevron_right
                      </span>
                    </button>

                    <button
                      onClick={() => setIsProtocolModalOpen(true)}
                      className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-surface hover:bg-surface-container-high transition-colors text-left text-xs font-medium text-on-surface border border-border"
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">
                          security
                        </span>
                        VIP Airport &amp; Hotel Protocols
                      </span>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">
                        chevron_right
                      </span>
                    </button>

                    <button
                      onClick={() => setIsSimDiagnosticOpen(true)}
                      className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-surface hover:bg-surface-container-high transition-colors text-left text-xs font-medium text-on-surface border border-border"
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-700 text-base">
                          settings_input_antenna
                        </span>
                        SIM Hardware Telematics &amp; Logs
                      </span>
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>

                {/* Flight Arrival Linkage Context */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary border border-border shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        flight_land
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-secondary font-bold">
                        Linked Flight Connection
                      </span>
                      <span className="text-xs font-bold text-primary">
                        LOS MMA VIP Terminal • Flight 9H-VTA
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Landed On-Time
                  </span>
                </div>
              </div>

              {/* RIGHT GPS TELEMETRY MAP (lg:col-span-8) */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                {/* Interactive Live Map Container */}
                <div className="relative w-full h-[640px] rounded-2xl overflow-hidden shadow-2xl bg-[#0b101b] border border-stone-800">
                  {/* Layer Background Simulation */}
                  <div
                    className="absolute inset-0 transition-transform duration-500 origin-center"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    {/* SVG Map Graphic */}
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 1000 700"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id="lux-grid"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="#fedeb2"
                            strokeOpacity={
                              mapMode === "vector" ? "0.08" : "0.03"
                            }
                            strokeWidth="0.5"
                          />
                        </pattern>

                        <linearGradient
                          id="routeGlowGrad"
                          x1="0%"
                          y1="100%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#725b38"
                            stopOpacity="0.4"
                          />
                          <stop
                            offset="50%"
                            stopColor="#fedeb2"
                            stopOpacity="0.95"
                          />
                          <stop
                            offset="100%"
                            stopColor="#ffffff"
                            stopOpacity="1"
                          />
                        </linearGradient>

                        <radialGradient
                          id="vehiclePulseGrad"
                          cx="50%"
                          cy="50%"
                          r="50%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#fedeb2"
                            stopOpacity="0.9"
                          />
                          <stop
                            offset="70%"
                            stopColor="#725b38"
                            stopOpacity="0.6"
                          />
                          <stop
                            offset="100%"
                            stopColor="#725b38"
                            stopOpacity="0"
                          />
                        </radialGradient>
                      </defs>

                      {/* Map Base color depending on mode */}
                      <rect
                        width="100%"
                        height="100%"
                        fill={
                          mapMode === "vector"
                            ? "#0c111c"
                            : mapMode === "satellite"
                              ? "#071216"
                              : "#0e1520"
                        }
                      />

                      {/* Lagos Lagoon & Five Cowrie Creek Waterways */}
                      <path
                        d="M -50,420 C 180,390 380,450 540,420 C 700,390 900,460 1100,430 L 1100,620 L -50,620 Z"
                        fill={mapMode === "satellite" ? "#061826" : "#111c2e"}
                        opacity="0.85"
                      />

                      {/* Grid Pattern */}
                      <rect width="100%" height="100%" fill="url(#lux-grid)" />

                      {/* Victoria Island City Streets Background */}
                      <path
                        d="M 120,680 L 260,520 L 380,460 L 520,440"
                        fill="none"
                        stroke="#252d3d"
                        strokeWidth="3"
                        strokeDasharray="4 4"
                      />
                      <path
                        d="M 260,520 L 480,560 L 760,580"
                        fill="none"
                        stroke="#252d3d"
                        strokeWidth="2"
                      />
                      <path
                        d="M 460,340 L 700,380 L 940,420"
                        fill="none"
                        stroke="#252d3d"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M 520,260 L 720,280 L 880,240"
                        fill="none"
                        stroke="#252d3d"
                        strokeWidth="2"
                      />

                      {/* Traffic Mode Congestion Highlights */}
                      {mapMode === "traffic" && (
                        <>
                          {/* Green flowing corridor along Ozumba Mbadiwe */}
                          <path
                            d="M 120,680 L 260,520"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="5"
                            opacity="0.75"
                          />
                          {/* Green clear crossing over Falomo */}
                          <path
                            d="M 260,520 Q 340,430 460,340"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="5"
                            opacity="0.85"
                          />
                          {/* Slight amber delay approaching Alfred Rewane */}
                          <path
                            d="M 460,340 T 680,160"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="5"
                            opacity="0.8"
                          />
                        </>
                      )}

                      {/* Active Route Trajectory Corridor */}
                      {/* Origin: The Wings Towers (260, 520) -> Falomo Bridge (460, 340) -> The Wheatbaker (680, 160) */}
                      <path
                        d="M 260,520 Q 340,430 460,340 T 680,160"
                        fill="none"
                        id="activeTrajectoryPath"
                        stroke="url(#routeGlowGrad)"
                        strokeLinecap="round"
                        strokeWidth="5.5"
                      />

                      {/* Completed Segment High-intensity Halo */}
                      <path
                        d="M 260,520 Q 340,430 460,340"
                        fill="none"
                        stroke="#fedeb2"
                        strokeOpacity="0.3"
                        strokeLinecap="round"
                        strokeWidth="8"
                      />

                      {/* Route Dots (Past & Future) */}
                      <circle cx="260" cy="520" r="5" fill="#725b38" />
                      <circle
                        cx="310"
                        cy="470"
                        r="3.5"
                        fill="#fedeb2"
                        opacity="0.8"
                      />
                      <circle
                        cx="370"
                        cy="415"
                        r="3.5"
                        fill="#fedeb2"
                        opacity="0.8"
                      />
                      <circle
                        cx="410"
                        cy="380"
                        r="3.5"
                        fill="#fedeb2"
                        opacity="0.8"
                      />
                      <circle
                        cx="510"
                        cy="290"
                        r="3"
                        fill="#ffffff"
                        opacity="0.5"
                        stroke="#fedeb2"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx="570"
                        cy="240"
                        r="3"
                        fill="#ffffff"
                        opacity="0.5"
                        stroke="#fedeb2"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx="630"
                        cy="195"
                        r="3"
                        fill="#ffffff"
                        opacity="0.5"
                        stroke="#fedeb2"
                        strokeDasharray="2 2"
                      />

                      {/* Dynamic Vehicle Marker with Real-time Coordinates */}
                      <g
                        transform={`translate(${vehiclePos.x}, ${vehiclePos.y})`}
                      >
                        {/* Animated Radar Pulse Rings */}
                        <circle
                          cx="0"
                          cy="0"
                          r="32"
                          fill="url(#vehiclePulseGrad)"
                        >
                          <animate
                            attributeName="r"
                            values="16;42;16"
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.8;0.1;0.8"
                            dur="2.4s"
                            repeatCount="indefinite"
                          />
                        </circle>

                        {/* Outer Precision Ring */}
                        <circle
                          cx="0"
                          cy="0"
                          r="14"
                          fill="#040505"
                          stroke="#fedeb2"
                          strokeWidth="2.5"
                        />

                        {/* Inner Directional Compass Arrow */}
                        <polygon points="0,-7 5,6 0,3 -5,6" fill="#fedeb2" />
                      </g>
                    </svg>

                    {/* WAYPOINT PIN 1: The Wings Towers (Origin) */}
                    <div
                      onClick={() => setSelectedWaypoint("wings")}
                      className="absolute left-[200px] top-[500px] flex items-center gap-2 bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-stone-700 shadow-xl cursor-pointer hover:scale-105 transition-transform"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white leading-tight">
                          The Wings Towers
                        </span>
                        <span className="text-[9px] text-stone-400 leading-none">
                          VI • Dep. 16:45 WAT
                        </span>
                      </div>
                    </div>

                    {/* WAYPOINT PIN 2: Falomo Bridge (Current Live Location) */}
                    <div
                      onClick={() => setSelectedWaypoint("falomo")}
                      className="absolute left-[380px] top-[260px] flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                    >
                      {/* Live Telemetry Floating HUD Card */}
                      <div className="bg-primary/95 border border-amber-300/40 backdrop-blur-md rounded-xl p-3 shadow-2xl text-white min-w-[240px]">
                        <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-stone-800">
                          <span className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                            LA PLANTA PRIME 01
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-white bg-amber-900/60 border border-amber-600/50 px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {speed} KM/H
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                          <div>
                            <span className="text-stone-400 text-[9px] block uppercase font-medium">
                              Heading
                            </span>
                            <span className="text-[11px] font-semibold text-white">
                              024° NNE
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 text-[9px] block uppercase font-medium">
                              GPS Fix
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-400">
                              12 Sats Lock
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 text-[9px] block uppercase font-medium">
                              Coordinates
                            </span>
                            <span className="text-[10px] font-mono text-amber-200 font-semibold">
                              {gpsCoordinates.lat}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400">
                          <span>Falomo Corridor</span>
                          <span className="text-amber-300/90 font-mono text-[9px]">
                            {lastPingTime}
                          </span>
                        </div>
                      </div>

                      {/* Triangle Pointer down to vehicle */}
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary/95"></div>
                    </div>

                    {/* WAYPOINT PIN 3: The Wheatbaker Hotel (Destination) */}
                    <div
                      onClick={() => setSelectedWaypoint("wheatbaker")}
                      className="absolute left-[620px] top-[95px] flex items-center gap-2.5 bg-primary/95 border border-amber-400/60 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-amber-300 text-lg">
                        location_on
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white leading-tight">
                          The Wheatbaker Hotel
                        </span>
                        <span className="text-[10px] text-amber-200 leading-none">
                          Destination Forecourt • 17:28 WAT
                        </span>
                      </div>
                    </div>

                    {/* Lagos Landmarks subtle ambient tags */}
                    <div className="absolute left-[330px] top-[470px] opacity-60 flex items-center gap-1 text-[11px] text-stone-300 pointer-events-none">
                      <span className="material-symbols-outlined text-xs">
                        water
                      </span>
                      Five Cowrie Creek
                    </div>
                    <div className="absolute left-[540px] top-[300px] opacity-70 flex items-center gap-1 text-[11px] text-amber-200/80 pointer-events-none">
                      <span className="material-symbols-outlined text-xs">
                        account_balance
                      </span>
                      Falomo Interchange
                    </div>
                    <div className="absolute left-[730px] top-[240px] opacity-60 flex items-center gap-1 text-[11px] text-stone-300 pointer-events-none">
                      <span className="material-symbols-outlined text-xs">
                        business
                      </span>
                      Alfred Rewane Commercial Corridor
                    </div>
                  </div>

                  {/* Top-Right Floating Map Layer & Zoom Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    {/* Zoom in / out */}
                    <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-xl flex flex-col items-center border border-border">
                      <button
                        onClick={() =>
                          setZoomLevel((prev) => Math.min(prev + 0.15, 1.6))
                        }
                        aria-label="Zoom in"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">
                          add
                        </span>
                      </button>
                      <div className="w-5 h-px bg-border my-0.5"></div>
                      <button
                        onClick={() =>
                          setZoomLevel((prev) => Math.max(prev - 0.15, 0.75))
                        }
                        aria-label="Zoom out"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">
                          remove
                        </span>
                      </button>
                    </div>

                    {/* Layer Switcher Buttons */}
                    <button
                      onClick={() => setMapMode("vector")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 border ${
                        mapMode === "vector"
                          ? "bg-primary text-white border-secondary"
                          : "bg-white/95 text-on-surface hover:bg-white border-border"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">
                        map
                      </span>
                      <span>Vector Dark</span>
                    </button>

                    <button
                      onClick={() => setMapMode("satellite")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 border ${
                        mapMode === "satellite"
                          ? "bg-primary text-white border-secondary"
                          : "bg-white/95 text-on-surface hover:bg-white border-border"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">
                        layers
                      </span>
                      <span>Satellite</span>
                    </button>

                    <button
                      onClick={() => setMapMode("traffic")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 border ${
                        mapMode === "traffic"
                          ? "bg-primary text-white border-secondary"
                          : "bg-white/95 text-on-surface hover:bg-white border-border"
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm text-emerald-500">
                        traffic
                      </span>
                      <span>Lagos Traffic HD</span>
                    </button>
                  </div>

                  {/* Bottom-Left Map Metric Overlay: Driver quick card */}
                  <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 border border-border">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-11 h-11 rounded-xl object-cover shadow-sm border border-border"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKbjhRjrCmhkNlNkML6SVprykttgquwqWvriXkbf51jsmHySi6yGrZW7ZJSluSjBFkdDZ8NJ2TismICR836d98noMAJJdUUZZjpt0JxtEM9FxNzWymZH9c00BiE4llpKb4bXYsZuCuoikHPm85V8b8o3PtMiKGswUciXjbf9vpKSFsjNerRJ0f54oAOGAH-IAOK5c1Z6j0A2AlKQ8TETBHFXSM3YMTFoUIS7sSk1WZ4TEyd_pRdrRQ"
                        alt="Emmanuel Okafor"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            Emmanuel Okafor
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-secondary text-[10px] font-bold">
                            {etaMinutes}m away
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          Range Rover Autobiography • LAG-892-XZ
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2 border-l border-border">
                      <button
                        onClick={() => setIsCallDriverModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary text-white hover:bg-secondary text-xs font-semibold transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">
                          call
                        </span>
                        <span>Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom-Right Recenter Trigger */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <button
                      onClick={() => {
                        setZoomLevel(1);
                        setIsCentered(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold transition-all shadow-xl active:scale-95"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        my_location
                      </span>
                      <span>Center on Vehicle</span>
                    </button>
                  </div>
                </div>

                {/* Telemetry Data Strip Cards below Map */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Speed & Dynamics */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary shrink-0 border border-border">
                      <span className="material-symbols-outlined text-xl">
                        speed
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        Speed &amp; Telemetry
                      </span>
                      <span className="text-xl font-bold text-primary leading-tight font-serif">
                        {speed} km/h
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Smooth crossing across Falomo corridor
                      </span>
                    </div>
                  </div>

                  {/* Card 2: GSM SIM Tracker Status */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-amber-700 shrink-0 border border-border">
                      <span className="material-symbols-outlined text-xl">
                        sim_card
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        SIM GPS Hardware
                      </span>
                      <span className="text-xl font-bold text-primary leading-tight font-serif">
                        4G LTE Active
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Ping ACK:{" "}
                        {lastPingTime
                          .replace("Auto-synced at ", "")
                          .replace("Manual ping ACK at ", "")}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: In-Cabin Comfort */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary shrink-0 border border-border">
                      <span className="material-symbols-outlined text-xl">
                        room_service
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        In-Cabin Amenities
                      </span>
                      <span className="text-xl font-bold text-primary leading-tight font-serif">
                        Executive Suite
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Starlink Wi-Fi &amp; San Pellegrino on ice
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Handover & Hotel Liaison Context Section */}
            <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="relative w-full md:w-5/12 h-64 rounded-2xl overflow-hidden shadow-md border border-border">
                  <img
                    className="w-full h-full object-cover"
                    alt="La Planta Prime VIP Executive Handover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzY-tMByM6PzbQikVLlkycW-YEmGwjqSpKIwLm_PZWaHVIWyC6w8Wtu93a_ebO5ghm4UBnrd5OGSDwhR0qVE-R28W10b-6v-qLp88LniEQWi-qhcxfsVtUxQK5juAgcJ_I0axI0fzrcZpN6IAWPIJ7OZtZIgFKugvqoL3bsR7ksO3bihMRdgm_0OFvHth6M2uc-8k6LlayYZR-TFgMxgk5x4QvYlJWqslgxWIRofTdn-_tzfnSNJ3F"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold">
                      MMA Executive Terminal • LOS Gate 4
                    </span>
                    <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm text-amber-200 border border-amber-300/40 text-[10px] font-bold">
                      Protocol Active
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-7/12 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">
                      Arrival Briefing
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Lagos Diplomatic SOP
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-primary">
                    VIP Handover Protocol at The Wheatbaker
                  </h3>

                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Upon vehicle arrival at 4 Onitolo Road, Chauffeur Emmanuel
                    will present the authenticated digital reservation pass for
                    swift contactless verification. Dedicated concierge staff
                    will attend to baggage intake directly to your suite without
                    delay.
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-base">
                        luggage
                      </span>
                      <span className="text-xs font-semibold">
                        Priority Luggage Escort
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-base">
                        wifi
                      </span>
                      <span className="text-xs font-semibold">
                        Starlink Active Onboard
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface">
                      <span className="material-symbols-outlined text-secondary text-base">
                        support_agent
                      </span>
                      <span className="text-xs font-semibold">
                        24/7 Operations Desk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SHARE TRIP MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  share_location
                </span>
                <h3 className="text-base font-bold text-primary">
                  Share Live Journey
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Share this secure encrypted tracking link with family, personal
              security details, or hotel concierge to follow your Range Rover in
              real-time.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                Private Tracking Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://laplantaprime.com/live-tracking?pass=LP-8842&sec=auth_98c2f"
                  className="w-full text-xs bg-surface-container-low px-3 py-2.5 rounded-xl border border-border font-mono text-on-surface outline-none"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold transition-all shrink-0 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {shareCopied ? "check" : "content_copy"}
                  </span>
                  <span>{shareCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              {shareCopied && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  ✓ Link copied to clipboard!
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="https://wa.me/?text=Track%20my%20executive%20journey%20with%20La%20Planta%20Prime:%20https://laplantaprime.com/live-tracking?pass=LP-8842"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  chat
                </span>
                <span>Send WhatsApp</span>
              </a>
              <a
                href="mailto:?subject=La%20Planta%20Prime%20Live%20Tracking&body=Track%20my%20executive%20journey:%20https://laplantaprime.com/live-tracking?pass=LP-8842"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-border text-xs font-semibold transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  email
                </span>
                <span>Send Email</span>
              </a>
            </div>

            <span className="text-[10px] text-stone-400 text-center pt-2 border-t border-border">
              End-to-End Encrypted Telematics. Link automatically expires upon
              completed handover.
            </span>
          </div>
        </div>
      )}

      {/* PROTOCOL MODAL */}
      {isProtocolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  security
                </span>
                <h3 className="text-base font-bold text-primary">
                  VIP Airport &amp; Hotel Protocols
                </h3>
              </div>
              <button
                onClick={() => setIsProtocolModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-border">
                <h4 className="font-bold text-primary mb-1 flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    flight_land
                  </span>
                  1. Executive Airport Tarmac &amp; Terminal Intake
                </h4>
                <p className="text-on-surface-variant leading-relaxed">
                  For private air charters landing at LOS Gate 4 / Executive
                  Terminal, your chauffeur holds ramp security clearance. Driver
                  Emmanuel will meet you curbside or at the lounge exit with
                  your digital name board.
                </p>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-border">
                <h4 className="font-bold text-primary mb-1 flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    luggage
                  </span>
                  2. Luggage &amp; Valuables White-Glove Handling
                </h4>
                <p className="text-on-surface-variant leading-relaxed">
                  All luggage pieces are tagged and loaded into the sanitized
                  Range Rover boot by the chauffeur wearing white protocol
                  gloves. Maximum boot capacity: 4 full-sized executive
                  suitcases.
                </p>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-border">
                <h4 className="font-bold text-primary mb-1 flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    hotel
                  </span>
                  3. Hotel Forecourt Staging at The Wheatbaker
                </h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Arrival at 4 Onitolo Rd Ikoyi is pre-coordinated with hotel
                  security for priority portico entry. No street parking or
                  valet queue delays.
                </p>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-border">
                <h4 className="font-bold text-primary mb-1 flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    support_agent
                  </span>
                  4. Diplomatic &amp; Fleet Operations Hotline
                </h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Fleet telemetry is continuously monitored by the central
                  Operations Desk in Victoria Island. In the event of traffic
                  diversions, alternative secure corridors are executed in real
                  time.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsProtocolModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-secondary transition-colors"
            >
              Understood &amp; Acknowledged
            </button>
          </div>
        </div>
      )}

      {/* SIM HARDWARE TELEMATICS MODAL */}
      {isSimDiagnosticOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-xl">
                  settings_input_antenna
                </span>
                <h3 className="text-base font-bold text-primary">
                  SIM Tracker Telematics Hub
                </h3>
              </div>
              <button
                onClick={() => setIsSimDiagnosticOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              La Planta Prime vehicles are equipped with dedicated GSM SIM
              telematics units. When queried, the SIM replies with
              high-precision NMEA GPS coordinates converted in real-time to
              high-definition map coordinates.
            </p>

            <div className="bg-[#0f172a] text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed flex flex-col gap-1.5 shadow-inner">
              <div className="flex items-center justify-between text-stone-400 border-b border-slate-700 pb-1">
                <span>SIM MSISDN:</span>
                <span className="text-white">+234 803 729 4810 (MTN IoT)</span>
              </div>
              <div className="flex items-center justify-between text-stone-400 border-b border-slate-700 pb-1">
                <span>Dispatch Backend:</span>
                <span className={backendHealth?.status === "ok" ? "text-emerald-300 font-semibold" : "text-amber-400 font-semibold"}>
                  {backendHealth?.status === "ok" ? "● Online (Port 4000)" : "○ Connecting :4000..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400 border-b border-slate-700 pb-1">
                <span>Protocol:</span>
                <span className="text-white">
                  SMS Query &amp; Periodic GPRS (5 min)
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400 border-b border-slate-700 pb-1">
                <span>Active Coordinates:</span>
                <span className="text-amber-300">
                  {gpsCoordinates.lat}, {gpsCoordinates.lng}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400 border-b border-slate-700 pb-1">
                <span>Signal RSSI:</span>
                <span className="text-emerald-300">
                  -65 dBm (4G LTE Band 20)
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Raw Response Packet:</span>
                <span className="text-stone-300">
                  GPRMC:0626.85N,00325.47E,{speed}kmh,A
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  handlePingSimTracker();
                  setIsSimDiagnosticOpen(false);
                }}
                disabled={isPingingSim}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">
                  satellite_alt
                </span>
                <span>Send Manual SMS Ping</span>
              </button>
              <button
                onClick={() => setIsSimDiagnosticOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL DRIVER & DISPATCH MODAL */}
      {isCallDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-secondary mx-auto flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl">
                phone_in_talk
              </span>
            </div>

            <div className="flex flex-col">
              <h3 className="text-base font-bold text-primary">
                Contact Chauffeur &amp; Dispatch
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Direct phone link to Chauffeur Emmanuel Okafor and the 24/7
                Fleet Command Center.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <a
                href="tel:+2348035550192"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold transition-all shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    call
                  </span>
                  <span>Driver Emmanuel (Direct)</span>
                </div>
                <span className="font-mono text-[11px] text-amber-200">
                  +234 803 555 0192
                </span>
              </a>

              <a
                href="tel:+23418885275"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-border transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-secondary">
                    support_agent
                  </span>
                  <span>Fleet Operations Desk</span>
                </div>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  +234 1 888 5275
                </span>
              </a>
            </div>

            <button
              onClick={() => setIsCallDriverModalOpen(false)}
              className="text-xs text-on-surface-variant hover:text-primary font-medium pt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
