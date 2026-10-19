import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { healthRouter } from "./routes/health";
import { telematicsRouter } from "./routes/telematics";
import { webhooksRouter } from "./routes/webhooks";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { paymentsRouter } from "./routes/payments";
import { emailRouter } from "./routes/email";
import { startTcpTelematicsListener } from "./parsers/tcpListener";
import { startTelematicsScheduler } from "./services/telematicsScheduler";

const app = express();

// ==============================================================================
// 1. HTTP SECURITY HEADERS (Helmet)
// ==============================================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// ==============================================================================
// 2. CORS STRICT ORIGIN WHITELIST
// ==============================================================================
const allowedOrigins = [
  "https://laplanta.ng",
  "https://www.laplanta.ng",
  "https://admin.laplanta.ng",
  config.clientUrl,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, healthcheck) or matching domains
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".ngrok-free.dev") ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Untrusted origin: ${origin}`);
        callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
      }
    },
    credentials: true,
  })
);

// ==============================================================================
// 3. RATE LIMITING
// ==============================================================================
// General API Rate Limiter (500 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api", apiLimiter);

// Sensitive Endpoints Rate Limiter (60 requests per 15 minutes per IP)
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests to this endpoint. Please try again later.",
  },
});
app.use("/api/payments/verify-payment", sensitiveLimiter);
app.use("/api/telematics/ping-request", sensitiveLimiter);
app.use("/api/email", sensitiveLimiter);

// ==============================================================================
// 4. BODY PARSING & CRYPTOGRAPHIC PAYLOAD CAPTURE
// ==============================================================================
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
app.use("/api/email", emailRouter);
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

// 3. Start Automated Periodic Telematics Scheduler for Active Trips (every 60s)
try {
  startTelematicsScheduler(60);
} catch (err: any) {
  console.error("Failed to start Telematics Scheduler:", err.message);
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});
