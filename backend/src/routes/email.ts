import { Router, Request, Response } from "express";
import {
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendCancellationNoticeEmail,
  sendCancellationRequestReceivedEmail,
  sendCancellationDeclinedEmail,
  sendExtensionRequestReceivedEmail,
  sendExtensionApprovedEmail,
  sendExtensionDeclinedEmail,
  sentEmailLogs,
} from "../services/emailService";

export const emailRouter = Router();

/**
 * GET /api/email/logs
 * Returns audit log of all transactional emails dispatched or simulated
 */
emailRouter.get("/logs", (req: Request, res: Response) => {
  res.json({
    success: true,
    count: sentEmailLogs.length,
    logs: sentEmailLogs,
  });
});

/**
 * GET /api/email/preview/:id
 * Render HTML preview of a logged email for browser inspection
 */
emailRouter.get("/preview/:id", (req: Request, res: Response) => {
  const item = sentEmailLogs.find((l) => l.id === req.params.id);
  if (!item || !item.html) {
    return res.status(404).send("Email preview not found");
  }
  res.setHeader("Content-Type", "text/html");
  return res.send(item.html);
});

/**
 * POST /api/email/welcome
 * Send VIP welcome email to a newly registered client
 */
emailRouter.post("/welcome", async (req: Request, res: Response) => {
  try {
    const { clientName, email, vipTier, bookingPin } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const result = await sendWelcomeEmail({
      clientName: clientName || "Executive Client",
      email,
      vipTier: vipTier || "Member",
      bookingPin: bookingPin || "#LP-8910",
    });

    res.json({
      success: true,
      message: "VIP Welcome email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Welcome email failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/booking-confirmation
 * Send booking itinerary and digital QR Pass link
 */
emailRouter.post("/booking-confirmation", async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      email,
      bookingCode,
      vehicleName,
      dates,
      rentalDays,
      amountFormatted,
      chauffeurProtocol,
      corridor,
      passUrl,
      trackingUrl,
    } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendBookingConfirmationEmail({
      clientName: clientName || "Executive Guest",
      email,
      bookingCode,
      vehicleName: vehicleName || "Executive Fleet Vehicle",
      dates: dates || "Nov 14 – Nov 17, 2024",
      rentalDays: Number(rentalDays) || 3,
      amountFormatted: amountFormatted || "₦1,350,000",
      chauffeurProtocol,
      corridor,
      passUrl,
      trackingUrl,
    });

    res.json({
      success: true,
      message: "Booking confirmation email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Booking confirmation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/cancellation
 * Send charter cancellation confirmation and refund notification (approved)
 */
emailRouter.post("/cancellation", async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      email,
      bookingCode,
      vehicleName,
      refundAmountFormatted,
      refundBank,
      refundAccount,
      statusNote,
    } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendCancellationNoticeEmail({
      clientName: clientName || "Executive Client",
      email,
      bookingCode,
      vehicleName: vehicleName || "Chartered Fleet Vehicle",
      refundAmountFormatted: refundAmountFormatted || "₦1,350,000",
      refundBank,
      refundAccount,
      statusNote,
    });

    res.json({
      success: true,
      message: "Cancellation & refund notice email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Cancellation notice failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/cancellation-request
 * Send cancellation request received notification (under review)
 */
emailRouter.post("/cancellation-request", async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      email,
      bookingCode,
      vehicleName,
      refundAmountFormatted,
      refundBank,
      refundAccount,
      reason,
    } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendCancellationRequestReceivedEmail({
      clientName: clientName || "Executive Client",
      email,
      bookingCode,
      vehicleName: vehicleName || "Chartered Fleet Vehicle",
      refundAmountFormatted: refundAmountFormatted || "₦1,350,000",
      refundBank,
      refundAccount,
      reason,
    });

    res.json({
      success: true,
      message: "Cancellation request received email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Cancellation request email failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/cancellation-declined
 * Send cancellation request declined notice
 */
emailRouter.post("/cancellation-declined", async (req: Request, res: Response) => {
  try {
    const { clientName, email, bookingCode, vehicleName, statusNote } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendCancellationDeclinedEmail({
      clientName: clientName || "Executive Client",
      email,
      bookingCode,
      vehicleName: vehicleName || "Chartered Fleet Vehicle",
      statusNote,
    });

    res.json({
      success: true,
      message: "Cancellation declined email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Cancellation declined email failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/extension-request
 * Send extension request received notice
 */
emailRouter.post("/extension-request", async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      email,
      bookingCode,
      vehicleName,
      extraDays,
      newReturnDate,
      reason,
    } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendExtensionRequestReceivedEmail({
      clientName: clientName || "Executive Client",
      email,
      bookingCode,
      vehicleName: vehicleName || "Chartered Fleet Vehicle",
      extraDays: Number(extraDays) || 1,
      newReturnDate,
      reason,
    });

    res.json({
      success: true,
      message: "Extension request received email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Extension request email failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/extension-approved
 * Send extension approved notice
 */
emailRouter.post("/extension-approved", async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      email,
      bookingCode,
      vehicleName,
      extraDays,
      newReturnDate,
      statusNote,
    } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendExtensionApprovedEmail({
      clientName: clientName || "Executive Client",
      email,
      bookingCode,
      vehicleName: vehicleName || "Chartered Fleet Vehicle",
      extraDays: Number(extraDays) || 1,
      newReturnDate,
      statusNote,
    });

    res.json({
      success: true,
      message: "Extension approved email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Extension approved email failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/extension-declined
 * Send extension declined notice
 */
emailRouter.post("/extension-declined", async (req: Request, res: Response) => {
  try {
    const { clientName, email, bookingCode, vehicleName, statusNote } = req.body;

    if (!email || !bookingCode) {
      return res.status(400).json({ error: "Email and bookingCode are required" });
    }

    const result = await sendExtensionDeclinedEmail({
      clientName: clientName || "Executive Client",
      email,
      bookingCode,
      vehicleName: vehicleName || "Chartered Fleet Vehicle",
      statusNote,
    });

    res.json({
      success: true,
      message: "Extension declined email dispatched successfully",
      details: result,
    });
  } catch (err: any) {
    console.error("[Email Error] Extension declined email failed:", err);
    res.status(500).json({ error: err.message });
  }
});


