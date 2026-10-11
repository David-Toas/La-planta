"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { backendApi } from "@/lib/api";
import { supabase, Vehicle } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";

/**
 * Interactive Auto-Scrolling Vehicle Card with Multi-Photo Carousel
 */
function VehicleCardItem({
  vehicle,
  onOpenGallery,
  onReserve,
}: {
  vehicle: Vehicle;
  onOpenGallery: (vehicle: Vehicle, index?: number) => void;
  onReserve: (vehicleId: string) => void;
}) {
  const photos = [
    vehicle.hero_image_url,
    ...(vehicle.gallery_image_urls || []),
  ].filter(Boolean) as string[];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll carousel every 3.5 seconds (pauses when user hovers)
  useEffect(() => {
    if (photos.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [photos.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const vehicleName = vehicle.name || `${vehicle.brand} ${vehicle.model}`;
  const rateNgn = Number(vehicle.daily_rate_ngn) || 0;
  const rateUsd = Number(vehicle.daily_rate_usd) || Math.round(rateNgn / 1500);
  const isArmored = vehicle.armored_level && vehicle.armored_level !== "None";

  return (
    <article
      className="group bg-surface-container-lowest rounded-2xl overflow-hidden border border-black/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(197,168,128,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Auto-scrolling Carousel Image Container */}
      <div className="relative w-full h-56 sm:h-60 overflow-hidden bg-surface-container-low select-none">
        {photos.length > 0 ? (
          <img
            key={currentIndex}
            src={photos[currentIndex]}
            alt={`${vehicleName} view ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-500 cursor-pointer"
            onClick={() => onOpenGallery(vehicle, currentIndex)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-500 cursor-pointer"
            onClick={() => onOpenGallery(vehicle, 0)}
          >
            <span className="material-symbols-outlined text-5xl">directions_car</span>
            <span className="text-xs uppercase tracking-wider mt-1">Vehicle Image Pending</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {isArmored ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-md flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">shield</span>
              {vehicle.armored_level}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-sm">
              {vehicle.category || "Executive"}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-primary/90 backdrop-blur-md text-white font-label-sm text-[10px] uppercase tracking-wider font-semibold">
            Chauffeur Included
          </span>
        </div>

        {/* Photo Counter Pill */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGallery(vehicle, currentIndex);
            }}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-colors z-10 shadow-sm"
          >
            <span className="material-symbols-outlined text-xs">photo_camera</span>
            <span>
              {currentIndex + 1}/{photos.length}
            </span>
          </button>
        )}

        {/* Left & Right Chevron Buttons (Visible on hover or touch) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              title="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
            >
              <span className="material-symbols-outlined text-base">navigate_before</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
            >
              <span className="material-symbols-outlined text-base">navigate_next</span>
            </button>
          </>
        )}

        {/* Bottom Carousel Indicator Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full ${
                  currentIndex === idx
                    ? "w-4 h-1.5 bg-secondary shadow-sm"
                    : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content & Details */}
      <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-secondary font-semibold uppercase tracking-widest truncate">
              {vehicle.color || "Obsidian Black"} {vehicle.year ? `• ${vehicle.year}` : ""}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-primary font-semibold leading-snug truncate">
            {vehicleName}
          </h3>
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {vehicle.features && vehicle.features.length > 0
              ? vehicle.features.slice(0, 3).join(" • ")
              : "Executive sanitized interior with dedicated executive chauffeur service."}
          </p>
        </div>

        {/* Quick Specs Strip */}
        <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 bg-surface-container-low rounded-xl text-center text-on-surface">
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="material-symbols-outlined text-secondary text-base">person</span>
            <span className="text-[11px] font-medium">{vehicle.seats || 4} Guests</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="material-symbols-outlined text-secondary text-base">luggage</span>
            <span className="text-[11px] font-medium">{vehicle.luggage_capacity || 4} Cases</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5">
            <span className="material-symbols-outlined text-secondary text-base">wifi</span>
            <span className="text-[11px] font-medium">Starlink</span>
          </div>
        </div>

        {/* Price Row (Prominent & Clear) */}
        <div className="pt-3 border-t border-black/[0.05] flex items-baseline justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary font-serif">
                ₦{rateNgn.toLocaleString()}
              </span>
              <span className="text-xs text-on-surface-variant font-normal">/day</span>
            </div>
            <span className="text-[10px] text-secondary tracking-wider font-medium">
              ${rateUsd.toLocaleString()} USD equiv.
            </span>
          </div>
          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-medium">
            Driver Included
          </span>
        </div>

        {/* Action Buttons Row (Placed BELOW the Price) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenGallery(vehicle, currentIndex)}
            className="w-full h-10 rounded-xl bg-surface-container hover:bg-secondary-fixed text-primary text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">photo_library</span>
            <span>Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => onReserve(vehicle.id)}
            className="w-full h-10 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Reserve</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FleetPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  // Handle Reserve with User Authentication Check
  const handleReserve = (vehicleId: string) => {
    const destination = `/checkout?vehicleId=${vehicleId}`;
    if (user) {
      router.push(destination);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("laPlanta_intended_destination", destination);
      }
      openAuthModal();
    }
  };

  // Fleet State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States (Dropdown selections + range slider)
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCapacity, setSelectedCapacity] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
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
        if (
          res?.success &&
          Array.isArray(res.vehicles) &&
          res.vehicles.length > 0
        ) {
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
        setActiveGalleryIndex((prev) =>
          prev > 0 ? prev - 1 : photos.length - 1
        );
      } else if (e.key === "ArrowRight") {
        setActiveGalleryIndex((prev) =>
          prev < photos.length - 1 ? prev + 1 : 0
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryVehicle]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedCapacity("All");
    setMaxPrice(2000000);
    setSortBy("popular");
  };

  const isAnyFilterActive =
    selectedCategory !== "All" ||
    selectedCapacity !== "All" ||
    maxPrice < 2000000 ||
    sortBy !== "popular";

  // Filter & Sort Logic
  const filteredVehicles = vehicles
    .filter((v) => {
      // Category Filter
      if (selectedCategory !== "All") {
        const cat = (v.category || "").toLowerCase();
        if (selectedCategory === "Sedans" && !cat.includes("sedan") && !cat.includes("saloon"))
          return false;
        if (selectedCategory === "SUVs" && !cat.includes("suv")) return false;
        if (
          selectedCategory === "Armored" &&
          !cat.includes("armored") &&
          (!v.armored_level || v.armored_level === "None")
        )
          return false;
        if (
          selectedCategory === "Executive Vans" &&
          !cat.includes("van") &&
          !cat.includes("minivan")
        )
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

      <main className="w-full pt-20 bg-surface flex-1">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                Our Executive Fleet
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
                {vehicles.length} Units In Service
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-primary font-bold tracking-tight">
                  Curated Executive Fleet
                </h1>
                <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
                  Every vehicle undergoes a 72-point sanitization protocol, mechanical inspection,
                  and professional driver assignment prior to dispatch.
                </p>
              </div>

              {/* VIP Concierge Fast-Contact */}
              <a
                href="https://wa.me/23418885275"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-secondary-fixed text-primary text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm self-start md:self-auto shrink-0"
              >
                <span className="material-symbols-outlined text-secondary text-base">support_agent</span>
                <span>Bespoke / Armed Escort Desk</span>
              </a>
            </div>
          </div>

          {/* TOP HORIZONTAL FILTER BAR */}
          <div className="w-full bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-sm border border-black/[0.05] mb-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">tune</span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Refine Inventory
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[11px] font-semibold">
                  Showing {filteredVehicles.length} of {vehicles.length}
                </span>
              </div>

              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-secondary hover:text-primary font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Filter Controls Row: Category Dropdown, Capacity Dropdown, Sort Dropdown, and Price Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Dropdown 1: Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-secondary">category</span>
                  Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-primary focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                  >
                    <option value="All">All Categories ({vehicles.length})</option>
                    <option value="Sedans">Sedans &amp; Saloons</option>
                    <option value="SUVs">Luxury SUVs</option>
                    <option value="Armored">Armored Ballistic</option>
                    <option value="Executive Vans">Executive Vans</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Dropdown 2: Capacity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-secondary">group</span>
                  Guest Capacity
                </label>
                <div className="relative">
                  <select
                    value={selectedCapacity}
                    onChange={(e) => setSelectedCapacity(e.target.value)}
                    className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-primary focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                  >
                    <option value="All">All Capacities</option>
                    <option value="1-2">1–2 VIP Guests</option>
                    <option value="3-4">3–4 VIP Guests</option>
                    <option value="5+">5+ VIP Guests</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Dropdown 3: Sort Order */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-secondary">swap_vert</span>
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface-container-low border border-surface-container text-xs font-semibold text-primary focus:outline-none focus:border-secondary appearance-none cursor-pointer"
                  >
                    <option value="popular">Curated / Featured</option>
                    <option value="price-asc">Daily Rate: Low to High</option>
                    <option value="price-desc">Daily Rate: High to Low</option>
                    <option value="armored">Armored Ballistic First</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Control 4: Price Range Slider (NOT a dropdown) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">payments</span>
                    Max Daily Rate
                  </label>
                  <span className="text-xs font-bold text-secondary font-mono">
                    ₦{maxPrice.toLocaleString()}
                  </span>
                </div>
                <div className="h-11 flex flex-col justify-center px-1">
                  <input
                    type="range"
                    min="300000"
                    max="2000000"
                    step="50000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-on-surface-variant pt-1 font-mono">
                    <span>₦300k</span>
                    <span>₦2.0M+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN FLEET CARDS GRID (3 to 4 side-by-side) */}
          {isLoading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-black/[0.04] flex flex-col gap-4 animate-pulse"
                >
                  <div className="w-full h-56 bg-surface-container rounded-xl" />
                  <div className="w-1/2 h-5 bg-surface-container rounded" />
                  <div className="w-3/4 h-3 bg-surface-container rounded" />
                  <div className="w-full h-10 bg-surface-container rounded-xl mt-4" />
                </div>
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            /* Empty State */
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-sm border border-surface-container flex flex-col items-center justify-center gap-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-4xl">directions_car</span>
              </div>
              <h3 className="font-serif text-2xl text-primary font-semibold">
                {vehicles.length === 0
                  ? "Fleet Inventory Is Being Provisioned"
                  : "No Vehicles Match Your Selected Filters"}
              </h3>
              <p className="font-body-md text-on-surface-variant max-w-md text-sm">
                {vehicles.length === 0
                  ? "Our operations team is currently registering vehicles. You can add vehicles using the Admin Dashboard."
                  : "Try clearing your filters or increasing your daily rate budget to see available units."}
              </p>
              {vehicles.length > 0 ? (
                <button
                  type="button"
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
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>Inquire With Operations Desk</span>
                </a>
              )}
            </div>
          ) : (
            /* 3–4 Side-by-Side Responsive Grid of Compact Auto-Scrolling Vehicle Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVehicles.map((vehicle) => (
                <VehicleCardItem
                  key={vehicle.id}
                  vehicle={vehicle}
                  onOpenGallery={(v, idx) => {
                    setGalleryVehicle(v);
                    setActiveGalleryIndex(idx || 0);
                  }}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FULL-SCREEN LIGHTBOX GALLERY MODAL */}
      {galleryVehicle && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Top Bar with Title, Counter & Close */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-2xl">
                garage
              </span>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold">
                  {galleryVehicle.name || `${galleryVehicle.brand} ${galleryVehicle.model}`}
                </h3>
                <span className="text-xs text-white/60">
                  {galleryVehicle.color || "Santorini Black"} • {galleryVehicle.category || "Executive Fleet"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full text-secondary font-bold">
                {activeGalleryIndex + 1} / {modalPhotos.length} Photos
              </span>
              <button
                type="button"
                onClick={() => setGalleryVehicle(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Main Stage with High-Res Image & Prev/Next Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-3 max-w-6xl mx-auto w-full">
            {modalPhotos.length > 0 ? (
              <img
                src={modalPhotos[activeGalleryIndex]}
                alt={`Photo ${activeGalleryIndex + 1}`}
                className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              />
            ) : (
              <div className="text-white/60 text-sm">No photos available</div>
            )}

            {modalPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveGalleryIndex((prev) =>
                      prev > 0 ? prev - 1 : modalPhotos.length - 1
                    )
                  }
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-secondary text-white flex items-center justify-center transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined text-2xl">
                    chevron_left
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveGalleryIndex((prev) =>
                      prev < modalPhotos.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-secondary text-white flex items-center justify-center transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined text-2xl">
                    chevron_right
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip & Reserve Action */}
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-2xl py-1">
              {modalPhotos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveGalleryIndex(i)}
                  className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    activeGalleryIndex === i
                      ? "border-secondary scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Direct Reserve Button */}
            <button
              type="button"
              onClick={() => {
                const vid = galleryVehicle.id;
                setGalleryVehicle(null);
                handleReserve(vid);
              }}
              className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <span>Reserve This Vehicle (₦{Number(galleryVehicle.daily_rate_ngn).toLocaleString()}/day)</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
