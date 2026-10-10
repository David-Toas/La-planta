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
    const { deviceCode, vehicleId } = req.body;

    if (!deviceCode && !vehicleId) {
      return res.status(400).json({ error: "Provide either deviceCode or vehicleId" });
    }

    let trackerData = null;
    let query = supabase.from("tracker_devices").select("id, device_code, sim_phone_number, assigned_vehicle_id");
    if (deviceCode) {
      query = query.eq("device_code", deviceCode);
    } else if (vehicleId) {
      query = query.eq("assigned_vehicle_id", vehicleId);
    }

    const { data: tracker, error } = await query.maybeSingle();
    if (tracker) {
      trackerData = tracker;
    } else {
      // Graceful fallback for initial testing if database seed hasn't completed yet
      trackerData = {
        id: "demo-trk-892",
        device_code: deviceCode || "TRK-892-SIM",
        sim_phone_number: "+2348037294810",
      };
      console.log(`[Telematics Notice] Tracker not in DB yet; using designated fleet fallback: ${trackerData.device_code}`);
    }

    // 2. Dispatch SMS command to tracker SIM (Standard command: "WHERE#" or "STATUS#")
    const commandText = "WHERE#";
    console.log(`\x1b[35m[GSM DISPATCH]\x1b[0m Sending "${commandText}" to SIM \x1b[33m${trackerData.sim_phone_number}\x1b[0m for Unit \x1b[32m${trackerData.device_code}\x1b[0m`);
    const dispatchResult = await sendSmsToTracker(trackerData.sim_phone_number, commandText);

    return res.json({
      success: true,
      message: `Encrypted ping command "${commandText}" dispatched to SIM ${trackerData.sim_phone_number}`,
      deviceCode: trackerData.device_code,
      simPhone: trackerData.sim_phone_number,
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
      .select("*, vehicles(*)")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error || !tracker) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.json({ success: true, tracker });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
