"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [pickupType, setPickupType] = useState<"office" | "delivery">("office");
  const [flightTracking, setFlightTracking] = useState(true);
  const [selectedCity, setSelectedCity] = useState(
    "Lagos (VI, Ikoyi, Lekki & Airport)",
  );

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

      <main className="flex-1 w-full pt-20">
        {/* HERO SECTION WITH EDITORIAL BLEED */}
        <section className="relative w-full -mt-20 pt-28 pb-20 lg:pb-32 bg-primary overflow-hidden">
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
            <div className="w-full mt-6 bg-surface-container-lowest rounded-xl shadow-2xl p-6 lg:p-8 flex flex-col gap-6">
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
                    <option>Lagos (VI, Ikoyi, Lekki &amp; Airport)</option>
                    <option>Abuja (Maitama, Asokoro &amp; Airport)</option>
                    <option>Inter-State Chauffeur Service</option>
                  </select>
                  <span className="text-[11px] text-secondary truncate font-medium">
                    Dedicated Professional Driver Included
                  </span>
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

            {/* 3 Fleet Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Card 1: Mercedes S-Class */}
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative w-full h-64 bg-surface-container-low overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Mercedes-Benz S-Class sedan"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEq6CKJotgsSHP0Gqq0hBl0rPx0O5c28Wh0S2i4oXF-UbSzwP2JwvTg-5No9c5hsLD52FwTXXwd4iJADQ8dLYddKFKQgCA0FHWbVdCQMoHMAUatLtrRf58ctM5XNuE4KS4VUjm3lT6wpaEeWw-fr_acU-K8IzijLlNZNuofyS0povaQIT-A1RLy48Ty1Mvpk9tRASC45JejF1cT8v1lXbUGjv0DMoOF-taw17Z43cae4ymMpql9jYL"
                  />
                  <Badge variant="luxury" className="absolute top-4 left-4">
                    Executive Saloon
                  </Badge>
                  <Badge variant="gold" className="absolute top-4 right-4">
                    Dedicated Driver Included
                  </Badge>
                </div>
                <CardContent className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-secondary uppercase tracking-widest font-semibold">
                      Obsidian Black Metallic
                    </span>
                    <h3 className="font-serif text-2xl text-primary font-semibold">
                      Mercedes-Benz S-Class S580
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      The definitive executive sanctuary featuring rear
                      reclining first-class airline seats, Burmester 4D audio,
                      and chilled refreshment compartment.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 bg-surface-container-low rounded-lg text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        person
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        3 Guests
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        luggage
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        2 Large Cases
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        wifi
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        Onboard 5G
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary">
                        ₦450,000
                        <span className="text-xs font-normal text-on-surface-variant">
                          /day
                        </span>
                      </span>
                      <span className="text-[11px] text-secondary tracking-wider">
                        $320 USD equiv.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/vehicle-details"
                        className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-secondary-fixed text-xs uppercase tracking-wider font-semibold transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleReserve("/checkout")}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-secondary text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Range Rover Autobiography */}
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative w-full h-64 bg-surface-container-low overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Range Rover Autobiography"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVWLez2z5YguHmqNI0_vRyMhuXrigLDRxmJ_agXTCAnGaYgFm5LTy9GZAX9s3PUXJjHYPR8RSET9c6JqFXig12OSehhkM0ZMC85CbABXlww06rgFNbz_tFjx8CdxI2vjxuzJ5adLqMxNfMAqjnVbCXtkB4m412raW-q_dDk8W_OnwvGGHcXlP29H8THTb7BSAH4p9FTcPII-b-0F-Z_nlSk0v0oGNoVzGBGuJBxo45LHt2tFPReO1z"
                  />
                  <Badge variant="luxury" className="absolute top-4 left-4">
                    Executive SUV LWB
                  </Badge>
                  <Badge variant="gold" className="absolute top-4 right-4">
                    Dedicated Driver Included
                  </Badge>
                </div>
                <CardContent className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-secondary uppercase tracking-widest font-semibold">
                      Santorini Black Pearl
                    </span>
                    <h3 className="font-serif text-2xl text-primary font-semibold">
                      Range Rover Autobiography
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Commanding road posture with effortless electronic air
                      suspension, active noise cancellation, and hot stone
                      massage executive seating.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 bg-surface-container-low rounded-lg text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        person
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        4 Guests
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        luggage
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        4 Large Cases
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        airline_seat_recline_extra
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        Air Ride LWB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary">
                        ₦620,000
                        <span className="text-xs font-normal text-on-surface-variant">
                          /day
                        </span>
                      </span>
                      <span className="text-[11px] text-secondary tracking-wider">
                        $440 USD equiv.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/vehicle-details"
                        className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-secondary-fixed text-xs uppercase tracking-wider font-semibold transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleReserve("/checkout")}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-secondary text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Land Cruiser 300 */}
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div className="relative w-full h-64 bg-surface-container-low overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Toyota Land Cruiser 300 VXR"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUjMQeK58RYlQJ7WwCSuRBQG0j-U8TS29VtLsEnGMmNXymViex4KflYxJ9CHXITyZboqW9veUEFYh9qVbwsqTD-mB4YzsqTCAd5VSoBgAdBx0UGCg8UgAqHelIXP45WJjpqqeJVQosmIkH45Eas0YQRkbyFxBo_wm8w-YCDQLQL86vODcFKZ0OdDb7ZRGw_1bE2mMCKZcpU44pJsKjORQcZal9SicgNThG9inGn1OvgXtRP7zkHHgH"
                  />
                  <Badge variant="luxury" className="absolute top-4 left-4">
                    Premium SUV
                  </Badge>
                  <Badge variant="gold" className="absolute top-4 right-4">
                    Dedicated Driver Included
                  </Badge>
                </div>
                <CardContent className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-secondary uppercase tracking-widest font-semibold">
                      Raven Black Edition
                    </span>
                    <h3 className="font-serif text-2xl text-primary font-semibold">
                      Land Cruiser 300 VXR
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Robust, commanding presence and road posture with
                      four-zone climate control, rear entertainment, and chilled
                      console box.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 bg-surface-container-low rounded-lg text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        groups
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        5 Guests
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        luggage
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        5 Cases
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-base">
                        shield
                      </span>
                      <span className="text-xs text-on-surface font-medium">
                        All-Terrain VIP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-primary">
                        ₦580,000
                        <span className="text-xs font-normal text-on-surface-variant">
                          /day
                        </span>
                      </span>
                      <span className="text-[11px] text-secondary tracking-wider">
                        $410 USD equiv.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/vehicle-details"
                        className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-secondary-fixed text-xs uppercase tracking-wider font-semibold transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleReserve("/checkout")}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-secondary text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      </main>

      <Footer />
    </div>
  );
}
