"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Vehicle } from "@/lib/supabase";

export interface VehicleCardProps {
  vehicle: Vehicle;
  onOpenGallery?: (vehicle: Vehicle, index?: number) => void;
  onReserve: (vehicleId: string) => void;
}

/**
 * Interactive Auto-Scrolling Luxury Vehicle Card with Multi-Photo Carousel
 */
export function VehicleCard({
  vehicle,
  onOpenGallery,
  onReserve,
}: VehicleCardProps) {
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

  const handleImageClick = () => {
    if (onOpenGallery) {
      onOpenGallery(vehicle, currentIndex);
    }
  };

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
            onClick={handleImageClick}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-500 cursor-pointer"
            onClick={handleImageClick}
          >
            <span className="material-symbols-outlined text-5xl">directions_car</span>
            <span className="text-xs uppercase tracking-wider mt-1">Vehicle Image Pending</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {vehicle.status === "reserved" ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-md flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">lock</span>
              Reserved
            </span>
          ) : vehicle.status === "in_transit" ? (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-md flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">directions_car</span>
              On Charter
            </span>
          ) : isArmored ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-md flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">shield</span>
              {vehicle.armored_level}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-sm text-[10px] uppercase tracking-wider font-bold shadow-sm">
              {vehicle.category || "Executive"}
            </span>
          )}
        </div>

        {/* Photo Counter Pill */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenGallery) onOpenGallery(vehicle, currentIndex);
            }}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition-colors z-10 shadow-sm"
          >
            <span className="material-symbols-outlined text-xs">photo_camera</span>
            <span>
              {currentIndex + 1}/{photos.length}
            </span>
          </button>
        )}

        {/* Left & Right Chevron Buttons */}
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
            {vehicle.status === "reserved" ? (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                Reserved
              </span>
            ) : vehicle.status === "in_transit" ? (
              <span className="text-[10px] text-blue-800 font-bold bg-blue-100/90 border border-blue-300 px-2 py-0.5 rounded uppercase tracking-wider">
                On Charter
              </span>
            ) : vehicle.status === "maintenance" ? (
              <span className="text-[10px] text-stone-700 font-bold bg-stone-100 border border-stone-300 px-2 py-0.5 rounded uppercase tracking-wider">
                In Service
              </span>
            ) : (
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Ready
              </span>
            )}
          </div>
          <Link href={`/vehicle-details?vehicleId=${vehicle.id}`} className="hover:text-secondary transition-colors">
            <h3 className="font-serif text-xl sm:text-2xl text-primary font-semibold leading-snug truncate">
              {vehicleName}
            </h3>
          </Link>
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

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/vehicle-details?vehicleId=${vehicle.id}`}
            className="w-full h-10 rounded-xl bg-surface-container hover:bg-secondary-fixed text-primary text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Detail</span>
          </Link>

          {vehicle.status === "reserved" ? (
            <button
              type="button"
              disabled
              title="This vehicle is currently reserved"
              className="w-full h-10 rounded-xl bg-amber-100 text-amber-800/80 border border-amber-200 text-xs font-semibold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Reserved</span>
            </button>
          ) : vehicle.status === "in_transit" ? (
            <button
              type="button"
              disabled
              title="This vehicle is currently active on charter"
              className="w-full h-10 rounded-xl bg-blue-100 text-blue-800/80 border border-blue-200 text-xs font-semibold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">directions_car</span>
              <span>On Charter</span>
            </button>
          ) : vehicle.status === "maintenance" ? (
            <button
              type="button"
              disabled
              title="This vehicle is undergoing routine maintenance"
              className="w-full h-10 rounded-xl bg-stone-100 text-stone-600 border border-stone-200 text-xs font-semibold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">build</span>
              <span>In Service</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReserve(vehicle.id)}
              className="w-full h-10 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Reserve</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

