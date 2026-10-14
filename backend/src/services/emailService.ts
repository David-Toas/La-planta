import nodemailer from "nodemailer";
import { config } from "../config";

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  type: "welcome" | "booking_confirmation" | "cancellation_notice" | "general";
  sentAt: string;
  status: "delivered" | "simulated" | "failed";
  provider: "resend" | "smtp" | "simulated";
  previewText?: string;
  html?: string;
  error?: string;
}

// In-memory audit log of sent transactional emails
export const sentEmailLogs: EmailLogEntry[] = [];

// Base HTML Wrapper for Luxury Brand Consistency
function renderLuxuryEmailShell(contentHtml: string, previewText: string): string {
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
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      letter-spacing: 4px;
      color: #ffffff;
      margin: 0;
      font-weight: 700;
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #d4af37;
      margin-top: 6px;
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
      <div class="header">
        <h1 class="brand-title">LA PLANTA PRIME</h1>
        <div class="brand-sub">Private Fleet &amp; Diplomatic Mobility</div>
      </div>
      <div class="body-content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #a0aec0;">
          LA PLANTA PRIME CONCIERGE &bull; LAGOS &bull; ABUJA
        </p>
        <p style="margin: 0 0 12px 0;">
          Direct Airside VIP Protocol &bull; Armored Transit &bull; 24/7 Operations Desk: <a href="tel:+23418885275">+234 1 888 5275</a>
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
  const tier = params.vipTier || "Member";
  const pin = params.bookingPin || "#LP-8910";
  const subject = `Welcome to La Planta Prime • Executive Membership Confirmed (${tier})`;
  const preview = `Your La Planta Prime VIP account is now active. Access airside protocol, armored fleet, and private chauffeurs.`;

  const body = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="gold-pill">Membership Tier: ${tier}</span>
      <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #ffffff; margin: 16px 0 8px 0;">
        Welcome to the Fleet, ${params.clientName}
      </h2>
      <p style="font-size: 13px; color: #a0aec0; line-height: 1.6; margin: 0;">
        Your credentials have been securely provisioned in the La Planta Prime executive network. You now command priority allocation across our Lagos and Abuja armored and executive fleets.
      </p>
    </div>

    <div class="card">
      <h3 style="font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #d4af37; margin: 0 0 12px 0;">
        Executive Privileges &amp; Protocols
      </h3>
      <table style="width: 100%; font-size: 12px; color: #cbd5e1; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #718096;">VIP Access PIN:</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #fedeb2; text-align: right;">${pin}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #718096;">Registered Email:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff; text-align: right;">${params.email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #718096;">Active Corridors:</td>
          <td style="padding: 6px 0; text-align: right;">Lagos (VI, Ikoyi, Lekki) &amp; Abuja (FCT, Airside)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #718096;">Chauffeur Allocation:</td>
          <td style="padding: 6px 0; text-align: right; color: #48bb78; font-weight: 600;">Defensive Driving Certified</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="http://localhost:3000/fleet" class="btn-gold">Explore The Private Fleet &rarr;</a>
    </div>

    <p style="font-size: 12px; color: #718096; line-height: 1.5; margin: 0; text-align: center;">
      Need direct airside escort or bullet-resistant B6/B7 dispatch? Contact your dedicated Concierge directly at <a href="https://wa.me/2348000000000" style="color: #d4af37; font-weight: 600;">WhatsApp Desk</a>.
    </p>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Welcome to La Planta Prime, ${params.clientName}. Your membership tier: ${tier}. Your Booking PIN: ${pin}. Explore the fleet at http://localhost:3000/fleet.`,
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
  const pass = params.passUrl || `http://localhost:3000/reservation-pass`;
  const tracking = params.trackingUrl || `http://localhost:3000/live-tracking`;
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
        ${params.refundAccount ? `
        <tr>
          <td style="padding: 7px 0; color: #718096;">Account Number:</td>
          <td style="padding: 7px 0; font-family: monospace; text-align: right;">${params.refundAccount}</td>
        </tr>
        ` : ""}
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
      <a href="http://localhost:3000/fleet" class="btn-gold">Plan Your Next Executive Charter &rarr;</a>
    </div>
  `;

  return {
    subject,
    html: renderLuxuryEmailShell(body, preview),
    text: `Your charter cancellation for ${code} (${params.vehicleName}) is processed. Refund of ${params.refundAmountFormatted} has been initiated to ${params.refundBank || "your bank"}.`,
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
}): Promise<{ success: boolean; id?: string; error?: string; provider: string }> {
  const { to, subject, html, text, type } = params;
  const from = `${config.email.fromName} <${config.email.fromEmail}>`;

  // 1. Try Resend if API Key is configured
  if (config.email.resendApiKey && config.email.resendApiKey.startsWith("re_")) {
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
          subject,
          html,
          text: text || "La Planta Prime VIP Transactional Notification",
        }),
      });

      const data = await response.json();
      if (response.ok && data?.id) {
        console.log(`\x1b[32m[Resend API Success]\x1b[0m Email ID: ${data.id} -> ${to} (${subject})`);
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
      } else {
        console.warn(`[Resend API Warning] Resend responded with error:`, data);
        // Fall through to SMTP or simulation
      }
    } catch (resendErr: any) {
      console.warn(`[Resend API Error]: ${resendErr.message}. Attempting fallback...`);
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

      console.log(`\x1b[32m[SMTP Success]\x1b[0m Message ID: ${info.messageId} -> ${to}`);
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
      console.warn(`[SMTP Error]: ${smtpErr.message}. Falling back to simulation...`);
    }
  }

  // 3. High-Fidelity Luxury Simulation Mode
  const simulatedId = `sim-email-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`\n\x1b[33m┌────────────────────────────────────────────────────────────────────────┐\x1b[0m`);
  console.log(`\x1b[33m│ 📧 LA PLANTA PRIME • VIP TRANSACTIONAL EMAIL (SIMULATED MODE)          │\x1b[0m`);
  console.log(`\x1b[33m├────────────────────────────────────────────────────────────────────────┤\x1b[0m`);
  console.log(`  \x1b[1mTo:\x1b[0m      ${to}`);
  console.log(`  \x1b[1mSubject:\x1b[0m \x1b[36m${subject}\x1b[0m`);
  console.log(`  \x1b[1mType:\x1b[0m    ${type.toUpperCase()}`);
  console.log(`  \x1b[1mID:\x1b[0m      ${simulatedId}`);
  console.log(`  \x1b[1mStatus:\x1b[0m  \x1b[32mDelivered to In-Memory Audit Ledger (Inspect via /api/email/logs)\x1b[0m`);
  console.log(`\x1b[33m└────────────────────────────────────────────────────────────────────────┘\x1b[0m\n`);

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

