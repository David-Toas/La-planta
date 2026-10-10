"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const health_1 = require("./routes/health");
const telematics_1 = require("./routes/telematics");
const webhooks_1 = require("./routes/webhooks");
const auth_1 = require("./routes/auth");
const tcpListener_1 = require("./parsers/tcpListener");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// REST Routes
app.use("/api/health", health_1.healthRouter);
app.use("/api/auth", auth_1.authRouter);
app.use("/api/telematics", telematics_1.telematicsRouter);
app.use("/api/webhooks", webhooks_1.webhooksRouter);
// Root greeting
app.get("/", (req, res) => {
    res.json({
        service: "La Planta Prime • Fleet Telematics & Dispatch Backend",
        version: "1.0.0",
        docs: {
            health: "/api/health",
            pingRequest: "POST /api/telematics/ping-request",
            directIngest: "POST /api/telematics/ingest",
            smsWebhook: "POST /api/webhooks/sms",
        },
    });
});
// 1. Start HTTP Server
const server = app.listen(config_1.config.port, () => {
    console.log(`=======================================================`);
    console.log(`  LA PLANTA PRIME • FLEET DISPATCH & TELEMATICS BACKEND`);
    console.log(`=======================================================`);
    console.log(`✓ HTTP API & Webhooks listening on: http://localhost:${config_1.config.port}`);
});
// 2. Start TCP Telematics Hardware Listener
try {
    (0, tcpListener_1.startTcpTelematicsListener)(config_1.config.telematicsPort);
}
catch (err) {
    console.error("Failed to start TCP Telematics listener:", err.message);
}
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
        process.exit(0);
    });
});
