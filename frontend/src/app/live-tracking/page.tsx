"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { backendApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { GoogleTrackingMap } from "@/components/google-tracking-map";

interface ActiveDoorDeliveryBooking {
  bookingCode: string;
  reference: string;
  status: "confirmed" | "in_transit" | "completed" | "pending";
  isDoorDelivery: boolean;
  deliveryAddress: string;
  pickupLocation: string;
  vehicle: {
    id: string;
    name: string;
    category: string;
    year: number;
    color: string;
    licensePlate: string;
    image: string;
    batteryFuelLevel: number;
    lat: number;
    lng: number;
    trackerCode?: string;
  };
  driver: {
    id?: string;
    name: string;
    badge: string;
    rating: number;
    trips: number;
    phone: string;
    avatar: string;
    isAssigned: boolean;
  } | null;
}

function LiveTrackingContent() {
  const searchParams = useSearchParams();
  const { user, session } = useAuth();

  // Booking & Delivery State
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<ActiveDoorDeliveryBooking | null>(
    null,
  );
  const [isOfficePickupOnly, setIsOfficePickupOnly] = useState(false);
  const [officePickupCode, setOfficePickupCode] = useState<string>("");

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
  const [lastPingTime, setLastPingTime] = useState("Just now");
  const [gpsCoordinates, setGpsCoordinates] = useState({
    lat: "6.4475° N",
    lng: "3.4243° E",
  });
  const [pingSuccessNotice, setPingSuccessNotice] = useState<string | null>(
    null,
  );

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [isCallDriverModalOpen, setIsCallDriverModalOpen] = useState(false);

  // Live hardware coordinates from Supabase & Telematics Backend
  const [driverCoords, setDriverCoords] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 6.4352,
    lng: 3.4219,
  });

  const handleEtaUpdate = useCallback((mins: number, distance: number) => {
    setRealEtaMinutes(mins);
    setRealDistanceKm(distance);
    setEtaMinutes(mins);
    const arrivalDate = new Date(Date.now() + mins * 60 * 1000);
    const timeStr = `${arrivalDate.getHours().toString().padStart(2, "0")}:${arrivalDate.getMinutes().toString().padStart(2, "0")} WAT`;
    setEstimatedArrivalTime(timeStr);
  }, []);

  // 1. Fetch real active booking data from Supabase / LocalStorage
  useEffect(() => {
    let isMounted = true;

    async function loadActiveBooking() {
      setLoading(true);
      try {
        const urlCode =
          searchParams?.get("code") ||
          searchParams?.get("pass") ||
          searchParams?.get("id");

        // 1. Query Supabase
        let query = supabase
          .from("bookings")
          .select("*, vehicles(*), drivers(*)");

        if (urlCode) {
          query = query.or(`booking_reference.eq.${urlCode},id.eq.${urlCode}`);
        } else if (user?.id) {
          query = query.eq("client_id", user.id);
        }

        const { data: dbBookings } = await query
          .in("status", ["confirmed", "in_transit", "pending"])
          .order("created_at", { ascending: false });

        let matched =
          dbBookings && dbBookings.length > 0 ? dbBookings[0] : null;

        // Fallback: check localStorage if user just finalized checkout
        if (!matched && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("laplanta_active_booking");
            if (stored) {
              const parsed = JSON.parse(stored);
              matched = parsed;
            }
          } catch {}
        }

        if (!isMounted) return;

        if (!matched) {
          setBooking(null);
          setIsOfficePickupOnly(false);
          setLoading(false);
          return;
        }

        // Determine if this booking is Door Delivery
        const isDelivery =
          matched.handoverMode === "delivery" ||
          matched.pickup_type === "delivery" ||
          (matched.special_instructions &&
            matched.special_instructions
              .toLowerCase()
              .includes("direct delivery")) ||
          (matched.pickup_location &&
            !matched.pickup_location.toLowerCase().includes("flagship hub"));

        const bCode =
          matched.booking_reference || matched.bookingCode || "LP-RESERVED";

        if (!isDelivery) {
          setIsOfficePickupOnly(true);
          setOfficePickupCode(bCode);
          setBooking(null);
          setLoading(false);
          return;
        }

        // Resolve vehicle
        const v = matched.vehicles || matched.vehicle || {};
        const vehicleLat = v.current_latitude
          ? Number(v.current_latitude)
          : 6.4352;
        const vehicleLng = v.current_longitude
          ? Number(v.current_longitude)
          : 3.4219;

        // Resolve driver
        const d = matched.drivers || matched.driver || null;

        const resolvedBooking: ActiveDoorDeliveryBooking = {
          bookingCode: bCode,
          reference: matched.id || bCode,
          status: matched.status || "confirmed",
          isDoorDelivery: true,
          deliveryAddress:
            matched.deliveryAddress ||
            matched.pickup_location ||
            "Victoria Island Metro, Lagos",
          pickupLocation:
            "La Planta Flagship Hub, The Wings Towers, Victoria Island",
          vehicle: {
            id: v.id || matched.vehicle_id || "v-1",
            name:
              v.name ||
              `${v.brand || "Range Rover"} ${v.model || "Autobiography"}`,
            category: v.category || "VIP Executive Fleet",
            year: v.year || 2024,
            color: v.color || "Obsidian Black",
            licensePlate: v.license_plate || "LAG-892-XZ",
            image:
              v.hero_image_url ||
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCJkYRdhTwQ3X1F8Z2ZGSdwfKFwBPuaHl6qrwbkJyoaRwK1WQPv6tPBoXiyUrjmYwpsEyNtVGIHlXjCoaIeErWu8OCjR96Ipmvt9_73IffGUA6X8Yxo-WNSICQ1BRdCjAIteK1aN-_igKwgSv70KxYSaAeigakxSTSQ6KLYK11UWwrtZLffHbnqYyNA876gtzoWZIC_Wkm9J6wngxIWdcVEISmIj1G9ZDPOR4hc-YcOsOOoxCjZ03Q9",
            batteryFuelLevel: v.fuel_battery_level || 88,
            lat: vehicleLat,
            lng: vehicleLng,
            trackerCode: "TRK-892-SIM",
          },
          driver: d
            ? {
                id: d.id,
                name:
                  d.name ||
                  `${d.first_name || ""} ${d.last_name || ""}`.trim() ||
                  "Assigned VIP Chauffeur",
                badge: d.badge || "VIP Certified Lead",
                rating: d.rating || 5.0,
                trips: d.trips || 1240,
                phone: d.phone || "+234 803 729 4810",
                avatar:
                  d.avatar_url ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBKbjhRjrCmhkNlNkML6SVprykttgquwqWvriXkbf51jsmHySi6yGrZW7ZJSluSjBFkdDZ8NJ2TismICR836d98noMAJJdUUZZjpt0JxtEM9FxNzWymZH9c00BiE4llpKb4bXYsZuCuoikHPm85V8b8o3PtMiKGswUciXjbf9vpKSFsjNerRJ0f54oAOGAH-IAOK5c1Z6j0A2AlKQ8TETBHFXSM3YMTFoUIS7sSk1WZ4TEyd_pRdrRQ",
                isAssigned: true,
              }
            : null,
        };

        setBooking(resolvedBooking);
        setDriverCoords({ lat: vehicleLat, lng: vehicleLng });
        setGpsCoordinates({
          lat: `${vehicleLat.toFixed(4)}° N`,
          lng: `${vehicleLng.toFixed(4)}° E`,
        });
      } catch (err) {
        console.error("[LiveTracking] Error loading active booking:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadActiveBooking();
    return () => {
      isMounted = false;
    };
  }, [user, searchParams]);

  // 2. Fetch live hardware coordinates from Telematics Backend & Supabase
  const fetchLiveTelemetry = useCallback(async () => {
    if (!booking) return;
    try {
      // 1. Direct Supabase query to public.vehicles
      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select(
          "id, name, current_latitude, current_longitude, updated_at, assigned_tracker_id",
        )
        .eq("id", booking.vehicle.id)
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

      // 2. Fetch tracker status from backend API
      let trackerCode = booking.vehicle.trackerCode || "TRK-892-SIM";
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
  }, [booking]);

  // Dispatch real SMS ping command ("WHERE#") to SIM tracker every 60 seconds (1-minute cadence for door delivery asset)
  const triggerAutoPing = useCallback(async () => {
    if (!booking) return;
    try {
      const response = await backendApi.pingTracker({
        vehicleId: booking.vehicle.id,
      });
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} WAT`;
      if (response && response.success) {
        setLastPingTime(`Auto-ping dispatched at ${timeStr}`);
        fetchLiveTelemetry();
      }
    } catch (e) {
      console.warn("Auto-ping dispatch error:", e);
    }
  }, [fetchLiveTelemetry, booking]);

  const triggerAutoPingRef = useRef(triggerAutoPing);
  useEffect(() => {
    triggerAutoPingRef.current = triggerAutoPing;
  }, [triggerAutoPing]);

  // Live countdown timer for ETA & auto-ping (1-minute cadence for door delivery asset)
  useEffect(() => {
    if (!booking) return;

    const timer = setInterval(() => {
      setEtaSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setEtaMinutes((prevMin) => (prevMin > 0 ? prevMin - 1 : 0));
        return 59;
      });

      // Realistic speed fluctuation
      setSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        const newSpeed = Math.round(prev + delta);
        return Math.min(Math.max(newSpeed, 36), 49);
      });

      // Decrement SIM ping countdown & dispatch real GSM ping when cycle reaches zero (every 1 minute)
      setSimPingCountdown((prev) => {
        if (prev <= 1) {
          triggerAutoPingRef.current();
          return 60; // reset 60s cycle
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking]);

  // Supabase Realtime WebSocket listener for immediate coordinate updates
  useEffect(() => {
    if (!booking) return;

    fetchLiveTelemetry();
    const poller = setInterval(fetchLiveTelemetry, 4000);

    const channel = supabase
      .channel(`live_telematics_${booking.bookingCode}`)
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
        {
          event: "*",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${booking.vehicle.id}`,
        },
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
  }, [booking, fetchLiveTelemetry]);

  // Manual trigger to ping SIM card tracker
  const handlePingSimTracker = async () => {
    if (isPingingSim || !booking) return;
    setIsPingingSim(true);
    setPingSuccessNotice(
      "Dispatching encrypted GSM ping to Telematics Gateway...",
    );

    try {
      const response = await backendApi.pingTracker(
        booking.vehicle.trackerCode || "TRK-892-SIM",
        session?.access_token,
      );

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} WAT`;

      if (response && response.success) {
        setLastPingTime(`Manual ping ACK at ${timeStr}`);
        setSimPingCountdown(60);
        fetchLiveTelemetry();
        setPingSuccessNotice(
          `✓ Telematics ACK: Dispatched "WHERE#" to asset • ${response.dispatch?.provider || "GSM SMS Gateway"}`,
        );
      } else {
        setPingSuccessNotice(`Notice: ${response?.error || "Ping dispatched"}`);
      }
    } catch (err: any) {
      setPingSuccessNotice(
        `Gateway notice: ${err.message || "Ping in flight"}`,
      );
    } finally {
      setIsPingingSim(false);
      setTimeout(() => setPingSuccessNotice(null), 6000);
    }
  };

  // Copy shareable live link
  const handleCopyShareLink = () => {
    if (typeof window !== "undefined" && booking) {
      const shareUrl = `${window.location.origin}/live-tracking?code=${encodeURIComponent(booking.bookingCode)}`;
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans">
        <Navbar />
        <main className="w-full pt-16 lg:pt-20 flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4">
          <div className="w-12 h-12 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <p className="font-serif text-sm text-primary tracking-wide">
            Connecting to Live Telematics Gateway...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // 1. Office Pickup State (User booked office pickup, not door delivery)
  if (isOfficePickupOnly) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
        <Navbar />
        <main className="w-full pt-16 lg:pt-20 flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-surface-container-lowest border border-black/[0.06] rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">
                storefront
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-secondary">
                Flagship Hub Handover
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Hub Office Pickup Reservation
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Your reservation <strong>#{officePickupCode}</strong> is
                scheduled for <strong>Office Pickup</strong>. Your luxury
                vehicle is prepared and stationed at the La Planta Flagship Hub
                (The Wings Towers, Victoria Island). Live on-road radar tracking
                is exclusive to Direct Door Delivery bookings.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <Link
                href={`/reservation-pass?code=${encodeURIComponent(officePickupCode)}`}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-primary hover:bg-secondary text-secondary-fixed hover:text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 text-center"
              >
                View Reservation Pass
              </Link>
              <Link
                href="/fleet"
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs uppercase tracking-wider transition-all text-center"
              >
                Browse Fleet
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Empty State (No active booking at all)
  if (!booking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
        <Navbar />
        <main className="w-full pt-16 lg:pt-20 flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-surface-container-lowest border border-black/[0.06] rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">radar</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-secondary">
                VIP Telematics Radar
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                No Active Door Delivery Charter
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                You do not currently have an active door-delivery vehicle en
                route. Real-time GPS telematics and vehicle radar become active
                immediately upon dispatch of your door-delivery charter.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <Link
                href="/fleet"
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-primary hover:bg-secondary text-secondary-fixed hover:text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 text-center"
              >
                Explore Fleet
              </Link>
              <Link
                href="/reservation-pass"
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-xs uppercase tracking-wider transition-all text-center"
              >
                Reservation Pass
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Active Door Delivery Tracking Page (Dynamic live booking data)
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
                  href={`/reservation-pass?code=${encodeURIComponent(booking.bookingCode)}`}
                >
                  <span className="material-symbols-outlined text-base">
                    arrow_back
                  </span>
                  <span>Pass #{booking.bookingCode}</span>
                </Link>

                <div className="h-4 w-px bg-border hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">
                    DOOR DELIVERY EN ROUTE • LIVE GPS RADAR ACTIVE
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

                {/* Auto Ping Countdown Pill (1-Minute Cadence) */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-border">
                  <span className="material-symbols-outlined text-xs text-secondary animate-spin">
                    sync
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    GSM Ping in{" "}
                    <strong className="text-primary font-mono">
                      {simPingCountdown}s
                    </strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary border border-border transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    share
                  </span>
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* SIM Ping Status Alert Banner */}
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
                        Delivery Trajectory
                      </span>
                      <h2 className="text-lg font-serif font-bold text-primary">
                        Direct Door Handover
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-secondary font-bold text-xs">
                      LIVE RADAR
                    </span>
                  </div>

                  {/* Trip Stepper */}
                  <div className="relative pl-6 flex flex-col gap-5">
                    <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-stone-200"></div>

                    {/* Step 1: Staged & Dispatched */}
                    <div className="relative flex items-start gap-3">
                      <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-4 ring-white">
                        <span className="material-symbols-outlined text-xs">
                          check
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">
                          La Planta Flagship Hub
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          Vehicle sanitized, inspected &amp; dispatched for
                          direct delivery.
                        </span>
                      </div>
                    </div>

                    {/* Step 2: En Route */}
                    <div className="relative flex items-start gap-3">
                      <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white ring-4 ring-amber-100 shadow-sm animate-pulse">
                        <span className="material-symbols-outlined text-xs">
                          navigation
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-secondary">
                            Live Corridor
                          </span>
                          <span className="text-xs font-bold text-primary">
                            Cruising towards destination
                          </span>
                        </div>
                        <span className="text-xs text-on-surface font-medium">
                          Speed:{" "}
                          <strong className="text-primary">{speed} km/h</strong>{" "}
                          • 1-min telematic ping cadence
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Destination */}
                    <div className="relative flex items-start gap-3 opacity-90">
                      <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-stone-600 ring-4 ring-white">
                        <span className="material-symbols-outlined text-xs">
                          flag
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface">
                          Destination Delivery
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {booking.deliveryAddress}
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
                          href={`/reservation-pass?code=${encodeURIComponent(booking.bookingCode)}`}
                          className="text-secondary font-bold hover:underline"
                        >
                          #{booking.bookingCode}
                        </Link>{" "}
                        at your destination for instant contactless intake.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                      Assigned Chauffeur
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-on-surface font-medium bg-surface-container px-2.5 py-0.5 rounded-full border border-border">
                      <span className="material-symbols-outlined text-xs text-secondary">
                        verified
                      </span>
                      {booking.driver
                        ? "Vetted VIP Driver"
                        : "Allocation In Progress"}
                    </span>
                  </div>

                  {booking.driver ? (
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-border">
                        <img
                          className="w-full h-full object-cover"
                          alt={booking.driver.name}
                          src={booking.driver.avatar}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-base font-bold text-primary truncate">
                          {booking.driver.name}
                        </h3>
                        <span className="text-xs text-on-surface-variant">
                          {booking.driver.badge}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-amber-600 font-bold">
                            {booking.driver.rating.toFixed(1)} ★
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            • {booking.driver.trips}+ Completed Charters
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-border text-xs flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-lg">
                        badge
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">
                          Chauffeur Allocation In Progress
                        </span>
                        <span className="text-on-surface-variant text-[11px]">
                          Vetted protocol driver is being finalized for your
                          delivery destination.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Snapshot */}
                  <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">
                          directions_car
                        </span>
                        <Link
                          href={`/vehicle-details?id=${booking.vehicle.id}`}
                          className="hover:underline text-xs font-bold text-primary truncate max-w-[200px]"
                        >
                          {booking.vehicle.name} •{" "}
                          {booking.vehicle.licensePlate}
                        </Link>
                      </div>
                      <span className="text-[11px] text-secondary font-mono font-bold bg-white px-2 py-0.5 rounded border border-border shrink-0">
                        {etaMinutes} mins
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                      <div className="bg-white py-1.5 px-2 rounded border border-border">
                        <span className="text-on-surface-variant text-[10px] block">
                          Class
                        </span>
                        <span className="text-primary font-bold truncate block">
                          {booking.vehicle.category}
                        </span>
                      </div>
                      <div className="bg-white py-1.5 px-2 rounded border border-border">
                        <span className="text-on-surface-variant text-[10px] block">
                          Battery/Fuel
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {booking.vehicle.batteryFuelLevel}%
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
                      disabled={!booking.driver}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary text-white font-medium text-xs hover:bg-secondary transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">
                        call
                      </span>
                      <span>Call Driver</span>
                    </button>
                    <a
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-xs border border-border transition-all active:scale-95"
                      href={`https://wa.me/23418885275?text=Hello%20La%20Planta%20Prime,%20inquiry%20regarding%20en-route%20trip%20${encodeURIComponent(booking.bookingCode)}`}
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
                {/* Real Google Tracking Map Engine with Turn-by-Turn Route, Minimizable Driver Card, and Vehicle Hover Info */}
                <GoogleTrackingMap
                  bookingCode={booking.bookingCode}
                  vehicleTitle={booking.vehicle.name}
                  vehicleImage={booking.vehicle.image}
                  vehicleCategory={booking.vehicle.category}
                  plateNumber={booking.vehicle.licensePlate}
                  driverName={
                    booking.driver?.name || "Chauffeur Allocation In Progress"
                  }
                  driverPhone={booking.driver?.phone || "+234 814 031 3381"}
                  driverAvatar={booking.driver?.avatar}
                  originAddress={booking.pickupLocation}
                  destinationAddress={booking.deliveryAddress}
                  destinationCoords={{ lat: 6.4549, lng: 3.4326 }}
                  initialDriverCoords={driverCoords}
                  onPingSim={handlePingSimTracker}
                  isPingingSim={isPingingSim}
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
                        Smooth delivery corridor navigation
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
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        SIM Cadence (Door Delivery)
                      </span>
                      <span className="text-xs font-bold text-primary truncate">
                        1-Minute Active Ticker
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate">
                        {lastPingTime}
                      </span>
                    </div>
                  </div>

                  {/* Card 3: GPS Coordinates */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary shrink-0 border border-border">
                      <span className="material-symbols-outlined text-xl">
                        explore
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        Satellite Position
                      </span>
                      <span className="text-xs font-mono font-bold text-primary">
                        {gpsCoordinates.lat}, {gpsCoordinates.lng}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        High Precision Fix
                      </span>
                    </div>
                  </div>
                </div>

                {/* VIP Handover Protocol Briefing Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-border flex flex-col md:flex-row items-center gap-6">
                  <div className="relative w-full md:w-5/12 h-44 rounded-xl overflow-hidden shrink-0 border border-border">
                    <img
                      className="w-full h-full object-cover"
                      alt={booking.vehicle.name}
                      src={booking.vehicle.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                      <span className="font-semibold truncate">
                        {booking.deliveryAddress.split(",")[0]}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm text-amber-200 border border-amber-300/40 text-[10px] font-bold">
                        Door Delivery
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-7/12 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-secondary-container text-secondary text-xs font-bold uppercase tracking-wider">
                        Arrival Protocol
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        White-Glove Delivery
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-primary">
                      Door Handover at {booking.deliveryAddress.split(",")[0]}
                    </h3>

                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Upon vehicle arrival at your destination,{" "}
                      {booking.driver?.name
                        ? `Chauffeur ${booking.driver.name.split(" ")[0]}`
                        : "your assigned concierge lead"}{" "}
                      will present the authenticated digital reservation pass
                      for swift contactless verification.
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="material-symbols-outlined text-secondary text-base">
                          luggage
                        </span>
                        <span className="text-xs font-semibold">
                          Luggage Intake Assistance
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
              Share this secure tracking link with family or personal security
              to follow your {booking.vehicle.name} in real-time.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                Private Tracking Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/live-tracking?code=${encodeURIComponent(booking.bookingCode)}`
                      : `https://laplanta.ng/live-tracking?code=${booking.bookingCode}`
                  }
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
                href={`https://wa.me/?text=Track%20my%20executive%20journey%20with%20La%20Planta%20Prime:%20${typeof window !== "undefined" ? encodeURIComponent(`${window.location.origin}/live-tracking?code=${booking.bookingCode}`) : ""}`}
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
                href={`mailto:?subject=La%20Planta%20Prime%20Live%20Tracking&body=Track%20my%20executive%20journey:%20${typeof window !== "undefined" ? encodeURIComponent(`${window.location.origin}/live-tracking?code=${booking.bookingCode}`) : ""}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-border text-xs font-semibold transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  email
                </span>
                <span>Send Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CALL DRIVER MODAL */}
      {isCallDriverModalOpen && booking.driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border flex flex-col gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-low mx-auto flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">call</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-primary font-serif">
                Connect with {booking.driver.name}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Direct encrypted voice line to your assigned chauffeur.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={`tel:${booking.driver.phone}`}
                className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-base">
                  call
                </span>
                <span>Dial {booking.driver.phone}</span>
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
                  +234 814 031 3381
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
