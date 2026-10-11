"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { backendApi } from "@/lib/api";
import { supabase, Vehicle } from "@/lib/supabase";

export default function FleetPage() {
  const router = useRouter();

  // Fleet State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCapacity, setSelectedCapacity] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(1500000);
  const [sortBy, setSortBy] = useState<string>("popular");

  // Gallery Modal State
  const [galleryVehicle, setGalleryVehicle] = useState<Vehicle | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Fetch Live Fleet Data
  useEffect(() => {
    const fetchFleet = async () => {
      setIsLoading(true);
      try {
        // 1. Try Express backend
        const res = await backendApi.getFleet();
        if (res?.success && Array.isArray(res.vehicles) && res.vehicles.length > 0) {
          setVehicles(res.vehicles);
          setIsLoading(false);
          return;
        }

        // 2. Direct Supabase Fallback
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setVehicles(data as Vehicle[]);
        }
      } catch (err) {
        console.error("[Fleet Error] Failed to fetch vehicles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFleet();
  }, []);

  // Keyboard navigation for Lightbox Gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryVehicle) return;
      const photos = [
        galleryVehicle.hero_image_url,
        ...(galleryVehicle.gallery_image_urls || []),
      ].filter(Boolean) as string[];

      if (e.key === "Escape") {
        setGalleryVehicle(null);
      } else if (e.key === "ArrowLeft") {
        setActiveGalleryIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveGalleryIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryVehicle]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedCapacity("All");
    setMaxPrice(1500000);
    setSortBy("popular");
  };

  // Filter & Sort Logic
  const filteredVehicles = vehicles
    .filter((v) => {
      // Category Filter
      if (selectedCategory !== "All") {
        const cat = (v.category || "").toLowerCase();
        if (selectedCategory === "Sedans" && !cat.includes("sedan")) return false;
        if (selectedCategory === "SUVs" && !cat.includes("suv")) return false;
        if (
          selectedCategory === "Armored" &&
          !cat.includes("armored") &&
          (!v.armored_level || v.armored_level === "None")
        )
          return false;
        if (selectedCategory === "Executive Vans" && !cat.includes("van") && !cat.includes("minivan"))
          return false;
      }

      // Capacity Filter
      const seats = v.seats || 4;
      if (selectedCapacity === "1-2" && seats > 2) return false;
      if (selectedCapacity === "3-4" && (seats < 3 || seats > 4)) return false;
      if (selectedCapacity === "5+" && seats < 5) return false;

      // Price Filter
      const rate = Number(v.daily_rate_ngn) || 0;
      if (rate > maxPrice) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return Number(a.daily_rate_ngn) - Number(b.daily_rate_ngn);
      }
      if (sortBy === "price-desc") {
        return Number(b.daily_rate_ngn) - Number(a.daily_rate_ngn);
      }
      if (sortBy === "armored") {
        const aArm = a.armored_level && a.armored_level !== "None" ? 1 : 0;
        const bArm = b.armored_level && b.armored_level !== "None" ? 1 : 0;
        return bArm - aArm;
      }
      return 0;
    });

  // Photos for active modal
  const modalPhotos = galleryVehicle
    ? ([
        galleryVehicle.hero_image_url,
        ...(galleryVehicle.gallery_image_urls || []),
      ].filter(Boolean) as string[])
    : [];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-10">
            {/* Top Editorial Header & Operational Status Bar */}
            <div className="flex flex-col gap-6 mb-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">
                      Premium Fleet • Lagos &amp; Abuja Dispatch
                    </span>
                  </div>
                  <h1 className="font-display text-display text-primary tracking-tight font-serif">
                    The Executive Fleet
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-3 leading-relaxed">
                    Every executive vehicle is provisioned with a professional, vetted driver, in-city fuel allowance, high-speed Wi-Fi, and real-time GPS tracking across Lagos and Abuja.
                  </p>
                </div>

                {/* Quick Summary & Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 bg-surface-container px-4 py-2.5 rounded-lg shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                      {vehicles.filter((v) => v.status === "available").length} Vehicles Available Today
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
                    <label
                      className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
                      htmlFor="fleet-sort"
                    >
                      Sort By:
                    </label>
                    <select
                      id="fleet-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="popular">Most Requested</option>
                      <option value="armored">Armored Vehicles (B6)</option>
                      <option value="price-desc">Rate: High to Low</option>
                      <option value="price-asc">Rate: Low to High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Ticker Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-3 px-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">
                    verified_user
                  </span>
                  <div>
                    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Executive Service
                    </div>
                    <div className="font-title-md text-title-md text-on-surface">
                      Professional Drivers
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">
                    flight_land
                  </span>
                  <div>
                    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Airport Service
                    </div>
                    <div className="font-title-md text-title-md text-on-surface">
                      Airport Fast-Track
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">
                    wifi
                  </span>
                  <div>
                    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Onboard Connectivity
                    </div>
                    <div className="font-title-md text-title-md text-on-surface">
                      Complimentary 5G Wi-Fi
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">
                    tonality
                  </span>
                  <div>
                    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Privacy Level
                    </div>
                    <div className="font-title-md text-title-md text-on-surface">
                      Bespoke Luxury &amp; Tint
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Grid: 12 Columns (4 col Sticky Sidebar + 8 col Catalog Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* STICKY FILTER SIDEBAR (4 Cols) */}
              <aside className="lg:col-span-4 sticky top-28 space-y-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col gap-6">
                  <div className="flex items-center justify-between pb-3 border-b-0">
                    <h3 className="font-headline-sm text-headline-sm text-primary font-serif">
                      Refine Fleet
                    </h3>
                    <button
                      onClick={handleResetFilters}
                      className="font-label-sm text-label-sm uppercase tracking-widest text-secondary hover:text-on-surface transition-colors"
                      type="button"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-col gap-2.5">
                    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                      Category
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {["All", "Sedans", "SUVs", "Armored", "Executive Vans"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm font-semibold transition-all shadow-sm ${
                            selectedCategory === cat
                              ? "bg-secondary-fixed text-on-secondary-fixed ring-1 ring-secondary"
                              : "bg-surface-container text-on-surface-variant hover:bg-secondary-fixed/50 hover:text-on-secondary-fixed"
                          }`}
                          type="button"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Filter */}
                  <div className="flex flex-col gap-2.5">
                    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                      Guest Capacity
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "1-2 Guests", val: "1-2" },
                        { label: "3-4 Guests", val: "3-4" },
                        { label: "5+ Guests", val: "5+" },
                      ].map((cap) => (
                        <button
                          key={cap.val}
                          onClick={() =>
                            setSelectedCapacity(selectedCapacity === cap.val ? "All" : cap.val)
                          }
                          className={`py-2 text-center rounded-lg font-label-sm text-label-sm font-medium transition-colors ${
                            selectedCapacity === cap.val
                              ? "bg-secondary-fixed text-on-secondary-fixed font-semibold shadow-sm ring-1 ring-secondary"
                              : "bg-surface-container text-on-surface hover:bg-secondary-fixed/50"
                          }`}
                          type="button"
                        >
                          {cap.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Slider */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                        Max Rate per Day
                      </span>
                      <span className="font-label-md text-label-md text-secondary font-bold font-mono">
                        ₦{maxPrice.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="300000"
                      max="1500000"
                      step="50000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
                    />
                    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                      <span>₦300,000</span>
                      <span>₦1,500,000</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3 mt-2">
                    <span className="material-symbols-outlined text-secondary text-2xl shrink-0 mt-0.5">
                      verified
                    </span>
                    <div className="flex flex-col">
                      <span className="font-title-md text-title-md text-on-surface leading-snug">
                        Chauffeur Assurance
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                        Dedicated, vetted executive drivers with expert route knowledge, flight monitoring, and diplomatic discretion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* VIP Concierge Card */}
                <div className="bg-primary-container text-on-primary p-6 rounded-xl shadow-md flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed font-semibold">
                      VIP Support Desk
                    </span>
                  </div>
                  <div className="font-headline-sm text-headline-sm font-serif">
                    Need Bespoke Itinerary?
                  </div>
                  <p className="font-body-sm text-body-sm text-on-primary-container">
                    Specialized armed escort transfers, multi-day bookings, or airport VIP tarmac clearance can be organized instantly.
                  </p>
                  <a
                    className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-secondary-fixed transition-colors font-semibold shadow-sm"
                    href="tel:+23418885275"
                  >
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    Contact VIP Desk
                  </a>
                </div>
              </aside>

              {/* CATALOG GRID CONTENT (8 Cols) */}
              <main className="lg:col-span-8 space-y-8">
                {isLoading ? (
                  /* Loading Skeletons */
                  <div className="flex flex-col gap-6">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4 animate-pulse"
                      >
                        <div className="w-full h-72 bg-surface-container rounded-lg" />
                        <div className="w-1/3 h-6 bg-surface-container rounded" />
                        <div className="w-2/3 h-4 bg-surface-container rounded" />
                      </div>
                    ))}
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  /* Empty State */
                  <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-sm border border-surface-container flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-4xl">directions_car</span>
                    </div>
                    <h3 className="font-serif text-2xl text-primary font-semibold">
                      {vehicles.length === 0
                        ? "Fleet Inventory Is Being Provisioned"
                        : "No Vehicles Match Your Selected Filters"}
                    </h3>
                    <p className="font-body-md text-on-surface-variant max-w-md">
                      {vehicles.length === 0
                        ? "Our operations team is currently staging new executive units. Please check back shortly or contact our 24/7 VIP desk for immediate assistance."
                        : "Try adjusting your price range or category filter to browse available vehicles."}
                    </p>
                    {vehicles.length > 0 ? (
                      <button
                        onClick={handleResetFilters}
                        className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm"
                      >
                        Reset All Filters
                      </button>
                    ) : (
                      <a
                        href="https://wa.me/23418885275"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">chat</span>
                        Inquire With Operations
                      </a>
                    )}
                  </div>
                ) : (
                  /* Dynamic Vehicle Cards */
                  filteredVehicles.map((vehicle) => {
                    const vehicleName =
                      vehicle.name || `${vehicle.brand} ${vehicle.model}`;
                    const rateNgn = Number(vehicle.daily_rate_ngn) || 0;
                    const rateUsd =
                      Number(vehicle.daily_rate_usd) || Math.round(rateNgn / 1500);
                    const photoCount =
                      (vehicle.gallery_image_urls?.length || 0) +
                      (vehicle.hero_image_url ? 1 : 0);
                    const isArmored =
                      vehicle.armored_level && vehicle.armored_level !== "None";

                    return (
                      <article
                        key={vehicle.id}
                        className="bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] overflow-hidden transition-all duration-300 hover:shadow-[0_18px_40px_rgba(197,168,128,0.12)] hover:-translate-y-0.5 flex flex-col"
                      >
                        {/* Hero Image Section */}
                        <div className="relative w-full h-80 overflow-hidden bg-surface-container">
                          {vehicle.hero_image_url ? (
                            <img
                              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                              alt={vehicleName}
                              src={vehicle.hero_image_url}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                              <span className="material-symbols-outlined text-secondary text-6xl">
                                directions_car
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {isArmored ? (
                              <span className="px-3 py-1 rounded-full bg-amber-500 text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold shadow-md flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">shield</span>
                                {vehicle.armored_level} Ballistic
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-secondary text-sm">
                                  flight_takeoff
                                </span>
                                Airport Fast-Track
                              </span>
                            )}
                            <span className="px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                              Professional Driver Included
                            </span>
                          </div>

                          {/* Photo Count Pill */}
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryVehicle(vehicle);
                              setActiveGalleryIndex(0);
                            }}
                            className="absolute top-4 right-4 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-semibold shadow-sm hover:bg-secondary-fixed transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              photo_library
                            </span>
                            <span>{photoCount > 0 ? `1/${photoCount} Photos` : "View Photos"}</span>
                          </button>

                          {/* Bottom Title & Rate in Overlay */}
                          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-on-primary">
                            <div>
                              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
                                {vehicle.color || "Obsidian Black"} • {vehicle.category || "Executive"}
                              </span>
                              <h2 className="font-headline-lg text-headline-lg font-serif leading-tight">
                                {vehicleName}
                              </h2>
                            </div>
                            <div className="text-right">
                              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container block">
                                Daily Rate
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="font-display-mobile text-display-mobile font-serif font-semibold">
                                  ₦{rateNgn.toLocaleString()}
                                </span>
                                <span className="font-label-sm text-label-sm text-secondary-fixed">
                                  (~${rateUsd.toLocaleString()} USD)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 md:p-8 flex flex-col gap-6">
                          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                            {isArmored
                              ? "Reinforced executive ballistic transit featuring multi-layer protection, run-flat tyres, and discrete whisper-quiet cabin security."
                              : "Engineered for uncompromised poise during high-profile transit across Lagos and Abuja. Provisioned with executive amenities and GPS telematics."}
                          </p>

                          {/* Specifications Bento Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-lg">
                                person
                              </span>
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                                  Passengers
                                </span>
                                <span className="font-title-md text-title-md text-on-surface leading-tight">
                                  {vehicle.seats || 4} Guests
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-lg">
                                luggage
                              </span>
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                                  Luggage
                                </span>
                                <span className="font-title-md text-title-md text-on-surface leading-tight">
                                  {vehicle.luggage_capacity || 4} Cases
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-lg">
                                wifi
                              </span>
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                                  Wi-Fi
                                </span>
                                <span className="font-title-md text-title-md text-on-surface leading-tight">
                                  High-Speed 5G
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-lg">
                                tonality
                              </span>
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                                  Privacy
                                </span>
                                <span className="font-title-md text-title-md text-on-surface leading-tight">
                                  Tinted Windows
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Footer: View Gallery & Reserve Vehicle */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <span className="material-symbols-outlined text-secondary text-base">
                                check_circle
                              </span>
                              <span className="font-body-sm text-body-sm">
                                Includes fuel allowance, toll clearance &amp; vetted chauffeur
                              </span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setGalleryVehicle(vehicle);
                                  setActiveGalleryIndex(0);
                                }}
                                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors font-semibold active:scale-95 flex items-center justify-center gap-2"
                              >
                                <span className="material-symbols-outlined text-base">
                                  photo_camera
                                </span>
                                <span>View Gallery</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  router.push(`/checkout?vehicleId=${vehicle.id}`);
                                }}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-all font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95"
                              >
                                <span>Reserve Vehicle</span>
                                <span className="material-symbols-outlined text-base">
                                  arrow_forward
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </main>
            </div>

            {/* Bottom Bespoke Convoy & Ramp Protocol Banner */}
            <section className="mt-16 bg-surface-container-lowest rounded-2xl p-8 lg:p-12 shadow-[0_10px_30px_rgba(26,26,26,0.035)] relative overflow-hidden">
              <div className="absolute -right-16 -bottom-16 w-96 h-96 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary text-lg">
                      local_police
                    </span>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                      Executive Services • Escort &amp; Airport Protocol
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md font-serif text-primary">
                    Need a multi-vehicle escort convoy or VIP airport meet-and-greet?
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                    From luxury executive convoys with dedicated escort vehicles to VIP airport arrivals at Murtala Muhammed (LOS) and Nnamdi Azikiwe (ABV), our operations team coordinates seamless executive movement.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
                  <a
                    className="px-6 py-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-all flex items-center justify-center gap-3 shadow-md font-semibold"
                    href="https://wa.me/23418885275"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-xl">chat</span>
                    <span>WhatsApp Concierge</span>
                  </a>
                  <a
                    className="px-6 py-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 font-semibold"
                    href="tel:+23418885275"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                    <span>Priority Hotline</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {/* Interactive Lightbox Gallery Modal */}
      {galleryVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-primary/90 backdrop-blur-md"
            onClick={() => setGalleryVehicle(null)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container flex flex-col z-10 max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-container bg-surface-container-lowest shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                  {galleryVehicle.category || "Executive Fleet"} • {galleryVehicle.color || "Obsidian Black"}
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-primary font-semibold">
                  {galleryVehicle.name || `${galleryVehicle.brand} ${galleryVehicle.model}`}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase text-on-surface-variant block font-semibold">
                    Daily Rate
                  </span>
                  <span className="font-serif font-bold text-primary text-base">
                    ₦{(Number(galleryVehicle.daily_rate_ngn) || 0).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => setGalleryVehicle(null)}
                  className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors"
                  aria-label="Close Gallery"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Active Image Viewport */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[420px] max-h-[550px] overflow-hidden group">
              {modalPhotos.length > 0 ? (
                <img
                  src={modalPhotos[activeGalleryIndex]}
                  alt={`${galleryVehicle.name} - View ${activeGalleryIndex + 1}`}
                  className="w-full h-full object-contain max-h-[550px] transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-white/70 p-8">
                  <span className="material-symbols-outlined text-5xl text-secondary">
                    no_photography
                  </span>
                  <p className="text-xs uppercase tracking-wider font-semibold">
                    Photographs Being Cataloged For This Unit
                  </p>
                </div>
              )}

              {/* Prev / Next Controls */}
              {modalPhotos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveGalleryIndex((prev) =>
                        prev > 0 ? prev - 1 : modalPhotos.length - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all backdrop-blur-sm"
                    aria-label="Previous Photo"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                  <button
                    onClick={() =>
                      setActiveGalleryIndex((prev) =>
                        prev < modalPhotos.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all backdrop-blur-sm"
                    aria-label="Next Photo"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </>
              )}

              {/* Photo Counter Tag */}
              {modalPhotos.length > 0 && (
                <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-mono">
                  {activeGalleryIndex + 1} / {modalPhotos.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip (if multiple photos) */}
            {modalPhotos.length > 1 && (
              <div className="p-3 bg-surface-container-low flex items-center gap-2 overflow-x-auto shrink-0">
                {modalPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeGalleryIndex === idx
                        ? "border-secondary scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Modal Footer CTA */}
            <div className="p-4 sm:p-5 bg-surface-container-lowest border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span>
                  <strong>Seats:</strong> {galleryVehicle.seats || 4} Guests
                </span>
                <span>•</span>
                <span>
                  <strong>Luggage:</strong> {galleryVehicle.luggage_capacity || 4} Cases
                </span>
                <span>•</span>
                <span>
                  <strong>Armor:</strong> {galleryVehicle.armored_level || "Standard"}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setGalleryVehicle(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = galleryVehicle.id;
                    setGalleryVehicle(null);
                    router.push(`/checkout?vehicleId=${id}`);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <span>Reserve This Vehicle</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
