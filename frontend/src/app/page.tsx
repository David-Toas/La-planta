"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { backendApi } from "@/lib/api";
import { supabase, Vehicle } from "@/lib/supabase";
import { VehicleCard } from "@/components/vehicle-card";

const FALLBACK_VEHICLES: Vehicle[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-222222222222",
    name: "Mercedes-Benz S-Class S580",
    brand: "Mercedes-Benz",
    model: "S-Class S580",
    year: 2024,
    license_plate: "APP-580-LP",
    color: "Obsidian Black Metallic",
    category: "Executive Saloon",
    armored_level: "None",
    daily_rate_ngn: 450000,
    daily_rate_usd: 320,
    seats: 3,
    luggage_capacity: 2,
    transmission: "Automatic",
    fuel_battery_level: 100,
    odometer_km: 12000,
    status: "available",
    features: ["Burmester 4D Audio", "Chilled Refreshment Box", "First-Class Reclining Seats"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEq6CKJotgsSHP0Gqq0hBl0rPx0O5c28Wh0S2i4oXF-UbSzwP2JwvTg-5No9c5hsLD52FwTXXwd4iJADQ8dLYddKFKQgCA0FHWbVdCQMoHMAUatLtrRf58ctM5XNuE4KS4VUjm3lT6wpaEeWw-fr_acU-K8IzijLlNZNuofyS0povaQIT-A1RLy48Ty1Mvpk9tRASC45JejF1cT8v1lXbUGjv0DMoOF-taw17Z43cae4ymMpql9jYL",
    gallery_image_urls: [],
    current_location_name: "Victoria Island, Lagos",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
    name: "Range Rover Autobiography",
    brand: "Land Rover",
    model: "Range Rover Autobiography",
    year: 2024,
    license_plate: "KJA-888-LP",
    color: "Santorini Black Pearl",
    category: "Executive SUV LWB",
    armored_level: "None",
    daily_rate_ngn: 620000,
    daily_rate_usd: 440,
    seats: 4,
    luggage_capacity: 4,
    transmission: "Automatic",
    fuel_battery_level: 100,
    odometer_km: 15400,
    status: "available",
    features: ["Air Ride LWB", "Active Noise Cancellation", "Executive Hot Stone Massage"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBVWLez2z5YguHmqNI0_vRyMhuXrigLDRxmJ_agXTCAnGaYgFm5LTy9GZAX9s3PUXJjHYPR8RSET9c6JqFXig12OSehhkM0ZMC85CbABXlww06rgFNbz_tFjx8CdxI2vjxuzJ5adLqMxNfMAqjnVbCXtkB4m412raW-q_dDk8W_OnwvGGHcXlP29H8THTb7BSAH4p9FTcPII-b-0F-Z_nlSk0v0oGNoVzGBGuJBxo45LHt2tFPReO1z",
    gallery_image_urls: [],
    current_location_name: "Ikoyi, Lagos",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-444444444444",
    name: "Land Cruiser 300 VXR",
    brand: "Toyota",
    model: "Land Cruiser 300 VXR",
    year: 2024,
    license_plate: "AGL-300-LP",
    color: "Raven Black Edition",
    category: "Premium SUV",
    armored_level: "None",
    daily_rate_ngn: 580000,
    daily_rate_usd: 410,
    seats: 5,
    luggage_capacity: 5,
    transmission: "Automatic",
    fuel_battery_level: 100,
    odometer_km: 9800,
    status: "available",
    features: ["Four-Zone Climate", "Chilled Cool Box", "Rear Seat Entertainment"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUjMQeK58RYlQJ7WwCSuRBQG0j-U8TS29VtLsEnGMmNXymViex4KflYxJ9CHXITyZboqW9veUEFYh9qVbwsqTD-mB4YzsqTCAd5VSoBgAdBx0UGCg8UgAqHelIXP45WJjpqqeJVQosmIkH45Eas0YQRkbyFxBo_wm8w-YCDQLQL86vODcFKZ0OdDb7ZRGw_1bE2mMCKZcpU44pJsKjORQcZal9SicgNThG9inGn1OvgXtRP7zkHHgH",
    gallery_image_urls: [],
    current_location_name: "Victoria Island, Lagos",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [pickupType, setPickupType] = useState<"office" | "delivery">("office");
  const [flightTracking, setFlightTracking] = useState(true);
  const [selectedCity, setSelectedCity] = useState(
    "Lagos (VI, Ikoyi, Lekki & Airport)",
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>(FALLBACK_VEHICLES);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  // Fetch real-time vehicles from backend / Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadFeaturedVehicles() {
      try {
        // 1. Try Express Backend API
        const res = await backendApi.getFleet();
        if (isMounted && res?.success && Array.isArray(res.vehicles) && res.vehicles.length > 0) {
          setVehicles(res.vehicles);
          setIsLoadingVehicles(false);
          return;
        }

        // 2. Direct Supabase Query
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false });

        if (isMounted && !error && data && data.length > 0) {
          setVehicles(data as Vehicle[]);
        }
      } catch (err) {
        console.error("[Homepage] Error fetching featured vehicles:", err);
      } finally {
        if (isMounted) setIsLoadingVehicles(false);
      }
    }

    loadFeaturedVehicles();
    return () => {
      isMounted = false;
    };
  }, []);

  const consoleRef = useRef<HTMLDivElement>(null);
  const [isScrolledPast, setIsScrolledPast] = useState(false);
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (consoleRef.current) {
        const rect = consoleRef.current.getBoundingClientRect();
        // Visible when user scrolls past the hero console card
        setIsScrolledPast(rect.bottom < 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleReserve = (destination = "/checkout") => {
    if (user) {
      router.push(destination);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("laPlanta_intended_destination", destination);
      }
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="flex-1 w-full pt-16 lg:pt-20">
        {/* HERO SECTION WITH EDITORIAL BLEED */}
        <section className="relative w-full -mt-16 lg:-mt-20 pt-24 lg:pt-28 pb-20 lg:pb-32 bg-primary overflow-hidden">
          {/* Background Image Scrim */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center mix-blend-luminosity opacity-40 scale-105 transition-transform duration-1000 ease-out"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuByTOG29Rtsw_hZNArFdOO6HeSeYrWD5S-oJXeBKlUyxTfEqIsn8pxMeW1gDugl5k08QbK17lCPinEDRM4lwuj87IzCeLimI203viadgfyuqaGyOXnq2qwZm57iOD5vr5rIZqQ1mrWmxqN1ckuO_p9vapbiWsLrzATHLl-ssr0oU2kp7m-W8kTdiygx64WBeU_8ZqUVNEUn9acAcNBdqE8iXDnj5ynQWGqmYQJ3bH0xhW4Q-mAEz7V7')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-primary/40" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-start gap-8 z-10">
            {/* Main Headline & Subtitle */}
            <div className="max-w-4xl flex flex-col gap-5">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]">
                Premier &amp; Executive Car Hire.
              </h1>
              {/* <p className="text-base sm:text-lg text-[#c8c6c5] max-w-2xl font-light leading-relaxed">
                First-class executive sedans, luxury SUVs, and armored vehicles
                with vetted professional drivers for corporate leaders, private
                VIP transit, and diaspora arrivals across Lagos and Abuja.
              </p> */}
            </div>

            {/* Floating Booking Console Card */}
            <div
              ref={consoleRef}
              className="w-full mt-6 bg-surface-container-lowest rounded-xl shadow-2xl p-6 lg:p-8 flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.04]">
                {/* Segmented Handover Tabs */}
                <div className="inline-flex p-1 bg-surface-container-low rounded-lg">
                  <button
                    onClick={() => setPickupType("office")}
                    className={`px-5 py-2 rounded-md text-xs uppercase tracking-wider font-semibold transition-all ${
                      pickupType === "office"
                        ? "bg-surface-container-lowest text-on-surface shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Office Pickup
                  </button>
                  <button
                    onClick={() => setPickupType("delivery")}
                    className={`px-5 py-2 rounded-md text-xs uppercase tracking-wider font-semibold transition-all ${
                      pickupType === "delivery"
                        ? "bg-surface-container-lowest text-on-surface shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    type="button"
                  >
                    Direct Delivery
                  </button>
                </div>

                {/* <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    flight
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                    <input
                      checked={flightTracking}
                      onChange={(e) => setFlightTracking(e.target.checked)}
                      className="w-3.5 h-3.5 accent-secondary cursor-pointer"
                      type="checkbox"
                    />
                    <span>Complimentary flight tracking for timely airport pickup</span>
                  </label>
                </div> */}
              </div>

              {/* Booking Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-lg">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-secondary text-base">
                      location_on
                    </span>
                    City / Operational Area
                  </span>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none cursor-pointer"
                  >
                    <option>Lagos </option>
                    <option>Abuja</option>
                    <option>Inter-State </option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-lg">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-secondary text-base">
                      calendar_month
                    </span>
                    Pickup Date &amp; Time
                  </span>
                  <input
                    className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none cursor-pointer"
                    type="datetime-local"
                    defaultValue="2025-04-12T14:00"
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    Scheduled pickup time
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-lg">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-secondary text-base">
                      event_repeat
                    </span>
                    Return Date &amp; Time
                  </span>
                  <input
                    className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none cursor-pointer"
                    type="datetime-local"
                    defaultValue="2025-04-14T18:00"
                  />
                  <span className="text-[11px] text-secondary font-medium">
                    Complimentary flexible adjustment
                  </span>
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <Link
                    href="/fleet"
                    className="w-full h-12 rounded-lg bg-primary text-white hover:bg-secondary font-semibold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Find Your Vehicle</span>
                    <span className="material-symbols-outlined text-base">
                      arrow_forward
                    </span>
                  </Link>
                  {/* <div className="flex items-center justify-center gap-1.5 text-center">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      lock
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      100% Upfront Guarantee &amp; Instant QR Voucher
                    </span>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Key Assurance Metrics */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  verified
                </span>
                <span className="text-xs uppercase tracking-wider font-medium">
                  Vetted Professional Drivers
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  flight_takeoff
                </span>
                <span className="text-xs uppercase tracking-wider font-medium">
                  VIP Airport &amp; Terminal Meet
                </span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-secondary-fixed text-lg">
                  schedule
                </span>
                <span className="text-xs uppercase tracking-wider font-medium">
                  Guaranteed Punctual Staging
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED FLEET SECTION */}
        <section className="w-full py-20 lg:py-28 bg-surface">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                  Our Fleet
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-primary font-semibold">
                  Curated Executive Vehicles
                </h2>
                <p className="text-sm text-on-surface-variant max-w-xl">
                  Each vehicle undergoes a meticulous 72-point sanitization,
                  mechanical inspection, and executive stocking protocol prior
                  to assignment.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/fleet"
                  className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-xs uppercase tracking-wider hover:bg-secondary hover:text-white transition-colors"
                >
                  Sedans &amp; Saloons
                </Link>
                <Link
                  href="/fleet"
                  className="px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs uppercase tracking-wider font-semibold"
                >
                  Armored Vehicles
                </Link>
                <Link
                  href="/fleet"
                  className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-xs uppercase tracking-wider hover:bg-secondary hover:text-white transition-colors"
                >
                  Luxury SUVs
                </Link>
              </div>
            </div>

            {/* 3 Featured Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...vehicles]
                .sort((a, b) => {
                  const aOrder = a.status === "available" ? 0 : 1;
                  const bOrder = b.status === "available" ? 0 : 1;
                  return aOrder - bOrder;
                })
                .slice(0, 3)
                .map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onReserve={(id) => handleReserve(`/checkout?vehicleId=${id}`)}
                  />
                ))}
            </div>

            {/* See More Fleet Button */}
            <div className="flex flex-col items-center justify-center pt-2 gap-3">
              <Link
                href="/fleet"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer"
              >
                <span>See More</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
              <span className="text-xs text-on-surface-variant font-medium">
                Explore the full La Planta Prime executive fleet
              </span>
            </div>
          </div>
        </section>

        {/* FOUR PILLARS SECTION */}
        <section className="w-full py-20 lg:py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                Uncompromising Standards
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-primary font-semibold">
                The La Planta Prime Executive Protocol
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Every charter represents seamless coordination, uncompromising
                personal security, and world-class hospitality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4 border border-black/[0.03]">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined text-2xl">
                    verified_user
                  </span>
                </div>
                <h4 className="font-serif text-lg font-semibold text-primary">
                  Vetted Drivers
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Rigorous background audits, executive defensive driving
                  certification, and non-disclosure discretion.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4 border border-black/[0.03]">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined text-2xl">
                    gps_fixed
                  </span>
                </div>
                <h4 className="font-serif text-lg font-semibold text-primary">
                  Live Telematics
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  24/7 real-time telemetry monitoring with automated emergency
                  dispatch coordination and geofence tracking.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4 border border-black/[0.03]">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined text-2xl">
                    nest_clock_farsight_analog
                  </span>
                </div>
                <h4 className="font-serif text-lg font-semibold text-primary">
                  Punctual Staging
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Active commercial and private flight tracking ensures your
                  driver arrives at the tarmac or terminal 30 minutes early.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4 border border-black/[0.03]">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-secondary-fixed">
                  <span className="material-symbols-outlined text-2xl">
                    qr_code_2
                  </span>
                </div>
                <h4 className="font-serif text-lg font-semibold text-primary">
                  Digital QR Voucher
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Instant offline-ready digital key pass and 72-point condition
                  photo log for transparent, friction-free handover.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Persistent Handover Card (Appears when scrolled past Hero Console) */}
        {isScrolledPast && (
          <div className="fixed right-4 sm:right-6 bottom-20 lg:bottom-8 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {isFloatingMinimized ? (
              <button
                type="button"
                onClick={() => setIsFloatingMinimized(false)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0c1017]/95 border border-[#d4af37]/50 text-white shadow-2xl backdrop-blur-xl text-xs font-semibold hover:border-[#d4af37] transition-all group active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
                <span className="text-[#fedeb2] font-mono uppercase text-[10px] tracking-wider">
                  {pickupType === "office"
                    ? "Office Pickup"
                    : "Direct Delivery"}
                </span>
                <span className="material-symbols-outlined text-sm text-[#d4af37] group-hover:rotate-180 transition-transform">
                  expand_less
                </span>
              </button>
            ) : (
              <div className="w-[280px] sm:w-[320px] rounded-2xl bg-[#0c1017]/95 border border-[#d4af37]/40 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex flex-col gap-3 text-stone-200">
                {/* Header with Minimize button */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#d4af37] text-base">
                      {pickupType === "office"
                        ? "storefront"
                        : "local_shipping"}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                      Make A Reservation
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFloatingMinimized(true)}
                    className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Minimize"
                  >
                    <span className="material-symbols-outlined text-sm">
                      minimize
                    </span>
                  </button>
                </div>

                {/* Mini Segmented Handover Switcher */}
                <div className="grid grid-cols-2 p-1 bg-black/60 rounded-xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setPickupType("office")}
                    className={`py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                      pickupType === "office"
                        ? "bg-[#d4af37] text-black font-bold shadow-md"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    Office Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupType("delivery")}
                    className={`py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                      pickupType === "delivery"
                        ? "bg-[#d4af37] text-black font-bold shadow-md"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    Direct Delivery
                  </button>
                </div>

                {/* Operational Details Strip */}
                <div className="flex items-center justify-between text-[11px] text-stone-300 px-1">
                  <span className="flex items-center gap-1 truncate">
                    <span className="text-[#d4af37]">📍</span>
                    <span className="truncate">
                      {selectedCity.split("(")[0].trim()}
                    </span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      if (consoleRef.current) {
                        consoleRef.current.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      calendar_month
                    </span>
                    <span>Edit Dates</span>
                  </button>
                  <Link
                    href={`/fleet?handover=${pickupType}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#d4af37] hover:bg-[#fedeb2] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-md active:scale-95"
                  >
                    <span>View Cars</span>
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
