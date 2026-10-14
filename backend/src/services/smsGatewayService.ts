import { config } from "../config";

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

/**
 * Sends an SMS command (e.g. "WHERE#", "STATUS#") to the vehicle's tracker SIM
 */
export async function sendSmsToTracker(toPhoneNumber: string, commandText: string): Promise<SendSmsResult> {
  const provider = config.smsProvider.toLowerCase();

  // 1. Termii SMS Gateway (Nigeria)
  if (provider === "termii" && config.termii.apiKey) {
    try {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toPhoneNumber,
          from: config.termii.senderId || "LaPlanta",
          sms: commandText,
          type: "plain",
          channel: "generic",
          api_key: config.termii.apiKey,
        }),
      });

      const data = await response.json();
      if (response.ok && data.message_id) {
        return { success: true, messageId: data.message_id, provider: "termii" };
      }
      return { success: false, provider: "termii", error: data.message || "Failed Termii dispatch" };
    } catch (err: any) {
      return { success: false, provider: "termii", error: err.message };
    }
  }

  // 2. Africa's Talking (Alternative Pan-African Gateway)
  if (provider === "africastalking" && config.africasTalking.apiKey) {
    try {
      const isSandbox = config.africasTalking.username.toLowerCase() === "sandbox";
      const endpoint = isSandbox
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging";

      const params = new URLSearchParams({
        username: config.africasTalking.username,
        to: toPhoneNumber,
        message: commandText,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apiKey: config.africasTalking.apiKey,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();
      return { success: true, messageId: data?.SMSMessageData?.Recipients?.[0]?.messageId, provider: "africastalking" };
    } catch (err: any) {
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
