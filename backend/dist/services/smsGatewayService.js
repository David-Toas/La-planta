"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSmsToTracker = sendSmsToTracker;
const config_1 = require("../config");
/**
 * Sends an SMS command (e.g. "WHERE#", "STATUS#") to the vehicle's tracker SIM
 */
async function sendSmsToTracker(toPhoneNumber, commandText) {
    const provider = config_1.config.smsProvider.toLowerCase();
    // 1. Termii SMS Gateway (Nigeria)
    if (provider === "termii" && config_1.config.termii.apiKey) {
        try {
            const response = await fetch("https://api.ng.termii.com/api/sms/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: toPhoneNumber,
                    from: config_1.config.termii.senderId || "LaPlanta",
                    sms: commandText,
                    type: "plain",
                    channel: "generic",
                    api_key: config_1.config.termii.apiKey,
                }),
            });
            const data = await response.json();
            if (response.ok && data.message_id) {
                return { success: true, messageId: data.message_id, provider: "termii" };
            }
            return { success: false, provider: "termii", error: data.message || "Failed Termii dispatch" };
        }
        catch (err) {
            return { success: false, provider: "termii", error: err.message };
        }
    }
    // 2. Africa's Talking (Alternative Pan-African Gateway)
    if (provider === "africastalking" && config_1.config.africasTalking.apiKey) {
        try {
            const params = new URLSearchParams({
                username: config_1.config.africasTalking.username,
                to: toPhoneNumber,
                message: commandText,
            });
            const response = await fetch("https://api.africastalking.com/version1/messaging", {
                method: "POST",
                headers: {
                    apiKey: config_1.config.africasTalking.apiKey,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });
            const data = await response.json();
            return { success: true, messageId: data?.SMSMessageData?.Recipients?.[0]?.messageId, provider: "africastalking" };
        }
        catch (err) {
            return { success: false, provider: "africastalking", error: err.message };
        }
    }
    // 3. Simulated Fallback (Development & Staging)
    console.log(`[SMS Gateway Simulated] Sent command "${commandText}" to SIM ${toPhoneNumber}`);
    return {
        success: true,
        messageId: `sim_${Date.now()}`,
        provider: "simulated",
    };
}
