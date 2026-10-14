import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#080b10",
    color: "#f3f4f6",
    fontFamily: "Helvetica",
    padding: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#d4af37",
    paddingBottom: 14,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: "#000000",
    borderWidth: 1.5,
    borderColor: "#d4af37",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#d4af37",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: "#d4af37",
    fontSize: 8,
    letterSpacing: 2,
    marginTop: 2,
  },
  passBadge: {
    backgroundColor: "#161d29",
    borderWidth: 1,
    borderColor: "#d4af37",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "flex-end",
  },
  passBadgeText: {
    color: "#fedeb2",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  passBadgeCode: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#101520",
    borderWidth: 1,
    borderColor: "#222c3d",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1d2636",
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#d4af37",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardSubtitle: {
    color: "#9ca3af",
    fontSize: 8,
  },
  qrSection: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  qrBox: {
    width: 120,
    height: 120,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: 108,
    height: 108,
  },
  qrInfo: {
    flex: 1,
  },
  pinContainer: {
    backgroundColor: "#18202e",
    borderWidth: 1,
    borderColor: "#d4af37",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinLabel: {
    color: "#d4af37",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  pinValue: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  instructionText: {
    color: "#9ca3af",
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  statusText: {
    color: "#10b981",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  colHalf: {
    flex: 1,
    backgroundColor: "#101520",
    borderWidth: 1,
    borderColor: "#222c3d",
    borderRadius: 10,
    padding: 14,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  fieldLabel: {
    color: "#6b7280",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  fieldValue: {
    color: "#ffffff",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  fieldValueSub: {
    color: "#fedeb2",
    fontSize: 8,
    marginTop: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tagPill: {
    backgroundColor: "#1a2232",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#273449",
  },
  tagText: {
    color: "#9ca3af",
    fontSize: 6.5,
  },
  footer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1d2636",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    color: "#6b7280",
    fontSize: 7,
  },
  footerHotline: {
    color: "#d4af37",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
});

export interface VIPPassPDFProps {
  booking: {
    bookingCode: string;
    reference: string;
    verificationPin: string;
    serviceTier: string;
    amountFormatted: string;
    customerName: string;
    customerPhone?: string;
    handoverProtocol: string;
    vehicle: {
      name: string;
      category: string;
      year: number;
      color: string;
      licensePlate: string;
    };
    driver: {
      name: string;
      badge: string;
      rating: number;
      trips: number;
      phone: string;
      tags: string[];
    };
    itinerary: {
      pickupDate: string;
      returnDate: string;
      duration: string;
      pickupLocation: string;
      pickupAddress: string;
      flightNumber: string;
      flightRoute: string;
      flightStatus: string;
    };
  };
  qrCodeUrl: string;
}

export function VIPPassPDFDocument({ booking, qrCodeUrl }: VIPPassPDFProps) {
  return (
    <Document title={`LaPlanta_VIP_Pass_${booking.bookingCode}`} author="La Planta Prime">
      <Page size="A4" style={styles.page}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>LP</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>LA PLANTA PRIME</Text>
              <Text style={styles.brandSubtitle}>EXECUTIVE CHAUFFEUR &amp; VIP HANDOVER PASS</Text>
            </View>
          </View>
          <View style={styles.passBadge}>
            <Text style={styles.passBadgeText}>SEC-256 BOARDING TOKEN</Text>
            <Text style={styles.passBadgeCode}>#{booking.bookingCode}</Text>
          </View>
        </View>

        {/* Main Digital QR Handover Voucher Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Digital Handover Voucher</Text>
            <Text style={styles.cardSubtitle}>{booking.handoverProtocol}</Text>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <Image src={qrCodeUrl} style={styles.qrImage} />
            </View>
            <View style={styles.qrInfo}>
              <View style={styles.pinContainer}>
                <Text style={styles.pinLabel}>VERIFICATION PIN</Text>
                <Text style={styles.pinValue}>{booking.verificationPin}</Text>
              </View>

              <Text style={styles.instructionText}>
                Present this scannable QR voucher or reference PIN #{booking.bookingCode} upon arrival at
                the hotel valet forecourt or airport private terminal. Your assigned executive chauffeur will
                authenticate this token to initiate your itinerary.
              </Text>

              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  Payment Settled (100% Upfront) • {booking.serviceTier}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Two-Column Grid: Vehicle Asset & Chauffeur Profile */}
        <View style={styles.twoCol}>
          {/* Designated Fleet Vehicle */}
          <View style={styles.colHalf}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Designated Fleet Asset</Text>
              <Text style={styles.cardSubtitle}>First Class Spec</Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Automobile Model</Text>
              <Text style={styles.fieldValue}>{booking.vehicle.name}</Text>
              <Text style={styles.fieldValueSub}>
                Model Year {booking.vehicle.year} • {booking.vehicle.category}
              </Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Exterior Specification &amp; Plate</Text>
              <Text style={styles.fieldValue}>
                {booking.vehicle.color} • {booking.vehicle.licensePlate}
              </Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>In-Cabin Amenities</Text>
              <Text style={styles.instructionText}>
                Starlink Wi-Fi • Chilled Refreshment Bar • Acoustic Privacy Glazing • Massaging Executive Recliners
              </Text>
            </View>
          </View>

          {/* Assigned Executive Chauffeur */}
          <View style={styles.colHalf}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Assigned Chauffeur</Text>
              <Text style={styles.cardSubtitle}>{booking.driver.badge}</Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Professional Driver</Text>
              <Text style={styles.fieldValue}>{booking.driver.name}</Text>
              <Text style={styles.fieldValueSub}>
                Rating: {booking.driver.rating} ★ ({booking.driver.trips}+ verified VIP charters)
              </Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Chauffeur Direct Contact</Text>
              <Text style={styles.fieldValue}>{booking.driver.phone}</Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Vetted Certifications</Text>
              <View style={styles.tagRow}>
                {booking.driver.tags.slice(0, 3).map((tag, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Trip Logistics & Handover Itinerary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Itinerary &amp; Handover Schedule</Text>
            <Text style={styles.cardSubtitle}>Charter Duration: {booking.itinerary.duration}</Text>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Commencement Schedule</Text>
                <Text style={styles.fieldValue}>{booking.itinerary.pickupDate}</Text>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Handover Destination</Text>
                <Text style={styles.fieldValue}>{booking.itinerary.pickupLocation}</Text>
                <Text style={styles.instructionText}>{booking.itinerary.pickupAddress}</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Return Schedule</Text>
                <Text style={styles.fieldValue}>{booking.itinerary.returnDate}</Text>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Flight Arrival Connection</Text>
                <Text style={styles.fieldValue}>
                  {booking.itinerary.flightNumber} ({booking.itinerary.flightRoute})
                </Text>
                <Text style={{ ...styles.instructionText, color: "#10b981" }}>
                  {booking.itinerary.flightStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            La Planta Prime Luxury Fleet Limited • 24/7 VIP Concierge Services
          </Text>
          <Text style={styles.footerHotline}>Direct Concierge: +234 1 888 5275</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Client-Side Trigger to generate and download the luxury PDF
 */
export async function downloadVIPPassPDF(booking: VIPPassPDFProps["booking"]) {
  if (typeof window === "undefined") return;

  const { pdf } = await import("@react-pdf/renderer");

  // Construct absolute QR code URL for the PDF
  const origin = window.location.origin || "https://laplantaprime.com";
  const handoverInspectionUrl = `${origin}/handover-inspection?code=${booking.bookingCode}&pin=${booking.verificationPin}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
    handoverInspectionUrl
  )}`;

  const doc = <VIPPassPDFDocument booking={booking} qrCodeUrl={qrCodeUrl} />;
  const blob = await pdf(doc).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LaPlanta_VIP_Pass_${booking.bookingCode}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

