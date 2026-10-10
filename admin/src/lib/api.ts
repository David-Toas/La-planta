const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const adminApi = {
  /**
   * Health status of the Express operations backend
   */
  async getHealth() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { status: "offline", error: err.message };
    }
  },

  /**
   * Aggregated dashboard KPIs
   */
  async getOverview() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/overview`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fleet inventory & tracker status
   */
  async getFleet() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fleet`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Chauffeur roster
   */
  async getDrivers() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/drivers`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * All bookings and handover status
   */
  async getBookings() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/bookings`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * User directory for VIP tier assignments
   */
  async getUsers() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Update a user's VIP status tier (Admin privilege)
   */
  async updateUserVipTier(userId: string, vipTier: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vip_tier: vipTier }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Dispatch fleet broadcast alert
   */
  async broadcastNotice(message: string, corridor?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, corridor }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Dispatch encrypted ping to vehicle tracker SIM
   */
  async pingTracker(deviceCode = "TRK-892-SIM") {
    try {
      const res = await fetch(`${BACKEND_URL}/api/telematics/ping-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

