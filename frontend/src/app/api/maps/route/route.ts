import { NextRequest, NextResponse } from "next/server";

// Decode Google encoded polyline string into lat/lng coordinates
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { origin, destination } = body;

    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 400 }
      );
    }

    const originLat = origin?.lat ?? 6.4352;
    const originLng = origin?.lng ?? 3.4219;
    const destLat = destination?.lat ?? 6.4549;
    const destLng = destination?.lng ?? 3.4326;

    // Call modern Google Routes API (computeRoutes)
    const googleRes = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: { latitude: originLat, longitude: originLng },
            },
          },
          destination: {
            location: {
              latLng: { latitude: destLat, longitude: destLng },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      }
    );

    const data = await googleRes.json();

    if (!googleRes.ok || !data.routes || data.routes.length === 0) {
      console.warn("[RoutesAPI] Google response:", data);
      return NextResponse.json(
        {
          error: data.error?.message || "Route not found",
          fallback: true,
        },
        { status: 200 }
      );
    }

    const route = data.routes[0];
    const durationSeconds = route.duration
      ? parseInt(route.duration.replace("s", ""), 10)
      : 540;
    const distanceMeters = route.distanceMeters ?? 3800;
    const encodedPolyline = route.polyline?.encodedPolyline ?? "";
    const coordinates = encodedPolyline ? decodePolyline(encodedPolyline) : [];

    return NextResponse.json({
      success: true,
      durationMinutes: Math.round(durationSeconds / 60),
      distanceKm: Number((distanceMeters / 1000).toFixed(1)),
      coordinates,
      encodedPolyline,
    });
  } catch (err: any) {
    console.error("[RoutesAPI] Server Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compute route", fallback: true },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const originLat = parseFloat(searchParams.get("originLat") || "6.4352");
  const originLng = parseFloat(searchParams.get("originLng") || "3.4219");
  const destLat = parseFloat(searchParams.get("destLat") || "6.4549");
  const destLng = parseFloat(searchParams.get("destLng") || "3.4326");

  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
      }),
    })
  );
}

