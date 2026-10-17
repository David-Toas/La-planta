"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/context/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { supabase, Vehicle } from "@/lib/supabase";
import { backendApi } from "@/lib/api";

interface GalleryItem {
  url: string;
  alt: string;
  caption?: string;
  tag?: string;
}

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJkYRdhTwQ3X1F8Z2ZGSdwfKFwBPuaHl6qrwbkJyoaRwK1WQPv6tPBoXiyUrjmYwpsEyNtVGIHlXjCoaIeErWu8OCjR96Ipmvt9_73IffGUA6X8Yxo-WNSICQ1BRdCjAIteK1aN-_igKwgSv70KxYSaAeigakxSTSQ6KLYK11UWwrtZLffHbnqYyNA876gtzoWZIC_Wkm9J6wngxIWdcVEISmIj1G9ZDPOR4hc-YcOsOOoxCjZ03Q9",
    alt: "Luxurious black Range Rover Autobiography LWB 2024 parked seamlessly on private jet airside runway tarmac at sunset next to a sleek private executive aircraft and presidential private terminal, golden warm light illuminating sleek metallic surfaces and red carpet boarding.",
    caption: "Murtala Muhammed VIP Terminal • Lagos",
    tag: "VIP Airport Pickup",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhdtKQUAyW3EbCEGGsJh5TTgYE7bq1zXG_vkGmZRd5GBZNpyidnAzvYn8I4POQp0dQmoFLOicQXjsSs3Ak5kCo4b0zZd9TD4YHDzqv5OmagreIH2LihjIDHKGCymML5iPSXyVqvky0PUP3LPhytGnL5zN0Wq_DovtPg1HnKhihguaHNuu8qWkU-WuGUOijB4ldH3koXViqAeSecYvXrYT6YbLS0g0bqAf-62ukM6ptgcdMlwr6KXmm",
    alt: "Luxurious black Range Rover Autobiography LWB 2024 parked seamlessly on private jet airside runway tarmac at sunset next to a sleek private executive aircraft.",
    caption: "Airside Executive Runway Positioning",
    tag: "Exterior Silhouette",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEYZSMD7r0J8_k8hlMk24b89_4m5dOaKd-sCoITTB97bjI6reYv_rpnl5Yyl9BH1QKGZoreob1zPWHfVb9Yg1993LBTWKKYCD9vA6X8yyaiM08vH2AdCWMV9lVLQQ2qhxhqB5LjY1ZtWPV-F5ZGCiHaFOOi7F9Al-u2gvPc4QjoJwE2OuamQvMJAvrO0plswFTQjqMCwbsTYVeDd7X4CeaAF1D1s-REFmoSK8XTPSFfsUnByCPeVOn",
    alt: "Sumptuous tan semi-aniline leather rear executive lounge seating in a 2024 Range Rover Autobiography LWB with deployed motorized veneer tray table, refrigerated champagne cooler, and crystal glasses.",
    caption: "Rear Executive First-Class Lounge",
    tag: "Cabin Luxury",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRS8nUzHOSmJinbFzevVfXkM5Ag4aeqg_VETI_mRrhxw98UcYq7NRPLk7utxIMIdHb92NAS5s89dV8qBFx_X4T0ePPOnWCertCx3cfdq-FCFiYrDGaaXrtUKFO_CxDZlZg-YWQa6q44xt843yIDD6TjbUU5-0SAO-Awh5JnbfT4RXG93MyvpVeh7P5cREuf5ioAIR2-iYvneeS-PTcxjWtalSFVYdaQqX7xUI-zHzl9Adp87Y0aQKB",
    alt: "Spacious open trunk of Range Rover Autobiography holding four large dark aluminum Rimowa luxury travel suitcases with bespoke luggage organization and soft ambient cargo lighting.",
    caption: "1,050L Luggage Threshold • 4 Large Cases",
    tag: "Luggage Capacity",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB63CX73tDnoDJbj9lFqLCA4tXXkZn5P5k_A3D6Q7lCUN0UJAbvIwbvEtJ5cZa3ZB19jXAq-IJCTC2_ckdbeBAQ0aK7X4uqydnqoYw2Z67W7ZEqenMgpV0lIbOOJ4QMs4hvUXA48DMPnS_0rw5qDuVnc3jUEyN_LTwlIV3omTp8ccIJ27ylP093HFXlUh2m0hMrjgb56U4qGZ0EGXpNn17NXzq1tWiOak0P-lEjMotu0ySHk2XAxifP",
    alt: "Minimalist driver cockpit and front cabin dashboard of modern luxury SUV featuring curved digital glass display, natural dark walnut wood accents, and high-tech satellite telematics.",
    caption: "Digital Cockpit & Advanced Telematics",
    tag: "Driver Suite",
  },
];

function VehicleDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdParam =
    searchParams.get("vehicleId") || searchParams.get("id");
  const { user, openAuthModal } = useAuth();

  // Vehicle Data State
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gallery & Slideshow State
  const [galleryItems, setGalleryItems] =
    useState<GalleryItem[]>(DEFAULT_GALLERY);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch Vehicle by ID if provided
  useEffect(() => {
    if (!vehicleIdParam) return;

    const fetchVehicle = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", vehicleIdParam)
          .single();

        if (!error && data) {
          const v = data as Vehicle;
          setVehicle(v);

          // Build photos array from vehicle hero and gallery URLs
          const photos = [
            v.hero_image_url,
            ...(v.gallery_image_urls || []),
          ].filter(Boolean) as string[];

          if (photos.length > 0) {
            const mapped: GalleryItem[] = photos.map((url, i) => ({
              url,
              alt: `${v.name || v.model} view ${i + 1}`,
              caption:
                i === 0
                  ? `${v.current_location_name || "Murtala Muhammed VIP Terminal"} • Lagos`
                  : `${v.name || v.model} Feature Angle ${i + 1}`,
              tag: i === 0 ? "Flagship View" : `Gallery View ${i + 1}`,
            }));
            setGalleryItems(mapped);
            setActiveImageIndex(0);
          }
        }
      } catch (err) {
        console.error("Error fetching vehicle details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleIdParam]);

  // Auto-scroll slideshow every 3.5 seconds when there are multiple photos
  useEffect(() => {
    if (galleryItems.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % galleryItems.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [galleryItems.length, isPaused]);

  // Manual Previous/Next Controls
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    setActiveImageIndex((prev) =>
      prev > 0 ? prev - 1 : galleryItems.length - 1,
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    setActiveImageIndex((prev) =>
      prev < galleryItems.length - 1 ? prev + 1 : 0,
    );
  };

  // Pricing
  const dailyRateNgn = vehicle
    ? Number(vehicle.daily_rate_ngn) || 620000
    : 620000;
  const dailyRateUsd = vehicle?.daily_rate_usd
    ? Number(vehicle.daily_rate_usd)
    : Math.round(dailyRateNgn / 1400);

  const vehicleName =
    vehicle?.name || "Range Rover Autobiography Long Wheelbase";
  const vehicleCategory = vehicle?.category || "First-Class SUVs";
  const vehicleYear = vehicle?.year || 2024;
  const vehicleSeats = vehicle?.seats || 4;
  const vehicleLuggage = vehicle?.luggage_capacity || 4;

  const handleReserve = (destination?: string) => {
    const targetUrl =
      destination ||
      `/checkout?vehicleId=${vehicle?.id || "a1b2c3d4-e5f6-7890-abcd-111111111111"}`;
    if (user) {
      router.push(targetUrl);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("laPlanta_intended_destination", targetUrl);
      }
      openAuthModal();
    }
  };

  const currentImage = galleryItems[activeImageIndex] || galleryItems[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="w-full pt-16 lg:pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="flex flex-col w-full">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full">
            {/* Top Breadcrumbs & Classification Meta */}
            <nav className="flex items-center gap-2 mb-6">
              <Link
                className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors"
                href="/fleet"
              >
                Fleet Catalog
              </Link>
              <span className="text-secondary text-xs">/</span>
              <Link
                className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors"
                href="/fleet"
              >
                {vehicleCategory}
              </Link>
              <span className="text-secondary text-xs">/</span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                {vehicleName}
              </span>
            </nav>

            {/* Header Strip */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 mb-10 bg-gradient-to-r from-transparent via-surface-container-low to-transparent p-6 rounded-2xl">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {vehicle?.status === "reserved" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-label-sm uppercase tracking-wider font-bold border border-amber-300 shadow-sm">
                      <span className="material-symbols-outlined text-xs">
                        lock
                      </span>
                      Currently Reserved
                    </span>
                  ) : vehicle?.status === "in_transit" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-label-sm text-label-sm uppercase tracking-wider font-bold border border-blue-300 shadow-sm">
                      <span className="material-symbols-outlined text-xs">
                        directions_car
                      </span>
                      Currently On Charter
                    </span>
                  ) : vehicle?.status === "maintenance" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-label-sm text-label-sm uppercase tracking-wider font-bold border border-stone-300 shadow-sm">
                      <span className="material-symbols-outlined text-xs">
                        build
                      </span>
                      In Routine Service
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm">
                      <span className="material-symbols-outlined text-xs">
                        star
                      </span>
                      Flagship Luxury • Driver Included
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                    Model Year {vehicleYear}
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif mt-1">
                  {vehicleName}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  The executive choice for corporate leaders, private VIP
                  transit, weddings, and diaspora travelers navigating Victoria
                  Island, Ikoyi, Ikeja, and Abuja.
                </p>

                {/* Pricing & Proceed to Reservation Button (under vehicle description) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 mt-1 border-t border-surface-container/60">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-md text-2xl sm:text-3xl font-serif text-primary font-bold">
                      ₦{dailyRateNgn.toLocaleString()}
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant">
                      / day
                    </span>
                    <span className="font-label-sm text-xs text-secondary bg-secondary-fixed/50 px-2.5 py-0.5 rounded-full font-semibold ml-1">
                      ≈ ${dailyRateUsd.toLocaleString()} USD
                    </span>
                  </div>

                  {vehicle?.status === "reserved" ? (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-100 text-amber-800 font-label-md text-sm uppercase tracking-wider font-semibold border border-amber-300 cursor-not-allowed shrink-0"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        lock
                      </span>
                      <span>Currently Reserved</span>
                    </button>
                  ) : vehicle?.status === "in_transit" ? (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-100 text-blue-800 font-label-md text-sm uppercase tracking-wider font-semibold border border-blue-300 cursor-not-allowed shrink-0"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        directions_car
                      </span>
                      <span>Currently On Charter</span>
                    </button>
                  ) : vehicle?.status === "maintenance" ? (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-stone-100 text-stone-600 font-label-md text-sm uppercase tracking-wider font-semibold border border-stone-300 cursor-not-allowed shrink-0"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        build
                      </span>
                      <span>In Routine Service</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReserve()}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-label-md text-sm uppercase tracking-wider font-semibold shadow-md hover:bg-secondary transition-all duration-300 group cursor-pointer active:scale-95 shrink-0"
                      type="button"
                    >
                      <span>Proceed to Reservation</span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:text-secondary font-label-md text-label-md uppercase tracking-wider shadow-sm transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    share
                  </span>
                  Share Vehicle
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:text-secondary font-label-md text-label-md uppercase tracking-wider shadow-sm transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    download
                  </span>
                  Download Spec Sheet
                </button>
              </div>
            </div>

            {/* Main Full-Width Content Layout */}
            <div className="flex flex-col gap-12 max-w-5xl mx-auto w-full">
                {/* Primary Gallery Showcase */}
                <section className="flex flex-col gap-4">
                  {/* Big Card Main Showcase with Smooth Transition & Auto-Scroll */}
                  <div
                    className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl bg-surface-container-high group select-none cursor-pointer"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                  >
                    {/* Active Main Image */}
                    <img
                      key={activeImageIndex}
                      id="main-gallery-view"
                      src={currentImage.url}
                      alt={currentImage.alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Ambient Luxury Dark Gradient Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Previous & Next Chevron Controls (Visible on hover/touch) */}
                    {galleryItems.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          aria-label="Previous photo"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-secondary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl z-20 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-2xl">
                            chevron_left
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          aria-label="Next photo"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-secondary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl z-20 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-2xl">
                            chevron_right
                          </span>
                        </button>
                      </>
                    )}

                    {/* Bottom Info Bar & High-Contrast Luminous Gallery Badge */}
                    <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between text-white z-10 pointer-events-none">
                      <div className="flex flex-col pr-4">
                        <span className="font-label-sm text-label-sm uppercase tracking-widest text-[#fedeb2] font-semibold drop-shadow-sm">
                          {currentImage.tag || "Executive Suite"}
                        </span>
                        <span className="font-title-lg text-title-lg font-serif text-white drop-shadow-md">
                          {currentImage.caption || `${vehicleName} • Lagos`}
                        </span>
                      </div>

                      {/* FIXED High-Contrast Gallery Badge */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-xl pointer-events-auto shrink-0">
                        <span className="material-symbols-outlined text-sm text-[#fedeb2]">
                          photo_camera
                        </span>
                        <span className="font-semibold text-xs tracking-wide text-white drop-shadow-sm">
                          Gallery {activeImageIndex + 1} / {galleryItems.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnails Row (All Photos Included with Synchronized Active Border) */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {galleryItems.map((item, idx) => {
                      const isActive = activeImageIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveImageIndex(idx);
                            setIsPaused(true);
                          }}
                          aria-label={`View photo ${idx + 1}`}
                          className={`relative aspect-[4/3] rounded-xl overflow-hidden p-0.5 shadow-sm focus:outline-none transition-all duration-300 ${
                            isActive
                              ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface scale-[1.03] shadow-md opacity-100"
                              : "bg-surface-container-low opacity-60 hover:opacity-100 hover:-translate-y-0.5"
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.alt}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-secondary/15 pointer-events-none rounded-lg" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Executive Specification Matrix (Bento style) */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline-sm text-headline-sm text-primary font-serif">
                      Executive Architecture
                    </h2>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                      Vehicle Specifications
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">
                            airline_seat_recline_extra
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                          First-Class 2+2
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">
                          Seating Architecture
                        </span>
                        <span className="font-title-lg text-title-lg text-primary block">
                          {vehicleSeats} Executive Guests
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Full rear business lounge with 24-way heated,
                          ventilated, and hot stone massage recline functions.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">
                            luggage
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
                          1,050 L Capacity
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">
                          Luggage Threshold
                        </span>
                        <span className="font-title-lg text-title-lg text-primary block">
                          {vehicleLuggage} Large + 2 Cabin Cases
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Engineered to accommodate {vehicleLuggage} large
                          travel cases alongside executive carry-ons with ease.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">
                            tune
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">
                          Dynamic Response Pro
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">
                          Chassis Dynamics
                        </span>
                        <span className="font-title-lg text-title-lg text-primary block">
                          Electronic Air Suspension
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Active noise cancellation embedded headrests creating
                          an acoustically isolated, ultra-quiet cabin.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">
                            wifi
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                          Executive Suite
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">
                          Cabin Telematics
                        </span>
                        <span className="font-title-lg text-title-lg text-primary block">
                          5G Satellite Wi-Fi &amp; Dual Screens
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          1,600W Meridian Signature Sound system with center
                          refrigerated console cooling drinks to 5°C.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Chauffeur Spotlight & Standard Inclusions */}
                <section className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline-sm text-headline-sm text-primary font-serif">
                      What&apos;s Included
                    </h2>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                      Included as Standard
                    </span>
                  </div>

                  {/* Chauffeur Spotlight Card */}
                  <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative shrink-0">
                      <img
                        className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm ring-4 ring-surface-container"
                        alt="Professional executive chauffeur in sharp suit"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuARWL88DqVjPu6K1BUp45G3KXKtvIZO9Mpj_OTa3gML8ead26fnpNmIPB6cBv9vpI0DmmpMki4rLmd_QkFefTyqTpe-6e8wza91aBrnqegeMn8l6j9WcWBR2rg1pdhZcKQkEfBJbYbIvlqhBe05T196C2O8yayDNQ8RPAj3U8LT12JpleUzqLpeOzsAamJlmJKm_8Zm7tA8KcPhP_eP-FwVDcEi2_Rn4n57rIAjQ0yZ69rNFQqkYDIB"
                      />
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-secondary text-white font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                        Vetted Driver
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-title-lg text-title-lg text-primary block">
                            Professional Dedicated Chauffeur
                          </span>
                          <span className="font-body-sm text-body-sm text-secondary">
                            Defensive Driving Certified • Bilingual (English /
                            French)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-secondary">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-sm"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                          ))}
                          <span className="font-label-sm text-label-sm text-on-surface font-bold ml-1">
                            5.0
                          </span>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Every booking includes a formally attired, professional
                        driver trained in executive transit, defensive driving,
                        route optimization, and discreet client care across
                        Lagos and Abuja.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface">
                          <span className="material-symbols-outlined text-xs text-secondary">
                            verified
                          </span>
                          Vetted &amp; Background Checked
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface">
                          <span className="material-symbols-outlined text-xs text-secondary">
                            security
                          </span>
                          Defensive Driving Certified
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface">
                          <span className="material-symbols-outlined text-xs text-secondary">
                            lock
                          </span>
                          Strict Confidentiality
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feature Inclusions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm">
                        <span className="material-symbols-outlined text-lg">
                          person_pin
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-primary">
                          Dedicated Chauffeur
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Defensively trained, licensed professional driver with
                          complete route mastery.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm">
                        <span className="material-symbols-outlined text-lg">
                          shield
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-primary">
                          Comprehensive Insurance
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Full passenger liability, comprehensive collision
                          cover, and 24/7 roadside backup.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm">
                        <span className="material-symbols-outlined text-lg">
                          satellite_alt
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-primary">
                          24/7 Telematics
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Real-time GPS tracking sync and 24/7 fleet operations
                          support.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm">
                        <span className="material-symbols-outlined text-lg">
                          water_drop
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-primary">
                          Complimentary In-Cabin Refreshments
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Chilled premium bottled water, refreshing wipes,
                          mints, and multi-device fast charging cables.
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Bottom Reservation Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-lg gap-6 mt-4">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block">
                      Ready to Charter
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-serif text-primary mt-1">
                      {vehicleName}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Includes vetted executive chauffeur, fuel reserve, and 24/7 telematics monitoring.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-headline-md text-2xl font-serif text-primary font-bold">
                        ₦{dailyRateNgn.toLocaleString()}
                      </div>
                      <span className="font-label-sm text-xs text-on-surface-variant">/ day</span>
                    </div>
                    {vehicle?.status === "reserved" ? (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-100 text-amber-800 font-label-md text-sm uppercase tracking-wider font-semibold border border-amber-300 cursor-not-allowed"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          lock
                        </span>
                        <span>Currently Reserved</span>
                      </button>
                    ) : vehicle?.status === "in_transit" ? (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-100 text-blue-800 font-label-md text-sm uppercase tracking-wider font-semibold border border-blue-300 cursor-not-allowed"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          directions_car
                        </span>
                        <span>Currently On Charter</span>
                      </button>
                    ) : vehicle?.status === "maintenance" ? (
                      <button
                        disabled
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-stone-100 text-stone-600 font-label-md text-sm uppercase tracking-wider font-semibold border border-stone-300 cursor-not-allowed"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          build
                        </span>
                        <span>In Routine Service</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReserve()}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-label-md text-sm uppercase tracking-wider font-semibold shadow-md hover:bg-secondary transition-all duration-300 group cursor-pointer active:scale-95"
                        type="button"
                      >
                        <span>Proceed to Reservation</span>
                        <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Booking Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden p-3 bg-[#0a0d14]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-8px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
            Daily Charter
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white font-serif">
              ₦{dailyRateNgn.toLocaleString()}
            </span>
            <span className="text-[10px] text-stone-400">/day</span>
          </div>
        </div>
        {vehicle?.status === "reserved" ? (
          <button
            disabled
            type="button"
            className="px-6 py-2.5 rounded-xl bg-amber-200/90 text-amber-900 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Reserved</span>
          </button>
        ) : vehicle?.status === "in_transit" ? (
          <button
            disabled
            type="button"
            className="px-6 py-2.5 rounded-xl bg-blue-200/90 text-blue-900 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">directions_car</span>
            <span>On Charter</span>
          </button>
        ) : vehicle?.status === "maintenance" ? (
          <button
            disabled
            type="button"
            className="px-6 py-2.5 rounded-xl bg-stone-200/90 text-stone-800 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">build</span>
            <span>In Service</span>
          </button>
        ) : (
          <button
            onClick={() => handleReserve()}
            type="button"
            className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <span>Reserve Now</span>
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function VehicleDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-serif text-primary">
              Loading Vehicle Suite...
            </span>
          </div>
        </div>
      }
    >
      <AuthGuard
        fallbackTitle="VIP Fleet Portfolio Access"
        fallbackDescription="Vehicle technical specifications and concierge reservation suites are reserved for authenticated private clients."
      >
        <VehicleDetailsContent />
      </AuthGuard>
    </Suspense>
  );
}
