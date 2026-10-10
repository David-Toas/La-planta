import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  telematicsPort: parseInt(process.env.PORT_TELEMATICS || "5000", 10),
  supabaseUrl: process.env.SUPABASE_URL || "https://placeholder-project.supabase.co",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
  smsProvider: process.env.SMS_PROVIDER || "simulated",
  termii: {
    apiKey: process.env.TERMII_API_KEY || "",
    senderId: process.env.TERMII_SENDER_ID || "LaPlanta",
  },
  africasTalking: {
    username: process.env.AT_USERNAME || "sandbox",
    apiKey: process.env.AT_API_KEY || "",
  },
};
