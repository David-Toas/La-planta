# La Planta Prime • Standalone Telematics & Fleet Dispatch Backend

This is the dedicated, standalone backend service for **LA PLANTA PRIME**. It is completely decoupled from the Next.js frontend, enabling independent deployment, scaling, and hosting on any cloud provider (Render, Railway, Fly.io, DigitalOcean VPS, or AWS).

---

## Capabilities & Architecture

1. **Dual-Listener Design**:
   - **HTTP REST & Webhook Server (Port 4000)**: Serves health checks, on-demand vehicle ping triggers, and inbound SMS webhooks (Termii / Africa's Talking).
   - **TCP GPS Socket Server (Port 5000)**: Accepts persistent GPRS cellular data connections from vehicle tracker hardware (Coban, SinoTrack, Teltonika, Concox) for zero-SMS live tracking.
2. **NMEA & SMS Parser**:
   - Automatically decodes Google Maps URLs (`maps.google.com/?q=6.4475,3.4243`), raw NMEA GPRMC strings, and telemetry key-value text.
3. **Automated Supabase Synchronization**:
   - Ingests pings into `public.telematics_pings`.
   - Links coordinates to active customer bookings (`LP-8842`).
   - Automatically updates vehicle live latitude and longitude for real-time frontend map rendering.

---

## Directory Structure

```
backend/
├── src/
│   ├── index.ts                # Main application entry point
│   ├── config.ts               # Environment configuration loader
│   ├── supabase.ts             # Supabase admin client (Service Role)
│   ├── parsers/
│   │   ├── nmeaParser.ts       # Parses NMEA packets & SMS text
│   │   └── tcpListener.ts      # TCP socket listener for GPRS trackers
│   ├── services/
│   │   ├── telematicsService.ts # Ingests & synchronizes coordinates in Supabase
│   │   └── smsGatewayService.ts # Termii / Africa's Talking dispatch
│   └── routes/
│       ├── health.ts           # Service healthcheck
│       ├── telematics.ts       # On-demand ping and ingestion endpoints
│       └── webhooks.ts         # Inbound SMS webhook receiver
├── Dockerfile                  # Multi-stage production container
├── package.json                # Standalone dependencies
├── tsconfig.json               # TypeScript configuration
└── .env.example                # Environment variables template
```

---

## Local Development

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The servers will start on:
- HTTP API: `http://localhost:4000`
- TCP Telematics: `0.0.0.0:5000`

---

## API Endpoints Reference

### 1. Healthcheck
- **`GET /api/health`**
- Response:
  ```json
  {
    "status": "ok",
    "service": "La Planta Prime Telematics & Fleet Dispatch Backend",
    "timestamp": "2026-10-08T16:00:00.000Z",
    "uptimeSeconds": 142
  }
  ```

### 2. On-Demand Tracker Ping
- **`POST /api/telematics/ping-request`**
- Body:
  ```json
  {
    "deviceCode": "TRK-892-SIM"
  }
  ```

### 3. Inbound SMS Webhook (Termii / Africa's Talking)
- **`POST /api/webhooks/sms`**
- Body (Termii format):
  ```json
  {
    "from": "+2348037294810",
    "text": "maps.google.com/?q=6.447492,3.424310 Speed: 42km/h Bat: 98%"
  }
  ```

### 4. Direct HTTP Ingestion
- **`POST /api/telematics/ingest`**
- Body:
  ```json
  {
    "deviceCode": "TRK-892-SIM",
    "latitude": 6.447492,
    "longitude": 3.424310,
    "speed": 42.0,
    "heading": 24.0,
    "battery": 98,
    "address": "Falomo Bridge, Ikoyi, Lagos"
  }
  ```

---

## Independent Cloud Deployment

### Option A: Railway / Render (Easiest)
1. Push the repository to GitHub.
2. In Railway or Render, create a new Web Service and set the **Root Directory** to `backend`.
3. Set the Environment Variables from `.env.example`.
4. Build command: `npm install && npm run build`
5. Start command: `npm start`

### Option B: Docker Container
```bash
docker build -t laplanta-backend .
docker run -p 4000:4000 -p 5000:5000 --env-file .env laplanta-backend
```
