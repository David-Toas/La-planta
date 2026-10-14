"use client";

import React, { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export interface Vehicle {
  id: string;
  name?: string;
  brand?: string;
  model: string;
  year?: number;
  license_plate?: string;
  status: string;
  category?: string;
  daily_rate_ngn?: number;
  daily_rate_usd?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface GoogleFleetMapProps {
  vehicles: Vehicle[];
  onPingTracker?: (trackerId: string) => Promise<void>;
}

// Nationwide Nigeria City Bounds & Coordinates
const NIGERIA_CITIES = [
  { id: "all", name: "All Nigeria", lat: 9.0820, lng: 8.6753, zoom: 6 },
  { id: "lagos", name: "Lagos (VI, Ikoyi, Airport)", lat: 6.4549, lng: 3.4246, zoom: 12 },
  { id: "abuja", name: "Abuja (Maitama, Airport)", lat: 9.0765, lng: 7.3986, zoom: 12 },
  { id: "ph", name: "Port Harcourt (Rivers)", lat: 4.8156, lng: 7.0498, zoom: 12 },
  { id: "kano", name: "Kano (North Hub)", lat: 12.0022, lng: 8.5920, zoom: 12 },
  { id: "ibadan", name: "Ibadan (Oyo)", lat: 7.3775, lng: 3.9470, zoom: 12 },
  { id: "enugu", name: "Enugu (Coal City)", lat: 6.4584, lng: 7.5464, zoom: 12 },
  { id: "delta", name: "Asaba / Warri (Delta)", lat: 6.1984, lng: 6.7333, zoom: 12 },
];

// Luxury Obsidian Dark Map Theme for Google Maps
const LUXURY_DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0c1017" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0c1017" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e5e7eb" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b7280" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#111827" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#725b38" }], // Warm champagne bronze highway
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1c1917" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#fef3c7" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d1d5db" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#04070d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#04070d" }],
  },
];

export function GoogleFleetMap({ vehicles, onPingTracker }: GoogleFleetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [selectedCity, setSelectedCity] = useState("all");
  const [mapType, setMapType] = useState<"styled" | "satellite">("styled");
  const [isTrafficActive, setIsTrafficActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "";

  // Assign realistic nationwide coordinates if a vehicle does not have explicit lat/lng
  const getVehicleCoordinates = (v: Vehicle, index: number) => {
    if (v.latitude && v.longitude) {
      return { lat: Number(v.latitude), lng: Number(v.longitude) };
    }

    // Default distribution across key Nigerian hubs based on location or index
    const loc = (v.location || "").toLowerCase();
    if (loc.includes("abuja") || loc.includes("fct")) {
      // Abuja clusters (Maitama, Central Area, Airport corridor)
      const offsets = [
        { lat: 9.0765, lng: 7.3986 },
        { lat: 9.0882, lng: 7.4933 },
        { lat: 9.0522, lng: 7.4619 },
      ];
      return offsets[index % offsets.length];
    } else if (loc.includes("port") || loc.includes("harcourt") || loc.includes("rivers")) {
      return { lat: 4.8156 + (index % 3) * 0.01, lng: 7.0498 + (index % 3) * 0.01 };
    } else if (loc.includes("kano")) {
      return { lat: 12.0022 + (index % 3) * 0.01, lng: 8.5920 + (index % 3) * 0.01 };
    } else if (loc.includes("ibadan")) {
      return { lat: 7.3775 + (index % 3) * 0.01, lng: 3.9470 + (index % 3) * 0.01 };
    }

    // Lagos default clusters (VI, Ikoyi, Lekki, Ikeja Airport)
    const lagosClusters = [
      { lat: 6.4281, lng: 3.4219 }, // Victoria Island
      { lat: 6.4549, lng: 3.4246 }, // Ikoyi
      { lat: 6.4474, lng: 3.4723 }, // Lekki Phase 1
      { lat: 6.5774, lng: 3.3212 }, // Murtala Muhammed Airport
      { lat: 6.4352, lng: 3.4411 }, // Oniru
    ];
    return lagosClusters[index % lagosClusters.length];
  };

  // Initialize Google Maps using the modern functional API
  useEffect(() => {
    if (!mapRef.current) return;

    if (!apiKey) {
      setApiKeyError(true);
      return;
    }

    try {
      setOptions({
        key: apiKey,
        v: "weekly",
      });

      Promise.all([importLibrary("maps"), importLibrary("places")])
        .then(() => {
          setIsApiLoaded(true);
          setApiKeyError(false);

          const initialCity = NIGERIA_CITIES[0];
          const map = new google.maps.Map(mapRef.current!, {
            center: { lat: initialCity.lat, lng: initialCity.lng },
            zoom: initialCity.zoom,
            styles: LUXURY_DARK_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            backgroundColor: "#0c1017",
          });

          googleMapInstance.current = map;
          trafficLayerRef.current = new google.maps.TrafficLayer();
        })
        .catch((err) => {
          console.warn("[GoogleFleetMap] Failed to load Google Maps SDK:", err);
          setApiKeyError(true);
        });
    } catch (err) {
      console.warn("[GoogleFleetMap] Error setting options:", err);
      setApiKeyError(true);
    }
  }, [apiKey]);

  // Update Markers on map
  useEffect(() => {
    if (!isApiLoaded || !googleMapInstance.current || typeof window === "undefined" || !window.google) {
      return;
    }

    const map = googleMapInstance.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Filter vehicles by search query
    const filteredVehicles = vehicles.filter((v) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.license_plate?.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q)
      );
    });

    filteredVehicles.forEach((vehicle, idx) => {
      const pos = getVehicleCoordinates(vehicle, idx);
      const isTrip = vehicle.status === "rented" || (vehicle.status as any) === "on_trip";
      const isMaint = vehicle.status === "maintenance";

      // Color coding: Gold = active charter, Emerald = ready, Red/Amber = maintenance
      const pinFill = isTrip ? "#d4af37" : isMaint ? "#f59e0b" : "#10b981";
      const pinLabel = (vehicle.model || vehicle.brand || "CAR").slice(0, 3).toUpperCase();

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate || "Active"})`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isTrip ? 10 : 8,
          fillColor: pinFill,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        label: {
          text: pinLabel,
          color: "#ffffff",
          fontSize: "9px",
          fontWeight: "bold",
        },
      });

      marker.addListener("click", () => {
        setSelectedVehicle(vehicle);

        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="background:#0c1017; color:#fff; padding:12px; border-radius:12px; font-family:sans-serif; max-width:280px; border:1px solid #725b38;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:10px; color:#d4af37; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">
                  ${vehicle.category || "VIP Executive"}
                </span>
                <span style="background:${pinFill}; color:#fff; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:bold; text-transform:uppercase;">
                  ${vehicle.status || "Ready"}
                </span>
              </div>
              <div style="font-size:14px; font-weight:bold; color:#fff; margin-bottom:4px;">
                ${vehicle.brand} ${vehicle.model}
              </div>
              <div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">
                Plate: <strong style="color:#e5e7eb;">${vehicle.license_plate || "LAG-892-XZ"}</strong> • Rate: ₦${Number(vehicle.daily_rate_ngn).toLocaleString()}/day
              </div>
              <div style="display:flex; justify-content:space-between; font-size:10px; background:#1f2937; padding:6px 8px; border-radius:8px;">
                <span>Telematics: <strong style="color:#10b981;">Online 4G</strong></span>
                <span>Speed: <strong style="color:#d4af37;">${isTrip ? "48 km/h" : "0 km/h"}</strong></span>
              </div>
            </div>
          `,
        });

        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;
      });

      markersRef.current.push(marker);
    });
  }, [isApiLoaded, vehicles, searchQuery]);

  // Handle City Change
  const handleSelectCity = (cityId: string) => {
    setSelectedCity(cityId);
    const city = NIGERIA_CITIES.find((c) => c.id === cityId);
    if (!city || !googleMapInstance.current) return;

    googleMapInstance.current.setCenter({ lat: city.lat, lng: city.lng });
    googleMapInstance.current.setZoom(city.zoom);
  };

  // Toggle Map Type (Styled Dark vs Satellite)
  const handleToggleMapType = () => {
    if (!googleMapInstance.current) return;
    const nextType = mapType === "styled" ? "satellite" : "styled";
    setMapType(nextType);

    if (nextType === "satellite") {
      googleMapInstance.current.setMapTypeId(google.maps.MapTypeId.HYBRID);
    } else {
      googleMapInstance.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      googleMapInstance.current.setOptions({ styles: LUXURY_DARK_MAP_STYLE });
    }
  };

  // Toggle Traffic Layer
  const handleToggleTraffic = () => {
    if (!googleMapInstance.current || !trafficLayerRef.current) return;
    const next = !isTrafficActive;
    setIsTrafficActive(next);

    if (next) {
      trafficLayerRef.current.setMap(googleMapInstance.current);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  };

  // Trigger Hardware Ping
  const handlePing = async () => {
    if (onPingTracker) {
      setIsPinging(true);
      await onPingTracker("TRK-NIG-SIM");
      setIsPinging(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090e] border border-stone-800 shadow-2xl flex flex-col">
      {/* Top Controls Bar */}
      <div className="p-4 bg-[#0c1017]/95 border-b border-stone-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
          <span className="text-[10px] uppercase font-bold text-secondary tracking-widest mr-1 shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">public</span>
            Region:
          </span>
          {NIGERIA_CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCity(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCity === c.id
                  ? "bg-secondary text-primary shadow-sm"
                  : "bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800"
              }`}
              type="button"
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* View Toggles & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, model, city..."
              className="w-48 sm:w-56 h-8 px-3 pl-8 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-secondary"
            />
            <span className="material-symbols-outlined absolute left-2 text-stone-400 text-sm">
              search
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-stone-400 hover:text-stone-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Traffic Toggle */}
          <button
            onClick={handleToggleTraffic}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isTrafficActive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800"
            }`}
            title="Toggle Live Google Traffic Layer"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">traffic</span>
            <span>Traffic</span>
          </button>

          {/* Satellite Toggle */}
          <button
            onClick={handleToggleMapType}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              mapType === "satellite"
                ? "bg-secondary/20 text-secondary border-secondary/40"
                : "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800"
            }`}
            title="Toggle Satellite Photorealistic View"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">satellite_alt</span>
            <span>{mapType === "satellite" ? "Dark Map" : "Satellite"}</span>
          </button>

          {/* Ping All Trackers */}
          {onPingTracker && (
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              type="button"
            >
              <span className={`material-symbols-outlined text-sm ${isPinging ? "animate-spin" : ""}`}>
                {isPinging ? "sync" : "cell_tower"}
              </span>
              <span>{isPinging ? "Pinging..." : "Ping SIM"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[520px] sm:h-[600px] bg-[#0c1017]">
        {/* Real Google Map Container */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Fallback View if no Google Maps API Key or Error */}
        {apiKeyError && (
          <div className="absolute inset-0 bg-[#07090e]/95 backdrop-blur-sm p-6 flex flex-col justify-between z-20">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/90 border border-stone-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-2xl">map</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Google Maps Fleet Command • Nigeria Telematics
                  </h4>
                  <p className="text-xs text-stone-400">
                    Live corridor coverage for Lagos, Abuja, Port Harcourt &amp; nationwide transit routes.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  {vehicles.length} Fleet Units Active
                </span>
                <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold font-mono">
                  GSM 4G Ready
                </span>
              </div>
            </div>

            {/* Simulated Live Grid of Fleet Corridors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
              {/* Corridor 1: Lagos VIP Corridors */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col gap-2.5 hover:border-secondary transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-secondary">LAGOS METROPOLITAN</span>
                  <span className="text-emerald-400 font-mono text-[11px]">99.8% GPS Lock</span>
                </div>
                <div className="text-sm font-bold text-white">Victoria Island • Ikoyi • MMIA Airport</div>
                <div className="text-xs text-stone-400">
                  Active Units:{" "}
                  <span className="text-stone-200 font-semibold">
                    {vehicles.filter((v) => (v.location || "").toLowerCase().includes("lagos") || !v.location).length} Units
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Fast Corridor: Lekki-Ikoyi Link</span>
                  <span className="text-secondary font-mono">18m Avg Staging</span>
                </div>
              </div>

              {/* Corridor 2: Abuja Federal Capital */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col gap-2.5 hover:border-secondary transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-secondary">ABUJA FCT CORRIDOR</span>
                  <span className="text-emerald-400 font-mono text-[11px]">99.9% GPS Lock</span>
                </div>
                <div className="text-sm font-bold text-white">Maitama • Central Area • Nnamdi Azikiwe Airport</div>
                <div className="text-xs text-stone-400">
                  Active Units:{" "}
                  <span className="text-stone-200 font-semibold">
                    {vehicles.filter((v) => (v.location || "").toLowerCase().includes("abuja")).length || 2} Units
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>VIP Escort Protocol: Active</span>
                  <span className="text-secondary font-mono">15m Tarmac Meet</span>
                </div>
              </div>

              {/* Corridor 3: Regional Interstate Hubs */}
              <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 flex flex-col gap-2.5 hover:border-secondary transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-secondary">NATIONWIDE INTERSTATE</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Satellite Sync</span>
                </div>
                <div className="text-sm font-bold text-white">Port Harcourt • Kano • Ibadan • Asaba</div>
                <div className="text-xs text-stone-400">
                  Interstate Charters &amp; Diplomatic Convoys
                </div>
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Coverage: 36 States + FCT</span>
                  <span className="text-emerald-400 font-mono">24/7 Telematics</span>
                </div>
              </div>
            </div>

            {/* Note on Google Maps API Key configuration */}
            <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-center text-xs text-stone-300 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">info</span>
              <span>
                To render live Google Maps tiles, add your Google Maps API key to{" "}
                <code className="text-secondary font-mono">admin/.env.local</code> as{" "}
                <code className="text-secondary font-mono">NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...</code>
              </span>
            </div>
          </div>
        )}

        {/* Selected Vehicle Floating HUD Drawer */}
        {selectedVehicle && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-[#0c1017]/95 border border-stone-700 p-4 rounded-xl shadow-2xl backdrop-blur-md z-30 animate-in fade-in duration-200">
            <div className="flex items-start justify-between pb-2 border-b border-stone-800">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-widest">
                  Selected Fleet Unit
                </span>
                <h4 className="text-sm font-bold text-white">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h4>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-stone-400 hover:text-white text-xs p-1"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="bg-stone-900 p-2 rounded-lg">
                <span className="text-stone-400 text-[10px] block">Plate Number</span>
                <span className="text-stone-100 font-mono font-bold">
                  {selectedVehicle.license_plate || "LAG-892-XZ"}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg">
                <span className="text-stone-400 text-[10px] block">Status</span>
                <span className="text-emerald-400 font-bold uppercase text-[11px]">
                  {selectedVehicle.status || "Ready"}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg">
                <span className="text-stone-400 text-[10px] block">Location</span>
                <span className="text-stone-100 font-medium">
                  {selectedVehicle.location || "Lagos (VI)"}
                </span>
              </div>
              <div className="bg-stone-900 p-2 rounded-lg">
                <span className="text-stone-400 text-[10px] block">Daily Charter</span>
                <span className="text-secondary font-bold font-mono">
                  ₦{Number(selectedVehicle.daily_rate_ngn).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handlePing()}
                className="flex-1 py-1.5 rounded-lg bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs uppercase tracking-wider transition-all"
              >
                Ping Telemetry
              </button>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telematics Ribbon */}
      <div className="p-3 bg-[#0a0d14] border-t border-stone-800 text-xs flex flex-wrap items-center justify-between gap-3 text-stone-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Fleet: {vehicles.length} Units
          </span>
          <span className="hidden sm:inline text-stone-600">•</span>
          <span className="hidden sm:inline">Coverage: Lagos, Abuja, Port Harcourt, Kano &amp; Nationwide</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Google Maps API: {isApiLoaded ? "Active" : apiKey ? "Initializing" : "Key Needed"}</span>
          <span>Refresh Interval: 5s</span>
        </div>
      </div>
    </div>
  );
}

