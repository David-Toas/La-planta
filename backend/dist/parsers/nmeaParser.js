"use strict";
/**
 * Parser for GPS Tracker NMEA Strings and Inbound SMS text payloads
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSmsOrNmeaPayload = parseSmsOrNmeaPayload;
function parseSmsOrNmeaPayload(rawText) {
    if (!rawText || typeof rawText !== "string")
        return null;
    const text = rawText.trim();
    // Pattern 1: Google Maps URL in SMS (e.g., "maps.google.com/?q=6.447492,3.424310" or "maps.google.com/maps?q=6.4475,3.4243")
    const googleMapsRegex = /maps\.google\.com\/(?:maps)?\?q=(-?\d+\.\d+),(-?\d+\.\d+)/i;
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
                if (latDir === "S")
                    lat = -lat;
                const lngDeg = parseFloat(rawLng.slice(0, 3));
                const lngMin = parseFloat(rawLng.slice(3));
                let lng = lngDeg + lngMin / 60;
                if (lngDir === "W")
                    lng = -lng;
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
    return null;
}
