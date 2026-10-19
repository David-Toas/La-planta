import { Router, Request, Response } from "express";
import { parseSmsOrNmeaPayload } from "../parsers/nmeaParser";
import { recordTelematicsPing } from "../services/telematicsService";
import { supabase } from "../supabase";
import { config } from "../config";

export const webhooksRouter = Router();

/**
 * Inbound SMS Webhook from Termii or Africa's Talking
 * Triggered whenever the tracker SIM sends an SMS reply
 * Hardened with secret validation and registered tracker SIM whitelist
 */
webhooksRouter.post("/sms", async (req: Request, res: Response) => {
  try {
    // 1. Webhook Secret Validation (if configured)
    if (process.env.SMS_WEBHOOK_SECRET) {
      const incomingSecret =
        (req.headers["x-webhook-secret"] as string) ||
        (req.query.secret as string);
      if (incomingSecret !== process.env.SMS_WEBHOOK_SECRET) {
        console.warn("[Webhook] Unauthorized SMS webhook invocation rejected: Invalid secret token.");
        return res.status(401).json({ error: "Invalid or missing webhook secret" });
      }
    }

    const payload = req.body || {};
    console.log("[Webhook] Received inbound SMS payload:", JSON.stringify(payload));

    // Termii Webhook format: { from: "+2348037294810", to: "LaPlanta", text: "...", date: "..." }
    // Africa's Talking format: { from: "+234803...", text: "...", to: "..." }
    const fromPhone = payload.from || payload.sender || payload.phone || "";
    const rawMessage = payload.text || payload.message || payload.body || "";

    if (!fromPhone || !rawMessage) {
      return res.status(400).json({ error: "Missing sender or text in webhook payload" });
    }

    // 2. Sender Verification: Verify sender number matches a fleet tracker
    const cleanPhone = fromPhone.replace(/[\s\-\+]/g, "").slice(-10);
    const isConfigFallback = config.trackerSimPhone?.replace(/[\s\-\+]/g, "").slice(-10) === cleanPhone;

    if (!isConfigFallback) {
      const { data: tracker } = await supabase
        .from("tracker_devices")
        .select("id")
        .ilike("sim_phone_number", `%${cleanPhone}%`)
        .maybeSingle();

      if (!tracker && process.env.NODE_ENV === "production") {
        console.warn(`[Webhook Blocked] SMS from unauthorized phone number: ${fromPhone}`);
        return res.status(403).json({ error: "Sender phone number is not bound to any registered tracker" });
      }
    }

    // Parse coordinates, speed, battery from the message
    const parsed = parseSmsOrNmeaPayload(rawMessage);

    if (!parsed) {
      console.warn(`[Webhook] Could not extract GPS coordinates from SMS: "${rawMessage}"`);
      return res.status(200).json({ status: "received_unparsed", rawMessage });
    }

    // Save to Supabase telematics_pings
    const result = await recordTelematicsPing({
      simPhoneNumber: fromPhone,
      parsedLocation: parsed,
      triggerType: "auto_periodic",
    });

    return res.status(200).json({
      status: "success",
      recorded: result.success,
      coordinates: { lat: parsed.latitude, lng: parsed.longitude, speed: parsed.speedKmh },
    });
  } catch (err: any) {
    console.error("[Webhook Error] Inbound SMS processing failure:", err);
    return res.status(500).json({ error: err.message });
  }
});
