import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { VIPPassPDFDocument } from "@/components/vip-pass-pdf";
import { createClient } from "@supabase/supabase-js";

// Supabase client for route handler
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const code = resolvedParams.code;

    if (!code) {
      return NextResponse.json({ error: "Booking code required" }, { status: 400 });
    }

    // 1. Fetch live booking from Supabase
    const { data: dbBooking } = await supabase
      .from("bookings")
      .select("*, vehicles(*), drivers(*), profiles(*)")
      .eq("booking_reference", code)
      .maybeSingle();

    const origin =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://laplanta.ng";

    let bookingData: any;

    if (dbBooking) {
      // Security Verification: Require valid booking PIN, QR capability token, or authenticated session
      const pinParam = request.nextUrl.searchParams.get("pin");
      const tokenParam = request.nextUrl.searchParams.get("token");

      let isAuthorized = false;

      // 1. Check capability parameter (from scanned QR code voucher)
      if (
        pinParam &&
        dbBooking.verification_pin &&
        pinParam.trim().toLowerCase() === dbBooking.verification_pin.trim().toLowerCase()
      ) {
        isAuthorized = true;
      } else if (
        tokenParam &&
        dbBooking.qr_pass_token &&
        tokenParam === dbBooking.qr_pass_token
      ) {
        isAuthorized = true;
      }

      // 2. Check active authenticated session header (from logged in client browser/mobile app)
      if (!isAuthorized) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const sessionToken = authHeader.split(" ")[1];
          const { data: authData } = await supabase.auth.getUser(sessionToken);
          if (authData?.user && authData.user.id === dbBooking.client_id) {
            isAuthorized = true;
          }
        }
      }

      // Block unauthorized scraping of customer itineraries and PII
      if (!isAuthorized) {
        return NextResponse.json(
          {
            error:
              "Unauthorized: Valid verification PIN or owner authentication required to download voucher.",
          },
          { status: 403 }
        );
      }

      const v = dbBooking.vehicles;
      const d = dbBooking.drivers;
      const p = dbBooking.profiles;

      const isHub =
        dbBooking.service_type === "self_drive" ||
        dbBooking.pickup_location?.toLowerCase().includes("hub") ||
        dbBooking.special_instructions?.includes("Office Pickup");

      bookingData = {
        bookingCode: dbBooking.booking_reference || code,
        reference: dbBooking.payment_reference || dbBooking.id || "LP_REF",
        verificationPin: dbBooking.verification_pin || "7974-09",
        serviceTier:
          dbBooking.service_type === "diplomatic_escort"
            ? "Diplomatic Armored Escort"
            : dbBooking.service_type === "self_drive"
              ? "Executive Self-Drive"
              : "Executive First Class",
        amountFormatted: dbBooking.total_amount_ngn
          ? `₦${Number(dbBooking.total_amount_ngn).toLocaleString()}`
          : "₦4,950,000",
        customerName:
          p?.full_name ||
          dbBooking.customer_name ||
          "Executive VIP Member",
        customerPhone: p?.phone || dbBooking.customer_phone || "+234 814 031 3381",
        customerEmail: p?.email || dbBooking.customer_email || "",
        handoverProtocol: isHub
          ? "Flagship Hub Pickup"
          : "Direct VIP Doorstep Delivery",
        vehicle: {
          name: v ? `${v.brand} ${v.model}` : "Land Rover Autobiography LWB",
          category: v?.category || "Executive SUV",
          year: v?.year || 2024,
          color: v?.color || "Santorini Black",
          licensePlate: v?.license_plate || "LAG-892-XZ",
        },
        driver: isHub
          ? {
              name: "Flagship Hub Concierge (Bay 01)",
              badge: "VI-HUB-BAY01",
              rating: 5.0,
              trips: 0,
              phone: "+234 814 031 3381",
              tags: ["Dedicated VIP Bay 01", "Vehicle Pre-inspected"],
            }
          : d && d.full_name
            ? {
                name: d.full_name,
                badge: d.badge_number || "CHAUFFEUR #104",
                rating: d.rating || 5.0,
                trips: d.total_trips || 140,
                phone: d.phone || "+234 814 031 3381",
                tags: ["Vetted & Certified", "Discreet & Professional"],
              }
            : {
                name: "Chauffeur Allocation In Progress",
                badge: "ALLOCATION PENDING",
                rating: 5.0,
                trips: 0,
                phone: "+234 814 031 3381",
                tags: ["72-Point Inspection", "Vetted Chauffeur Network"],
              },
        itinerary: {
          pickupDate: dbBooking.pickup_datetime
            ? new Date(dbBooking.pickup_datetime).toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
              }) + " WAT"
            : "Scheduled Charter Commencement",
          returnDate: dbBooking.dropoff_datetime
            ? new Date(dbBooking.dropoff_datetime).toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
              }) + " WAT"
            : "Charter Return Scheduled",
          duration: "Full Term Reserved",
          pickupLocation:
            dbBooking.pickup_location || "La Planta Flagship Hub (Victoria Island)",
          pickupAddress:
            dbBooking.pickup_location || "Plot 14 Victoria Island Boulevard, Lagos",
          flightNumber: dbBooking.flight_number || undefined,
          flightRoute: dbBooking.flight_terminal || "MMIA Terminal 2",
          flightStatus: dbBooking.flight_number ? "Tracked Ground Connection" : undefined,
        },
      };
    } else {
      // Elegant fallback for preview / demo reservations like LP-LOS-77974
      bookingData = {
        bookingCode: code,
        reference: `LP_${code}_REF`,
        verificationPin: `${code.replace(/\D/g, "").slice(-4) || "7974"}-09`,
        serviceTier: "Executive First Class",
        amountFormatted: "₦4,950,000",
        customerName: "Showole (Executive VIP Member)",
        customerPhone: "+234 814 031 3381",
        customerEmail: "vip@laplanta.ng",
        handoverProtocol: "Flagship Hub Pickup",
        vehicle: {
          name: "Land Rover Autobiography LWB",
          category: "Executive SUV",
          year: 2024,
          color: "Santorini Black",
          licensePlate: "LAG-892-XZ",
        },
        driver: {
          name: "Hub Operations Specialist",
          badge: "VI-HUB-BAY01",
          rating: 5.0,
          trips: 340,
          phone: "+234 814 031 3381",
          tags: ["72-Point Inspection", "VIP Valet Bay 01"],
        },
        itinerary: {
          pickupDate: "Scheduled Charter Commencement • 10:00 AM WAT",
          returnDate: "Scheduled Full-Term Return",
          duration: "11 Days Reserved",
          pickupLocation: "La Planta Flagship Hub (Victoria Island)",
          pickupAddress: "Plot 14 Victoria Island Boulevard, Lagos",
        },
      };
    }

    const handoverInspectionUrl = `${origin}/handover-inspection?code=${bookingData.bookingCode}&pin=${bookingData.verificationPin}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
      handoverInspectionUrl
    )}`;

    // Generate the PDF Buffer via @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      React.createElement(VIPPassPDFDocument, {
        booking: bookingData,
        qrCodeUrl,
      }) as any
    );

    // Return direct binary PDF stream
    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="LaPlanta_VIP_Pass_${code}.pdf"`,
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (err: any) {
    console.error("[PDF Route] Failed to generate PDF pass:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF pass", details: err?.message },
      { status: 500 }
    );
  }
}
