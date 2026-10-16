/**
 * API Client for Standalone La Planta Prime Telematics & Dispatch Backend
 */

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").trim();

const BASE_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

export const backendApi = {
  /**
   * Healthcheck
   */
  async getHealth() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, {
        headers: BASE_HEADERS,
      });
      return await res.json();
    } catch (err: any) {
      return { status: "offline", error: err.message };
    }
  },

  /**
   * Trigger an on-demand ping to the vehicle's tracker device
   */
  async pingTracker(
    target: string | { deviceCode?: string; vehicleId?: string; trackerId?: string },
    token?: string
  ) {
    try {
      const payload = typeof target === "string" ? { deviceCode: target } : target;
      const res = await fetch(`${BACKEND_URL}/api/telematics/ping-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...BASE_HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to contact telematics backend" };
    }
  },

  /**
   * Get latest hardware status for a tracker device
   */
  async getTrackerStatus(deviceCode: string) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/telematics/status/${encodeURIComponent(deviceCode)}?_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            ...BASE_HEADERS,
          },
        }
      );
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch active vehicle fleet
   */
  async getFleet() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fleet`, {
        cache: "no-store",
        headers: BASE_HEADERS,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Verify authenticated user profile with backend
   */
  async getAuthProfile(token: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          ...BASE_HEADERS,
          Authorization: `Bearer ${token}`,
        },
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Submit a guest cancellation or extension request
   */
  async submitBookingRequest(data: any) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...BASE_HEADERS,
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch active requests for current client/booking
   */
  async getBookingRequests() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/requests`, {
        cache: "no-store",
        headers: BASE_HEADERS,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch live bookings for a user by id, email, or booking code
   */
  async getUserBookings(params: { userId?: string; email?: string; bookingCode?: string }) {
    try {
      const q = new URLSearchParams();
      if (params.userId) q.set("userId", params.userId);
      if (params.email) q.set("email", params.email);
      if (params.bookingCode) q.set("bookingCode", params.bookingCode);

      const res = await fetch(`${BACKEND_URL}/api/payments/my-bookings?${q.toString()}`, {
        cache: "no-store",
        headers: BASE_HEADERS,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message, bookings: [] };
    }
  },
};
