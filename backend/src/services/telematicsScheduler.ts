import { supabase } from "../supabase";
import { sendSmsToTracker } from "./smsGatewayService";
import { config } from "../config";

let schedulerInterval: NodeJS.Timeout | null = null;
let isPollingActive = false;
let cycleCounter = 0;

/**
 * Resolves the tracker SIM phone number and device code for a vehicle
 */
async function resolveTrackerForVehicle(vehicle: { id: string; name?: string; assigned_tracker_id?: string | null }): Promise<{ phone: string | null; code: string }> {
  let trackerSimPhone: string | null = null;
  let deviceCode = "TRK-SIM";

  if (vehicle.assigned_tracker_id) {
    const { data: tracker } = await supabase
      .from("tracker_devices")
      .select("sim_phone_number, device_code")
      .eq("id", vehicle.assigned_tracker_id)
      .maybeSingle();

    if (tracker?.sim_phone_number) {
      trackerSimPhone = tracker.sim_phone_number;
      deviceCode = tracker.device_code || deviceCode;
    }
  }

  if (!trackerSimPhone) {
    const { data: tracker } = await supabase
      .from("tracker_devices")
      .select("sim_phone_number, device_code")
      .eq("assigned_vehicle_id", vehicle.id)
      .maybeSingle();

    if (tracker?.sim_phone_number) {
      trackerSimPhone = tracker.sim_phone_number;
      deviceCode = tracker.device_code || deviceCode;
    }
  }

  if (!trackerSimPhone && config.trackerSimPhone) {
    trackerSimPhone = config.trackerSimPhone;
  }

  return { phone: trackerSimPhone, code: deviceCode };
}

/**
 * Automated telematics background daemon.
 * - Vehicles in transit, out for delivery, or in client's possession: pinged every 1 minute
 * - Vehicles in the hub (available, reserved before delivery date, maintenance): pinged every 10 minutes
 */
export function startTelematicsScheduler(baseIntervalSeconds: number = 60) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log(
    `\x1b[36m[Telematics Scheduler]\x1b[0m Automated dual-frequency polling active (In-Transit: ${baseIntervalSeconds}s, In-Hub: ${baseIntervalSeconds * 10}s)`,
  );

  const executePollingCycle = async () => {
    if (isPollingActive) return;
    isPollingActive = true;
    cycleCounter++;
    const isTenMinuteWindow = cycleCounter % 10 === 0 || cycleCounter === 1;

    try {
      const nowIso = new Date().toISOString();

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
      // Category 1: In Transit / Out for Delivery / Client Possession (1-Minute Cadence)
      const inTransitVehicles = allVehicles.filter(
        (v) => v.status === "in_transit" || activeDeliveryVehicleIds.has(v.id),
      );

      // Category 2: In Hub (Available, Future Reserved, Maintenance) (10-Minute Cadence)
      const inHubVehicles = allVehicles.filter(
        (v) => v.status !== "in_transit" && !activeDeliveryVehicleIds.has(v.id),
      );

      // 1. Dispatch 1-minute pings to in-transit / delivery assets
      if (inTransitVehicles.length > 0) {
        for (const v of inTransitVehicles) {
          const { phone, code } = await resolveTrackerForVehicle(v);
          if (phone) {
            console.log(
              `\x1b[35m[Auto-Telematics (1m Cadence)]\x1b[0m In-Transit / Delivery ping for asset \x1b[32m"${v.name}"\x1b[0m (SIM: \x1b[33m${phone}\x1b[0m, Unit: \x1b[36m${code}\x1b[0m)`,
            );
            await sendSmsToTracker(phone, "WHERE#");
          }
        }
      } else {
        // Fallback for demo if tracker device exists
        await pollDemoTrackerIfActive();
      }

      // 2. Dispatch 10-minute pings to in-hub stationed assets
      if (isTenMinuteWindow && inHubVehicles.length > 0) {
        console.log(
          `\x1b[36m[Auto-Telematics (10m Cadence)]\x1b[0m Executing periodic status ping for ${inHubVehicles.length} asset(s) stationed at hub...`,
        );
        for (const v of inHubVehicles) {
          const { phone, code } = await resolveTrackerForVehicle(v);
          if (phone) {
            console.log(
              `\x1b[36m[Auto-Telematics (10m Cadence)]\x1b[0m In-Hub ping for asset \x1b[32m"${v.name}"\x1b[0m (SIM: \x1b[33m${phone}\x1b[0m, Unit: \x1b[36m${code}\x1b[0m)`,
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
