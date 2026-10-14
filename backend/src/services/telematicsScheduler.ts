import { supabase } from "../supabase";
import { sendSmsToTracker } from "./smsGatewayService";
import { config } from "../config";

let schedulerInterval: NodeJS.Timeout | null = null;
let isPollingActive = false;

/**
 * Automated telematics background daemon.
 * Periodically checks for vehicles currently on active trips ('in_transit')
 * and dispatches encrypted GSM pings ("WHERE#") to their trackers automatically.
 */
export function startTelematicsScheduler(intervalSeconds = 60) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log(
    `\x1b[36m[Telematics Scheduler]\x1b[0m Automated periodic vehicle polling active (every ${intervalSeconds}s)`,
  );

  const pollActiveFleet = async () => {
    if (isPollingActive) return;
    isPollingActive = true;

    try {
      // 1. Find all vehicles currently in transit or reserved
      const { data: activeVehicles, error: vErr } = await supabase
        .from("vehicles")
        .select("id, name, status, assigned_tracker_id")
        .in("status", ["in_transit", "reserved"]);

      if (vErr || !activeVehicles || activeVehicles.length === 0) {
        // Fallback for demo: if demo tracker has active booking or testing mode
        await pollDemoTrackerIfActive();
        return;
      }

      for (const vehicle of activeVehicles) {
        let trackerSimPhone = config.trackerSimPhone;

        if (vehicle.assigned_tracker_id) {
          const { data: tracker } = await supabase
            .from("tracker_devices")
            .select("sim_phone_number, device_code")
            .eq("id", vehicle.assigned_tracker_id)
            .maybeSingle();

          if (tracker && tracker.sim_phone_number) {
            trackerSimPhone = tracker.sim_phone_number;
          }
        }

        if (trackerSimPhone) {
          console.log(
            `\x1b[35m[Auto-Telematics]\x1b[0m Automated ping dispatch for active asset \x1b[32m"${vehicle.name}"\x1b[0m (SIM: \x1b[33m${trackerSimPhone}\x1b[0m)`,
          );
          await sendSmsToTracker(trackerSimPhone, "WHERE#");
        }
      }
    } catch (err: any) {
      console.warn(
        "[Auto-Telematics] Error during automated cycle:",
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
          `\x1b[35m[Auto-Telematics]\x1b[0m Automated ping for fleet unit TRK-892-SIM (SIM: \x1b[33m${phone}\x1b[0m)`,
        );
        await sendSmsToTracker(phone, "WHERE#");
      }
    } catch (err: any) {
      console.warn("[Auto-Telematics] Demo poll error:", err.message);
    }
  }

  // Initial poll after 5 seconds, then periodic
  setTimeout(pollActiveFleet, 5000);
  schedulerInterval = setInterval(pollActiveFleet, intervalSeconds * 1000);
}

export function stopTelematicsScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Telematics Scheduler] Automated polling stopped.");
  }
}
