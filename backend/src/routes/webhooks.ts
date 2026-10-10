import { Router, Request, Response } from "express";
import { parseSmsOrNmeaPayload } from "../parsers/nmeaParser";
import { recordTelematicsPing } from "../services/telematicsService";

export const webhooksRouter = Router();

/**
 * Inbound SMS Webhook from Termii or Africa's Talking
 * Triggered whenever the tracker SIM sends an SMS reply
 */
webhooksRouter.post("/sms", async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    console.log("[Webhook] Received inbound SMS payload:", JSON.stringify(payload));

    // Termii Webhook format: { from: "+2348037294810", to: "LaPlanta", text: "...", date: "..." }
    // Africa's Talking format: { from: "+234803...", text: "...", to: "..." }
    const fromPhone = payload.from || payload.sender || payload.phone || "";
    const rawMessage = payload.text || payload.message || payload.body || "";

    if (!fromPhone || !rawMessage) {
      return res.status(400).json({ error: "Missing sender or text in webhook payload" });
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
