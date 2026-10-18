/**
 * Parser for GPS Tracker NMEA Strings and Inbound SMS text payloads
 */

export interface ParsedLocation {
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  batteryPercentage?: number;
  ignitionStatus?: boolean;
  rawPayload: string;
}

export function parseSmsOrNmeaPayload(rawText: string): ParsedLocation | null {
  if (!rawText || typeof rawText !== "string") return null;

  const text = rawText.trim();

  // Pattern 1: Google Maps URL in SMS (e.g., "maps.google.com/?q=..." or "maps.google.com/maps?f=q&q=7.352264,3.882394&z=16")
  const googleMapsRegex = /maps\.google\.com\/(?:maps)?\?(?:.*?[&?])?q=(-?\d+\.\d+),(-?\d+\.\d+)/i;
  const urlMatch = text.match(googleMapsRegex);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);

    // Check for speed e.g. "Speed: 42km/h" or "Speed: 42.5"
    const speedMatch = text.match(/Speed:?\s*(\d+(?:\.\d+)?)\s*(?:km\/h|knots|mph)?/i);
    const speed = speedMatch ? parseFloat(speedMatch[1]) : 0;

    // Check for battery e.g. "Bat: 98%" or "Battery: 95%"
    const batMatch = text.match(/Bat(?:tery)?:?\s*(\d+)%/i);
    const battery = batMatch ? parseInt(batMatch[1], 10) : 95;

    // Check for ignition status e.g. "ACC: ON" or "ACC: OFF"
    const accMatch = text.match(/ACC:?\s*(ON|OFF)/i);
    const ignition = accMatch ? accMatch[1].toUpperCase() === "ON" : true;

    return {
      latitude: lat,
      longitude: lng,
      speedKmh: speed,
      headingDeg: 0,
      batteryPercentage: battery,
      ignitionStatus: ignition,
      rawPayload: text,
    };
  }

  // Pattern 2: Key-value text format (e.g. "Lat: 6.447492, Lon: 3.424310, Speed: 42km/h, Bat: 98%")
  const latMatch = text.match(/(?:lat|latitude):?\s*(-?\d+\.\d+)/i);
  const lonMatch = text.match(/(?:lon|long|longitude):?\s*(-?\d+\.\d+)/i);
  if (latMatch && lonMatch) {
    const lat = parseFloat(latMatch[1]);
    const lng = parseFloat(lonMatch[1]);

    const speedMatch = text.match(/speed:?\s*(\d+(?:\.\d+)?)/i);
    const speed = speedMatch ? parseFloat(speedMatch[1]) : 0;

    const batMatch = text.match(/bat(?:tery)?:?\s*(\d+)%/i);
    const battery = batMatch ? parseInt(batMatch[1], 10) : 95;

    return {
      latitude: lat,
      longitude: lng,
      speedKmh: speed,
      headingDeg: 0,
      batteryPercentage: battery,
      rawPayload: text,
    };
  }

  // Pattern 3: Standard NMEA GPRMC line (e.g., "$GPRMC,123519,A,0626.85,N,00325.47,E,22.7,024.0,230324,003.1,W*6A")
  if (text.includes("GPRMC") || text.includes("$GPRMC")) {
    const parts = text.split(",");
    if (parts.length >= 10 && (parts[2] === "A" || parts[2] === "V")) {
      // Coordinate format: DDMM.MMMM -> Decimal Degrees
      const rawLat = parts[3];
      const latDir = parts[4];
      const rawLng = parts[5];
      const lngDir = parts[6];
      const speedKnots = parseFloat(parts[7] || "0");
      const heading = parseFloat(parts[8] || "0");

      if (rawLat && rawLng) {
        const latDeg = parseFloat(rawLat.slice(0, 2));
        const latMin = parseFloat(rawLat.slice(2));
        let lat = latDeg + latMin / 60;
        if (latDir === "S") lat = -lat;

        const lngDeg = parseFloat(rawLng.slice(0, 3));
        const lngMin = parseFloat(rawLng.slice(3));
        let lng = lngDeg + lngMin / 60;
        if (lngDir === "W") lng = -lng;

        // Convert knots to km/h (1 knot = 1.852 km/h)
        const speedKmh = Math.round(speedKnots * 1.852);

        return {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          speedKmh,
          headingDeg: heading,
          rawPayload: text,
        };
      }
    }
  }

  // Pattern 3B: Coban GPS-303 GPRS TCP Packet (e.g., "imei:864920049182741,...A,0721.1358,N,00352.9436,E,0.00,..." or "##,imei:...,A,0721.1358,N,00352.9436,E,...")
  const cobanGprsRegex = /(?:imei:\d+.*?,)?A,(\d{4}\.\d+),([NS]),(\d{5}\.\d+),([EW]),(\d+(?:\.\d+)?)/i;
  const cobanMatch = text.match(cobanGprsRegex);
  if (cobanMatch) {
    const rawLat = cobanMatch[1];
    const latDir = cobanMatch[2].toUpperCase();
    const rawLng = cobanMatch[3];
    const lngDir = cobanMatch[4].toUpperCase();
    const speed = parseFloat(cobanMatch[5] || "0");

    const latDeg = parseFloat(rawLat.slice(0, 2));
    const latMin = parseFloat(rawLat.slice(2));
    let lat = latDeg + latMin / 60;
    if (latDir === "S") lat = -lat;

    const lngDeg = parseFloat(rawLng.slice(0, 3));
    const lngMin = parseFloat(rawLng.slice(3));
    let lng = lngDeg + lngMin / 60;
    if (lngDir === "W") lng = -lng;

    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      speedKmh: Math.round(speed * 1.852), // Convert knots to km/h if in knots or keep speed
      headingDeg: 0,
      ignitionStatus: true,
      rawPayload: text,
    };
  }

  // Pattern 4: Raw comma/space separated coordinates (e.g. "7.1948475733240675, 3.450026012569789")
  const rawCoordRegex = /(-?\d+\.\d{3,})\s*(?:,|\s+)\s*(-?\d+\.\d{3,})/;
  const rawCoordMatch = text.match(rawCoordRegex);
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lng = parseFloat(rawCoordMatch[2]);
    const speedMatch = text.match(/Speed:?\s*(\d+(?:\.\d+)?)/i);
    const speed = speedMatch ? parseFloat(speedMatch[1]) : 42;
    const batMatch = text.match(/Bat(?:tery)?:?\s*(\d+)%/i);
    const battery = batMatch ? parseInt(batMatch[1], 10) : 98;

    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      speedKmh: speed,
      headingDeg: 0,
      batteryPercentage: battery,
      ignitionStatus: true,
      rawPayload: text,
    };
  }

  return null;
}
