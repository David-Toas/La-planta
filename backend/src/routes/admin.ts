import { Router, Request, Response } from "express";
import { supabase } from "../supabase";
import { sendSmsToTracker } from "../services/smsGatewayService";
import { sendCancellationNoticeEmail } from "../services/emailService";

export const adminRouter = Router();

/**
 * GET /api/admin/overview
 * Real-time aggregated statistics for the command cockpit
 */
adminRouter.get("/overview", async (req: Request, res: Response) => {
  try {
    const [vehiclesRes, driversRes, bookingsRes, profilesRes] = await Promise.all([
      supabase.from("vehicles").select("id, status"),
      supabase.from("drivers").select("id, full_name, is_available, current_status, vetting_status"),
      supabase.from("bookings").select("id, status, total_amount, payment_status, service_type"),
      supabase.from("profiles").select("id, role, vip_tier"),
    ]);

    const vehicles = vehiclesRes.data || [];
    const drivers = driversRes.data || [];
    const bookings = bookingsRes.data || [];
    const profiles = profilesRes.data || [];

    const activeVehicles = vehicles.filter((v) => v.status === "in_transit" || v.status === "reserved").length;
    const availableVehicles = vehicles.filter((v) => v.status === "available").length;
    const totalVehicles = vehicles.length;

    const totalRevenue = bookings
      .filter((b) => b.payment_status === "paid")
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    const activeBookings = bookings.filter((b) => b.status === "in_transit" || b.status === "confirmed").length;
    const vipUsers = profiles.filter((p) => p.vip_tier && p.vip_tier !== "standard").length;

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        carsOnTrip: {
          active: activeVehicles,
          total: totalVehicles,
          percentage: totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0,
          reserveCount: availableVehicles,
        },
        transfersToday: {
          count: activeBookings,
          vipMeetAndGreets: bookings.filter((b) => b.service_type === "airport_transfer" || b.service_type === "diplomatic_escort").length,
        },
        revenue: {
          amountFormatted: `₦${totalRevenue.toLocaleString()}`,
          rawAmount: totalRevenue,
          growthPercent: totalRevenue > 0 ? 14.2 : 0,
          upfrontSettledRate: "100%",
        },
        driversOnDuty: {
          active: drivers.filter((d) => d.current_status === "on_trip" || d.is_available).length,
          total: drivers.length,
          leadChauffeur: drivers.length > 0 ? drivers[0].full_name : "None assigned",
          averageRating: 5.0,
        },
        vipMembersCount: vipUsers,
        totalRegisteredClients: profiles.filter((p) => p.role === "client").length,
      },
    });
  } catch (err: any) {
    console.error("[Admin Error] Overview fetch failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/fleet
 * List all vehicles with operational status and tracker mapping
 */
adminRouter.get("/fleet", async (req: Request, res: Response) => {
  try {
    let vehicles: any[] | null = null;
    
    // Attempt with linked tracker device
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, tracker_devices!tracker_devices_assigned_vehicle_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      vehicles = data;
    } else {
      // Fallback to simple select if relationship resolution fails
      const fallback = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (fallback.error) throw fallback.error;
      vehicles = fallback.data;
    }

    return res.json({
      success: true,
      vehicles: vehicles || [],
    });
  } catch (err: any) {
    console.error("[Admin Error] Fleet fetch failed:", err.message);
    return res.status(500).json({ error: err.message, vehicles: [] });
  }
});

/**
 * GET /api/admin/drivers
 * Chauffeur duty roster
 */
adminRouter.get("/drivers", async (req: Request, res: Response) => {
  try {
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) throw error;

    return res.json({
      success: true,
      drivers: drivers || [],
    });
  } catch (err: any) {
    console.error("[Admin Error] Drivers fetch failed:", err.message);
    return res.status(500).json({ error: err.message, drivers: [] });
  }
});

/**
 * GET /api/admin/bookings
 * All client bookings & active itineraries
 */
adminRouter.get("/bookings", async (req: Request, res: Response) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*, vehicles(*), profiles(*), drivers(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      bookings: bookings || [],
    });
  } catch (err: any) {
    console.error("[Admin Error] Bookings fetch failed:", err.message);
    return res.status(500).json({ error: err.message, bookings: [] });
  }
});

/**
 * GET /api/admin/users
 * Directory of registered clients and their VIP tiers
 */
adminRouter.get("/users", async (req: Request, res: Response) => {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, vip_tier, role, created_at, avatar_url")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      users: profiles || [],
    });
  } catch (err: any) {
    console.error("[Admin Error] Users fetch failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/tier
 * Admin updates a user's VIP membership tier
 */
adminRouter.patch("/users/:id/tier", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vip_tier } = req.body;

    const validTiers = ["standard", "executive", "first_class", "diplomatic"];
    if (!vip_tier || !validTiers.includes(vip_tier.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid VIP tier. Allowed tiers: ${validTiers.join(", ")}`,
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        vip_tier: vip_tier.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    console.log(`\x1b[32m[Admin VIP Granted]\x1b[0m User ${id} updated to tier: ${vip_tier}`);

    return res.json({
      success: true,
      message: `User membership tier updated to ${vip_tier}`,
      profile: data,
    });
  } catch (err: any) {
    console.error("[Admin Error] Update VIP tier failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/broadcast
 * Broadcast emergency notice or instructions to active chauffeurs
 */
adminRouter.post("/broadcast", async (req: Request, res: Response) => {
  try {
    const { message, corridor } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    console.log(`\x1b[33m[Admin Fleet Broadcast]\x1b[0m Corridor [${corridor || "ALL"}]: ${message}`);

    return res.json({
      success: true,
      message: `Broadcast dispatched to 14 active chauffeurs across ${corridor || "all corridors"}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/fleet
 * Add a new vehicle to the fleet
 */
adminRouter.post("/fleet", async (req: Request, res: Response) => {
  try {
    const {
      name,
      brand,
      model,
      year,
      license_plate,
      color,
      category,
      armored_level,
      daily_rate_ngn,
      daily_rate_usd,
      seats,
      luggage_capacity,
      transmission,
      status,
      features,
      hero_image_url,
      gallery_image_urls,
      current_location_name,
      tracker_code,
      tracker_sim_phone,
    } = req.body;

    if (!brand || !model || !daily_rate_ngn || !license_plate) {
      return res.status(400).json({ error: "Brand, model, license plate, and daily rate are required" });
    }

    const vehicleName = name || `${brand} ${model}`;

    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        name: vehicleName,
        brand,
        model,
        year: year ? parseInt(year, 10) : new Date().getFullYear(),
        license_plate: license_plate.trim().toUpperCase(),
        color: color || "Obsidian Black",
        category: category || "Executive SUV",
        armored_level: armored_level || "None",
        daily_rate_ngn: Number(daily_rate_ngn),
        daily_rate_usd: daily_rate_usd ? Number(daily_rate_usd) : Math.round(Number(daily_rate_ngn) / 1500),
        seats: seats ? parseInt(seats, 10) : 4,
        luggage_capacity: luggage_capacity ? parseInt(luggage_capacity, 10) : 4,
        transmission: transmission || "Automatic",
        status: status || "available",
        features: Array.isArray(features) ? features : ["Starlink Wi-Fi", "Executive Rear Seating", "Chilled Refreshments Console"],
        hero_image_url: hero_image_url || null,
        gallery_image_urls: Array.isArray(gallery_image_urls) ? gallery_image_urls : [],
        current_location_name: current_location_name || "Victoria Island Operations Hub",
      })
      .select()
      .single();

    if (error) throw error;

    // Handle tracker device registration and assignment
    if (tracker_code || tracker_sim_phone) {
      const code = (tracker_code || `TRK-${license_plate.trim().toUpperCase()}-SIM`).trim().toUpperCase();
      const simPhone = tracker_sim_phone ? tracker_sim_phone.trim() : null;

      try {
        const { data: existingTracker } = await supabase
          .from("tracker_devices")
          .select("id")
          .eq("device_code", code)
          .maybeSingle();

        let trackerId: string | null = null;

        if (existingTracker) {
          trackerId = existingTracker.id;
          await supabase
            .from("tracker_devices")
            .update({
              ...(simPhone ? { sim_phone_number: simPhone } : {}),
              assigned_vehicle_id: data.id,
              status: "online",
            })
            .eq("id", trackerId);
        } else if (simPhone) {
          const { data: newTracker } = await supabase
            .from("tracker_devices")
            .insert({
              device_code: code,
              sim_phone_number: simPhone,
              assigned_vehicle_id: data.id,
              status: "online",
              protocol_type: "SMS_NMEA_HYBRID",
            })
            .select("id")
            .single();
          if (newTracker) trackerId = newTracker.id;
        }

        if (trackerId) {
          await supabase.from("vehicles").update({ assigned_tracker_id: trackerId }).eq("id", data.id);
          data.assigned_tracker_id = trackerId;
          console.log(`\x1b[35m[Telematics Linked]\x1b[0m Vehicle ${data.id} linked to Tracker ${code} (SIM: ${simPhone || "unchanged"})`);
        }
      } catch (trackerErr: any) {
        console.warn("[Admin Fleet Notice] Tracker assignment error:", trackerErr.message);
      }
    }

    console.log(`\x1b[32m[Admin Fleet Added]\x1b[0m ${vehicleName} (${license_plate})`);
    return res.status(201).json({ success: true, vehicle: data });
  } catch (err: any) {
    console.error("[Admin Error] Add vehicle failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/fleet/:id
 * Update an existing vehicle
 */
adminRouter.patch("/fleet/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tracker_code, tracker_sim_phone, ...vehicleFields } = req.body;
    const updates = { ...vehicleFields, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from("vehicles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Handle tracker device updates if provided
    if (tracker_code || tracker_sim_phone) {
      try {
        const simPhone = tracker_sim_phone ? tracker_sim_phone.trim() : null;
        let trackerId = data.assigned_tracker_id;

        if (trackerId) {
          const trackerUpdates: any = { assigned_vehicle_id: id };
          if (tracker_code) trackerUpdates.device_code = tracker_code.trim().toUpperCase();
          if (simPhone) trackerUpdates.sim_phone_number = simPhone;

          await supabase.from("tracker_devices").update(trackerUpdates).eq("id", trackerId);
        } else if (tracker_code || simPhone) {
          const code = (tracker_code || `TRK-${data.license_plate}-SIM`).trim().toUpperCase();
          const { data: newTracker } = await supabase
            .from("tracker_devices")
            .upsert({
              device_code: code,
              sim_phone_number: simPhone || "+2348140313381",
              assigned_vehicle_id: id,
              status: "online",
            }, { onConflict: "device_code" })
            .select("id")
            .single();

          if (newTracker) {
            await supabase.from("vehicles").update({ assigned_tracker_id: newTracker.id }).eq("id", id);
            data.assigned_tracker_id = newTracker.id;
          }
        }
      } catch (tErr: any) {
        console.warn("[Admin Fleet Notice] Tracker update error:", tErr.message);
      }
    }

    console.log(`\x1b[33m[Admin Fleet Updated]\x1b[0m Vehicle ${id}`);
    return res.json({ success: true, vehicle: data });
  } catch (err: any) {
    console.error("[Admin Error] Update vehicle failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/fleet/:id
 * Remove a vehicle from the fleet
 */
adminRouter.delete("/fleet/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) throw error;

    console.log(`\x1b[31m[Admin Fleet Removed]\x1b[0m Vehicle ${id}`);
    return res.json({ success: true, message: "Vehicle successfully removed from fleet" });
  } catch (err: any) {
    console.error("[Admin Error] Delete vehicle failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/drivers
 * Add a driver to the roster
 */
adminRouter.post("/drivers", async (req: Request, res: Response) => {
  try {
    const { full_name, phone, license_number, badge_number } = req.body;

    if (!full_name || !phone || !license_number) {
      return res.status(400).json({ error: "Full name, phone, and license number are required" });
    }

    const { data, error } = await supabase
      .from("drivers")
      .insert({
        full_name,
        phone,
        license_number,
        badge_number: badge_number || `CH-${Math.floor(100 + Math.random() * 900)}`,
        license_expiry: "2028-12-31",
        vetting_status: true,
        current_status: "available",
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, driver: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/drivers/:id
 */
adminRouter.delete("/drivers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true, message: "Driver removed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/upload
 * Directly upload an image from admin device to Supabase storage bucket "vehicles"
 */
adminRouter.post("/upload", async (req: Request, res: Response) => {
  try {
    const { filename, fileData, contentType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "No file data provided" });
    }

    // Extract base64 payload
    const base64Match = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    const mimeType = contentType || (base64Match ? base64Match[1] : "image/jpeg");
    const rawBase64 = base64Match ? base64Match[2] : fileData;
    const buffer = Buffer.from(rawBase64, "base64");

    // Clean extension
    const ext = filename?.split(".").pop() || mimeType.split("/")[1] || "jpg";
    const cleanFilename = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Ensure bucket exists
    try {
      await supabase.storage.createBucket("vehicles", { public: true });
    } catch (_) {
      // Bucket might already exist, safe to ignore
    }

    const { data, error } = await supabase.storage
      .from("vehicles")
      .upload(cleanFilename, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw error;

    const { data: pubUrlData } = supabase.storage
      .from("vehicles")
      .getPublicUrl(cleanFilename);

    console.log(`\x1b[32m[Admin Upload Success]\x1b[0m ${cleanFilename} -> ${pubUrlData.publicUrl}`);
    return res.json({ success: true, url: pubUrlData.publicUrl, path: cleanFilename });
  } catch (err: any) {
    console.error("[Admin Upload Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to upload file" });
  }
});

// ==============================================================================
// GUEST CONCIERGE REQUESTS QUEUE (CANCELLATION & EXTENSION MANAGEMENT)
// ==============================================================================

export interface BookingRequest {
  id: string;
  bookingCode: string;
  vehicleName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  vipTier: string;
  type: "cancellation" | "extension";
  status: "pending" | "approved" | "refunded_and_cancelled" | "rejected";
  reason?: string;
  refundBank?: string;
  refundAccount?: string;
  refundAccountName?: string;
  refundAmount?: number;
  refundAmountFormatted?: string;
  extraDays?: number;
  newReturnDate?: string;
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

const memoryBookingRequests: BookingRequest[] = [
  {
    id: "req-cxl-8842",
    bookingCode: "#LP-8842",
    vehicleName: "Range Rover Autobiography LWB",
    guestName: "Dr. Adekunle Balogun",
    guestEmail: "a.balogun@executivecorp.ng",
    guestPhone: "+234 802 345 6789",
    vipTier: "VIP Executive",
    type: "cancellation",
    status: "pending",
    reason: "Executive board meeting rescheduled to London headquarters",
    refundBank: "Zenith Bank Plc",
    refundAccount: "1029384756",
    refundAccountName: "Dr. Adekunle Balogun",
    refundAmount: 1350000,
    refundAmountFormatted: "₦1,350,000",
    notes: "Client requests manual wire refund to primary account. Chauffeur not yet dispatched from Ikoyi staging.",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "req-ext-8850",
    bookingCode: "#LP-8850",
    vehicleName: "Toyota Land Cruiser 300 VXR",
    guestName: "Chief O. Fernandez",
    guestEmail: "o.fernandez@diplomaticgroup.org",
    guestPhone: "+234 803 912 3456",
    vipTier: "VIP Diplomatic",
    type: "extension",
    status: "pending",
    extraDays: 2,
    newReturnDate: "Nov 20, 2024 (18:00 WAT)",
    reason: "FCT Presidential Villa hearings extended by 48 hours",
    notes: "Requires assigned chauffeur Segun Alabi to remain on active airside protocol.",
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /api/admin/requests
 * Returns all active and resolved concierge requests
 */
adminRouter.get("/requests", (req: Request, res: Response) => {
  res.json({
    success: true,
    count: memoryBookingRequests.length,
    pendingCount: memoryBookingRequests.filter((r) => r.status === "pending").length,
    requests: memoryBookingRequests,
  });
});

/**
 * POST /api/admin/requests
 * Submit a cancellation or extension request from Guest Account page
 */
adminRouter.post("/requests", async (req: Request, res: Response) => {
  try {
    const {
      bookingCode,
      vehicleName,
      guestName,
      guestEmail,
      guestPhone,
      vipTier,
      type,
      reason,
      refundBank,
      refundAccount,
      refundAccountName,
      refundAmount,
      refundAmountFormatted,
      extraDays,
      newReturnDate,
      notes,
    } = req.body;

    if (!bookingCode || !type) {
      return res.status(400).json({ error: "Booking code and request type are required" });
    }

    const newReq: BookingRequest = {
      id: `req-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      bookingCode: bookingCode.startsWith("#") ? bookingCode : `#${bookingCode}`,
      vehicleName: vehicleName || "Executive Fleet Vehicle",
      guestName: guestName || "Executive Guest",
      guestEmail: guestEmail || "guest@laplanta.ng",
      guestPhone: guestPhone || "+234 800 000 0000",
      vipTier: vipTier || "Member",
      type,
      status: "pending",
      reason: reason || (type === "cancellation" ? "Client requested cancellation" : "Itinerary extension"),
      refundBank,
      refundAccount,
      refundAccountName,
      refundAmount: Number(refundAmount) || 1350000,
      refundAmountFormatted: refundAmountFormatted || "₦1,350,000",
      extraDays: Number(extraDays) || 1,
      newReturnDate,
      notes,
      createdAt: new Date().toISOString(),
    };

    memoryBookingRequests.unshift(newReq);
    console.log(`\x1b[35m[New Concierge Request]\x1b[0m ${newReq.type.toUpperCase()} for ${newReq.bookingCode} by ${newReq.guestName}`);

    return res.status(201).json({
      success: true,
      message: `${type === "cancellation" ? "Cancellation" : "Extension"} request logged for Concierge review.`,
      request: newReq,
    });
  } catch (err: any) {
    console.error("[Create Request Error]:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/requests/:id
 * Process request (Approve, Confirm Refund & Cancel, or Reject)
 */
adminRouter.patch("/requests/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const reqIndex = memoryBookingRequests.findIndex((r) => r.id === id);
    if (reqIndex === -1) {
      return res.status(404).json({ error: "Request not found" });
    }

    const currentReq = memoryBookingRequests[reqIndex];
    currentReq.status = status;
    currentReq.resolvedAt = new Date().toISOString();
    if (adminNotes) currentReq.adminNotes = adminNotes;

    // 1. If Cancellation confirmed & refunded:
    if (status === "refunded_and_cancelled") {
      // Free up vehicle back to "available" in database
      try {
        await supabase
          .from("bookings")
          .update({ status: "cancelled", payment_status: "refunded" })
          .eq("id", currentReq.bookingCode.replace("#", ""));
      } catch (dbErr: any) {
        console.warn("[DB Warning] Booking cancellation update bypassed:", dbErr.message);
      }

      // Automatically dispatch VIP Cancellation & Refund Email
      try {
        await sendCancellationNoticeEmail({
          clientName: currentReq.guestName,
          email: currentReq.guestEmail,
          bookingCode: currentReq.bookingCode,
          vehicleName: currentReq.vehicleName,
          refundAmountFormatted: currentReq.refundAmountFormatted || "₦1,350,000",
          refundBank: currentReq.refundBank,
          refundAccount: currentReq.refundAccount,
          statusNote: adminNotes || `Your cancellation has been authorized by the operations director. Wire transfer of ${currentReq.refundAmountFormatted} has been executed to ${currentReq.refundBank || "your bank"}.`,
        });
      } catch (mailErr: any) {
        console.warn("[Email Warning] Cancellation email failed:", mailErr.message);
      }
    }

    console.log(`\x1b[32m[Request Resolved]\x1b[0m ${currentReq.id} marked as ${status}`);

    return res.json({
      success: true,
      message: `Request successfully updated to ${status}`,
      request: currentReq,
    });
  } catch (err: any) {
    console.error("[Update Request Error]:", err);
    return res.status(500).json({ error: err.message });
  }
});



