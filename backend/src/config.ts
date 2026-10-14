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
  trackerSimPhone: process.env.TRACKER_SIM_PHONE || "+2348140313381",
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || "",
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER || "resend") as "resend" | "smtp" | "simulated",
    resendApiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.EMAIL_FROM || "concierge@laplantaprime.com",
    fromName: process.env.EMAIL_FROM_NAME || "La Planta Prime VIP Concierge",
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      secure: process.env.SMTP_SECURE === "true",
    },
  },
};
