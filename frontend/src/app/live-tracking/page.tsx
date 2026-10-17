"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { backendApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { GoogleTrackingMap } from "@/components/google-tracking-map";

function LiveTrackingContent() {
  const searchParams = useSearchParams();
  const vehicleIdParam =
    searchParams?.get("vehicleId") ||
    searchParams?.get("vehicle") ||
    searchParams?.get("id") ||
    "a1b2c3d4-e5f6-7890-abcd-111111111111";
  const { session } = useAuth();
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    uptime?: number;
  } | null>(null);
  // Live telematics simulation state
  const [speed, setSpeed] = useState(42);
  const [etaMinutes, setEtaMinutes] = useState(17);
  const [etaSeconds, setEtaSeconds] = useState(48);
  const [realEtaMinutes, setRealEtaMinutes] = useState<number | null>(null);
  const [realDistanceKm, setRealDistanceKm] = useState<number | null>(null);
  const [estimatedArrivalTime, setEstimatedArrivalTime] =
    useState<string>("17:28 WAT");
  const [simPingCountdown, setSimPingCountdown] = useState(60);
  const [isPingingSim, setIsPingingSim] = useState(false);
  const [lastPingTime, setLastPingTime] = useState("Just now (17:11:04 WAT)");
  const [gpsCoordinates, setGpsCoordinates] = useState({
    lat: "6.4475° N",
    lng: "3.4243° E",
  });
  const [pingSuccessNotice, setPingSuccessNotice] = useState<string | null>(
    null,
  );

  const handleEtaUpdate = useCallback((mins: number, distance: number) => {
    setRealEtaMinutes(mins);
    setRealDistanceKm(distance);
    setEtaMinutes(mins);
    const arrivalDate = new Date(Date.now() + mins * 60 * 1000);
    const timeStr = `${arrivalDate.getHours().toString().padStart(2, "0")}:${arrivalDate.getMinutes().toString().padStart(2, "0")} WAT`;
    setEstimatedArrivalTime(timeStr);
  }, []);

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

  // Live hardware coordinates from Supabase & Telematics Backend
  const [driverCoords, setDriverCoords] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 7.433688,
    lng: 4.183283,
  });

  // Fetch live hardware coordinates from Telematics Backend & Supabase
  const fetchLiveTelemetry = useCallback(async () => {
    try {
      // 1. Direct Supabase query to public.vehicles
      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select("id, name, current_latitude, current_longitude, updated_at, assigned_tracker_id")
        .eq("id", vehicleIdParam)
        .maybeSingle();

      if (
        vehicleData &&
        vehicleData.current_latitude &&
        vehicleData.current_longitude
      ) {
        const latNum = Number(vehicleData.current_latitude);
        const lngNum = Number(vehicleData.current_longitude);
        setDriverCoords({ lat: latNum, lng: lngNum });
        setGpsCoordinates({
          lat: `${latNum.toFixed(4)}° N`,
          lng: `${lngNum.toFixed(4)}° E`,
        });
      }

      // 2. Fetch tracker status from backend API if assigned tracker exists or by default unit
      let trackerCode = "TRK-892-SIM";
      if (vehicleData?.assigned_tracker_id) {
        const { data: t } = await supabase
          .from("tracker_devices")
          .select("device_code")
          .eq("id", vehicleData.assigned_tracker_id)
          .maybeSingle();
        if (t?.device_code) trackerCode = t.device_code;
      }

      const res = await backendApi.getTrackerStatus(trackerCode);
      if (res && res.success && res.tracker) {
        const t = res.tracker;
        if (t.last_latitude && t.last_longitude) {
          const latNum = Number(t.last_latitude);
          const lngNum = Number(t.last_longitude);
          setDriverCoords({ lat: latNum, lng: lngNum });
          setGpsCoordinates({
            lat: `${latNum.toFixed(4)}° N`,
            lng: `${lngNum.toFixed(4)}° E`,
          });
          if (t.last_speed_kmh !== null && t.last_speed_kmh !== undefined) {
            setSpeed(Number(t.last_speed_kmh));
          }
          if (t.updated_at) {
            const time = new Date(t.updated_at).toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            setLastPingTime(`Live GSM Sync at ${time} WAT`);
          }
        }
      }
    } catch (err) {
      console.warn("[LiveTracking] Tracker fetch notice:", err);
    }
  }, [vehicleIdParam]);

  // Dispatch real SMS ping command ("WHERE#") to SIM tracker every 60 seconds
  const triggerAutoPing = useCallback(async () => {
    try {
      const response = await backendApi.pingTracker({ vehicleId: vehicleIdParam });
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} WAT`;
      if (response && response.success) {
        setLastPingTime(`Auto-ping dispatched at ${timeStr}`);
        fetchLiveTelemetry();
      }
    } catch (e) {
      console.warn("Auto-ping dispatch error:", e);
    }
  }, [fetchLiveTelemetry, vehicleIdParam]);

  const triggerAutoPingRef = useRef(triggerAutoPing);
  useEffect(() => {
    triggerAutoPingRef.current = triggerAutoPing;
  }, [triggerAutoPing]);

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

      // Decrement SIM ping countdown & dispatch real GSM ping when cycle reaches zero
      setSimPingCountdown((prev) => {
        if (prev <= 1) {
          triggerAutoPingRef.current();
          return 60; // reset 60s cycle
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

  // Check Telematics Backend health, start 4s auto-poller, and subscribe to Supabase Realtime
  useEffect(() => {
    backendApi.getHealth().then((health) => {
      setBackendHealth(health);
    });

    // 1. Initial fetch & 4-second periodic auto-sync
    fetchLiveTelemetry();
    const poller = setInterval(() => {
      fetchLiveTelemetry();
    }, 4000);

    // 2. Realtime WebSocket listener for immediate coordinate updates
    const channel = supabase
      .channel("live_telematics_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "telematics_pings" },
        (payload) => {
          const newPing = (payload.new as any) || (payload.old as any);
          if (newPing && newPing.latitude && newPing.longitude) {
            setDriverCoords({
              lat: Number(newPing.latitude),
              lng: Number(newPing.longitude),
            });
            setGpsCoordinates({
              lat: `${Number(newPing.latitude).toFixed(4)}° N`,
              lng: `${Number(newPing.longitude).toFixed(4)}° E`,
            });
            if (newPing.speed_kmh !== null && newPing.speed_kmh !== undefined) {
              setSpeed(Number(newPing.speed_kmh));
            }
            const time = new Date(
              newPing.timestamp || newPing.created_at || Date.now(),
            ).toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            setLastPingTime(`Real-Time Sync at ${time} WAT`);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracker_devices" },
        (payload) => {
          const device = (payload.new as any) || (payload.old as any);
          if (device && device.last_latitude && device.last_longitude) {
            setDriverCoords({
              lat: Number(device.last_latitude),
              lng: Number(device.last_longitude),
            });
            setGpsCoordinates({
              lat: `${Number(device.last_latitude).toFixed(4)}° N`,
              lng: `${Number(device.last_longitude).toFixed(4)}° E`,
            });
            if (device.last_speed_kmh) setSpeed(Number(device.last_speed_kmh));
            setLastPingTime(`Real-Time Sync at Just Now`);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        (payload) => {
          const vehicle = (payload.new as any) || (payload.old as any);
          if (
            vehicle &&
            vehicle.current_latitude &&
            vehicle.current_longitude
          ) {
            setDriverCoords({
              lat: Number(vehicle.current_latitude),
              lng: Number(vehicle.current_longitude),
            });
            setGpsCoordinates({
              lat: `${Number(vehicle.current_latitude).toFixed(4)}° N`,
              lng: `${Number(vehicle.current_longitude).toFixed(4)}° E`,
            });
            setLastPingTime(`Real-Time Sync at Just Now`);
          }
        },
      )
      .subscribe();

    return () => {
      clearInterval(poller);
      supabase.removeChannel(channel);
    };
  }, [fetchLiveTelemetry]);

  // Manual trigger to ping SIM card tracker via Standalone Backend API
  const handlePingSimTracker = async () => {
    if (isPingingSim) return;
    setIsPingingSim(true);
    setPingSuccessNotice(
      "Dispatching encrypted GSM ping to Telematics Backend (Port 4000)...",
    );

    try {
      const response = await backendApi.pingTracker(
        "TRK-892-SIM",
        session?.access_token,
      );

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} WAT`;

      if (response && response.success) {
        setLastPingTime(`Manual ping ACK at ${timeStr}`);
        setSimPingCountdown(60);

        // Fetch latest telemetry record
        fetchLiveTelemetry();

        setPingSuccessNotice(
          `✓ Backend ACK: ${response.message} • Provider: ${response.dispatch?.provider || "GSM SMS Gateway"}`,
        );
      } else {
        setPingSuccessNotice(
          `Notice: ${response?.error || "Backend reached but response pending"}`,
        );
      }
    } catch (err: any) {
      setPingSuccessNotice(
        `Backend communication notice: ${err.message || "Failed to reach Port 4000"}`,
      );
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

      <main className="w-full pt-16 lg:pt-20 bg-surface min-h-[calc(100vh-20rem)]">
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
                      {realEtaMinutes !== null
                        ? realEtaMinutes >= 60
                          ? `${Math.floor(realEtaMinutes / 60)}h ${realEtaMinutes % 60}m away`
                          : `${realEtaMinutes}m away`
                        : `${etaMinutes}m ${etaSeconds < 10 ? `0${etaSeconds}` : etaSeconds}s away`}{" "}
                      <span className="text-secondary font-normal text-xs">
                        ({estimatedArrivalTime})
                      </span>
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
                        {realDistanceKm && realDistanceKm > 50
                          ? "Inter-State Corridor"
                          : "Falomo Passage"}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-secondary font-bold text-xs">
                      {realDistanceKm && realDistanceKm > 50
                        ? "LONG-RANGE"
                        : "STAGE 2 / 3"}
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
                            {realDistanceKm && realDistanceKm > 50
                              ? `En Route • ${realDistanceKm} km to Destination`
                              : "Falomo Bridge Crossing"}
                          </span>
                        </div>
                        <span className="text-xs text-on-surface font-medium">
                          Speed:{" "}
                          <span className="font-bold text-primary">
                            {speed} km/h
                          </span>{" "}
                          • Cruising towards Destination
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
                            {estimatedArrivalTime} (Est.)
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
                </div>

                
              </div>

              {/* RIGHT GPS TELEMETRY MAP (lg:col-span-8) */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                {/* Real Google Tracking Map Engine with Turn-by-Turn Route & Traffic */}
                <GoogleTrackingMap
                  bookingCode="LP-8842"
                  vehicleTitle="Range Rover Autobiography LWB"
                  plateNumber="LAG-892-XZ"
                  driverName="Emmanuel Okafor"
                  driverPhone="+234 803 729 4810"
                  originAddress="The Wings Towers, Ozumba Mbadiwe Ave, Victoria Island, Lagos"
                  destinationAddress="The Wheatbaker Hotel, 4 Onitolo Rd, Ikoyi, Lagos"
                  destinationCoords={{ lat: 6.4549, lng: 3.4326 }}
                  initialDriverCoords={driverCoords}
                  onEtaUpdate={handleEtaUpdate}
                />

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
                <span
                  className={
                    backendHealth?.status === "ok"
                      ? "text-emerald-300 font-semibold"
                      : "text-amber-400 font-semibold"
                  }
                >
                  {backendHealth?.status === "ok"
                    ? "● Online (Port 4000)"
                    : "○ Connecting :4000..."}
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
                href="tel:+23418885275"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold transition-all shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    call
                  </span>
                  <span>Driver Emmanuel (Direct Dispatch)</span>
                </div>
                <span className="font-mono text-[11px] text-amber-200">
                  +234 1 888 5275 (Ext. 02)
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

export default function LiveTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-serif text-primary">
              Connecting to Fleet Telematics...
            </span>
          </div>
        </div>
      }
    >
      <AuthGuard
        fallbackTitle="VIP Telematics Tracking Portal"
        fallbackDescription="Real-time telemetry and GPS vehicle radar tracking is reserved for authenticated clients with an active itinerary."
      >
        <LiveTrackingContent />
      </AuthGuard>
    </Suspense>
  );
}
