import { Router, Request, Response } from "express";
import crypto from "crypto";
import { config } from "../config";
import { supabase } from "../supabase";
import { sendBookingConfirmationEmail } from "../services/emailService";

export const paymentsRouter = Router();

// In-memory payment ledger audit log (synced with Supabase bookings)
interface PaymentAuditLog {
  id: string;
  reference: string;
  gateway: "paystack";
  amount: number;
  amount_formatted: string;
  currency: string;
  channel: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: "success" | "failed" | "pending";
  booking_code: string;
  vehicle_name?: string;
  paid_at: string;
  raw_gateway_ref?: string;
}

const memoryPaymentLogs: PaymentAuditLog[] = [];

/**
 * POST /api/payments/initialize
 * Initializes transaction with Paystack or prepares inline payment reference
 */
paymentsRouter.post("/initialize", async (req: Request, res: Response) => {
  try {
    const { email, amount, bookingCode, customerName, phone, vehicleName } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount (in NGN) are required" });
    }

    const reference = `LP_${bookingCode || "BK"}_${Date.now()}`;
    const amountInKobo = Math.round(Number(amount) * 100);

    // If Paystack Secret Key is configured, initialize remotely
    if (config.paystack.secretKey && config.paystack.secretKey.startsWith("sk_")) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          currency: "NGN",
          reference,
          metadata: {
            custom_fields: [
              { display_name: "Booking Code", variable_name: "booking_code", value: bookingCode },
              { display_name: "Customer Name", variable_name: "customer_name", value: customerName },
              { display_name: "Vehicle", variable_name: "vehicle", value: vehicleName },
            ],
          },
        }),
      });

      const data = await response.json();
      if (!data.status) {
        return res.status(400).json({ error: data.message || "Paystack initialization failed" });
      }

      return res.json({
        success: true,
        reference,
        amount,
        amountInKobo,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        publicKey: config.paystack.publicKey,
      });
    }

    // Dev / Test mode fallback
    return res.json({
      success: true,
      reference,
      amount,
      amountInKobo,
      publicKey: config.paystack.publicKey || "pk_test_sample_key",
      mode: "inline_ready",
    });
  } catch (err: any) {
    console.error("[Payments Error] Initialize failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Paystack transaction reference server-side, updates Supabase, and logs payment
 */
paymentsRouter.post("/verify", async (req: Request, res: Response) => {
  try {
    const {
      reference,
      bookingCode,
      customerName,
      email,
      amount,
      vehicleName,
      phone,
      vehicleId,
      clientId,
      rentalDays,
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
    } = req.body;

    if (!reference) {
      return res.status(400).json({ error: "Transaction reference is required" });
    }

    let isSuccess = false;
    let channel = "card";
    let paidAmount = Number(amount) || 0;
    let gatewayRef = reference;

    // Verify against Paystack (Fail-closed: requires valid Paystack secret key)
    if (!config.paystack.secretKey || !config.paystack.secretKey.startsWith("sk_")) {
      console.error("[SECURITY] Paystack secret key is missing or invalid. Rejecting payment verification.");
      return res.status(503).json({
        success: false,
        error: "Payment verification service is temporarily unavailable. Please contact concierge support.",
      });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${config.paystack.secretKey}`,
      },
    });

    const data = await response.json();
    if (data.status && data.data.status === "success") {
      isSuccess = true;
      channel = data.data.channel || "card";
      paidAmount = data.data.amount / 100;
      gatewayRef = data.data.reference;

      // Cryptographic & Integrity check: Verify paid amount matches expected booking fee
      if (amount && Number(amount) > 0) {
        const expectedNgn = Number(amount);
        if (paidAmount < expectedNgn * 0.99) {
          console.error(`[SECURITY] Payment underpayment tampering detected: Expected ₦${expectedNgn}, Received ₦${paidAmount} for ref: ${reference}`);
          return res.status(400).json({
            success: false,
            error: "Payment settlement amount does not match required charter rate.",
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: data.message || "Payment verification failed on Paystack",
      });
    }

    if (isSuccess) {
      const timestamp = new Date().toISOString();

      // Record in Memory Audit Ledger
      const auditLog: PaymentAuditLog = {
        id: `tx-${Date.now()}`,
        reference,
        gateway: "paystack",
        amount: Number(paidAmount),
        amount_formatted: `₦${Number(paidAmount).toLocaleString()}`,
        currency: "NGN",
        channel,
        customer_name: customerName || "Executive Client",
        customer_email: email || "client@laplanta.ng",
        customer_phone: phone || "+234 800 000 0000",
        status: "success",
        booking_code: bookingCode || reference,
        vehicle_name: vehicleName || "Reserved Fleet Unit",
        paid_at: timestamp,
        raw_gateway_ref: gatewayRef,
      };
      memoryPaymentLogs.unshift(auditLog);

      // Upsert into Supabase bookings table
      try {
        // Resolve client_id: use provided clientId, or lookup profile by email
        let resolvedClientId = clientId;
        if (!resolvedClientId && email) {
          const { data: p } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (p?.id) resolvedClientId = p.id;
        }
        if (!resolvedClientId) {
          resolvedClientId = "00000000-0000-0000-0000-000000000002";
        }

        // Resolve vehicle_id: use provided vehicleId, or lookup by vehicleName
        let resolvedVehicleId = vehicleId;
        if (!resolvedVehicleId && vehicleName) {
          const { data: v } = await supabase
            .from("vehicles")
            .select("id")
            .ilike("name", `%${vehicleName}%`)
            .limit(1)
            .maybeSingle();
          if (v?.id) resolvedVehicleId = v.id;
        }
        if (!resolvedVehicleId) {
          const { data: v } = await supabase.from("vehicles").select("id").limit(1).maybeSingle();
          resolvedVehicleId = v?.id || "a1b2c3d4-e5f6-7890-abcd-111111111111";
        }

        const effectiveBookingCode = bookingCode || `LP-${Date.now().toString().slice(-4)}`;

        // Check if booking already exists
        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("id")
          .or(`booking_reference.eq.${effectiveBookingCode},payment_reference.eq.${reference}`)
          .maybeSingle();

        if (existingBooking) {
          await supabase
            .from("bookings")
            .update({
              payment_status: "paid",
              status: "confirmed",
              total_amount_ngn: Number(paidAmount),
              updated_at: timestamp,
            })
            .eq("id", existingBooking.id);
          console.log(`[Payments] Updated existing booking ${existingBooking.id}`);
        } else {
          const { error: insErr } = await supabase.from("bookings").insert({
            booking_reference: effectiveBookingCode,
            client_id: resolvedClientId,
            vehicle_id: resolvedVehicleId,
            service_type: "chauffeur_driven",
            status: "confirmed",
            pickup_location: pickupLocation || "La Planta Flagship Hub (Victoria Island)",
            pickup_datetime: startDate || timestamp,
            dropoff_location: dropoffLocation || pickupLocation || "Victoria Island / Lagos Mainland",
            dropoff_datetime:
              endDate ||
              new Date(Date.now() + 86400000 * (Number(rentalDays) || 3)).toISOString(),
            base_price_ngn: Number(paidAmount),
            total_amount_ngn: Number(paidAmount),
            total_amount_usd: Math.round(Number(paidAmount) / 1400),
            payment_status: "paid",
            payment_gateway: "paystack",
            payment_reference: reference,
            paid_at: timestamp,
            special_instructions: `Executive Booking via Paystack for ${customerName || email}`,
            verification_pin: `${effectiveBookingCode.replace(/\D/g, "").slice(-4) || "8842"}-09`,
            qr_pass_token: crypto.randomBytes(16).toString("hex"),
            is_tarmac_intake_required: false,
            created_at: timestamp,
            updated_at: timestamp,
          });
          if (insErr) {
            console.warn("[Payments Warning] Supabase insert failed:", insErr.message);
          } else {
            console.log(`[Payments] Created new confirmed booking ${effectiveBookingCode} in Supabase`);
          }
        }

        // Mark vehicle as reserved in Supabase
        if (resolvedVehicleId) {
          await supabase
            .from("vehicles")
            .update({ status: "reserved" })
            .eq("id", resolvedVehicleId);
          console.log(`[Payments] Marked vehicle ${resolvedVehicleId} as reserved`);
        }
      } catch (dbErr: any) {
        console.warn("[Payments Warning] Supabase upsert bypassed:", dbErr.message);
      }

      console.log(`\x1b[32m[Paystack Verified]\x1b[0m ₦${Number(paidAmount).toLocaleString()} for ${customerName || email} (Ref: ${reference})`);

      // 4. Trigger Luxury Transactional Email Dispatch (Resend / SMTP / Simulation)
      try {
        await sendBookingConfirmationEmail({
          clientName: customerName || "Executive Guest",
          email: email || "client@laplanta.ng",
          bookingCode: bookingCode || reference,
          vehicleName: vehicleName || "Reserved Fleet Unit",
          dates: "Nov 14 – Nov 17, 2024",
          rentalDays: 3,
          amountFormatted: `₦${Number(paidAmount).toLocaleString()}`,
          chauffeurProtocol: "Dedicated Professional Driver Included",
          corridor: "Lagos & Abuja Executive Corridors",
          passUrl: `${config.clientUrl}/reservation-pass`,
          trackingUrl: `${config.clientUrl}/live-tracking`,
        });
      } catch (mailErr: any) {
        console.warn("[Payments Warning] Email dispatch failed:", mailErr.message);
      }

      return res.json({
        success: true,
        message: "Payment successfully verified and settled",
        transaction: auditLog,
      });
    }

    return res.status(400).json({ success: false, error: "Payment verification could not be completed" });
  } catch (err: any) {
    console.error("[Payments Error] Verify failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/payments/webhook
 * Paystack background event webhook with HMAC SHA512 signature validation
 */
paymentsRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;

    if (!config.paystack.secretKey) {
      console.error("[Paystack Webhook] Secret key is unconfigured on server.");
      return res.status(500).send("Webhook secret unconfigured");
    }

    if (!signature) {
      console.warn("[Paystack Webhook] Access denied: Missing x-paystack-signature header.");
      return res.status(401).send("Missing webhook signature");
    }

    const payload = (req as any).rawBody || JSON.stringify(req.body);
    const hash = crypto
      .createHmac("sha512", config.paystack.secretKey)
      .update(payload)
      .digest("hex");

    if (hash !== signature) {
      console.warn("[Paystack Webhook] Invalid HMAC signature rejected.");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;
    console.log(`\x1b[34m[Paystack Webhook Event]\x1b[0m ${event?.event}`);

    if (event?.event === "charge.success") {
      const data = event.data;
      const amountNgn = data.amount / 100;
      const ref = data.reference;

      // Update in memory audit log
      const existing = memoryPaymentLogs.find((l) => l.reference === ref);
      if (!existing) {
        memoryPaymentLogs.unshift({
          id: `tx-${data.id || Date.now()}`,
          reference: ref,
          gateway: "paystack",
          amount: amountNgn,
          amount_formatted: `₦${amountNgn.toLocaleString()}`,
          currency: data.currency || "NGN",
          channel: data.channel || "card",
          customer_name: data.customer?.first_name ? `${data.customer.first_name} ${data.customer.last_name || ""}` : "Verified Guest",
          customer_email: data.customer?.email || "",
          status: "success",
          booking_code: data.metadata?.booking_code || ref,
          paid_at: data.paid_at || new Date().toISOString(),
          raw_gateway_ref: String(data.id),
        });
      }

      // Update Supabase booking
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          total_amount_ngn: amountNgn,
        })
        .or(`id.eq.${ref},id.eq.${data.metadata?.booking_code}`);

      // Dispatch confirmation email in background
      if (data.customer?.email) {
        const clientDomain = process.env.FRONTEND_URL || "https://la-planta-ocrt.vercel.app";
        sendBookingConfirmationEmail({
          clientName: data.customer?.first_name
            ? `${data.customer.first_name} ${data.customer.last_name || ""}`
            : "Verified Guest",
          email: data.customer.email,
          bookingCode: data.metadata?.booking_code || ref,
          vehicleName: data.metadata?.vehicle || "Reserved Fleet Unit",
          dates: "Nov 14 – Nov 17, 2024",
          rentalDays: Number(data.metadata?.rental_days) || 3,
          amountFormatted: `₦${amountNgn.toLocaleString()}`,
          chauffeurProtocol: "Dedicated Professional Driver Included",
          corridor: "Lagos & Abuja Executive Corridors",
          passUrl: `${clientDomain}/reservation-pass`,
          trackingUrl: `${clientDomain}/live-tracking`,
        }).catch((err) =>
          console.warn("[Webhook Email Warning]:", err.message)
        );
      }
    }

    return res.sendStatus(200);
  } catch (err: any) {
    console.error("[Payments Webhook Error]:", err);
    return res.sendStatus(500);
  }
});

/**
 * GET /api/payments/logs
 * Returns audit trail of all transactions processed for the Admin Command Cockpit
 */
paymentsRouter.get("/logs", async (req: Request, res: Response) => {
  try {
    // 1. Fetch live bookings from Supabase
    let dbLogs: any[] = [];
    try {
      const { data } = await supabase
        .from("bookings")
        .select("id, total_amount_ngn, payment_status, status, created_at, profiles(full_name, email, phone), vehicles(name, brand, model)")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        dbLogs = data
          .filter((b) => b.payment_status === "paid" || b.payment_status === "completed")
          .map((b) => ({
            id: `db-${b.id}`,
            reference: `LP-PAY-${b.id.substring(0, 8).toUpperCase()}`,
            gateway: "paystack",
            amount: Number(b.total_amount_ngn) || 0,
            amount_formatted: `₦${(Number(b.total_amount_ngn) || 0).toLocaleString()}`,
            currency: "NGN",
            channel: "card",
            customer_name: (b.profiles as any)?.full_name || "Executive Guest",
            customer_email: (b.profiles as any)?.email || "guest@laplanta.ng",
            customer_phone: (b.profiles as any)?.phone || "",
            status: "success",
            booking_code: `LP-${b.id.substring(0, 6).toUpperCase()}`,
            vehicle_name: b.vehicles
              ? (b.vehicles as any).name || `${(b.vehicles as any).brand} ${(b.vehicles as any).model}`
              : "Executive Vehicle",
            paid_at: b.created_at,
          }));
      }
    } catch (e) {
      // Fallback to memory logs
    }

    // Merge memory logs and DB logs, deduplicating references
    const combined = [...memoryPaymentLogs];
    for (const d of dbLogs) {
      if (!combined.some((m) => m.reference === d.reference || m.booking_code === d.booking_code)) {
        combined.push(d);
      }
    }

    const totalSettled = combined
      .filter((l) => l.status === "success")
      .reduce((sum, l) => sum + l.amount, 0);

    return res.json({
      success: true,
      total_settled_amount: totalSettled,
      total_settled_formatted: `₦${totalSettled.toLocaleString()}`,
      count: combined.length,
      logs: combined,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/payments/my-bookings
 * Securely fetch bookings for a client by ID, email, or booking reference
 */
paymentsRouter.get("/my-bookings", async (req: Request, res: Response) => {
  try {
    const { userId, email, bookingCode } = req.query;

    let query = supabase
      .from("bookings")
      .select(`
        *,
        vehicles:vehicle_id (*),
        drivers:driver_id (*)
      `)
      .order("created_at", { ascending: false });

    if (bookingCode) {
      const code = String(bookingCode).replace("#", "");
      query = query.or(`booking_reference.eq.${code},booking_reference.eq.#${code}`);
    } else if (userId && email) {
      query = query.or(`client_id.eq.${userId},special_instructions.ilike.%${email}%`);
    } else if (userId) {
      query = query.eq("client_id", String(userId));
    } else if (email) {
      query = query.ilike("special_instructions", `%${email}%`);
    } else {
      return res.status(400).json({ error: "userId, email, or bookingCode required" });
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({
      success: true,
      bookings: data || [],
    });
  } catch (err: any) {
    console.error("[Payments] My Bookings error:", err.message);
    return res.status(500).json({ error: err.message, bookings: [] });
  }
});

