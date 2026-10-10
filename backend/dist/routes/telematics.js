"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telematicsRouter = void 0;
const express_1 = require("express");
const telematicsService_1 = require("../services/telematicsService");
const smsGatewayService_1 = require("../services/smsGatewayService");
const supabase_1 = require("../supabase");
exports.telematicsRouter = (0, express_1.Router)();
/**
 * Trigger an on-demand ping to a vehicle's tracker device
 */
exports.telematicsRouter.post("/ping-request", async (req, res) => {
    try {
        const { deviceCode, vehicleId } = req.body;
        if (!deviceCode && !vehicleId) {
            return res.status(400).json({ error: "Provide either deviceCode or vehicleId" });
        }
        // 1. Fetch tracker details
        let query = supabase_1.supabase.from("tracker_devices").select("id, device_code, sim_phone_number, assigned_vehicle_id");
        if (deviceCode) {
            query = query.eq("device_code", deviceCode);
        }
        else if (vehicleId) {
            query = query.eq("assigned_vehicle_id", vehicleId);
        }
        const { data: tracker, error } = await query.maybeSingle();
        if (error || !tracker) {
            return res.status(404).json({ error: "Tracker device not found" });
        }
        // 2. Dispatch SMS command to tracker SIM (Standard command: "WHERE#" or "STATUS#")
        const commandText = "WHERE#";
        const dispatchResult = await (0, smsGatewayService_1.sendSmsToTracker)(tracker.sim_phone_number, commandText);
        return res.json({
            success: true,
            message: `Ping request command "${commandText}" dispatched to SIM ${tracker.sim_phone_number}`,
            deviceCode: tracker.device_code,
            dispatch: dispatchResult,
        });
    }
    catch (err) {
        console.error("[Telematics Error] Ping request error:", err);
        return res.status(500).json({ error: err.message });
    }
});
/**
 * Direct HTTP coordinate ingestion endpoint (Used by trackers reporting via HTTP POST)
 */
exports.telematicsRouter.post("/ingest", async (req, res) => {
    try {
        const { deviceCode, latitude, longitude, speed, heading, battery, address } = req.body;
        if (!deviceCode || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: "Missing required fields: deviceCode, latitude, longitude" });
        }
        const result = await (0, telematicsService_1.recordTelematicsPing)({
            deviceCode,
            parsedLocation: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                speedKmh: parseFloat(speed || "0"),
                headingDeg: parseFloat(heading || "0"),
                batteryPercentage: battery !== undefined ? parseInt(battery, 10) : 98,
                rawPayload: JSON.stringify(req.body),
            },
            geocodedAddress: address,
            triggerType: "auto_periodic",
        });
        return res.json(result);
    }
    catch (err) {
        console.error("[Telematics Error] Ingest error:", err);
        return res.status(500).json({ error: err.message });
    }
});
/**
 * Get device status & latest known coordinates
 */
exports.telematicsRouter.get("/status/:deviceCode", async (req, res) => {
    try {
        const { deviceCode } = req.params;
        const { data: tracker, error } = await supabase_1.supabase
            .from("tracker_devices")
            .select("*, vehicles(*)")
            .eq("device_code", deviceCode)
            .maybeSingle();
        if (error || !tracker) {
            return res.status(404).json({ error: "Device not found" });
        }
        return res.json({ success: true, tracker });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
