"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { backendApi } from "@/lib/api";
import { supabase, Vehicle } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { VehicleCard } from "@/components/vehicle-card";
import { cn } from "@/lib/utils";

function FleetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();

  // Sync handover mode from query or sessionStorage
  useEffect(() => {
    const handover = searchParams?.get("handover");
    if (handover && typeof window !== "undefined") {
      sessionStorage.setItem("laPlanta_handover_mode", handover);
    }
  }, [searchParams]);

  // Handle Reserve with User Authentication Check and Handover Sync
  const handleReserve = (vehicleId: string) => {
    const handover =
      searchParams?.get("handover") ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("laPlanta_handover_mode")
        : null) ||
      "office";
    const destination = `/checkout?vehicleId=${vehicleId}&handover=${handover}`;
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

  // Pagination State (Limit 12 fleets per page)
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const fleetGridRef = useRef<HTMLDivElement>(null);

  // Automatically reset to Page 1 when any filter or sorting criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCapacity, maxPrice, sortBy]);

  // Fetch Live Available Fleet Data (excluding reserved / booked units)
  useEffect(() => {
    const fetchFleet = async () => {
      setIsLoading(true);
      try {
        // Query active/confirmed bookings to ensure reserved/chartered cars are hidden
        const { data: activeBookings } = await supabase
          .from("bookings")
          .select("vehicle_id, status")
          .in("status", ["confirmed", "in_transit", "pending"]);

        const bookedVehicleIds = new Set(
          (activeBookings || []).map((b) => b.vehicle_id).filter(Boolean),
        );

        const filterAvailable = (list: Vehicle[]) =>
          list.filter(
            (v) => v.status === "available" && !bookedVehicleIds.has(v.id),
          );

        // 1. Try Express backend
        const res = await backendApi.getFleet();
        if (
          res?.success &&
          Array.isArray(res.vehicles) &&
          res.vehicles.length > 0
        ) {
          setVehicles(filterAvailable(res.vehicles));
          setIsLoading(false);
          return;
        }

        // 2. Direct Supabase Fallback
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("status", "available")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setVehicles(filterAvailable(data as Vehicle[]));
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
    setCurrentPage(1);
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
      // Default: prioritize available vehicles
      const aAvail = a.status === "available" ? 0 : 1;
      const bAvail = b.status === "available" ? 0 : 1;
      return aAvail - bAvail;
    });

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVehicles = filteredVehicles.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (fleetGridRef.current) {
      fleetGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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

      <main className="w-full pt-16 lg:pt-20 bg-surface flex-1">
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
                  {filteredVehicles.length > 0
                    ? `Showing ${startIndex + 1}–${Math.min(startIndex + ITEMS_PER_PAGE, filteredVehicles.length)} of ${filteredVehicles.length}`
                    : "0 units"}
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

            {/* Mobile Category Quick Chips (Touch app feel) */}
            <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 -mx-1 px-1">
              {[
                { label: "All Fleet", value: "All" },
                { label: "Sedans", value: "Sedans" },
                { label: "SUVs", value: "SUVs" },
                { label: "Armored", value: "Armored" },
                { label: "Vans", value: "Executive Vans" },
              ].map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedCategory(chip.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === chip.value
                      ? "bg-primary text-secondary-fixed shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-surface-container"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
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
            <div ref={fleetGridRef} className="flex flex-col gap-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedVehicles.map((vehicle) => (
                  <VehicleCard
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

              {/* Luxury Obsidian & Gold Pagination Controls */}
              {totalPages > 1 && (
                <div className="w-full bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-sm border border-black/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <div className="text-xs text-on-surface-variant font-medium">
                    Showing{" "}
                    <span className="font-bold text-primary font-mono">
                      {startIndex + 1}
                    </span>
                    –
                    <span className="font-bold text-primary font-mono">
                      {Math.min(startIndex + ITEMS_PER_PAGE, filteredVehicles.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-primary font-mono">
                      {filteredVehicles.length}
                    </span>{" "}
                    luxury units (12 per page)
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Page Button */}
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-surface-container bg-surface-container-low text-primary transition-all hover:bg-secondary-fixed/50 hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                      <span>Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => {
                          const isCurrent = pageNum === safeCurrentPage;
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => handlePageChange(pageNum)}
                              className={cn(
                                "w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center font-mono shadow-sm",
                                isCurrent
                                  ? "bg-primary text-white shadow-md scale-105"
                                  : "bg-surface-container-lowest border border-surface-container text-on-surface hover:bg-secondary-fixed/50 hover:border-secondary/30",
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                    </div>

                    {/* Next Page Button */}
                    <button
                      type="button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-surface-container bg-surface-container-low text-primary transition-all hover:bg-secondary-fixed/50 hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <span>Next</span>
                      <span className="material-symbols-outlined text-sm">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              )}
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

export default function FleetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FleetContent />
    </Suspense>
  );
}
