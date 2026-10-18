"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

interface GoogleTrackingMapProps {
  bookingCode?: string;
  vehicleTitle?: string;
  vehicleImage?: string;
  vehicleCategory?: string;
  plateNumber?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  originAddress?: string;
  destinationAddress?: string;
  destinationCoords?: { lat: number; lng: number };
  initialDriverCoords?: { lat: number; lng: number };
  onPingSim?: () => Promise<void>;
  isPingingSim?: boolean;
  onEtaUpdate?: (etaMinutes: number, distanceKm: number) => void;
}

// Luxury Obsidian Dark Theme for Google Maps
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
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#725b38" }], // Warm champagne gold highway
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
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#04070d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4b5563" }],
  },
];

export function GoogleTrackingMap({
  bookingCode = "LP-8842",
  vehicleTitle = "Range Rover Autobiography LWB",
  vehicleImage,
  vehicleCategory = "VIP Fleet Unit",
  plateNumber = "LAG-892-XZ",
  driverName = "Emmanuel Okafor",
  driverPhone = "+234 803 729 4810",
  driverAvatar,
  originAddress = "The Wings Towers, Ozumba Mbadiwe Ave, Victoria Island, Lagos",
  destinationAddress = "The Wheatbaker Hotel, 4 Onitolo Rd, Ikoyi, Lagos",
  destinationCoords = { lat: 6.4549, lng: 3.4326 },
  initialDriverCoords = { lat: 6.4352, lng: 3.4219 },
  onPingSim,
  isPingingSim = false,
  onEtaUpdate,
}: GoogleTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const carMarkerRef = useRef<google.maps.Marker | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeCoordsRef = useRef<{ lat: number; lng: number }[]>([]);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [mapType, setMapType] = useState<"dark" | "satellite">("dark");
  const [isTrafficActive, setIsTrafficActive] = useState(false);
  const [isDriverMinimized, setIsDriverMinimized] = useState(false);

  // Live telemetry state
  const [currentSpeed, setCurrentSpeed] = useState(42);
  const [etaMinutes, setEtaMinutes] = useState(14);
  const [distanceKm, setDistanceKm] = useState(3.8);
  const [currentStreet, setCurrentStreet] = useState("Falomo Bridge Passage");
  const [progress, setProgress] = useState(0.48);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "";

  // Telemetry fluctuation & movement timer
  useEffect(() => {
    const timer = setInterval(() => {
      // Speed fluctuation
      setCurrentSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        const newSpeed = Math.round(prev + delta);
        return Math.min(Math.max(newSpeed, 35), 49);
      });

      // Advance along route
      setProgress((prev) => {
        if (prev >= 0.98) return 0.98;
        return prev + 0.001;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // Draw or redraw route and calculate ETA from origin to destination
  const updateRoute = useCallback(
    (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
      const map = mapInstance.current;
      if (!map) return;

      const drawGoldPolyline = (coords: { lat: number; lng: number }[]) => {
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null);
        }
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }
        const polyline = new google.maps.Polyline({
          path: coords,
          map,
          strokeColor: "#d4af37", // Champagne gold route line
          strokeWeight: 5,
          strokeOpacity: 0.9,
        });
        routePolylineRef.current = polyline;
        routeCoordsRef.current = coords;
      };

      // 1. Try server-side computeRoutes
      fetch("/api/maps/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.coordinates && data.coordinates.length > 0) {
            drawGoldPolyline(data.coordinates);
            if (data.durationMinutes) {
              setEtaMinutes(data.durationMinutes);
              onEtaUpdate?.(data.durationMinutes, data.distanceKm || 0);
            }
            if (data.distanceKm) setDistanceKm(data.distanceKm);
            if (data.distanceKm > 50) {
              setCurrentStreet("Long-Range Inter-State Corridor");
            } else {
              setCurrentStreet("Metropole Access • Destination Route");
            }
          } else {
            fallbackClientDirections(origin, destination);
          }
        })
        .catch(() => {
          fallbackClientDirections(origin, destination);
        });

      function fallbackClientDirections(
        orig: { lat: number; lng: number },
        dest: { lat: number; lng: number }
      ) {
        if (!mapInstance.current || typeof google === "undefined") return;
        try {
          const directionsService = new google.maps.DirectionsService();
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
          }
          if (routePolylineRef.current) {
            routePolylineRef.current.setMap(null);
          }
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: mapInstance.current,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#d4af37",
              strokeWeight: 5,
              strokeOpacity: 0.9,
            },
          });
          directionsRendererRef.current = directionsRenderer;

          directionsService.route(
            {
              origin: orig,
              destination: dest,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result);
                const route = result.routes[0];
                if (route && route.legs[0]) {
                  const leg = route.legs[0];
                  const mins = leg.duration?.value ? Math.round(leg.duration.value / 60) : 15;
                  const km = leg.distance?.value ? Number((leg.distance.value / 1000).toFixed(1)) : 5;
                  setEtaMinutes(mins);
                  setDistanceKm(km);
                  onEtaUpdate?.(mins, km);
                  if (leg.steps && leg.steps.length > 1) {
                    setCurrentStreet(leg.steps[1].instructions.replace(/<[^>]+>/g, ""));
                  }
                }
              }
            }
          );
        } catch (e) {
          console.warn("[GoogleTrackingMap] Directions fallback notice:", e);
        }
      }
    },
    [onEtaUpdate]
  );

  // Initialize Google Maps
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

      Promise.all([importLibrary("maps"), importLibrary("routes")])
        .then(() => {
          setIsApiLoaded(true);
          setApiKeyError(false);

          const centerLat = (initialDriverCoords.lat + destinationCoords.lat) / 2;
          const centerLng = (initialDriverCoords.lng + destinationCoords.lng) / 2;

          const map = new google.maps.Map(mapRef.current!, {
            center: { lat: centerLat, lng: centerLng },
            zoom: 14,
            styles: LUXURY_DARK_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            backgroundColor: "#0c1017",
          });

          mapInstance.current = map;
          trafficLayerRef.current = new google.maps.TrafficLayer();

          // Connect initial position to destination and compute travel time
          updateRoute(initialDriverCoords, destinationCoords);

          // Custom Destination Marker (Client Pickup / Delivery)
          destMarkerRef.current = new google.maps.Marker({
            position: destinationCoords,
            map,
            title: `Destination: ${destinationAddress}`,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#fedeb2",
              fillOpacity: 1,
              strokeColor: "#725b38",
              strokeWeight: 2,
            },
            label: {
              text: "VIP",
              color: "#0c1017",
              fontSize: "9px",
              fontWeight: "bold",
            },
          });

          // Custom Chauffeur Vehicle Marker
          carMarkerRef.current = new google.maps.Marker({
            position: initialDriverCoords,
            map,
            title: `${vehicleTitle} • Chauffeur ${driverName}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2.5,
            },
            label: {
              text: "VIP",
              color: "#ffffff",
              fontSize: "8px",
              fontWeight: "bold",
            },
          });

          // Interactive Vehicle Hover Card on VIP Markers
          const vehicleCardHtml = `
            <div style="background:#0c1017; color:#fff; padding:12px; border-radius:12px; font-family:system-ui,-apple-system,sans-serif; width:220px; border:1px solid #725b38; box-shadow:0 12px 30px rgba(0,0,0,0.85);">
              ${vehicleImage ? `<div style="width:100%; height:90px; border-radius:8px; overflow:hidden; margin-bottom:8px; background:#18202e;"><img src="${vehicleImage}" alt="${vehicleTitle}" style="width:100%; height:100%; object-fit:cover;" /></div>` : ""}
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:9px; color:#fedeb2; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">
                  ${vehicleCategory || "VIP Fleet Unit"}
                </span>
                <span style="font-size:8px; background:#10b981; color:#fff; padding:2px 6px; border-radius:10px; font-weight:bold; text-transform:uppercase;">
                  Door Delivery
                </span>
              </div>
              <div style="font-size:13px; font-weight:bold; color:#fff; line-height:1.2; margin-bottom:3px;">
                ${vehicleTitle}
              </div>
              <div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">
                Plate: <strong style="color:#fef3c7;">${plateNumber}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; background:#18202e; padding:5px 8px; border-radius:6px; border:1px solid #283344;">
                <span style="color:#9ca3af;">Driver: <strong style="color:#fff;">${driverName.split(" ")[0]}</strong></span>
                <span style="color:#fedeb2; font-weight:bold;">${currentSpeed} km/h</span>
              </div>
            </div>
          `;

          const vehicleInfoWindow = new google.maps.InfoWindow({
            content: vehicleCardHtml,
            disableAutoPan: true,
          });

          carMarkerRef.current.addListener("mouseover", () => {
            vehicleInfoWindow.open(map, carMarkerRef.current);
          });
          carMarkerRef.current.addListener("mouseout", () => {
            vehicleInfoWindow.close();
          });

          destMarkerRef.current.addListener("mouseover", () => {
            vehicleInfoWindow.open(map, destMarkerRef.current);
          });
          destMarkerRef.current.addListener("mouseout", () => {
            vehicleInfoWindow.close();
          });
        })
        .catch((err) => {
          console.warn("[GoogleTrackingMap] Failed to load SDK:", err);
          setApiKeyError(true);
        });
    } catch (err) {
      console.warn("[GoogleTrackingMap] Error loading Google Maps:", err);
      setApiKeyError(true);
    }
  }, [apiKey, destinationAddress]);

  // React immediately to live GPS hardware coordinates from Supabase & Backend
  useEffect(() => {
    if (!carMarkerRef.current || !mapInstance.current) return;

    const newPos = new google.maps.LatLng(initialDriverCoords.lat, initialDriverCoords.lng);
    carMarkerRef.current.setPosition(newPos);

    // Smoothly pan map and fit both vehicle and destination in viewport
    try {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(newPos);
      bounds.extend(new google.maps.LatLng(destinationCoords.lat, destinationCoords.lng));
      mapInstance.current.fitBounds(bounds, 80);
    } catch {
      mapInstance.current.panTo(newPos);
    }

    // Connect updated current location to final destination & recalculate travel time!
    updateRoute(initialDriverCoords, destinationCoords);
  }, [initialDriverCoords.lat, initialDriverCoords.lng, destinationCoords.lat, destinationCoords.lng, updateRoute]);

  // Map Controls
  const handleToggleSatellite = () => {
    if (!mapInstance.current) return;
    const next = mapType === "dark" ? "satellite" : "dark";
    setMapType(next);

    if (next === "satellite") {
      mapInstance.current.setMapTypeId(google.maps.MapTypeId.HYBRID);
    } else {
      mapInstance.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      mapInstance.current.setOptions({ styles: LUXURY_DARK_MAP_STYLE });
    }
  };

  const handleToggleTraffic = () => {
    if (!mapInstance.current || !trafficLayerRef.current) return;
    const next = !isTrafficActive;
    setIsTrafficActive(next);

    if (next) {
      trafficLayerRef.current.setMap(mapInstance.current);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  };

  const handleRecenter = () => {
    if (!mapInstance.current || !carMarkerRef.current) return;
    const pos = carMarkerRef.current.getPosition();
    if (pos) {
      mapInstance.current.panTo(pos);
      mapInstance.current.setZoom(15);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090e] border border-stone-800 shadow-2xl flex flex-col">
      {/* HUD Header Bar */}
      <div className="p-4 bg-[#0c1017]/95 border-b border-stone-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary block">
              Live Google GPS Telematics
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{etaMinutes} mins away</span>
              <span className="text-stone-400 font-normal text-xs">
                ({distanceKm} km • {currentSpeed} km/h)
              </span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Traffic Toggle */}
          <button
            onClick={handleToggleTraffic}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isTrafficActive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800"
            }`}
            title="Toggle Live Traffic"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">traffic</span>
            <span className="hidden sm:inline">Traffic</span>
          </button>

          {/* Satellite Toggle */}
          <button
            onClick={handleToggleSatellite}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              mapType === "satellite"
                ? "bg-secondary/20 text-secondary border-secondary/40"
                : "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800"
            }`}
            title="Toggle Satellite Imagery"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">satellite_alt</span>
            <span className="hidden sm:inline">{mapType === "satellite" ? "Dark Map" : "Satellite"}</span>
          </button>

          {/* Recenter */}
          <button
            onClick={handleRecenter}
            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Recenter Map on Chauffeur"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">my_location</span>
            <span className="hidden sm:inline">Recenter</span>
          </button>

          {/* Ping Tracker */}
          {onPingSim && (
            <button
              onClick={onPingSim}
              disabled={isPingingSim}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              type="button"
            >
              <span className={`material-symbols-outlined text-sm ${isPingingSim ? "animate-spin" : ""}`}>
                {isPingingSim ? "sync" : "satellite"}
              </span>
              <span>{isPingingSim ? "Pinging..." : "Ping Chauffeur"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[520px] sm:h-[620px] bg-[#0c1017]">
        {/* Real Google Map Container */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Fallback View if no Google Maps API Key or Error */}
        {apiKeyError && (
          <div className="absolute inset-0 bg-[#07090e]/95 backdrop-blur-sm p-6 flex flex-col justify-between z-20">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/90 border border-stone-800 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-2xl">navigation</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Live Chauffeur Transit Corridor • Pass #{bookingCode}
                  </h4>
                  <p className="text-xs text-stone-400">
                    Real-time GPS dispatch to: <span className="text-stone-200">{destinationAddress}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  Chauffeur En Route
                </span>
                <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold font-mono">
                  {etaMinutes} Mins ETA
                </span>
              </div>
            </div>

            {/* Simulated Live Route Stepper */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 my-auto flex flex-col gap-5 max-w-xl mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary text-primary font-bold flex items-center justify-center text-sm shadow-md">
                    {driverName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{driverName}</div>
                    <div className="text-xs text-stone-400">{vehicleTitle} • {plateNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block uppercase">Speed</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{currentSpeed} km/h</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-stone-300">
                  <span>Departure: {originAddress.split(",")[0]}</span>
                  <span className="font-bold text-secondary">{Math.round(progress * 100)}% Complete</span>
                  <span>Arrival: {destinationAddress.split(",")[0]}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-300">
                  <span className="material-symbols-outlined text-secondary text-base">near_me</span>
                  <span>Current Corridor: <strong className="text-white">{currentStreet}</strong></span>
                </div>
                <span className="text-stone-400 font-mono text-[11px]">{distanceKm} km remaining</span>
              </div>
            </div>

            {/* Note on Google Maps API Key */}
            <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-center text-xs text-stone-300 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">info</span>
              <span>
                To render live Google Maps satellite tiles, add your Google Maps API key to{" "}
                <code className="text-secondary font-mono">frontend/.env.local</code> as{" "}
                <code className="text-secondary font-mono">NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...</code>
              </span>
            </div>
          </div>
        )}

        {/* Floating Trip Status Badge (Minimizable) */}
        <div
          className={`absolute bottom-4 left-4 right-4 sm:right-auto ${
            isDriverMinimized ? "sm:w-72" : "sm:w-96"
          } bg-[#0c1017]/95 border border-stone-700 p-3.5 sm:p-4 rounded-xl shadow-2xl backdrop-blur-md z-30 transition-all duration-300`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-[10px] uppercase font-bold text-secondary tracking-widest flex items-center gap-1.5">
              <span>Live Chauffeur Telemetry</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {currentSpeed} km/h
              </span>
              <button
                type="button"
                onClick={() => setIsDriverMinimized((prev) => !prev)}
                className="w-6 h-6 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
                title={
                  isDriverMinimized
                    ? "Expand Driver Details"
                    : "Minimize Driver Details"
                }
                aria-label="Toggle driver details"
              >
                <span className="material-symbols-outlined text-sm">
                  {isDriverMinimized ? "expand_less" : "expand_more"}
                </span>
              </button>
            </div>
          </div>

          {!isDriverMinimized && (
            <div className="flex items-center gap-3 pt-3 animate-in fade-in duration-200">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-800 border border-secondary/40 shrink-0">
                <img
                  src={
                    driverAvatar ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBKbjhRjrCmhkNlNkML6SVprykttgquwqWvriXkbf51jsmHySi6yGrZW7ZJSluSjBFkdDZ8NJ2TismICR836d98noMAJJdUUZZjpt0JxtEM9FxNzWymZH9c00BiE4llpKb4bXYsZuCuoikHPm85V8b8o3PtMiKGswUciXjbf9vpKSFsjNerRJ0f54oAOGAH-IAOK5c1Z6j0A2AlKQ8TETBHFXSM3YMTFoUIS7sSk1WZ4TEyd_pRdrRQ"
                  }
                  alt={driverName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {driverName}
                </span>
                <span className="text-xs text-stone-400 truncate">
                  {vehicleTitle} • {plateNumber}
                </span>
                <span className="text-[11px] text-secondary font-medium mt-0.5 truncate">
                  Approaching: {destinationAddress.split(",")[0]}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

