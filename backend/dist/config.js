"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
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
