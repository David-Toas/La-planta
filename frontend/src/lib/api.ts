/**
 * API Client for Standalone La Planta Prime Telematics & Dispatch Backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const backendApi = {
  /**
   * Healthcheck
   */
  async getHealth() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      return await res.json();
    } catch (err: any) {
      return { status: "offline", error: err.message };
    }
  },

  /**
   * Trigger an on-demand ping to the vehicle's tracker device
   */
  async pingTracker(deviceCode: string, token?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/telematics/ping-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ deviceCode }),
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
      const res = await fetch(`${BACKEND_URL}/api/telematics/status/${encodeURIComponent(deviceCode)}`);
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
          Authorization: `Bearer ${token}`,
        },
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
