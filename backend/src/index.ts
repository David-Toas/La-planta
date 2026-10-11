import express from "express";
import cors from "cors";
import { config } from "./config";
import { healthRouter } from "./routes/health";
import { telematicsRouter } from "./routes/telematics";
import { webhooksRouter } from "./routes/webhooks";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { paymentsRouter } from "./routes/payments";
import { startTcpTelematicsListener } from "./parsers/tcpListener";

const app = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Clear & Prominent Request Logger Middleware for Terminal Visibility
app.use((req, res, next) => {
  const start = Date.now();
  const time = new Date().toLocaleTimeString();
  console.log(`\x1b[36m[HTTP REQ]\x1b[0m \x1b[1m\x1b[33m${req.method}\x1b[0m ${req.originalUrl} \x1b[90m(from ${req.ip || "client"} at ${time})\x1b[0m`);
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const isSuccess = res.statusCode < 400;
    const statusTag = isSuccess
      ? `\x1b[32m${res.statusCode} OK\x1b[0m`
      : `\x1b[31m${res.statusCode} ERROR\x1b[0m`;
    console.log(`\x1b[90m  └─>\x1b[0m ${statusTag} \x1b[90mcompleted in ${duration}ms\x1b[0m`);
  });

  next();
});

// REST Routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/telematics", telematicsRouter);
app.use("/api/webhooks", webhooksRouter);

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
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  LA PLANTA PRIME • FLEET DISPATCH & TELEMATICS BACKEND`);
  console.log(`=======================================================`);
  console.log(`✓ HTTP API & Webhooks listening on: http://localhost:${config.port}`);
});

// 2. Start TCP Telematics Hardware Listener
try {
  startTcpTelematicsListener(config.telematicsPort);
} catch (err: any) {
  console.error("Failed to start TCP Telematics listener:", err.message);
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});
