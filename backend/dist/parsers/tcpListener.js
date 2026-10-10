"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTcpTelematicsListener = startTcpTelematicsListener;
const net_1 = __importDefault(require("net"));
const nmeaParser_1 = require("./nmeaParser");
const telematicsService_1 = require("../services/telematicsService");
/**
 * Initializes a TCP Socket server listening for GPS Tracker GPRS connections
 * Many commercial trackers (Coban, Sinotrack, Teltonika) report periodically over a raw TCP port
 */
function startTcpTelematicsListener(port) {
    const server = net_1.default.createServer((socket) => {
        const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`[TCP Telematics] Tracker device connected from ${clientAddress}`);
        socket.on("data", async (data) => {
            try {
                const rawString = data.toString("utf8").trim();
                console.log(`[TCP Telematics Data from ${clientAddress}]: ${rawString}`);
                // Parse coordinates from raw GPRS packet
                const parsed = (0, nmeaParser_1.parseSmsOrNmeaPayload)(rawString);
                if (parsed) {
                    // Attempt to extract device IMEI or identifier (typically formatted e.g. "##,imei:864920049182741,..." or "TRK-892")
                    const imeiMatch = rawString.match(/imei:?(\d+)/i);
                    const deviceCode = imeiMatch ? `TRK-${imeiMatch[1].slice(-4)}` : "TRK-892-SIM";
                    await (0, telematicsService_1.recordTelematicsPing)({
                        deviceCode,
                        parsedLocation: parsed,
                        triggerType: "auto_periodic",
                    });
                    // Send standard ACK reply if required by tracker protocol
                    socket.write("LOAD\r\n");
                }
            }
            catch (err) {
                console.error(`[TCP Telematics Error from ${clientAddress}]:`, err);
            }
        });
        socket.on("error", (err) => {
            console.warn(`[TCP Socket Warning ${clientAddress}]:`, err.message);
        });
        socket.on("close", () => {
            console.log(`[TCP Telematics] Tracker disconnected: ${clientAddress}`);
        });
    });
    server.listen(port, () => {
        console.log(`[TCP Telematics Server] Listening for GPRS tracker hardware on port ${port}`);
    });
    return server;
}
