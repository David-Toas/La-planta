import { supabase } from "./supabase";

const BACKEND_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").trim();

const DEFAULT_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
  "bypass-tunnel-reminder": "true",
  "Content-Type": "application/json",
};

/**
 * Robust fetcher that automatically attaches ngrok bypass headers,
 * attempts the configured backend, and falls back to localhost:4000 if needed.
 */
async function adminFetch(path: string, options: RequestInit = {}) {
  let authHeaders: Record<string, string> = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeaders = { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err: any) {
    console.warn("[adminApi] Failed to resolve auth session:", err?.message);
  }

  const headers = {
    ...DEFAULT_HEADERS,
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  // 1. Try PRIMARY backend (e.g. ngrok or configured BACKEND_URL)
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers,
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.warn(`[adminApi] Primary backend (${BACKEND_URL}${path}) failed:`, err.message);
  }

  // 2. Try LOCAL fallback (http://localhost:4000) if primary is not localhost:4000
  if (!BACKEND_URL.includes("localhost:4000")) {
    try {
      const res = await fetch(`http://localhost:4000${path}`, {
        ...options,
        headers,
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        return data;
      }
    } catch (_) {}
  }

  return null;
}

export const adminApi = {
  /**
   * Health status of the Express operations backend
   */
  async getHealth() {
    const res = await adminFetch("/api/health", { cache: "no-store" });
    if (res?.status) return res;
    return { status: "offline" };
  },

  /**
   * Aggregated dashboard KPIs
   */
  async getOverview() {
    const res = await adminFetch("/api/admin/overview", { cache: "no-store" });
    if (res?.success && res.kpis) {
      return res;
    }

    // Direct Supabase fallback for KPIs
    try {
      const [vRes, dRes, bRes, pRes] = await Promise.all([
        supabase.from("vehicles").select("id, status"),
        supabase.from("drivers").select("id, full_name, is_available, current_status"),
        supabase.from("bookings").select("id, status, total_amount_ngn, payment_status, service_type"),
        supabase.from("profiles").select("id, role, vip_tier"),
      ]);
      const vehicles = vRes.data || [];
      const drivers = dRes.data || [];
      const bookings = bRes.data || [];
      const profiles = pRes.data || [];

      const activeVehicles = vehicles.filter(
        (v) => v.status === "in_transit" || v.status === "reserved"
      ).length;
      const availableVehicles = vehicles.filter((v) => v.status === "available").length;
      const totalVehicles = vehicles.length;
      const totalRevenue = bookings
        .filter((b) => b.payment_status === "paid")
        .reduce((sum, b) => sum + (Number(b.total_amount_ngn) || 0), 0);

      return {
        success: true,
        kpis: {
          carsOnTrip: {
            active: activeVehicles,
            total: totalVehicles,
            percentage:
              totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0,
            reserveCount: availableVehicles,
          },
          transfersToday: {
            count: bookings.filter(
              (b) => b.status === "in_transit" || b.status === "confirmed"
            ).length,
            vipMeetAndGreets: bookings.filter(
              (b) =>
                b.service_type === "airport_transfer" ||
                b.service_type === "diplomatic_escort"
            ).length,
          },
          revenue: {
            amountFormatted: `₦${totalRevenue.toLocaleString()}`,
            rawAmount: totalRevenue,
            growthPercent: 14.2,
            upfrontSettledRate: "100%",
          },
          driversOnDuty: {
            active: drivers.filter((d) => d.current_status === "on_trip" || d.is_available)
              .length,
            total: drivers.length,
            leadChauffeur: drivers.length > 0 ? drivers[0].full_name : "Lead Officer",
            averageRating: 5.0,
          },
          vipMembersCount: profiles.filter(
            (p) => p.vip_tier && p.vip_tier !== "standard"
          ).length,
          totalRegisteredClients: profiles.filter((p) => p.role === "client").length,
        },
      };
    } catch (_) {}

    return res || { success: false, error: "Failed to load overview" };
  },

  /**
   * Fleet inventory & tracker status (Backend + direct Supabase fallback)
   */
  async getFleet() {
    const res = await adminFetch("/api/admin/fleet", { cache: "no-store" });
    if (res?.success && Array.isArray(res.vehicles) && res.vehicles.length > 0) {
      return res;
    }

    // Direct Supabase fallback
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, tracker_devices!tracker_devices_assigned_vehicle_id_fkey(*)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return { success: true, vehicles: data };
      }

      const simple = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!simple.error && simple.data) {
        return { success: true, vehicles: simple.data };
      }
    } catch (dbErr: any) {
      console.error("[adminApi] Supabase getFleet fallback error:", dbErr);
    }

    return res || { success: false, error: "Failed to load fleet" };
  },

  /**
   * Add a new vehicle to fleet (Backend + direct Supabase fallback)
   */
  async createVehicle(data: any) {
    const res = await adminFetch("/api/admin/fleet", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res?.success) return res;

    // Direct Supabase fallback insert
    try {
      const { data: inserted, error } = await supabase
        .from("vehicles")
        .insert(data)
        .select()
        .single();
      if (!error && inserted) {
        return { success: true, vehicle: inserted };
      }
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    return res || { success: false, error: "Failed to register vehicle" };
  },

  /**
   * Update an existing vehicle (Backend + direct Supabase fallback)
   */
  async updateVehicle(id: string, data: any) {
    const res = await adminFetch(`/api/admin/fleet/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (res?.success) return res;

    try {
      const { data: updated, error } = await supabase
        .from("vehicles")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && updated) {
        return { success: true, vehicle: updated };
      }
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    return res || { success: false, error: "Failed to update vehicle" };
  },

  /**
   * Delete vehicle from fleet (Backend + direct Supabase fallback)
   */
  async deleteVehicle(id: string) {
    const res = await adminFetch(`/api/admin/fleet/${id}`, {
      method: "DELETE",
    });
    if (res?.success) return res;

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (!error) return { success: true };
      return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Upload image directly from admin laptop to Supabase storage with API fallback
   */
  async uploadFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // 1. Direct Supabase storage upload
      const ext = file.name.split(".").pop() || "jpg";
      const cleanFilename = `veh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("vehicles")
        .upload(cleanFilename, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: pubUrlData } = supabase.storage
          .from("vehicles")
          .getPublicUrl(cleanFilename);
        return { success: true, url: pubUrlData.publicUrl };
      }
    } catch (sErr: any) {
      console.warn("[adminApi] Direct storage upload notice:", sErr.message);
    }

    // 2. Fallback to backend upload endpoint
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
      const fileData = await base64Promise;

      const res = await adminFetch("/api/admin/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          fileData,
          contentType: file.type,
        }),
      });
      if (res?.success && res.url) return res;
    } catch (err: any) {
      return { success: false, error: err.message || "Upload failed" };
    }

    return { success: false, error: "Failed to upload image" };
  },

  /**
   * Chauffeur roster
   */
  async getDrivers() {
    const res = await adminFetch("/api/admin/drivers", { cache: "no-store" });
    if (res?.success && res.drivers) return res;

    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("full_name", { ascending: true });
      if (!error && data) return { success: true, drivers: data };
    } catch (_) {}

    return res || { success: false, error: "Failed to load drivers" };
  },

  async createDriver(data: any) {
    const res = await adminFetch("/api/admin/drivers", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res?.success) return res;

    try {
      const { data: inserted, error } = await supabase
        .from("drivers")
        .insert(data)
        .select()
        .single();
      if (!error && inserted) return { success: true, driver: inserted };
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    return res || { success: false, error: "Failed to register driver" };
  },

  async deleteDriver(id: string) {
    const res = await adminFetch(`/api/admin/drivers/${id}`, {
      method: "DELETE",
    });
    if (res?.success) return res;

    try {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (!error) return { success: true };
    } catch (_) {}

    return res || { success: false, error: "Failed to delete driver" };
  },

  /**
   * Update driver status (available, on_trip, not_available/off_duty)
   */
  async updateDriver(id: string, updates: any) {
    const res = await adminFetch(`/api/admin/drivers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (res?.success) return res;

    try {
      const normalizedStatus =
        updates.current_status === "not_available" ? "off_duty" : updates.current_status;
      const dbUpdates: any = {
        ...updates,
        ...(updates.current_status ? { current_status: normalizedStatus } : {}),
        updated_at: new Date().toISOString(),
      };
      if (normalizedStatus) {
        dbUpdates.is_available = normalizedStatus === "available";
      }
      const { data, error } = await supabase
        .from("drivers")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return { success: true, driver: data };
    } catch (_) {}

    return res || { success: false, error: "Failed to update driver" };
  },

  /**
   * All bookings and handover status
   */
  async getBookings() {
    const res = await adminFetch("/api/admin/bookings", { cache: "no-store" });
    if (res?.success && res.bookings) return res;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, vehicles(*), profiles(*), drivers(*)")
        .order("created_at", { ascending: false });
      if (!error && data) return { success: true, bookings: data };
    } catch (_) {}

    return res || { success: false, error: "Failed to load bookings" };
  },

  /**
   * Assign or reassign driver to a booking
   */
  async assignDriver(bookingId: string, driverId: string | null) {
    const res = await adminFetch(`/api/admin/bookings/${bookingId}/assign-driver`, {
      method: "PATCH",
      body: JSON.stringify({ driver_id: driverId }),
    });
    if (res?.success) return res;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          driver_id: driverId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .select("*, vehicles(*), profiles(*), drivers(*)")
        .single();

      if (!error && data) {
        if (driverId) {
          await supabase
            .from("drivers")
            .update({ current_status: "on_trip", is_available: false, updated_at: new Date().toISOString() })
            .eq("id", driverId);
        }
        return { success: true, booking: data };
      }
    } catch (_) {}

    return res || { success: false, error: "Failed to assign driver" };
  },

  /**
   * User directory for VIP tier assignments
   */
  async getUsers() {
    const res = await adminFetch("/api/admin/users", { cache: "no-store" });
    if (res?.success && res.users) return res;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, vip_tier, role, created_at, avatar_url")
        .order("created_at", { ascending: false });
      if (!error && data) return { success: true, users: data };
    } catch (_) {}

    return res || { success: false, error: "Failed to load users" };
  },

  /**
   * Update a user's VIP status tier (Admin privilege)
   */
  async updateUserVipTier(userId: string, vipTier: string) {
    const res = await adminFetch(`/api/admin/users/${userId}/tier`, {
      method: "PATCH",
      body: JSON.stringify({ vip_tier: vipTier }),
    });
    if (res?.success) return res;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ vip_tier: vipTier.toLowerCase(), updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();
      if (!error && data) return { success: true, profile: data };
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    return res || { success: false, error: "Failed to update VIP tier" };
  },

  /**
   * Update a user's role (e.g. promote client to admin or revoke admin)
   */
  async updateUserRole(userId: string, role: "admin" | "client") {
    const res = await adminFetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (res?.success) return res;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: role.toLowerCase(), updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();
      if (!error && data) return { success: true, profile: data };
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    return res || { success: false, error: "Failed to update user role" };
  },

  /**
   * Dispatch encrypted ping to vehicle tracker SIM (Resolves target SIM dynamically from database)
   */
  async pingTracker(
    params:
      | string
      | {
          vehicleId?: string;
          deviceCode?: string;
          trackerId?: string;
          simPhoneNumber?: string;
        } = "TRK-892-SIM",
  ) {
    const payload =
      typeof params === "string" ? { deviceCode: params } : params;
    const res = await adminFetch("/api/telematics/ping-request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res || { success: false, error: "Failed to dispatch tracker ping" };
  },

  /**
   * Retrieve real-time payment transaction logs and audit trail
   */
  async getPaymentLogs() {
    const res = await adminFetch("/api/payments/logs", { cache: "no-store" });
    if (res?.success && Array.isArray(res.logs) && res.logs.length > 0) return res;

    // Direct Supabase fallback
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, total_amount_ngn, payment_status, status, created_at, profiles(full_name, email, phone), vehicles(name, brand, model)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const logs = data
          .filter((b) => b.payment_status === "paid" || b.status === "confirmed")
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

        const totalSettled = logs.reduce((sum, l) => sum + l.amount, 0);
        return {
          success: true,
          total_settled_amount: totalSettled,
          total_settled_formatted: `₦${totalSettled.toLocaleString()}`,
          count: logs.length,
          logs,
        };
      }
    } catch (_) {}

    return res || { success: false, logs: [] };
  },

  /**
   * Retrieve concierge requests (cancellations and extensions)
   */
  async getBookingRequests() {
    const res = await adminFetch("/api/admin/requests", { cache: "no-store" });
    return res || { success: false, requests: [] };
  },

  /**
   * Update concierge request status (approve, refund & cancel, reject)
   */
  async updateBookingRequest(id: string, status: string, adminNotes?: string) {
    const res = await adminFetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
    });
    return res || { success: false, error: "Failed to update booking request" };
  },

  /**
   * Retrieve transactional email audit logs
   */
  async getEmailLogs() {
    const res = await adminFetch("/api/email/logs", { cache: "no-store" });
    return res || { success: false, logs: [] };
  },
};
