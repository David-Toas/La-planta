"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/context/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { supabase } from "@/lib/supabase";
import { downloadVIPPassPDF } from "@/components/vip-pass-pdf";
import { backendApi } from "@/lib/api";

interface BookingPassData {
  bookingCode: string;
  reference: string;
  verificationPin: string;
  status: "confirmed" | "in_transit" | "completed" | "pending";
  serviceTier: string;
  amountFormatted: string;
  paidAt: string;
  paidDate: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  handoverProtocol: string;
  vehicle: {
    id?: string;
    name: string;
    category: string;
    year: number;
    color: string;
    licensePlate: string;
    image: string;
    amenities: { icon: string; label: string }[];
  };
  driver: {
    id?: string;
    name: string;
    badge: string;
    rating: number;
    trips: number;
    phone: string;
    avatar: string;
    bio: string;
    tags: string[];
    isAssigned: boolean;
  };
  itinerary: {
    pickupDate: string;
    returnDate: string;
    duration: string;
    pickupLocation: string;
    pickupAddress: string;
    flightNumber?: string;
    flightRoute?: string;
    flightStatus?: string;
  };
}

function ReservationPassContent() {
  const searchParams = useSearchParams();
  const urlCode =
    searchParams.get("booking") ||
    searchParams.get("code") ||
    searchParams.get("id");

  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingPassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [searchCodeInput, setSearchCodeInput] = useState(urlCode || "");
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<
    "pass" | "vehicle" | "itinerary" | "all"
  >("all");
  const [qrImgError, setQrImgError] = useState(false);

  const [originUrl, setOriginUrl] = useState("https://laplantaprime.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Live Supabase & LocalStorage Data Resolution
  useEffect(() => {
    let isMounted = true;

    async function resolveLiveBooking() {
      setLoading(true);
      const targetCode = urlCode ? urlCode.trim() : null;

      try {
        let dbRecord: any = null;

        // 1. If explicit URL code is given, query Supabase by reference, ID, or payment ref
        if (targetCode) {
          const { data, error } = await supabase
            .from("bookings")
            .select("*, vehicles:vehicle_id (*), drivers:driver_id (*)")
            .or(
              `booking_reference.eq.${targetCode},id.eq.${targetCode},payment_reference.eq.${targetCode}`,
            )
            .maybeSingle();

          if (!error && data) {
            dbRecord = data;
          }
        }

        // 2. If no record yet and user is authenticated, query user's latest booking
        if (!dbRecord && user?.id) {
          const { data, error } = await supabase
            .from("bookings")
            .select("*, vehicles:vehicle_id (*), drivers:driver_id (*)")
            .eq("client_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!error && data) {
            dbRecord = data;
          }
        }

        // 3. Fallback to localStorage active booking if still not found
        let localData: any = null;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("laplanta_active_booking");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (
                !targetCode ||
                parsed.bookingCode === targetCode ||
                parsed.reference === targetCode
              ) {
                localData = parsed;
              }
            }
          } catch (e) {
            console.warn("Failed reading localStorage booking:", e);
          }
        }

        if (!isMounted) return;

        // If we found a live Supabase record
        if (dbRecord) {
          const v = dbRecord.vehicles;
          const d = dbRecord.drivers;

          const isHubRecord =
            (dbRecord.pickup_location &&
              (dbRecord.pickup_location.toLowerCase().includes("hub") ||
                dbRecord.pickup_location.toLowerCase().includes("office"))) ||
            dbRecord.handover_mode === "office" ||
            dbRecord.special_instructions?.includes("Office Pickup");

          const hasAssignedDriver = !isHubRecord && !!(d && d.full_name);

          const passData: BookingPassData = {
            bookingCode: dbRecord.booking_reference || targetCode || "LP-PRIME",
            reference: dbRecord.payment_reference || dbRecord.id || "LP_REF",
            verificationPin: dbRecord.verification_pin || "8842-09",
            status: dbRecord.status || "confirmed",
            serviceTier:
              dbRecord.service_type === "diplomatic_escort"
                ? "Diplomatic Armored Escort"
                : dbRecord.service_type === "self_drive"
                  ? "Executive Self-Drive"
                  : "Executive First Class",
            amountFormatted: dbRecord.total_amount_ngn
              ? `₦${Number(dbRecord.total_amount_ngn).toLocaleString()}`
              : "₦0",
            paidAt: dbRecord.paid_at
              ? new Date(dbRecord.paid_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " WAT"
              : "Confirmed",
            paidDate: dbRecord.paid_at
              ? new Date(dbRecord.paid_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent",
            customerName:
              user?.name || dbRecord.customer_name || "Executive Client",
            customerPhone: user?.phone || dbRecord.customer_phone || "",
            customerEmail: user?.email || dbRecord.customer_email || "",
            handoverProtocol: isHubRecord
              ? "Flagship Hub Collection"
              : dbRecord.service_type === "self_drive"
                ? "Direct Delivery (Self-Drive)"
                : "VIP Handover & Escort Cleared",
            vehicle: {
              id: v?.id,
              name: v ? `${v.brand} ${v.model}` : "Executive Fleet Vehicle",
              category: v?.category || "First-Class Fleet",
              year: v?.year || 2024,
              color: v?.color || "Obsidian Black",
              licensePlate: v?.license_plate || "LP-PRIME",
              image:
                v?.hero_image_url ||
                v?.gallery_image_urls?.[0] ||
                "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
              amenities: [
                { icon: "wifi", label: "High-Speed Starlink Wi-Fi" },
                { icon: "wine_bar", label: "Chilled Refreshments" },
                { icon: "volume_off", label: "Acoustic Privacy Glazing" },
                {
                  icon: "airline_seat_recline_extra",
                  label: "First-Class Executive Seating",
                },
              ],
            },
            driver: isHubRecord
              ? {
                  name: "Flagship Hub Concierge (Bay 01)",
                  badge: "VI-HUB-BAY01",
                  rating: 5.0,
                  trips: 0,
                  phone: "+234 814 031 3381",
                  avatar: "",
                  bio: "Your vehicle is pre-conditioned to 21°C, inspected, and staged at VIP Bay 01. Keys and vehicle will be handed over immediately upon scanning this digital pass.",
                  tags: [
                    "VIP Bay 01 Staging",
                    "72-Point Inspected",
                    "Express Handover",
                  ],
                  isAssigned: true,
                }
              : hasAssignedDriver
                ? {
                    id: d.id,
                    name: d.full_name,
                    badge: d.badge_number || `CHAUFFEUR #${d.id.slice(0, 4)}`,
                    rating: d.rating || 5.0,
                    trips: d.total_trips || 120,
                    phone: d.phone || "+234 814 031 3381",
                    avatar:
                      d.avatar_url ||
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                    bio: "Vetted Executive Chauffeur assigned to your reservation itinerary with flawless defensive driving and hospitality protocol.",
                    tags: d.certifications?.length
                      ? d.certifications
                      : ["Vetted & Certified", "Discreet & Professional"],
                    isAssigned: true,
                  }
                : {
                    name: "Chauffeur Allocation In Progress",
                    badge: "ALLOCATION PENDING",
                    rating: 5.0,
                    trips: 0,
                    phone: "+234 814 031 3381",
                    avatar: "",
                    bio: "A vetted executive chauffeur is currently being assigned to your itinerary. Details and contact channels will activate prior to scheduled departure.",
                    tags: [
                      "Allocation In Progress",
                      "72-Point Inspection",
                      "Vetted Chauffeur Network",
                    ],
                    isAssigned: false,
                  },
            itinerary: {
              pickupDate: dbRecord.pickup_datetime
                ? new Date(dbRecord.pickup_datetime).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " WAT"
                : "Scheduled",
              returnDate: dbRecord.dropoff_datetime
                ? new Date(dbRecord.dropoff_datetime).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " WAT"
                : "Scheduled",
              duration: "Full Term Reserved",
              pickupLocation:
                dbRecord.pickup_location || "Victoria Island Flagship Hub",
              pickupAddress:
                dbRecord.pickup_location || "Victoria Island, Lagos",
              flightNumber: dbRecord.flight_number || undefined,
              flightRoute: dbRecord.flight_terminal || "MMIA Terminal 2",
              flightStatus: dbRecord.flight_number
                ? "Active Flight Tracking Linked"
                : "Ground Dispatch",
            },
          };

          setBooking(passData);
        } else if (localData) {
          // Fallback to active localStorage booking
            const isHubLocal =
              localData.handoverMode === "office" ||
              (localData.deliveryAddress &&
                (localData.deliveryAddress.toLowerCase().includes("hub") ||
                  localData.deliveryAddress.toLowerCase().includes("office"))) ||
              (localData.pickupLocation &&
                (localData.pickupLocation.toLowerCase().includes("hub") ||
                  localData.pickupLocation.toLowerCase().includes("office")));

            const passData: BookingPassData = {
              bookingCode: localData.bookingCode || targetCode || "LP-PRIME",
              reference: localData.reference || "LP_REF",
              verificationPin: localData.verificationPin || "8842-09",
              status: "confirmed",
              serviceTier:
                localData.serviceType === "self_drive"
                  ? "Executive Self-Drive"
                  : "Executive First Class",
              amountFormatted: localData.amountFormatted || "₦0",
              paidAt: localData.paidAt || "Confirmed",
              paidDate: localData.paidDate || "Recent",
              customerName:
                user?.name || localData.customerName || "Executive Client",
              customerPhone: user?.phone || localData.customerPhone || "",
              customerEmail: user?.email || localData.customerEmail || "",
              handoverProtocol: isHubLocal
                ? "Flagship Hub Collection"
                : localData.handoverMode === "delivery"
                  ? localData.includeChauffeur
                    ? "Direct Delivery with Chauffeur"
                    : "Direct Delivery (Self-Drive)"
                  : "Flagship Hub Collection",
              vehicle: {
                name: localData.vehicle || "Executive Fleet Vehicle",
                category: "First-Class Fleet",
                year: 2024,
                color: localData.vehicleColor || "Obsidian Black",
                licensePlate: "LP-PRIME",
                image:
                  localData.vehicleImage ||
                  "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
                amenities: [
                  { icon: "wifi", label: "High-Speed Starlink Wi-Fi" },
                  { icon: "wine_bar", label: "Chilled Refreshments" },
                  { icon: "volume_off", label: "Acoustic Privacy Glazing" },
                  {
                    icon: "airline_seat_recline_extra",
                    label: "First-Class Executive Seating",
                  },
                ],
              },
              driver: isHubLocal
                ? {
                    name: "Flagship Hub Concierge (Bay 01)",
                    badge: "VI-HUB-BAY01",
                    rating: 5.0,
                    trips: 0,
                    phone: "+234 814 031 3381",
                    avatar: "",
                    bio: "Your vehicle is pre-conditioned to 21°C, inspected, and staged at VIP Bay 01. Keys and vehicle will be handed over immediately upon scanning this digital pass.",
                    tags: [
                      "VIP Bay 01 Staging",
                      "72-Point Inspected",
                      "Express Handover",
                    ],
                    isAssigned: true,
                  }
                : {
                    name: "Chauffeur Allocation In Progress",
                    badge: "ALLOCATION PENDING",
                    rating: 5.0,
                    trips: 0,
                    phone: "+234 814 031 3381",
                    avatar: "",
                    bio: "A vetted executive chauffeur is currently being assigned to your itinerary. Details and contact channels will activate prior to scheduled departure.",
                    tags: [
                      "Allocation In Progress",
                      "72-Point Inspection",
                      "Vetted Chauffeur Network",
                    ],
                    isAssigned: false,
                  },
            itinerary: {
              pickupDate: localData.startDate
                ? new Date(localData.startDate).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " WAT"
                : "Scheduled",
              returnDate: localData.endDate
                ? new Date(localData.endDate).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " WAT"
                : "Scheduled",
              duration: `${localData.rentalDays || 3} Days Reserved`,
              pickupLocation:
                localData.deliveryAddress || "Victoria Island Flagship Hub",
              pickupAddress:
                localData.deliveryAddress || "Victoria Island, Lagos",
              flightNumber: localData.flightNumber || undefined,
              flightRoute: localData.flightTerminal || "MMIA Terminal 2",
              flightStatus: localData.flightNumber
                ? "Active Flight Tracking Linked"
                : "Ground Dispatch",
            },
          };

          setBooking(passData);
        } else {
          // No booking found anywhere
          setBooking(null);
        }
      } catch (err) {
        console.error("[ReservationPass] Error resolving live booking:", err);
        setBooking(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolveLiveBooking();
    return () => {
      isMounted = false;
    };
  }, [urlCode, user]);

  const handleCopyPin = () => {
    if (booking?.verificationPin && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(booking.verificationPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingNotice, setPingNotice] = useState<string | null>(null);

  const handlePingSim = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingNotice("Dispatching encrypted GSM ping to Chauffeur GPS SIM...");
    try {
      const res = await backendApi.pingTracker("TRK-892-SIM");
      if (res && res.success) {
        setPingNotice(
          `✓ Sent "WHERE#" ping to SIM ${res.simPhone || "+2348140313381"} (Africa's Talking ACK)`,
        );
      } else {
        setPingNotice(`Notice: ${res?.error || "Dispatched"}`);
      }
    } catch {
      setPingNotice("Ping request dispatched to telematics gateway.");
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingNotice(null), 6000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (!booking) return;
    try {
      setIsDownloadingPdf(true);
      await downloadVIPPassPDF(booking);
    } catch (err) {
      console.error("PDF generation notice, falling back to print:", err);
      handlePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const pdfPassUrl = booking
    ? `${originUrl}/api/reservation-pass/${booking.bookingCode}/pdf?pin=${encodeURIComponent(booking.verificationPin || "")}`
    : originUrl;

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(
    pdfPassUrl,
  )}`;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans">
        <Navbar />
        <main className="w-full pt-16 lg:pt-20 flex-1 flex flex-col items-center justify-center gap-4 py-24 px-4">
          <div className="w-12 h-12 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
          <p className="font-serif text-sm text-primary tracking-wide">
            Retrieving Live VIP Reservation Pass...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // No active booking found state
  if (!booking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
        <Navbar />
        <main className="w-full pt-16 lg:pt-20 flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full bg-surface-container-lowest border border-black/[0.06] rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">
                event_busy
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-secondary">
                VIP Reservation Portal
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                No Active Reservation Found
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                You do not currently have a confirmed vehicle charter or digital
                pass under this profile. Reserve a vehicle from our curated
                fleet or look up an existing itinerary reference code.
              </p>
            </div>

            {/* Quick Code Lookup Form */}
            <div className="w-full flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchCodeInput}
                  onChange={(e) =>
                    setSearchCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. LP-LOS-12345"
                  className="flex-1 h-11 px-3.5 rounded-xl bg-surface-container-low text-primary text-xs font-mono uppercase border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchCodeInput.trim()) {
                      window.location.href = `/reservation-pass?code=${encodeURIComponent(searchCodeInput.trim())}`;
                    }
                  }}
                  className="h-11 px-4 rounded-xl bg-primary text-white hover:bg-secondary text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
                >
                  Lookup
                </button>
              </div>
            </div>

            <div className="w-full pt-2 border-t border-black/[0.04]">
              <Link
                href="/fleet"
                className="w-full py-3.5 px-6 rounded-xl bg-secondary hover:bg-secondary/90 text-primary-fixed font-semibold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  directions_car
                </span>
                <span>Explore Executive Fleet</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Detect if this is an office / hub collection
  const isHubPickup = booking
    ? booking.handoverProtocol.toLowerCase().includes("hub") ||
      booking.handoverProtocol.toLowerCase().includes("office") ||
      booking.itinerary.pickupLocation.toLowerCase().includes("hub") ||
      booking.itinerary.pickupLocation.toLowerCase().includes("office") ||
      booking.serviceTier.toLowerCase().includes("self-drive") ||
      booking.serviceTier.toLowerCase().includes("office")
    : false;

  // Active Confirmed Booking Pass View (Warm Alabaster & White Luxury Light Theme)
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-secondary-fixed selection:text-primary">
      {/* Print Specific Clean CSS */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header, footer, nav, .no-print {
            display: none !important;
          }
          .print-clean {
            border: 1px solid #d4af37 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Navbar />
      </div>

      <main className="w-full pt-16 lg:pt-20 pb-28 lg:pb-16 flex-1">
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {/* Top Status Notification Banner */}
          <div className="w-full rounded-2xl bg-surface-container-lowest border border-black/[0.06] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Payment Settled (100%)
              </span>
              <span className="text-outline-variant hidden sm:inline">•</span>
              <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-secondary">
                  {isHubPickup ? "storefront" : "badge"}
                </span>
                {isHubPickup
                  ? "Flagship Hub Collection • Bay 01 Staged"
                  : booking.driver.isAssigned
                    ? "Chauffeur Assigned"
                    : "Chauffeur Allocation In Progress"}
              </span>
              <span className="text-outline-variant hidden sm:inline">•</span>
              <span className="text-xs font-mono text-secondary bg-surface-container-low px-2.5 py-1 rounded-md border border-surface-container font-semibold">
                Pass #{booking.bookingCode}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearchDrawer(!showSearchDrawer)}
                type="button"
                className="no-print inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-black/[0.04] transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  search
                </span>
                <span>Switch Pass</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-base">
                  verified
                </span>
                <span className="hidden md:inline">
                  Private Handover Cleared
                </span>
              </div>
            </div>
          </div>

          {/* Quick Search Drawer (Collapsible) */}
          {showSearchDrawer && (
            <div className="no-print p-4 rounded-xl bg-surface-container-lowest border border-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="material-symbols-outlined text-secondary text-lg">
                  manage_search
                </span>
                <span className="text-xs text-on-surface font-medium">
                  Lookup Reservation Reference:
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchCodeInput}
                  onChange={(e) =>
                    setSearchCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. LP-LOS-12345"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container text-primary text-xs font-mono focus:outline-none focus:border-secondary w-full sm:w-44"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchCodeInput.trim()) {
                      window.location.href = `/reservation-pass?code=${encodeURIComponent(searchCodeInput.trim())}`;
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs uppercase tracking-wider hover:bg-secondary transition-colors shrink-0"
                >
                  Load Pass
                </button>
              </div>
            </div>
          )}

          {/* Editorial Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-base">
                  hotel_class
                </span>
                <span className="text-[11px] uppercase tracking-widest text-secondary font-bold">
                  VIP Guest Reservation
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-primary tracking-tight font-bold">
                Booking Confirmation &amp; Digital Handover Pass
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs uppercase tracking-wider text-on-surface-variant">
                Service Tier:
              </span>
              <span className="px-3 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase tracking-wider shadow-sm">
                {booking.serviceTier}
              </span>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden no-print flex items-center justify-between p-1 bg-surface-container-low rounded-xl border border-black/[0.06]">
            <button
              onClick={() => setActiveMobileTab("all")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeMobileTab === "all"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              All Overview
            </button>
            <button
              onClick={() => setActiveMobileTab("pass")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeMobileTab === "pass"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                qr_code_2
              </span>
              <span>QR Voucher</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("vehicle")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeMobileTab === "vehicle"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                directions_car
              </span>
              <span>{isHubPickup ? "Asset & Hub" : "Asset & Driver"}</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("itinerary")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeMobileTab === "itinerary"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                calendar_month
              </span>
              <span>Itinerary</span>
            </button>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Digital Scannable Pass, Quick Actions, Chauffeur Profile */}
            <div
              className={`lg:col-span-7 flex flex-col gap-6 ${
                activeMobileTab !== "all" &&
                activeMobileTab !== "pass" &&
                activeMobileTab !== "vehicle"
                  ? "hidden lg:flex"
                  : "flex"
              }`}
            >
              {/* Luxury Boarding Pass Card */}
              {(activeMobileTab === "all" || activeMobileTab === "pass") && (
                <div className="relative rounded-3xl bg-surface-container-lowest border border-black/[0.08] shadow-sm p-6 sm:p-8 flex flex-col gap-6 overflow-hidden print-clean">
                  {/* Luxury Top Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary via-secondary-fixed to-secondary"></div>

                  {/* Header of the Pass */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
                          VIP Handover Voucher
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-mono">
                          SEC-256 ENCRYPTED
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl text-primary font-bold tracking-tight">
                        Digital Handover Voucher
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-surface-container text-xs text-on-surface font-medium">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      {booking.handoverProtocol}
                    </span>
                  </div>

                  {/* Digital Scannable QR Container */}
                  <div className="rounded-2xl bg-surface-container-low border border-surface-container p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 relative">
                    {/* QR Code Container */}
                    <div className="relative group shrink-0">
                      <div
                        onClick={() => setShowQrModal(true)}
                        className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-md border border-black/[0.06] cursor-pointer hover:ring-4 hover:ring-secondary/30 transition-all relative overflow-hidden"
                        title="Click to expand fullscreen for scanner"
                      >
                        {!qrImgError ? (
                          <img
                            src={qrCodeApiUrl}
                            alt="Scannable Handover QR Code"
                            onError={() => setQrImgError(true)}
                            className="w-full h-full object-contain"
                            suppressHydrationWarning
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-500">
                            <span className="material-symbols-outlined text-5xl">
                              qr_code_2
                            </span>
                            <span className="text-[10px] font-mono">
                              QR OFFLINE READY
                            </span>
                          </div>
                        )}

                        {/* Center Monogram Emblem */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-secondary-fixed border-2 border-secondary flex items-center justify-center font-serif font-black text-xs shadow-md">
                          LP
                        </div>
                      </div>

                      {/* Tap to Enlarge Badge */}
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="no-print w-full mt-2 py-1 px-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high border border-black/[0.06] text-on-surface text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs text-secondary">
                          fullscreen
                        </span>
                        <span>Tap to Enlarge QR</span>
                      </button>
                    </div>

                    {/* PIN & Security Protocol Details */}
                    <div className="flex flex-col gap-3 text-center sm:text-left flex-1">
                      <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                        Reservation QR &amp; Verification PIN
                      </span>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-surface-container-lowest border border-secondary/30 px-4 py-2 rounded-xl shadow-sm">
                          <span className="font-mono text-2xl font-bold text-primary tracking-widest">
                            #{booking.bookingCode}
                          </span>
                          <span className="material-symbols-outlined text-secondary text-lg">
                            qr_code_scanner
                          </span>
                        </div>

                        {/* Copyable PIN Button */}
                        <button
                          type="button"
                          onClick={handleCopyPin}
                          className="px-3 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-surface-container text-xs font-mono text-primary flex items-center gap-1.5 transition-colors group shadow-sm"
                          title="Click to copy Verification PIN"
                        >
                          <span className="text-secondary font-bold">PIN:</span>
                          <span className="font-bold text-primary">
                            {booking.verificationPin}
                          </span>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary">
                            {copiedPin ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>

                      {copiedPin && (
                        <p className="text-xs text-emerald-700 font-medium animate-in fade-in">
                          ✓ Verification PIN copied to clipboard
                        </p>
                      )}

                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {isHubPickup
                          ? "Present this QR pass upon arrival at the La Planta Flagship Hub (VIP Bay 01). Our concierge team will scan your encrypted token to authenticate your itinerary and release your vehicle keys."
                          : "Present this QR pass upon arrival at the hotel forecourt or private airport terminal. Your assigned chauffeur will scan the token at vehicle handover to authenticate your itinerary."}
                      </p>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-emerald-700 text-sm">
                          verified_user
                        </span>
                        <span>
                          {isHubPickup
                            ? "VIP Hub Collection Cleared • Dedicated Bay 01 Staging"
                            : "VIP Handover Protocol Cleared • Zero Forecourt Wait"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {!isHubPickup ? (
                      <Link
                        href={`/live-tracking?code=${booking.bookingCode}`}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">
                          near_me
                        </span>
                        <span>Track Live Telematics</span>
                      </Link>
                    ) : (
                      <a
                        href="https://maps.google.com/?q=Plot+14+Victoria+Island+Boulevard+Lagos"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md"
                      >
                        <span className="material-symbols-outlined text-base text-secondary-fixed">
                          directions
                        </span>
                        <span>Directions to Flagship Hub</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-black/[0.08] text-primary font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">
                        {isDownloadingPdf ? "sync" : "picture_as_pdf"}
                      </span>
                      <span>
                        {isDownloadingPdf
                          ? "Generating PDF Pass..."
                          : "Download Luxury PDF Pass"}
                      </span>
                    </button>
                  </div>

                  {/* Real-time Ping Alert Banner */}
                  {pingNotice && (
                    <div className="no-print mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-700 animate-pulse">
                          satellite_alt
                        </span>
                        <span>{pingNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPingNotice(null)}
                        className="text-emerald-800 hover:text-black text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned Professional Chauffeur Profile Card or Flagship Hub Collection Protocol */}
              {(activeMobileTab === "all" || activeMobileTab === "vehicle") && (
                isHubPickup ? (
                  <div className="rounded-3xl bg-surface-container-lowest border border-black/[0.08] p-6 sm:p-7 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
                          Handover &amp; Collection Protocol
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl text-primary font-bold">
                          Flagship Hub Collection
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <span className="material-symbols-outlined text-xs">
                          verified
                        </span>
                        BAY 01 READY
                      </span>
                    </div>

                    {/* Elegant Hub Staging Card */}
                    <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                      <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">
                          storefront
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <h4 className="font-serif text-base font-bold text-primary">
                            La Planta Flagship Lounge • VIP Staging Bay 01
                          </h4>
                          <span className="text-[11px] font-mono font-semibold text-secondary">
                            Plot 14 Victoria Island
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Your vehicle has been detailed, pre-conditioned to 21°C, and staged at dedicated VIP Bay 01. Please present this digital QR pass and valid identification to the concierge upon your arrival for immediate key handover.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-2 justify-center sm:justify-start">
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-black/[0.06] text-[11px] text-primary font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-emerald-600">
                              check_circle
                            </span>
                            Vehicle Sanitized &amp; Pre-inspected
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-black/[0.06] text-[11px] text-primary font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-secondary">
                              key
                            </span>
                            Contactless Key Release
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-black/[0.06] text-[11px] text-primary font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-secondary">
                              schedule
                            </span>
                            24/7 Priority Express Handover
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="no-print pt-2 flex flex-col sm:flex-row gap-3">
                      <a
                        href="https://maps.google.com/?q=Plot+14+Victoria+Island+Boulevard+Lagos"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-black/[0.06] text-primary font-semibold text-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-secondary">
                          directions
                        </span>
                        <span>Directions to Flagship Hub</span>
                      </a>
                      <a
                        href="https://wa.me/23418885275?text=Hello%20La%20Planta%20Concierge,%20I%20am%20arriving%20at%20the%20Flagship%20Hub%20for%20pickup"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-black/[0.06] text-primary font-semibold text-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-secondary">
                          support_agent
                        </span>
                        <span>Notify Hub Concierge</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-surface-container-lowest border border-black/[0.08] p-6 sm:p-7 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
                          Chauffeur Allocation Status
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl text-primary font-bold">
                          {booking.driver.isAssigned
                            ? "Executive Chauffeur Profile"
                            : "Chauffeur Allocation In Progress"}
                        </h2>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.driver.isAssigned
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "bg-secondary-fixed/50 border border-secondary/30 text-secondary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {booking.driver.isAssigned ? "verified" : "schedule"}
                        </span>
                        {booking.driver.isAssigned
                          ? "ON SCHEDULE"
                          : "IN PROGRESS"}
                      </span>
                    </div>

                    {booking.driver.isAssigned ? (
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                        <div className="relative shrink-0">
                          <img
                            src={booking.driver.avatar}
                            alt={booking.driver.name}
                            className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl object-cover shadow-md border border-black/[0.06]"
                          />
                          <span className="absolute -bottom-2 -right-2 bg-primary text-secondary-fixed text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-md">
                            {booking.driver.badge}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                            <h3 className="font-serif text-lg sm:text-xl text-primary font-bold">
                              {booking.driver.name}
                            </h3>
                            <div className="flex items-center justify-center sm:justify-start gap-1 text-secondary">
                              <span
                                className="material-symbols-outlined text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              <span className="font-bold text-primary text-xs">
                                {booking.driver.rating}
                              </span>
                              <span className="text-on-surface-variant text-xs">
                                ({booking.driver.trips}+ completed trips)
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {booking.driver.bio}
                          </p>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                            {booking.driver.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-full bg-surface-container-low border border-surface-container text-[11px] text-on-surface-variant font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Elegant Allocation In Progress Card */
                      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl animate-spin">
                            progress_activity
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h4 className="font-serif text-base font-bold text-primary">
                            Assigning Your Executive Chauffeur
                          </h4>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {booking.driver.bio}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                            <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                verified
                              </span>
                              Background-checked &amp; vetted driver protocol
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="no-print pt-2 flex flex-col sm:flex-row gap-3">
                      {booking.driver.isAssigned ? (
                        <a
                          href={`tel:${booking.driver.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-black/[0.06] text-primary font-semibold text-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm text-secondary">
                            call
                          </span>
                          <span>Call Chauffeur Directly</span>
                        </a>
                      ) : (
                        <a
                          href="https://wa.me/23418885275"
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-black/[0.06] text-primary font-semibold text-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm text-secondary">
                            support_agent
                          </span>
                          <span>Contact Executive Dispatch Desk</span>
                        </a>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Right Column: Designated Fleet Asset & Itinerary Logistics */}
            <div
              className={`lg:col-span-5 flex flex-col gap-6 ${
                activeMobileTab !== "all" &&
                activeMobileTab !== "vehicle" &&
                activeMobileTab !== "itinerary"
                  ? "hidden lg:flex"
                  : "flex"
              }`}
            >
              {/* Designated Fleet Asset Card */}
              {(activeMobileTab === "all" || activeMobileTab === "vehicle") && (
                <div className="rounded-3xl bg-surface-container-lowest border border-black/[0.08] p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
                        Designated Fleet Asset
                      </span>
                      <h2 className="font-serif text-lg sm:text-xl text-primary font-bold">
                        {booking.vehicle.name}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
                      FIRST CLASS SPEC
                    </span>
                  </div>

                  {/* Vehicle Picture Reference */}
                  <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden shadow-sm border border-black/[0.06] group">
                    <img
                      src={booking.vehicle.image}
                      alt={booking.vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="bg-primary/80 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs border border-white/10 font-mono">
                        {booking.vehicle.color} • {booking.vehicle.licensePlate}
                      </div>
                      <span className="text-[10px] text-white bg-black/40 backdrop-blur-md px-2 py-1 rounded-md uppercase font-semibold">
                        Model {booking.vehicle.year}
                      </span>
                    </div>
                  </div>

                  {/* Cabin Amenities Grid */}
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Executive In-Cabin Amenities
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {booking.vehicle.amenities.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-xs"
                        >
                          <span className="material-symbols-outlined text-secondary text-base shrink-0">
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reservation & Trip Summary Card */}
              {(activeMobileTab === "all" ||
                activeMobileTab === "itinerary") && (
                <div className="rounded-3xl bg-surface-container-lowest border border-black/[0.08] p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <h2 className="font-serif text-lg sm:text-xl text-primary font-bold">
                      Reservation &amp; Trip Summary
                    </h2>
                    <span className="material-symbols-outlined text-secondary">
                      calendar_month
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 text-xs">
                    {/* Dates / Timeline */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
                      <div className="p-2 rounded-lg bg-secondary-fixed/50 text-secondary shrink-0">
                        <span className="material-symbols-outlined text-base">
                          calendar_today
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Handover Schedule
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {booking.itinerary.pickupDate}
                        </span>
                        <span className="text-[11px] text-secondary mt-0.5 font-medium">
                          Return: {booking.itinerary.returnDate} (
                          {booking.itinerary.duration})
                        </span>
                      </div>
                    </div>

                    {/* Flight Details (if applicable) */}
                    {booking.itinerary.flightNumber && (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                          <span className="material-symbols-outlined text-base">
                            flight
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                            Flight Arrival Connection
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">
                              {booking.itinerary.flightNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[10px] text-on-surface font-mono">
                              {booking.itinerary.flightRoute}
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-800 mt-0.5 font-medium">
                            {booking.itinerary.flightStatus}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Destination */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                        <span className="material-symbols-outlined text-base">
                          location_on
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Handover Destination
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {booking.itinerary.pickupLocation}
                        </span>
                        <span className="text-[11px] text-on-surface-variant mt-0.5">
                          {booking.itinerary.pickupAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 24/7 Concierge Support Callout */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-on-surface text-xs">
                      <span className="material-symbols-outlined text-secondary text-base">
                        support_agent
                      </span>
                      <span>Need changes to your itinerary?</span>
                    </div>
                    <a
                      href="https://wa.me/23418885275"
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary hover:text-primary font-semibold text-xs whitespace-nowrap"
                    >
                      +234 814 031 3381
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Bottom Quick Bar */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 lg:hidden p-3 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-black/[0.06] shadow-lg flex items-center justify-between gap-3 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
            Pass #{booking.bookingCode}
          </span>
          <span className="text-xs text-primary font-mono font-bold">
            PIN: {booking.verificationPin}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            type="button"
            className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold flex items-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm text-secondary">
              qr_code_2
            </span>
            <span>QR Pass</span>
          </button>
          {!isHubPickup ? (
            <Link
              href={`/live-tracking?code=${booking.bookingCode}`}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">near_me</span>
              <span>Track</span>
            </Link>
          ) : (
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-sm text-secondary-fixed">
                picture_as_pdf
              </span>
              <span>PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="no-print">
        <Footer />
      </div>

      {/* Fullscreen High-Contrast QR Scanner Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-surface-container-lowest border border-black/[0.08] p-6 sm:p-8 flex flex-col items-center gap-5 shadow-2xl text-center">
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-primary rounded-full bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <span className="text-[11px] uppercase tracking-widest text-secondary font-bold">
              VIP Handover Terminal Scanner
            </span>

            {/* Oversized High-Contrast White Box */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-2xl p-4 shadow-md border border-black/[0.06] flex items-center justify-center relative">
              <img
                src={qrCodeApiUrl}
                alt="Fullscreen Scannable Handover QR Code"
                className="w-full h-full object-contain"
                suppressHydrationWarning
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-secondary-fixed border-2 border-secondary flex items-center justify-center font-serif font-black text-sm shadow-xl">
                LP
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="font-mono text-xl font-bold text-primary tracking-widest">
                #{booking.bookingCode}
              </div>
              <div className="text-xs text-secondary font-mono font-bold">
                Verification PIN: {booking.verificationPin}
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
              {isHubPickup
                ? "Present this high-contrast screen directly to the Flagship Hub concierge at VIP Bay 01."
                : "Present this high-contrast screen directly to your chauffeur or security personnel at handover."}
            </p>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator
                    .share({
                      title: `La Planta VIP Pass #${booking.bookingCode}`,
                      url: window.location.href,
                    })
                    .catch(() => {});
                } else {
                  handleCopyPin();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-xs uppercase tracking-wider hover:bg-secondary transition-colors"
            >
              Share / Copy Pass Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
            <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
              Loading VIP Digital Pass...
            </span>
          </div>
        </div>
      }
    >
      <AuthGuard
        fallbackTitle="Executive Itinerary Portal"
        fallbackDescription="Please sign in or register with your executive credentials to view your digital handover voucher, assigned chauffeur, and itinerary."
      >
        <ReservationPassContent />
      </AuthGuard>
    </Suspense>
  );
}
