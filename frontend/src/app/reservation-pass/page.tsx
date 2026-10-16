"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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
  };
  itinerary: {
    pickupDate: string;
    returnDate: string;
    duration: string;
    pickupLocation: string;
    pickupAddress: string;
    flightNumber: string;
    flightRoute: string;
    flightStatus: string;
  };
}

const DEFAULT_BOOKING: BookingPassData = {
  bookingCode: "LP-8842",
  reference: "LP_BK_8842_LAGOS",
  verificationPin: "8842-09",
  status: "confirmed",
  serviceTier: "Executive First Class",
  amountFormatted: "₦1,860,000",
  paidAt: "17:30 WAT",
  paidDate: "Today",
  customerName: "VIP Charter Guest",
  customerPhone: "+234 803 123 4567",
  customerEmail: "guest@laplanta.com",
  handoverProtocol: "Terminal & Forecourt Cleared",
  vehicle: {
    name: "Range Rover Autobiography LWB",
    category: "Flagship First-Class SUV",
    year: 2024,
    color: "Santorini Black",
    licensePlate: "LAG 892 XZ",
    image:
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      { icon: "wifi", label: "High-Speed Starlink Wi-Fi" },
      { icon: "wine_bar", label: "Chilled Refreshments & Water" },
      { icon: "volume_off", label: "Acoustic Privacy Glazing" },
      {
        icon: "airline_seat_recline_extra",
        label: "Executive Massaging Seats",
      },
    ],
  },
  driver: {
    name: "Mr. Emmanuel Okafor",
    badge: "CHAUFFEUR #409",
    rating: 4.98,
    trips: 340,
    phone: "+23418885275",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    bio: "Senior Executive Chauffeur with 12 years of white-glove luxury hospitality service across premium Nigerian executive itineraries. Flawless protocol record.",
    tags: [
      "Master Chauffeur Certified",
      "Executive Etiquette",
      "Discreet & Bilingual (EN/FR)",
      "Airside VIP Escort",
    ],
  },
  itinerary: {
    pickupDate: "Nov 14, 2026 at 17:30 WAT",
    returnDate: "Nov 17, 2026 at 17:30 WAT",
    duration: "3 Full Days Reserved",
    pickupLocation: "The Wheatbaker Hotel",
    pickupAddress: "4 Onitolo Rd, Ikoyi, Lagos (Valet Forecourt)",
    flightNumber: "British Airways BA 075",
    flightRoute: "LHR → LOS",
    flightStatus: "On Schedule • Chauffeur at VIP Arrivals",
  },
};

function ReservationPassContent() {
  const searchParams = useSearchParams();
  const urlCode =
    searchParams.get("booking") ||
    searchParams.get("code") ||
    searchParams.get("id");

  const [booking, setBooking] = useState<BookingPassData>(DEFAULT_BOOKING);
  const [loading, setLoading] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [searchCodeInput, setSearchCodeInput] = useState("");
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<
    "pass" | "vehicle" | "itinerary" | "all"
  >("all");
  const [qrImgError, setQrImgError] = useState(false);

  // Load from URL, LocalStorage or Supabase
  useEffect(() => {
    async function resolveBooking() {
      const targetCode = urlCode || "LP-8842";
      setSearchCodeInput(targetCode);

      // Check localStorage first
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("laplanta_active_booking");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!urlCode || parsed.bookingCode === urlCode) {
              setBooking((prev) => ({
                ...prev,
                bookingCode: parsed.bookingCode || prev.bookingCode,
                reference: parsed.reference || prev.reference,
                verificationPin: parsed.verificationPin || prev.verificationPin,
                amountFormatted: parsed.amountFormatted || prev.amountFormatted,
                customerName: parsed.customerName || prev.customerName,
                customerPhone: parsed.customerPhone || prev.customerPhone,
                customerEmail: parsed.customerEmail || prev.customerEmail,
                vehicle: {
                  ...prev.vehicle,
                  name: parsed.vehicle || prev.vehicle.name,
                  color: parsed.vehicleColor || prev.vehicle.color,
                  image: parsed.vehicleImage || prev.vehicle.image,
                },
                itinerary: {
                  ...prev.itinerary,
                  pickupAddress:
                    parsed.deliveryAddress || prev.itinerary.pickupAddress,
                  flightNumber:
                    parsed.flightNumber || prev.itinerary.flightNumber,
                  duration: `${parsed.rentalDays || 3} Full Days Reserved`,
                },
              }));
            }
          }
        } catch (e) {
          console.warn("Failed reading localStorage booking:", e);
        }
      }

      // Try fetching live record from Supabase
      try {
        setLoading(true);
        const { data: dbBooking, error } = await supabase
          .from("bookings")
          .select(
            `
            *,
            vehicles:vehicle_id (*),
            drivers:driver_id (*)
          `,
          )
          .eq("booking_reference", targetCode)
          .maybeSingle();

        if (!error && dbBooking) {
          const v = dbBooking.vehicles;
          const d = dbBooking.drivers;

          setBooking((prev) => ({
            ...prev,
            bookingCode: dbBooking.booking_reference || prev.bookingCode,
            reference: dbBooking.payment_reference || prev.reference,
            verificationPin: dbBooking.verification_pin || prev.verificationPin,
            amountFormatted: dbBooking.total_amount_ngn
              ? `₦${Number(dbBooking.total_amount_ngn).toLocaleString()}`
              : prev.amountFormatted,
            serviceTier:
              dbBooking.service_type === "diplomatic_escort"
                ? "Diplomatic Armored Escort"
                : "Executive First Class",
            vehicle: v
              ? {
                  id: v.id,
                  name: `${v.brand} ${v.model}`,
                  category: v.category || prev.vehicle.category,
                  year: v.year || prev.vehicle.year,
                  color: v.color || prev.vehicle.color,
                  licensePlate: v.license_plate || prev.vehicle.licensePlate,
                  image:
                    v.hero_image_url ||
                    v.gallery_image_urls?.[0] ||
                    prev.vehicle.image,
                  amenities: prev.vehicle.amenities,
                }
              : prev.vehicle,
            driver: d
              ? {
                  id: d.id,
                  name: d.full_name || prev.driver.name,
                  badge: d.badge_number || prev.driver.badge,
                  rating: d.rating || prev.driver.rating,
                  trips: d.total_trips || prev.driver.trips,
                  phone: d.phone || prev.driver.phone,
                  avatar: d.avatar_url || prev.driver.avatar,
                  bio: prev.driver.bio,
                  tags: d.certifications?.length
                    ? d.certifications
                    : prev.driver.tags,
                }
              : prev.driver,
            itinerary: {
              ...prev.itinerary,
              pickupLocation:
                dbBooking.pickup_location || prev.itinerary.pickupLocation,
              pickupAddress:
                dbBooking.pickup_location || prev.itinerary.pickupAddress,
              pickupDate: dbBooking.pickup_datetime
                ? new Date(dbBooking.pickup_datetime).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " WAT"
                : prev.itinerary.pickupDate,
              returnDate: dbBooking.dropoff_datetime
                ? new Date(dbBooking.dropoff_datetime).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }) + " WAT"
                : prev.itinerary.returnDate,
              flightNumber:
                dbBooking.flight_number || prev.itinerary.flightNumber,
            },
          }));
        }
      } catch (err) {
        console.warn("Supabase booking lookup notice:", err);
      } finally {
        setLoading(false);
      }
    }

    resolveBooking();
  }, [urlCode]);

  const handleCopyPin = () => {
    if (typeof navigator !== "undefined") {
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

  const [originUrl, setOriginUrl] = useState("https://laplantaprime.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const handoverInspectionUrl = `${originUrl}/handover-inspection?code=${booking.bookingCode}&pin=${booking.verificationPin}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(
    handoverInspectionUrl,
  )}`;

  return (
    <div className="min-h-screen bg-[#040505] text-stone-200 flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      {/* Print Specific CSS */}
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
            border: 2px solid #000000 !important;
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
          <div className="w-full rounded-2xl bg-[#0c1017] border border-white/[0.08] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Payment Settled (100%)
              </span>
              <span className="text-stone-500 hidden sm:inline">•</span>
              <span className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#d4af37]">
                  badge
                </span>
                Chauffeur Scheduled
              </span>
              <span className="text-stone-500 hidden sm:inline">•</span>
              <span className="text-xs font-mono text-[#fedeb2] bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.08]">
                Pass #{booking.bookingCode}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearchDrawer(!showSearchDrawer)}
                type="button"
                className="no-print inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  search
                </span>
                <span>Switch Pass</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className="material-symbols-outlined text-[#d4af37] text-base">
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
            <div className="no-print p-4 rounded-xl bg-[#0c1017] border border-[#d4af37]/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="material-symbols-outlined text-[#d4af37] text-lg">
                  manage_search
                </span>
                <span className="text-xs text-stone-300 font-medium">
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
                  placeholder="e.g. LP-8842"
                  className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-[#d4af37] w-full sm:w-44"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchCodeInput.trim()) {
                      window.location.href = `/reservation-pass?code=${encodeURIComponent(searchCodeInput.trim())}`;
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#fedeb2] transition-colors shrink-0"
                >
                  Load Pass
                </button>
              </div>
            </div>
          )}

          {/* Editorial Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#d4af37] text-base">
                  hotel_class
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[#d4af37] font-bold">
                  VIP Guest Reservation
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white tracking-tight font-bold">
                Booking Confirmation &amp; Digital Handover Pass
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs uppercase tracking-wider text-stone-400">
                Service Tier:
              </span>
              <span className="px-3 py-1 rounded-md bg-[#d4af37] text-black text-xs font-bold uppercase tracking-wider shadow-sm">
                {booking.serviceTier}
              </span>
            </div>
          </div>

          {/* Mobile Tab Switcher (Visible only on mobile/tablet) */}
          <div className="lg:hidden no-print flex items-center justify-between p-1 bg-[#0c1017] rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setActiveMobileTab("all")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeMobileTab === "all"
                  ? "bg-[#d4af37] text-black shadow-md font-bold"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              All Overview
            </button>
            <button
              onClick={() => setActiveMobileTab("pass")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeMobileTab === "pass"
                  ? "bg-[#d4af37] text-black shadow-md font-bold"
                  : "text-stone-400 hover:text-white"
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
                  ? "bg-[#d4af37] text-black shadow-md font-bold"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                directions_car
              </span>
              <span>Asset &amp; Driver</span>
            </button>
            <button
              onClick={() => setActiveMobileTab("itinerary")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeMobileTab === "itinerary"
                  ? "bg-[#d4af37] text-black shadow-md font-bold"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">flight</span>
              <span>Itinerary</span>
            </button>
          </div>

          {/* Main 2-Column Responsive Layout (7 Cols / 5 Cols on desktop) */}
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
                <div className="relative rounded-3xl bg-gradient-to-b from-[#101520] to-[#0a0d14] border border-white/[0.1] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 overflow-hidden print-clean">
                  {/* Subtle Luxury Top Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#d4af37] via-[#fedeb2] to-[#d4af37]"></div>

                  {/* Perforated ticket cutouts (Left & Right) */}
                  <div className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#040505] border-r border-white/[0.1]"></div>
                  <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#040505] border-l border-white/[0.1]"></div>

                  {/* Header of the Pass */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                          VIP Handover Voucher
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                          SEC-256 ENCRYPTED
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl text-white font-bold tracking-tight">
                        Digital Handover Voucher
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-stone-300">
                      <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                      {booking.handoverProtocol}
                    </span>
                  </div>

                  {/* Digital Scannable QR Container */}
                  <div className="rounded-2xl bg-black/50 border border-white/[0.08] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 relative">
                    {/* QR Code Container with High-Contrast Background */}
                    <div className="relative group shrink-0">
                      <div
                        onClick={() => setShowQrModal(true)}
                        className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-2xl cursor-pointer hover:ring-4 hover:ring-[#d4af37]/50 transition-all relative overflow-hidden"
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
                          /* High-Resolution SVG Fallback Pattern if offline */
                          <svg
                            className="w-full h-full text-black fill-current"
                            viewBox="0 0 160 160"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              fill="#000000"
                              height="46"
                              rx="6"
                              width="46"
                              x="0"
                              y="0"
                            ></rect>
                            <rect
                              fill="#FFFFFF"
                              height="32"
                              rx="4"
                              width="32"
                              x="7"
                              y="7"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="18"
                              width="18"
                              x="14"
                              y="14"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="46"
                              rx="6"
                              width="46"
                              x="114"
                              y="0"
                            ></rect>
                            <rect
                              fill="#FFFFFF"
                              height="32"
                              rx="4"
                              width="32"
                              x="121"
                              y="7"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="18"
                              width="18"
                              x="128"
                              y="14"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="46"
                              rx="6"
                              width="46"
                              x="0"
                              y="114"
                            ></rect>
                            <rect
                              fill="#FFFFFF"
                              height="32"
                              rx="4"
                              width="32"
                              x="7"
                              y="121"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="18"
                              width="18"
                              x="14"
                              y="128"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="58"
                              y="8"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="74"
                              y="8"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="90"
                              y="8"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="58"
                              y="24"
                            ></rect>
                            <rect
                              fill="#d4af37"
                              height="10"
                              rx="2"
                              width="10"
                              x="74"
                              y="24"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="90"
                              y="24"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="8"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="24"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="40"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="56"
                              y="58"
                            ></rect>
                            <rect
                              fill="#d4af37"
                              height="16"
                              rx="3"
                              width="16"
                              x="72"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="94"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="110"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="126"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="142"
                              y="58"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="8"
                              y="74"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="24"
                              y="74"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="40"
                              y="74"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="94"
                              y="74"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="110"
                              y="74"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="142"
                              y="74"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="8"
                              y="90"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="24"
                              y="90"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="56"
                              y="90"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="72"
                              y="90"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="88"
                              y="90"
                            ></rect>
                            <rect
                              fill="#000000"
                              height="10"
                              rx="2"
                              width="10"
                              x="126"
                              y="90"
                            ></rect>
                          </svg>
                        )}

                        {/* Center Monogram Emblem */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black text-[#d4af37] border-2 border-[#d4af37] flex items-center justify-center font-serif font-black text-xs shadow-md">
                          LP
                        </div>
                      </div>

                      {/* Tap to Enlarge Badge */}
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="no-print w-full mt-2 py-1 px-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-stone-300 text-[11px] flex items-center justify-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs text-[#d4af37]">
                          fullscreen
                        </span>
                        <span>Tap to Enlarge QR</span>
                      </button>
                    </div>

                    {/* PIN & Security Protocol Details */}
                    <div className="flex flex-col gap-3 text-center sm:text-left flex-1">
                      <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold">
                        Reservation QR &amp; Verification PIN
                      </span>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="inline-flex items-center gap-2 bg-[#141b26] border border-white/[0.1] px-4 py-2 rounded-xl shadow-inner">
                          <span className="font-mono text-2xl font-bold text-white tracking-widest">
                            #{booking.bookingCode}
                          </span>
                          <span className="material-symbols-outlined text-[#d4af37] text-lg">
                            qr_code_scanner
                          </span>
                        </div>

                        {/* Copyable PIN Button */}
                        <button
                          type="button"
                          onClick={handleCopyPin}
                          className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-stone-200 flex items-center gap-1.5 transition-colors group"
                          title="Click to copy Verification PIN"
                        >
                          <span className="text-[#d4af37] font-bold">PIN:</span>
                          <span className="font-bold text-white">
                            {booking.verificationPin}
                          </span>
                          <span className="material-symbols-outlined text-sm text-stone-400 group-hover:text-white">
                            {copiedPin ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>

                      {copiedPin && (
                        <p className="text-xs text-emerald-400 font-medium animate-in fade-in">
                          ✓ Verification PIN copied to clipboard
                        </p>
                      )}

                      <p className="text-xs text-stone-400 leading-relaxed">
                        Present this QR pass upon arrival at the hotel forecourt
                        or private airport terminal. Your assigned chauffeur
                        will scan the token at vehicle handover to authenticate
                        your itinerary.
                      </p>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-stone-400">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">
                          verified_user
                        </span>
                        <span>
                          VIP Handover Protocol Cleared • Zero Forecourt Wait
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Link
                      href={`/live-tracking?code=${booking.bookingCode}`}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#d4af37] hover:bg-[#fedeb2] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#d4af37]/15 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">
                        near_me
                      </span>
                      <span>Track Chauffeur Live</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-[#fedeb2] hover:text-white font-semibold text-xs transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base text-[#d4af37]">
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
                    <div className="no-print mt-3 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-400 animate-pulse">
                          satellite_alt
                        </span>
                        <span>{pingNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPingNotice(null)}
                        className="text-emerald-400 hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned Professional Chauffeur Profile Card */}
              {(activeMobileTab === "all" || activeMobileTab === "vehicle") && (
                <div className="rounded-3xl bg-[#0c1017] border border-white/[0.08] p-6 sm:p-7 shadow-xl flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                        Assigned Professional Chauffeur
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl text-white font-bold">
                        Executive Chauffeur Profile
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <span className="material-symbols-outlined text-xs">
                        verified
                      </span>
                      ON SCHEDULE
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                    <div className="relative shrink-0">
                      <img
                        src={booking.driver.avatar}
                        alt={booking.driver.name}
                        className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl object-cover shadow-xl border border-white/[0.1]"
                      />
                      <span className="absolute -bottom-2 -right-2 bg-black text-[#d4af37] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#d4af37]/40 shadow-lg">
                        {booking.driver.badge}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 flex-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h3 className="font-serif text-lg sm:text-xl text-white font-bold">
                          {booking.driver.name}
                        </h3>
                        <div className="flex items-center justify-center sm:justify-start gap-1 text-[#d4af37]">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <span className="font-bold text-white text-xs">
                            {booking.driver.rating}
                          </span>
                          <span className="text-stone-400 text-xs">
                            ({booking.driver.trips}+ completed trips)
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-400 leading-relaxed">
                        {booking.driver.bio}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                        {booking.driver.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-stone-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="no-print pt-2 flex flex-col sm:flex-row gap-3">
                    <a
                      href={`tel:${booking.driver.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold text-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-[#d4af37]">
                        call
                      </span>
                      <span>Call Chauffeur Directly</span>
                    </a>
                  </div>
                </div>
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
                <div className="rounded-3xl bg-[#0c1017] border border-white/[0.08] p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                        Designated Fleet Asset
                      </span>
                      <Link
                        href="/vehicle-details"
                        className="hover:text-[#d4af37] transition-colors"
                      >
                        <h2 className="font-serif text-lg sm:text-xl text-white font-bold">
                          {booking.vehicle.name}
                        </h2>
                      </Link>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider">
                      FIRST CLASS SPEC
                    </span>
                  </div>

                  {/* Vehicle Picture Reference */}
                  <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden shadow-lg border border-white/[0.06] group">
                    <img
                      src={booking.vehicle.image}
                      alt={booking.vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs border border-white/10 font-mono">
                        {booking.vehicle.color} • {booking.vehicle.licensePlate}
                      </div>
                      <span className="text-[10px] text-stone-300 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md uppercase font-semibold">
                        Model {booking.vehicle.year}
                      </span>
                    </div>
                  </div>

                  {/* Cabin Amenities Grid */}
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                      Executive In-Cabin Amenities
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {booking.vehicle.amenities.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-stone-300 text-xs"
                        >
                          <span className="material-symbols-outlined text-[#d4af37] text-base shrink-0">
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
                <div className="rounded-3xl bg-[#0c1017] border border-white/[0.08] p-6 shadow-xl flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h2 className="font-serif text-lg sm:text-xl text-white font-bold">
                      Reservation &amp; Trip Summary
                    </h2>
                    <span className="material-symbols-outlined text-[#d4af37]">
                      flight_land
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 text-xs">
                    {/* Dates / Timeline */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="p-2 rounded-lg bg-[#d4af37]/15 text-[#d4af37] shrink-0">
                        <span className="material-symbols-outlined text-base">
                          calendar_today
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                          Handover Schedule
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {booking.itinerary.pickupDate}
                        </span>
                        <span className="text-[11px] text-[#fedeb2] mt-0.5">
                          Return: {booking.itinerary.returnDate} (
                          {booking.itinerary.duration})
                        </span>
                      </div>
                    </div>

                    {/* Flight Details */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                        <span className="material-symbols-outlined text-base">
                          flight
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                          Flight Arrival Connection
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {booking.itinerary.flightNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-stone-300 font-mono">
                            {booking.itinerary.flightRoute}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400 mt-0.5">
                          {booking.itinerary.flightStatus}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
                        <span className="material-symbols-outlined text-base">
                          location_on
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                          Handover Destination
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {booking.itinerary.pickupLocation}
                        </span>
                        <span className="text-[11px] text-stone-400 mt-0.5">
                          {booking.itinerary.pickupAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 24/7 Concierge Support Callout */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-stone-300 text-xs">
                      <span className="material-symbols-outlined text-[#d4af37] text-base">
                        support_agent
                      </span>
                      <span>Need changes to your itinerary?</span>
                    </div>
                    <a
                      href="tel:+23418885275"
                      className="text-[#d4af37] hover:text-[#fedeb2] font-semibold text-xs whitespace-nowrap"
                    >
                      +234 1 888 5275
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Bottom Quick Bar (Above Mobile Dock) */}
      <div className="no-print fixed bottom-14 left-0 right-0 z-40 lg:hidden p-3 bg-[#0a0d14]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-8px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
            Pass #{booking.bookingCode}
          </span>
          <span className="text-xs text-stone-300 font-mono">
            PIN: {booking.verificationPin}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            type="button"
            className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold flex items-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm text-[#d4af37]">
              qr_code_2
            </span>
            <span>QR Pass</span>
          </button>
          <Link
            href={`/live-tracking?code=${booking.bookingCode}`}
            className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#fedeb2] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">near_me</span>
            <span>Track</span>
          </Link>
        </div>
      </div>

      <div className="no-print">
        <Footer />
      </div>

      {/* Fullscreen High-Contrast QR Scanner Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0c1017] border border-[#d4af37]/40 p-6 sm:p-8 flex flex-col items-center gap-5 shadow-2xl text-center">
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-white/[0.05]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <span className="text-[11px] uppercase tracking-widest text-[#d4af37] font-bold">
              VIP Handover Terminal Scanner
            </span>

            {/* Oversized High-Contrast White Box */}
            <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-2xl p-4 shadow-2xl flex items-center justify-center relative">
              <img
                src={qrCodeApiUrl}
                alt="Fullscreen Scannable Handover QR Code"
                className="w-full h-full object-contain"
                suppressHydrationWarning
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black text-[#d4af37] border-2 border-[#d4af37] flex items-center justify-center font-serif font-black text-sm shadow-xl">
                LP
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="font-mono text-xl font-bold text-white tracking-widest">
                #{booking.bookingCode}
              </div>
              <div className="text-xs text-[#fedeb2] font-mono">
                Verification PIN: {booking.verificationPin}
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
              Present this high-contrast screen directly to your chauffeur or
              security personnel. The code is optimized to scan through tinted
              glass and in low light.
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
              className="w-full py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#fedeb2] transition-colors"
            >
              Share / Copy Pass Link
            </button>
          </div>
        </div>
      )}

      {/* Simulated Apple / Google Wallet Pass Preview Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0c1017] border border-white/[0.15] p-6 flex flex-col items-center gap-5 shadow-2xl">
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-white/[0.05]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Apple Wallet Obsidian Pass Mockup */}
            <div className="w-full rounded-2xl bg-gradient-to-br from-[#1c1d22] to-[#0c0d12] border border-[#d4af37]/30 p-5 shadow-2xl flex flex-col gap-4 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black text-[#d4af37] border border-[#d4af37] flex items-center justify-center font-serif text-xs font-bold">
                    LP
                  </div>
                  <span className="font-serif text-xs font-bold text-white tracking-wider">
                    LA PLANTA PRIME
                  </span>
                </div>
                <span className="text-[10px] text-[#fedeb2] font-mono uppercase">
                  VIP BOARDING PASS
                </span>
              </div>

              <div className="flex justify-between items-start text-left">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-stone-400">
                    VEHICLE ASSET
                  </div>
                  <div className="font-serif text-sm font-bold text-white truncate max-w-[170px]">
                    {booking.vehicle.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-stone-400">
                    BOOKING CODE
                  </div>
                  <div className="font-mono text-sm font-bold text-[#d4af37]">
                    #{booking.bookingCode}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start text-left border-t border-white/[0.06] pt-2 text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-stone-400">
                    CHAUFFEUR
                  </div>
                  <div className="text-white font-medium">
                    {booking.driver.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-stone-400">
                    PIN CODE
                  </div>
                  <div className="font-mono text-white font-bold">
                    {booking.verificationPin}
                  </div>
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="pt-2 flex flex-col items-center gap-1 border-t border-white/10">
                <div className="w-32 h-14 bg-white rounded p-1 flex items-center justify-center">
                  <img
                    src={qrCodeApiUrl}
                    alt="Wallet QR"
                    className="w-full h-full object-contain"
                    suppressHydrationWarning
                  />
                </div>
                <span className="font-mono text-[9px] text-stone-400 tracking-widest">
                  {booking.reference}
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(
                    "Digital Pass ready. In production, this generates a signed Apple .pkpass file for Apple Wallet.",
                  );
                  setShowWalletModal(false);
                }}
                className="w-full py-3 rounded-xl bg-black border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  phone_iphone
                </span>
                <span>Add to Apple Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(
                    "Digital Pass ready. In production, this links directly to Google Wallet via JWT token.",
                  );
                  setShowWalletModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  wallet
                </span>
                <span>Add to Google Wallet</span>
              </button>
            </div>
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
        <div className="min-h-screen bg-[#040505] text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></span>
            <span className="text-xs uppercase tracking-widest text-[#d4af37]">
              Loading VIP Digital Pass...
            </span>
          </div>
        </div>
      }
    >
      <ReservationPassContent />
    </Suspense>
  );
}
