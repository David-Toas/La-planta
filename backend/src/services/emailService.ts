import nodemailer from "nodemailer";
import { config } from "../config";

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type:
    | "welcome"
    | "booking_confirmation"
    | "cancellation_notice"
    | "cancellation_request"
    | "cancellation_declined"
    | "extension_request"
    | "extension_approved"
    | "extension_declined"
    | "general";
  sentAt: string;
  status: "delivered" | "simulated" | "failed";
  provider: "resend" | "smtp" | "simulated";
  previewText?: string;
  html?: string;
  error?: string;
}

// In-memory audit log of sent transactional emails
export const sentEmailLogs: EmailLogEntry[] = [];

/**
 * HTML Sanitization Helper to prevent HTML Injection and XSS in transactional emails
 */
export function escapeHtml(unsafe: any): string {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Base HTML Wrapper for Luxury Brand Consistency
function renderLuxuryEmailShell(
  contentHtml: string,
  previewText: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>La Planta Prime</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #07090e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #07090e;
      padding: 40px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0e131f;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .header {
      padding: 36px 32px 24px 32px;
      background: linear-gradient(180deg, #161e30 0%, #0e131f 100%);
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      text-align: center;
    }
    .brand-title {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-size: 26px;
      letter-spacing: 5px;
      color: #d4af37 !important;
      margin: 0;
      font-weight: 800;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #fedeb2;
      margin-top: 8px;
      font-weight: 600;
    }
    .body-content {
      padding: 32px 32px 24px 32px;
    }
    .card {
      background-color: #141b2a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .gold-pill {
      display: inline-block;
      background: rgba(212, 175, 55, 0.15);
      color: #fedeb2;
      border: 1px solid rgba(212, 175, 55, 0.35);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .btn-gold {
      display: inline-block;
      background: linear-gradient(135deg, #d4af37 0%, #aa841e 100%);
      color: #050608 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 14px 28px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
    }
    .footer {
      padding: 24px 32px 36px 32px;
      background-color: #0a0d14;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
      font-size: 11px;
      color: #718096;
      line-height: 1.6;
    }
    .footer a {
      color: #d4af37;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header" style="padding: 36px 32px 24px 32px; background: linear-gradient(180deg, #161e30 0%, #0e131f 100%); border-bottom: 1px solid rgba(212, 175, 55, 0.3); text-align: center;">
        <h1 class="brand-title" style="margin: 0; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 800; letter-spacing: 5px; color: #d4af37 !important; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.6);"><span style="color: #d4af37 !important; font-weight: 800; letter-spacing: 5px;">LA PLANTA PRIME</span></h1>
        <div class="brand-sub" style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #fedeb2; margin-top: 8px; font-weight: 600;">Private Fleet &bull; Diplomatic Mobility</div>
      </div>
      <div class="body-content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #d4af37; letter-spacing: 2px; text-transform: uppercase;">
          LA PLANTA PRIME
        </p>
        <p style="margin: 0 0 12px 0;">
          24/7 Operations Desk: <a href="tel:+23418885275">+234 814 031 3381</a>
        </p>
        <p style="margin: 0; font-size: 10px; color: #4a5568;">
          This is an official transactional message regarding your chartered itinerary. Keep confidential.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Template: Welcome Email (Post Sign-Up)
 */
export function getWelcomeEmailHtml(params: {
  clientName: string;
  email: string;
  vipTier?: string;
  bookingPin?: string;
}): { html: string; text: string; subject: string } {
  const subject = `Welcome to La Planta Prime • Executive Account Confirmed`;
  const preview = `Your La Planta Prime VIP account is now active. Explore our private armored and luxury fleets.`;
  const fleetUrl = `${config.clientUrl}/fleet`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 8px 0;">
        Welcome to the Fleet, ${params.clientName}
      </h2>
      <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; margin: 0;">
        Your credentials have been securely provisioned in the La Planta Prime executive network. You now command priority allocation across our private armored and luxury automobile fleets.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Executive Account Details
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #718096;">Client Name:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff; text-align: right;">${params.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #718096;">Registered Email:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #fedeb2; text-align: right;">${params.email}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${fleetUrl}" class="btn-gold">Explore The Private Fleet &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #718096; line-height: 1.5; margin: 0; text-align: center;">
      You can contact your dedicated helpdesk directly at <a href="https://wa.me/2348000000000" style="color: #d4af37; font-weight: 600;">WhatsApp Desk</a>.
    </p>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Welcome to La Planta Prime, ${params.clientName}. Your executive account is now active. Explore the private fleet at ${fleetUrl}.`,
  };
}

/**
 * 2. Template: Booking Confirmation & Digital QR Pass (Post Payment)
 */
export function getBookingConfirmationHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  dates: string;
  rentalDays: number;
  amountFormatted: string;
  chauffeurProtocol?: string;
  corridor?: string;
  passUrl?: string;
  trackingUrl?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const pass = params.passUrl || `${config.clientUrl}/reservation-pass`;
  const tracking = params.trackingUrl || `${config.clientUrl}/live-tracking`;
  const subject = `Charter Confirmed • ${params.vehicleName} (${code})`;
  const preview = `Your charter ${code} for ${params.vehicleName} is secured. Access your QR Handover Pass and live GPS tracking.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill">Status: Charter Secured &amp; Settled</span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        VIP Charter Confirmation
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        Reservation <strong style="color: #fedeb2; font-family: monospace;">${code}</strong> is verified in our dispatch matrix.
      </p>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; margin-bottom: 14px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #d4af37; font-weight: 700;">Itinerary Summary</span>
        <span style="font-size: 11px; color: #48bb78; font-weight: 700;">PAYMENT VERIFIED</span>
      </div>

      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chartered Vehicle:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Itinerary Dates:</td>
          <td style="padding: 7px 0; font-weight: 600; text-align: right;">${params.dates}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Rental Duration:</td>
          <td style="padding: 7px 0; text-align: right;">${params.rentalDays} Day(s) Charter</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Corridor &amp; Protocol:</td>
          <td style="padding: 7px 0; text-align: right;">${params.corridor || "Lagos Airport &amp; Ikoyi Protocol"}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chauffeur Service:</td>
          <td style="padding: 7px 0; text-align: right; color: #fedeb2;">${params.chauffeurProtocol || "Dedicated Professional Driver Included"}</td>
        </tr>
        <tr style="border-top: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 12px 0 4px 0; font-weight: 700; color: #ffffff; font-size: 14px;">Total Settled:</td>
          <td style="padding: 12px 0 4px 0; font-weight: 800; color: #d4af37; font-size: 16px; font-family: monospace; text-align: right;">${params.amountFormatted}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: rgba(212, 175, 55, 0.08); border: 1px dashed rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #fedeb2; text-transform: uppercase; letter-spacing: 1px;">
        Digital Handover QR Pass
      </h4>
      <p style="font-size: 11px; color: #a0aec0; margin: 0 0 16px 0;">
        Present your live encrypted QR Pass to the chauffeur upon arrival for instant key handover verification.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <a href="${pass}" class="btn-gold" style="margin: 4px;">Open Digital QR Pass &rarr;</a>
        <a href="${tracking}" style="display: inline-block; background: #1a2233; color: #e2e8f0; text-decoration: none; font-weight: 600; font-size: 12px; padding: 14px 20px; border-radius: 8px; margin: 4px; border: 1px solid rgba(255,255,255,0.1);">Live Telematics GPS</a>
      </div>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your charter ${code} for ${params.vehicleName} is confirmed! Total settled: ${params.amountFormatted}. View your digital QR Pass at: ${pass}`,
  };
}

/**
 * 3. Template: Cancellation & Refund Notice (Post Admin Review & Refund)
 */
export function getCancellationNoticeHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  refundAmountFormatted: string;
  refundBank?: string;
  refundAccount?: string;
  statusNote?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const subject = `Charter Cancellation & Refund Notice • ${code}`;
  const preview = `Your cancellation request for charter ${code} has been processed and manual refund initiated.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill" style="border-color: rgba(226, 100, 100, 0.5); color: #fca5a5; background: rgba(220, 38, 38, 0.1);">
        Cancellation Verified &amp; Refund Processed
      </span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        Charter Cancellation Notice
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        Charter <strong style="color: #fedeb2; font-family: monospace;">${code}</strong> has been cancelled and vehicle availability released.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Refund &amp; Settlement Breakdown
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Cancelled Vehicle:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Refund Amount:</td>
          <td style="padding: 7px 0; font-family: monospace; font-size: 14px; font-weight: 800; color: #48bb78; text-align: right;">${params.refundAmountFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Refund Destination:</td>
          <td style="padding: 7px 0; text-align: right; color: #fedeb2; font-weight: 600;">${params.refundBank || "Designated Corporate Wire Account"}</td>
        </tr>
        ${
          params.refundAccount
            ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">Account Number:</td>
          <td style="padding: 7px 0; font-family: monospace; text-align: right;">${params.refundAccount}</td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 7px 0; color: #718096;">Security Escrow:</td>
          <td style="padding: 7px 0; text-align: right; color: #48bb78;">Full Escrow Hold Released</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #141b2a; border-left: 3px solid #d4af37; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
      <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Concierge Operations Note:</strong>
      ${params.statusNote || "Our financial operations team has executed your wire reversal. Depending on your banking institution, funds typically reflect within 1–2 business hours. We regret to miss hosting you on this occasion and look forward to welcoming you back aboard the fleet."}
    </div>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${config.clientUrl}/fleet" class="btn-gold">Plan Your Next Executive Charter &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your charter cancellation for ${code} (${params.vehicleName}) is processed. Refund of ${params.refundAmountFormatted} has been initiated to ${params.refundBank || "your bank"}.`,
  };
}

/**
 * 4. Template: Cancellation Request Submitted (Notification under review)
 */
export function getCancellationRequestSubmittedHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  refundAmountFormatted: string;
  refundBank?: string;
  refundAccount?: string;
  reason?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const subject = `Cancellation Request Received • ${code}`;
  const preview = `Your cancellation request for charter ${code} has been submitted and is currently being reviewed by our concierge team.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill" style="border-color: rgba(234, 179, 8, 0.5); color: #fef08a; background: rgba(234, 179, 8, 0.1);">
        Request Status: Under Active Review
      </span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        Cancellation Request Received
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        We have received your cancellation request for charter <strong style="color: #fedeb2; font-family: monospace;">${code}</strong>.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Request Details
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chartered Vehicle:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Estimated Refund:</td>
          <td style="padding: 7px 0; font-family: monospace; font-size: 14px; font-weight: 800; color: #48bb78; text-align: right;">${params.refundAmountFormatted}</td>
        </tr>
        ${
          params.refundBank
            ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">Destination Bank:</td>
          <td style="padding: 7px 0; text-align: right; color: #fedeb2;">${params.refundBank} (${params.refundAccount || "Direct Wire"})</td>
        </tr>
        `
            : ""
        }
        ${
          params.reason
            ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">Stated Reason:</td>
          <td style="padding: 7px 0; text-align: right; color: #cbd5e1; font-style: italic;">${params.reason}</td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <div style="background-color: #141b2a; border-left: 3px solid #d4af37; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
      <strong style="color: #ffffff; display: block; margin-bottom: 4px;">What Happens Next:</strong>
      Our concierge operations team is reviewing your itinerary against fleet dispatch guidelines. A concierge officer will contact you within 15 minutes to confirm the approval and coordinate your wire payout.
    </div>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${config.clientUrl}/account" class="btn-gold">View Account Status &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your cancellation request for charter ${code} (${params.vehicleName}) has been received and is under review. Estimated refund: ${params.refundAmountFormatted}. A concierge officer will update you within 15 minutes.`,
  };
}

/**
 * 5. Template: Cancellation Request Declined
 */
export function getCancellationDeclinedHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  statusNote?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const subject = `Cancellation Request Update • ${code}`;
  const preview = `An update regarding your cancellation request for charter ${code}.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill" style="border-color: rgba(239, 68, 68, 0.5); color: #fca5a5; background: rgba(239, 68, 68, 0.1);">
        Request Status: Declined
      </span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        Cancellation Request Decision
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        Regarding your cancellation request for charter <strong style="color: #fedeb2; font-family: monospace;">${code}</strong>.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Charter Status Overview
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Vehicle Reserved:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Reservation Status:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #48bb78; text-align: right;">Active &amp; Confirmed</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #141b2a; border-left: 3px solid #ef4444; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
      <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Operations Review Note:</strong>
      ${params.statusNote || "Due to short-notice staging or specialized armored protocol arrangements already deployed for this reservation, the cancellation request could not be approved. Your dedicated chauffeur and vehicle remain assigned as planned."}
    </div>

    <p style="font-size: 12px; color: #718096; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
      If you require assistance or schedule adjustments, please reach your VIP Concierge directly at <a href="tel:+23418885275" style="color: #d4af37; font-weight: 600;">+234 814 031 3381</a>.
    </p>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${config.clientUrl}/account" class="btn-gold">View Your Active Pass &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your cancellation request for charter ${code} could not be approved. Note: ${params.statusNote || "Your vehicle remains reserved."} Contact concierge for assistance.`,
  };
}

/**
 * 6. Template: Extension Request Submitted (Notification under review)
 */
export function getExtensionRequestSubmittedHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  extraDays: number;
  newReturnDate?: string;
  reason?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const subject = `Extension Request Received • ${code} (+${params.extraDays}d)`;
  const preview = `Your request to extend charter ${code} by ${params.extraDays} day(s) is under active review.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill" style="border-color: rgba(59, 130, 246, 0.5); color: #bfdbfe; background: rgba(59, 130, 246, 0.1);">
        Extension Request: Under Active Review
      </span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        Itinerary Extension Requested
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        We have received your extension request for charter <strong style="color: #fedeb2; font-family: monospace;">${code}</strong>.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Requested Itinerary Modification
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chartered Vehicle:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Additional Days:</td>
          <td style="padding: 7px 0; font-family: monospace; font-size: 13px; font-weight: 800; color: #60a5fa; text-align: right;">+${params.extraDays} Extra Day(s)</td>
        </tr>
        ${
          params.newReturnDate
            ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">Target New Return:</td>
          <td style="padding: 7px 0; font-weight: 600; text-align: right; color: #fedeb2;">${params.newReturnDate}</td>
        </tr>
        `
            : ""
        }
        ${
          params.reason
            ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">Reason:</td>
          <td style="padding: 7px 0; text-align: right; font-style: italic;">${params.reason}</td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <div style="background-color: #141b2a; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
      <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Next Steps:</strong>
      Our fleet dispatchers are confirming chauffeur roster availability and vehicle schedule continuity. You will receive an immediate confirmation email once authorized.
    </div>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${config.clientUrl}/account" class="btn-gold">Track Request Status &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your extension request (+${params.extraDays} days) for charter ${code} is under review. We will notify you as soon as dispatch confirms vehicle availability.`,
  };
}

/**
 * 7. Template: Extension Approved
 */
export function getExtensionApprovedHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  extraDays: number;
  newReturnDate?: string;
  statusNote?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const subject = `Charter Extension Approved • ${code} (+${params.extraDays}d)`;
  const preview = `Your itinerary extension for charter ${code} has been approved. Chauffeur protocol retained.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill" style="border-color: rgba(34, 197, 94, 0.5); color: #bbf7d0; background: rgba(34, 197, 94, 0.1);">
        Extension Confirmed &amp; Schedule Updated
      </span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        Itinerary Extension Confirmed
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        Charter <strong style="color: #fedeb2; font-family: monospace;">${code}</strong> has been extended by <strong style="color: #48bb78;">+${params.extraDays} day(s)</strong>.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Updated Itinerary Details
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chartered Vehicle:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Extended Duration:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #48bb78; text-align: right;">+${params.extraDays} Additional Day(s)</td>
        </tr>
        ${
          params.newReturnDate
            ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">New Return Schedule:</td>
          <td style="padding: 7px 0; font-weight: 700; text-align: right; color: #fedeb2;">${params.newReturnDate}</td>
        </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chauffeur Continuity:</td>
          <td style="padding: 7px 0; text-align: right; color: #48bb78;">Retained On Continuous Protocol</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #141b2a; border-left: 3px solid #22c55e; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
      <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Concierge Operations Note:</strong>
      ${params.statusNote || "Your extended itinerary has been logged in central dispatch and confirmed with your assigned chauffeur. Seamless service continues uninterrupted."}
    </div>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${config.clientUrl}/reservation-pass" class="btn-gold">View Updated Pass &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your charter extension (+${params.extraDays} days) for ${code} (${params.vehicleName}) is approved. New return schedule: ${params.newReturnDate || "Updated in dispatch"}.`,
  };
}

/**
 * 8. Template: Extension Declined
 */
export function getExtensionDeclinedHtml(params: {
  clientName: string;
  bookingCode: string;
  vehicleName: string;
  statusNote?: string;
}): { html: string; text: string; subject: string } {
  const code = params.bookingCode || "#LP-8842";
  const subject = `Charter Extension Update • ${code}`;
  const preview = `Update regarding your itinerary extension request for charter ${code}.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill" style="border-color: rgba(239, 68, 68, 0.5); color: #fca5a5; background: rgba(239, 68, 68, 0.1);">
        Extension Notice: Unavailable
      </span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 6px 0;">
        Extension Request Update
      </h2>
      <p style="font-size: 13px; color: #a0aec0; margin: 0;">
        Regarding your extension request for charter <strong style="color: #fedeb2; font-family: monospace;">${code}</strong>.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Current Itinerary Status
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 7px 0; color: #718096;">Chartered Vehicle:</td>
          <td style="padding: 7px 0; font-weight: 700; color: #ffffff; text-align: right;">${params.vehicleName}</td>
        </tr>
        <tr>
          <td style="padding: 7px 0; color: #718096;">Schedule:</td>
          <td style="padding: 7px 0; font-weight: 600; text-align: right; color: #cbd5e1;">Original Return Date In Effect</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #141b2a; border-left: 3px solid #ef4444; border-radius: 4px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #a0aec0; line-height: 1.6;">
      <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Operations Note:</strong>
      ${params.statusNote || "We regret that the requested extension cannot be accommodated because this automobile has a subsequent VIP booking scheduled immediately following your charter. Our concierge can arrange an alternate vehicle from our available fleet if desired."}
    </div>

    <div style="text-align: center; margin: 24px 0 12px 0;">
      <a href="${config.clientUrl}/fleet" class="btn-gold">Explore Alternate Fleet Vehicles &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your extension request for ${code} could not be accommodated. ${params.statusNote || "Original return schedule remains in effect."}`,
  };
}

/**
 * Core Dispatch Function: Sends via Resend REST API, Nodemailer SMTP, or Luxury Simulated Mode
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: EmailLogEntry["type"];
}): Promise<{
  success: boolean;
  id?: string;
  error?: string;
  provider: string;
}> {
  const { to, subject, html, text, type } = params;
  const from = `${config.email.fromName} <${config.email.fromEmail}>`;

  // 1. Try Resend if API Key is configured
  if (
    config.email.resendApiKey &&
    config.email.resendApiKey.startsWith("re_")
  ) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.email.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: "concierge@laplantaprime.com",
          subject,
          html,
          text: text || "La Planta Prime VIP Transactional Notification",
        }),
      });

      const data = await response.json();
      if (response.ok && data?.id) {
        console.log(
          `\x1b[32m[Resend API Success]\x1b[0m Email ID: ${data.id} -> ${to} (${subject})`,
        );
        const logEntry: EmailLogEntry = {
          id: data.id,
          to,
          subject,
          type,
          sentAt: new Date().toISOString(),
          status: "delivered",
          provider: "resend",
          previewText: text?.slice(0, 120),
          html,
        };
        sentEmailLogs.unshift(logEntry);
        return { success: true, id: data.id, provider: "resend" };
      } else if (
        !response.ok &&
        data?.message &&
        typeof data.message === "string" &&
        data.message.includes(
          "You can only send testing emails to your own email address",
        )
      ) {
        // Smart sandbox fallback: When testing on Resend sandbox without verified custom domain,
        // automatically route a copy to the verified account owner showoleolabode.6@gmail.com
        console.warn(
          `\x1b[33m[Resend Sandbox Notice]\x1b[0m Recipient '${to}' is unverified in Resend sandbox. Forwarding to verified account owner showoleolabode.6@gmail.com...`,
        );
        const bannerHtml = `
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; color: #92400e; line-height: 1.5;">
            <strong>⚠️ Resend Sandbox Development Mode:</strong> This email was targeted to <code>${to}</code>. Because custom domain verification is pending on Resend, it has been delivered to your registered account owner address (<code>showoleolabode.6@gmail.com</code>).
          </div>
        `;
        const forwardRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.email.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: ["showoleolabode.6@gmail.com"],
            reply_to: "concierge@laplantaprime.com",
            subject: `[Sandbox Forward for ${to}] ${subject}`,
            html: bannerHtml + html,
            text: text || "La Planta Prime VIP Transactional Notification",
          }),
        });

        const forwardData = await forwardRes.json();
        if (forwardRes.ok && forwardData?.id) {
          console.log(
            `\x1b[32m[Resend Sandbox Forwarded]\x1b[0m Delivered ID: ${forwardData.id} -> showoleolabode.6@gmail.com`,
          );
          const logEntry: EmailLogEntry = {
            id: forwardData.id,
            to: `${to} (Delivered to showoleolabode.6@gmail.com)`,
            subject,
            type,
            sentAt: new Date().toISOString(),
            status: "delivered",
            provider: "resend",
            previewText: text?.slice(0, 120),
            html,
          };
          sentEmailLogs.unshift(logEntry);
          return { success: true, id: forwardData.id, provider: "resend" };
        } else {
          console.error(`[Resend Forwarding Error]:`, forwardData);
        }
      } else {
        console.warn(`[Resend API Warning] Resend responded with error:`, data);
      }
    } catch (resendErr: any) {
      console.warn(
        `[Resend API Error]: ${resendErr.message}. Attempting fallback...`,
      );
    }
  }

  // 2. Try SMTP Nodemailer if host is configured
  if (config.email.smtp.host && config.email.smtp.user) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
      });

      console.log(
        `\x1b[32m[SMTP Success]\x1b[0m Message ID: ${info.messageId} -> ${to}`,
      );
      const logEntry: EmailLogEntry = {
        id: info.messageId,
        to,
        subject,
        type,
        sentAt: new Date().toISOString(),
        status: "delivered",
        provider: "smtp",
        previewText: text?.slice(0, 120),
        html,
      };
      sentEmailLogs.unshift(logEntry);
      return { success: true, id: info.messageId, provider: "smtp" };
    } catch (smtpErr: any) {
      console.warn(
        `[SMTP Error]: ${smtpErr.message}. Falling back to simulation...`,
      );
    }
  }

  // 3. High-Fidelity Luxury Simulation Mode
  const simulatedId = `sim-email-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(
    `\n\x1b[33m┌────────────────────────────────────────────────────────────────────────┐\x1b[0m`,
  );
  console.log(
    `\x1b[33m│ 📧 LA PLANTA PRIME • VIP TRANSACTIONAL EMAIL (SIMULATED MODE)          │\x1b[0m`,
  );
  console.log(
    `\x1b[33m├────────────────────────────────────────────────────────────────────────┤\x1b[0m`,
  );
  console.log(`  \x1b[1mTo:\x1b[0m      ${to}`);
  console.log(`  \x1b[1mSubject:\x1b[0m \x1b[36m${subject}\x1b[0m`);
  console.log(`  \x1b[1mType:\x1b[0m    ${type.toUpperCase()}`);
  console.log(`  \x1b[1mID:\x1b[0m      ${simulatedId}`);
  console.log(
    `  \x1b[1mStatus:\x1b[0m  \x1b[32mDelivered to In-Memory Audit Ledger (Inspect via /api/email/logs)\x1b[0m`,
  );
  console.log(
    `\x1b[33m└────────────────────────────────────────────────────────────────────────┘\x1b[0m\n`,
  );

  const simLogEntry: EmailLogEntry = {
    id: simulatedId,
    to,
    subject,
    type,
    sentAt: new Date().toISOString(),
    status: "simulated",
    provider: "simulated",
    previewText: text?.slice(0, 120),
    html,
  };
  sentEmailLogs.unshift(simLogEntry);

  return { success: true, id: simulatedId, provider: "simulated" };
}

/**
 * Convenient Domain Action Methods
 */
export async function sendWelcomeEmail(params: {
  clientName: string;
  email: string;
  vipTier?: string;
  bookingPin?: string;
}) {
  const template = getWelcomeEmailHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "welcome",
  });
}

export async function sendBookingConfirmationEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  dates: string;
  rentalDays: number;
  amountFormatted: string;
  chauffeurProtocol?: string;
  corridor?: string;
  passUrl?: string;
  trackingUrl?: string;
}) {
  const template = getBookingConfirmationHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "booking_confirmation",
  });
}

export async function sendCancellationNoticeEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  refundAmountFormatted: string;
  refundBank?: string;
  refundAccount?: string;
  statusNote?: string;
}) {
  const template = getCancellationNoticeHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "cancellation_notice",
  });
}

export async function sendCancellationRequestReceivedEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  refundAmountFormatted: string;
  refundBank?: string;
  refundAccount?: string;
  reason?: string;
}) {
  const template = getCancellationRequestSubmittedHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "cancellation_request",
  });
}

export async function sendCancellationDeclinedEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  statusNote?: string;
}) {
  const template = getCancellationDeclinedHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "cancellation_declined",
  });
}

export async function sendExtensionRequestReceivedEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  extraDays: number;
  newReturnDate?: string;
  reason?: string;
}) {
  const template = getExtensionRequestSubmittedHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "extension_request",
  });
}

export async function sendExtensionApprovedEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  extraDays: number;
  newReturnDate?: string;
  statusNote?: string;
}) {
  const template = getExtensionApprovedHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "extension_approved",
  });
}

export async function sendExtensionDeclinedEmail(params: {
  clientName: string;
  email: string;
  bookingCode: string;
  vehicleName: string;
  statusNote?: string;
}) {
  const template = getExtensionDeclinedHtml(params);
  return sendEmail({
    to: params.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    type: "extension_declined",
  });
}
