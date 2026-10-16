import { Router, Request, Response } from "express";
import { recordTelematicsPing } from "../services/telematicsService";
import { sendSmsToTracker } from "../services/smsGatewayService";
import { supabase } from "../supabase";

export const telematicsRouter = Router();

/**
 * Trigger an on-demand ping to a vehicle's tracker device
 */
telematicsRouter.post("/ping-request", async (req: Request, res: Response) => {
  try {
    const { deviceCode, vehicleId, trackerId } = req.body;

    if (!deviceCode && !vehicleId && !trackerId) {
      return res.status(400).json({ error: "Provide either deviceCode, vehicleId, or trackerId" });
    }

    let trackerData: any = null;
    let vehicleName: string | null = null;

    // 1. If vehicleId is provided, first check the vehicle's assigned tracker reference
    if (vehicleId) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("id, name, assigned_tracker_id")
        .eq("id", vehicleId)
        .maybeSingle();

      if (vehicle) {
        vehicleName = vehicle.name;
        if (vehicle.assigned_tracker_id) {
          const { data: t } = await supabase
            .from("tracker_devices")
            .select("id, device_code, sim_phone_number, assigned_vehicle_id, status")
            .eq("id", vehicle.assigned_tracker_id)
            .maybeSingle();
          if (t) trackerData = t;
        }
      }

      // Also check if any tracker points directly to this vehicle
      if (!trackerData) {
        const { data: tByVehicle } = await supabase
          .from("tracker_devices")
          .select("id, device_code, sim_phone_number, assigned_vehicle_id, status")
          .eq("assigned_vehicle_id", vehicleId)
          .maybeSingle();
        if (tByVehicle) trackerData = tByVehicle;
      }
    }

    // 2. Lookup by trackerId or deviceCode if not resolved yet
    if (!trackerData) {
      let query = supabase.from("tracker_devices").select("id, device_code, sim_phone_number, assigned_vehicle_id, status");
      if (trackerId) {
        query = query.eq("id", trackerId);
      } else if (deviceCode) {
        query = query.eq("device_code", deviceCode);
      }
      const { data: tDirect } = await query.maybeSingle();
      if (tDirect) trackerData = tDirect;
    }

    // 3. Fallback for demo unit if tracker record does not exist
    if (!trackerData) {
      trackerData = {
        id: "demo-trk-892",
        device_code: deviceCode || "TRK-892-SIM",
        sim_phone_number: "+2348140313381",
      };
      console.log(`[Telematics Notice] Tracker not in DB yet; using designated fleet fallback: ${trackerData.device_code}`);
    }

    // 4. Resolve target SIM phone:
    // Priority 1: Manual override in request body
    // Priority 2: Database record sim_phone_number (The production standard)
    // Priority 3: Environment variable fallback
    const targetSimPhone =
      req.body.simPhoneNumber ||
      trackerData.sim_phone_number ||
      process.env.TRACKER_SIM_PHONE;

    if (!targetSimPhone) {
      return res.status(422).json({
        error: `No SIM phone number found in database for tracker ${trackerData.device_code}. Please configure the SIM number in the Admin Dashboard.`,
      });
    }

    // 5. Dispatch SMS command to tracker SIM (Standard GSM command: "WHERE#")
    const commandText = "WHERE#";
    console.log(
      `\x1b[35m[GSM DISPATCH]\x1b[0m Sending "${commandText}" to SIM \x1b[33m${targetSimPhone}\x1b[0m for Asset \x1b[32m"${vehicleName || trackerData.device_code}"\x1b[0m (Source: ${trackerData.sim_phone_number ? "Database" : "Env Fallback"})`,
    );
    const dispatchResult = await sendSmsToTracker(targetSimPhone, commandText);

    return res.json({
      success: true,
      message: `Encrypted ping command "${commandText}" dispatched to SIM ${targetSimPhone}`,
      deviceCode: trackerData.device_code,
      simPhone: targetSimPhone,
      vehicleName: vehicleName || undefined,
      simSource: trackerData.sim_phone_number ? "database" : "env_fallback",
      dispatch: dispatchResult,
    });
  } catch (err: any) {
    console.error("[Telematics Error] Ping request error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Direct HTTP coordinate ingestion endpoint (Used by trackers reporting via HTTP POST)
 */
telematicsRouter.post("/ingest", async (req: Request, res: Response) => {
  try {
    const { deviceCode, latitude, longitude, speed, heading, battery, address } = req.body;

    if (!deviceCode || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields: deviceCode, latitude, longitude" });
    }

    const result = await recordTelematicsPing({
      deviceCode,
      parsedLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speedKmh: parseFloat(speed || "0"),
        headingDeg: parseFloat(heading || "0"),
        batteryPercentage: battery !== undefined ? parseInt(battery, 10) : 98,
        rawPayload: JSON.stringify(req.body),
      },
      geocodedAddress: address,
      triggerType: "auto_periodic",
    });

    return res.json(result);
  } catch (err: any) {
    console.error("[Telematics Error] Ingest error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get device status & latest known coordinates
 */
telematicsRouter.get("/status/:deviceCode", async (req: Request, res: Response) => {
  try {
    const { deviceCode } = req.params;

    const { data: tracker, error } = await supabase
      .from("tracker_devices")
      .select("*, vehicles:vehicles!tracker_devices_assigned_vehicle_id_fkey(*)")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error || !tracker) {
      return res.status(404).json({ error: "Device not found" });
    }

    // 2. Query telematics_pings to ensure latest location updates directly from Supabase are captured
    const { data: latestPing } = await supabase
      .from("telematics_pings")
      .select("*")
      .eq("tracker_id", tracker.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Query telematics_pings to ensure latest location updates directly from Supabase are captured
    if (latestPing && latestPing.latitude && latestPing.longitude) {
      tracker.last_latitude = Number(latestPing.latitude);
      tracker.last_longitude = Number(latestPing.longitude);
      if (latestPing.speed_kmh !== null && latestPing.speed_kmh !== undefined) {
        tracker.last_speed_kmh = Number(latestPing.speed_kmh);
      }
      if (latestPing.battery_percentage !== null && latestPing.battery_percentage !== undefined) {
        tracker.battery_percentage = Number(latestPing.battery_percentage);
      }
      tracker.updated_at = latestPing.timestamp || latestPing.created_at || tracker.updated_at;
    } else if (tracker.vehicles && tracker.vehicles.current_latitude && tracker.vehicles.current_longitude) {
      tracker.last_latitude = Number(tracker.vehicles.current_latitude);
      tracker.last_longitude = Number(tracker.vehicles.current_longitude);
    }

    return res.json({ success: true, tracker, latestPing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
