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

    // 3. Upsert / update ping in public.telematics_pings (strictly one single entry per tracker)
    const pingPayload = {
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
      timestamp: new Date().toISOString(),
    };

    const { data: existingPings } = await supabase
      .from("telematics_pings")
      .select("id")
      .eq("tracker_id", tracker.id)
      .order("created_at", { ascending: false });

    let pingRecord: any = null;

    if (existingPings && existingPings.length > 0) {
      // Update existing single row for this tracker
      const primaryPingId = existingPings[0].id;
      const { data: updatedPing, error: updateErr } = await supabase
        .from("telematics_pings")
        .update(pingPayload)
        .eq("id", primaryPingId)
        .select()
        .single();

      if (updateErr) {
        console.error("[Telematics] Failed to update telematics ping:", updateErr);
        return { success: false, error: updateErr.message };
      }
      pingRecord = updatedPing;

      // Clean up any extraneous duplicate rows for this tracker if present
      if (existingPings.length > 1) {
        const surplusIds = existingPings.slice(1).map((p) => p.id);
        await supabase.from("telematics_pings").delete().in("id", surplusIds);
      }
    } else {
      // Insert initial row for this tracker
      const { data: newPing, error: insertErr } = await supabase
        .from("telematics_pings")
        .insert(pingPayload)
        .select()
        .single();

      if (insertErr) {
        console.error("[Telematics] Failed to insert initial telematics ping:", insertErr);
        return { success: false, error: insertErr.message };
      }
      pingRecord = newPing;
    }

    // 4. Update tracker_devices & vehicles tables with latest live telemetry
    try {
      await Promise.all([
        supabase
          .from("tracker_devices")
          .update({
            last_latitude: parsedLocation.latitude,
            last_longitude: parsedLocation.longitude,
            last_speed_kmh: parsedLocation.speedKmh,
            battery_percentage: parsedLocation.batteryPercentage ?? 98,
            last_heartbeat: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", tracker.id),
        vehicleId
          ? supabase
              .from("vehicles")
              .update({
                current_latitude: parsedLocation.latitude,
                current_longitude: parsedLocation.longitude,
                updated_at: new Date().toISOString(),
              })
              .eq("id", vehicleId)
          : Promise.resolve(),
      ]);
    } catch (updateErr) {
      console.warn("[Telematics] Notice updating tracker/vehicle coordinates:", updateErr);
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
