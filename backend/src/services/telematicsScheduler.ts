import { supabase } from "../supabase";
import { sendSmsToTracker } from "./smsGatewayService";
import { config } from "../config";

let schedulerInterval: NodeJS.Timeout | null = null;
let isPollingActive = false;
let cycleCounter = 0;

/**
 * Resolves the tracker SIM phone number, device code, and latest GPRS heartbeat for a vehicle
 */
async function resolveTrackerForVehicle(vehicle: { id: string; name?: string; assigned_tracker_id?: string | null }): Promise<{ phone: string | null; code: string; lastHeartbeat: string | null }> {
  let trackerSimPhone: string | null = null;
  let deviceCode = "TRK-SIM";
  let lastHeartbeat: string | null = null;

  if (vehicle.assigned_tracker_id) {
    const { data: tracker } = await supabase
      .from("tracker_devices")
      .select("sim_phone_number, device_code, last_heartbeat")
      .eq("id", vehicle.assigned_tracker_id)
      .maybeSingle();

    if (tracker) {
      if (tracker.sim_phone_number) trackerSimPhone = tracker.sim_phone_number;
      if (tracker.device_code) deviceCode = tracker.device_code;
      lastHeartbeat = tracker.last_heartbeat;
    }
  }

  if (!trackerSimPhone) {
    const { data: tracker } = await supabase
      .from("tracker_devices")
      .select("sim_phone_number, device_code, last_heartbeat")
      .eq("assigned_vehicle_id", vehicle.id)
      .maybeSingle();

    if (tracker) {
      if (tracker.sim_phone_number) trackerSimPhone = tracker.sim_phone_number;
      if (tracker.device_code) deviceCode = tracker.device_code;
      if (!lastHeartbeat) lastHeartbeat = tracker.last_heartbeat;
    }
  }

  if (!trackerSimPhone && config.trackerSimPhone) {
    trackerSimPhone = config.trackerSimPhone;
  }

  return { phone: trackerSimPhone, code: deviceCode, lastHeartbeat };
}

/**
 * Automated telematics background daemon.
 * - Primary: Trackers stream online coordinates via TCP/GPRS (Port 5000).
 * - Fallback: If a vehicle hasn't transmitted a GPRS heartbeat within GPRS_OFFLINE_THRESHOLD_MINUTES,
 *   a fallback SMS ("WHERE#") is sent to query coordinates in network dead zones.
 */
export function startTelematicsScheduler(baseIntervalSeconds: number = 60) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  if (!config.enableSmsScheduler) {
    console.log(
      `\x1b[33m[Telematics Scheduler]\x1b[0m Automated SMS polling disabled (ENABLE_SMS_SCHEDULER=false). Primary tracking runs online via TCP/GPRS on Port ${config.telematicsPort}. SMS fallback is available on-demand via dashboard.`,
    );
    return;
  }

  const thresholdMins = config.gprsOfflineThresholdMinutes || 5;
  console.log(
    `\x1b[36m[Telematics Scheduler]\x1b[0m Smart SMS Fallback active. GPRS threshold: ${thresholdMins}m (In-Transit check: ${baseIntervalSeconds}s, In-Hub check: ${baseIntervalSeconds * 10}s)`,
  );

  const executePollingCycle = async () => {
    if (isPollingActive) return;
    isPollingActive = true;
    cycleCounter++;
    const isTenMinuteWindow = cycleCounter % 10 === 0 || cycleCounter === 1;

    try {
      const nowIso = new Date().toISOString();
      const gprsThresholdMs = thresholdMins * 60 * 1000;

      // Query vehicles and active bookings in parallel
      const [vehiclesRes, activeBookingsRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, name, status, assigned_tracker_id"),
        supabase
          .from("bookings")
          .select("vehicle_id, status, pickup_datetime, dropoff_datetime")
          .in("status", ["in_transit", "confirmed"]),
      ]);

      const allVehicles = vehiclesRes.data || [];
      const activeBookings = activeBookingsRes.data || [];

      // Vehicles currently in client's possession or actively dispatched for delivery
      const activeDeliveryVehicleIds = new Set<string>();

      activeBookings.forEach((b) => {
        if (b.status === "in_transit") {
          if (b.vehicle_id) activeDeliveryVehicleIds.add(b.vehicle_id);
        } else if (b.status === "confirmed" && b.pickup_datetime && b.dropoff_datetime) {
          if (b.pickup_datetime <= nowIso && b.dropoff_datetime >= nowIso) {
            if (b.vehicle_id) activeDeliveryVehicleIds.add(b.vehicle_id);
          }
        }
      });

      // Partition:
      // Category 1: In Transit / Out for Delivery / Client Possession
      const inTransitVehicles = allVehicles.filter(
        (v) => v.status === "in_transit" || activeDeliveryVehicleIds.has(v.id),
      );

      // Category 2: In Hub (Available, Future Reserved, Maintenance)
      const inHubVehicles = allVehicles.filter(
        (v) => v.status !== "in_transit" && !activeDeliveryVehicleIds.has(v.id),
      );

      // 1. In-transit / delivery assets: check GPRS heartbeat, fallback to SMS if offline
      if (inTransitVehicles.length > 0) {
        for (const v of inTransitVehicles) {
          const { phone, code, lastHeartbeat } = await resolveTrackerForVehicle(v);

          // Check if GPRS heartbeat is fresh
          const isGprsOnline =
            lastHeartbeat &&
            Date.now() - new Date(lastHeartbeat).getTime() < gprsThresholdMs;

          if (isGprsOnline) {
            const ageSeconds = Math.round(
              (Date.now() - new Date(lastHeartbeat!).getTime()) / 1000,
            );
            console.log(
              `\x1b[32m[Auto-Telematics (GPRS Online)]\x1b[0m Asset "${v.name}" streaming online via GPRS (ping ${ageSeconds}s ago). SMS skipped.`,
            );
            continue;
          }

          // Fallback to SMS if GPRS is offline / no recent packet
          if (phone) {
            const offlineDuration = lastHeartbeat
              ? `${Math.round((Date.now() - new Date(lastHeartbeat).getTime()) / 60000)}m without GPRS`
              : "no GPRS packets received";
            console.log(
              `\x1b[33m[Auto-Telematics (SMS Fallback)]\x1b[0m Asset \x1b[32m"${v.name}"\x1b[0m is offline on GPRS (${offlineDuration}). Dispatching fallback SMS to \x1b[33m${phone}\x1b[0m (Unit: \x1b[36m${code}\x1b[0m)...`,
            );
            await sendSmsToTracker(phone, "WHERE#");
          }
        }
      } else {
        // Fallback for demo if tracker device exists
        await pollDemoTrackerIfActive();
      }

      // 2. In-hub stationed assets: periodic GPRS health check
      if (isTenMinuteWindow && inHubVehicles.length > 0) {
        for (const v of inHubVehicles) {
          const { phone, code, lastHeartbeat } = await resolveTrackerForVehicle(v);
          const isGprsOnline =
            lastHeartbeat &&
            Date.now() - new Date(lastHeartbeat).getTime() < gprsThresholdMs * 2;

          if (isGprsOnline) {
            continue; // Hub vehicle is reporting fine over GPRS, skip SMS
          }

          if (phone) {
            console.log(
              `\x1b[36m[Auto-Telematics (Hub SMS Fallback)]\x1b[0m In-Hub heartbeat missing for "${v.name}". Sending fallback SMS to ${phone}...`,
            );
            await sendSmsToTracker(phone, "WHERE#");
          }
        }
      }
    } catch (err: any) {
      console.warn(
        "[Auto-Telematics] Error during automated ping cycle:",
        err.message,
      );
    } finally {
      isPollingActive = false;
    }
  };

  async function pollDemoTrackerIfActive() {
    try {
      const { data: demoBooking } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("booking_reference", "LP-8842")
        .in("status", ["in_transit", "confirmed"])
        .maybeSingle();

      const { data: demoTracker } = await supabase
        .from("tracker_devices")
        .select("sim_phone_number, status")
        .eq("device_code", "TRK-892-SIM")
        .maybeSingle();

      const phone = demoTracker?.sim_phone_number || config.trackerSimPhone;

      if ((demoBooking || demoTracker) && phone) {
        console.log(
          `\x1b[35m[Auto-Telematics (1m Cadence)]\x1b[0m Active ping for fleet unit TRK-892-SIM (SIM: \x1b[33m${phone}\x1b[0m)`,
        );
        await sendSmsToTracker(phone, "WHERE#");
      }
    } catch (err: any) {
      console.warn("[Auto-Telematics] Demo poll error:", err.message);
    }
  }

  // Initial poll after 5 seconds, then ticker every baseIntervalSeconds
  setTimeout(executePollingCycle, 5000);
  schedulerInterval = setInterval(executePollingCycle, baseIntervalSeconds * 1000);
}

export function stopTelematicsScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Telematics Scheduler] Automated polling stopped.");
  }
}
