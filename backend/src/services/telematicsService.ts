import { supabase } from "../supabase";
import { ParsedLocation } from "../parsers/nmeaParser";

export interface RecordPingInput {
  deviceCode?: string;
  simPhoneNumber?: string;
  parsedLocation: ParsedLocation;
  triggerType?: "auto_periodic" | "manual_admin" | "client_request" | "geofence_trigger";
  geocodedAddress?: string;
}

export async function recordTelematicsPing(input: RecordPingInput) {
  try {
    const { deviceCode, simPhoneNumber, parsedLocation, triggerType = "auto_periodic", geocodedAddress } = input;

    // 1. Locate tracker device in Supabase
    let query = supabase.from("tracker_devices").select("id, assigned_vehicle_id, device_code");
    if (deviceCode) {
      query = query.eq("device_code", deviceCode);
    } else if (simPhoneNumber) {
      query = query.eq("sim_phone_number", simPhoneNumber);
    } else {
      throw new Error("Either deviceCode or simPhoneNumber must be provided.");
    }

    const { data: tracker, error: trackerErr } = await query.maybeSingle();

    if (trackerErr || !tracker) {
      console.warn(`[Telematics] Tracker device not found for input:`, { deviceCode, simPhoneNumber });
      return { success: false, error: "Tracker device not found in database" };
    }

    const vehicleId = tracker.assigned_vehicle_id;

    // 2. Check for an active booking for this vehicle
    let bookingId: string | null = null;
    if (vehicleId) {
      const { data: activeBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .in("status", ["in_transit", "confirmed"])
        .order("pickup_datetime", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBooking) {
        bookingId = activeBooking.id;
      }
    }

    // 3. Insert ping into public.telematics_pings
    const { data: pingRecord, error: pingErr } = await supabase
      .from("telematics_pings")
      .insert({
        tracker_id: tracker.id,
        vehicle_id: vehicleId,
        booking_id: bookingId,
        latitude: parsedLocation.latitude,
        longitude: parsedLocation.longitude,
        speed_kmh: parsedLocation.speedKmh,
        heading_deg: parsedLocation.headingDeg,
        battery_percentage: parsedLocation.batteryPercentage ?? 98,
        ignition_status: parsedLocation.ignitionStatus ?? true,
        trigger_type: triggerType,
        raw_sms_payload: parsedLocation.rawPayload,
        geocoded_address: geocodedAddress || "Lagos En Route Corridor",
      })
      .select()
      .single();

    if (pingErr) {
      console.error("[Telematics] Failed to insert telematics ping:", pingErr);
      return { success: false, error: pingErr.message };
    }

    console.log(
      `[Telematics] Successfully recorded ping for ${tracker.device_code}: Lat ${parsedLocation.latitude}, Lng ${parsedLocation.longitude}, Speed ${parsedLocation.speedKmh} km/h`
    );

    return {
      success: true,
      ping: pingRecord,
      trackerCode: tracker.device_code,
      vehicleId,
    };
  } catch (err: any) {
    console.error("[Telematics] Error recording ping:", err);
    return { success: false, error: err.message || "Internal telematics error" };
  }
}
