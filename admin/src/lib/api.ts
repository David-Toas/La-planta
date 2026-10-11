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
   * Add a new vehicle to fleet
   */
  async createVehicle(data: any) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fleet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Update an existing vehicle
   */
  async updateVehicle(id: string, data: any) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fleet/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete vehicle from fleet
   */
  async deleteVehicle(id: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/fleet/${id}`, {
        method: "DELETE",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Upload image directly from admin laptop to Supabase storage
   */
  async uploadFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
      const fileData = await base64Promise;

      const res = await fetch(`${BACKEND_URL}/api/admin/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileData,
          contentType: file.type,
        }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Upload failed" };
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

  async createDriver(data: any) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteDriver(id: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/drivers/${id}`, {
        method: "DELETE",
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

  /**
   * Retrieve real-time payment transaction logs and audit trail
   */
  async getPaymentLogs() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/logs`, {
        cache: "no-store",
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

