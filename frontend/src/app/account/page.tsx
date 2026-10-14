"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/context/auth-context";
import { backendApi } from "@/lib/api";

interface InvoiceData {
  id: string;
  vehicle: string;
  dates: string;
  amount: string;
  paymentMethod: string;
  corridor: string;
  serviceType: string;
}

export default function AccountPage() {
  const { user, session, logout, openAuthModal, updateProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState<
    "active" | "history" | "settings"
  >("active");
  const [backendStatus, setBackendStatus] = useState<string>("connecting");

  // Selected invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null,
  );

  // Amend itinerary modal state (legacy support)
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [amendSuccess, setAmendSuccess] = useState(false);

  // Dedicated Guest Cancellation & Extension Request States
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  // Cancellation Form
  const [cancellationReason, setCancellationReason] = useState(
    "Corporate schedule change / Board meeting rescheduled"
  );
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [refundBank, setRefundBank] = useState("Zenith Bank Plc");
  const [refundAccount, setRefundAccount] = useState("1029384756");
  const [refundAccountName, setRefundAccountName] = useState(
    user?.name || "Dr. Adekunle Balogun"
  );
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [cancellationSuccessMsg, setCancellationSuccessMsg] = useState<string | null>(null);

  // Extension Form
  const [extensionDays, setExtensionDays] = useState(2);
  const [newReturnDate, setNewReturnDate] = useState("Nov 19, 2024 (18:00 WAT)");
  const [extensionReason, setExtensionReason] = useState(
    "Executive meetings extended in Victoria Island"
  );
  const [extensionNotes, setExtensionNotes] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
  const [extensionSuccessMsg, setExtensionSuccessMsg] = useState<string | null>(null);

  // Profile edit state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileTier, setProfileTier] = useState(user?.vipTier || "Member");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(
    null,
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Quick inline phone capture for Google Sign-In users
  const [inlinePhone, setInlinePhone] = useState("");
  const [isSavingInlinePhone, setIsSavingInlinePhone] = useState(false);
  const [inlinePhoneMsg, setInlinePhoneMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isDemoUser = Boolean(
    user &&
    (user.email === "a.balogun@executivecorp.ng" ||
      user.id === "00000000-0000-0000-0000-000000000002"),
  );

  // Update form fields when user logs in/changes & verify backend status
  React.useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfilePhone(user.phone || "");
      setProfileTier(user.vipTier || "Member");
    }

    // Ping standalone Express backend (Port 4000)
    backendApi.getHealth().then((res) => {
      setBackendStatus(res?.status === "ok" ? "online" : "offline");
    });

    if (session?.access_token) {
      backendApi.getAuthProfile(session.access_token).then((profileRes) => {
        if (profileRes?.success) {
          console.log(
            "[Account] Verified with standalone backend:",
            profileRes.user,
          );
        }
      });
    }

    // Sync guest booking request from localStorage or backend
    try {
      const stored = localStorage.getItem("laplanta_active_request_LP-8842");
      if (stored) {
        setActiveRequest(JSON.parse(stored));
      }
    } catch {}

    backendApi.getBookingRequests().then((res) => {
      if (res?.success && res.requests) {
        const found = res.requests.find(
          (r: any) =>
            r.bookingCode === "#LP-8842" || r.bookingCode === "LP-8842",
        );
        if (found) {
          setActiveRequest(found);
          try {
            localStorage.setItem(
              "laplanta_active_request_LP-8842",
              JSON.stringify(found),
            );
          } catch {}
        }
      }
    });
  }, [user, session]);

  const handleSubmitCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCancellation(true);
    setCancellationSuccessMsg(null);

    const payload = {
      bookingCode: "#LP-8842",
      vehicleName: "Range Rover Autobiography LWB",
      guestName: user?.name || "Dr. Adekunle Balogun",
      guestEmail: user?.email || "a.balogun@executivecorp.ng",
      guestPhone: user?.phone || "+234 802 345 6789",
      vipTier: user?.vipTier || "VIP Executive",
      type: "cancellation",
      reason: cancellationReason,
      refundBank,
      refundAccount,
      refundAccountName,
      refundAmount: 1350000,
      refundAmountFormatted: "₦1,350,000",
      notes:
        cancellationNotes ||
        "Client requests cancellation with manual wire refund to primary bank.",
    };

    const res = await backendApi.submitBookingRequest(payload);
    setIsSubmittingCancellation(false);

    const requestObj = res?.request || {
      ...payload,
      id: `req-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setActiveRequest(requestObj);
    try {
      localStorage.setItem(
        "laplanta_active_request_LP-8842",
        JSON.stringify(requestObj),
      );
    } catch {}

    setCancellationSuccessMsg(
      "Cancellation request dispatched! Our concierge desk will call you within 15 minutes to confirm and process your manual refund.",
    );
    setTimeout(() => {
      setIsCancellationModalOpen(false);
      setCancellationSuccessMsg(null);
    }, 2800);
  };

  const handleSubmitExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingExtension(true);
    setExtensionSuccessMsg(null);

    const payload = {
      bookingCode: "#LP-8842",
      vehicleName: "Range Rover Autobiography LWB",
      guestName: user?.name || "Dr. Adekunle Balogun",
      guestEmail: user?.email || "a.balogun@executivecorp.ng",
      guestPhone: user?.phone || "+234 802 345 6789",
      vipTier: user?.vipTier || "VIP Executive",
      type: "extension",
      extraDays: extensionDays,
      newReturnDate,
      reason: extensionReason,
      notes:
        extensionNotes ||
        `Requesting extension of ${extensionDays} extra day(s).`,
    };

    const res = await backendApi.submitBookingRequest(payload);
    setIsSubmittingExtension(false);

    const requestObj = res?.request || {
      ...payload,
      id: `req-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setActiveRequest(requestObj);
    try {
      localStorage.setItem(
        "laplanta_active_request_LP-8842",
        JSON.stringify(requestObj),
      );
    } catch {}

    setExtensionSuccessMsg(
      `Extension request (+${extensionDays} days) dispatched to operations desk! A concierge will confirm within 15 minutes.`,
    );
    setTimeout(() => {
      setIsExtensionModalOpen(false);
      setExtensionSuccessMsg(null);
    }, 2800);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileUpdateError(null);
    const res = await updateProfile({
      full_name: profileName,
      phone: profilePhone,
    });
    setIsSavingProfile(false);
    if (res.success) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } else {
      setProfileUpdateError(res.error || "Failed to update profile.");
    }
  };

  const handleSaveInlinePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePhone.trim()) {
      setInlinePhoneMsg({
        type: "error",
        text: "Please enter a valid phone number.",
      });
      return;
    }
    setIsSavingInlinePhone(true);
    setInlinePhoneMsg(null);
    const res = await updateProfile({ phone: inlinePhone.trim() });
    setIsSavingInlinePhone(false);
    if (res.success) {
      setInlinePhoneMsg({
        type: "success",
        text: "Phone number saved! Chauffeur dispatch records updated.",
      });
    } else {
      setInlinePhoneMsg({
        type: "error",
        text: res.error || "Failed to save phone number.",
      });
    }
  };

  const pastInvoices: InvoiceData[] = [
    {
      id: "LP-7940",
      vehicle: "Mercedes-Benz S580 Executive",
      dates: "Oct 12 – 15, 2024",
      amount: "₦1,350,000",
      paymentMethod: "Corporate Visa •••• 4102",
      corridor: "Lagos VI & Lekki Phase 1 Corridor",
      serviceType: "Dedicated Chauffeur Driven",
    },
    {
      id: "LP-7412",
      vehicle: "Toyota Land Cruiser 300 VXR",
      dates: "Aug 22 – 26, 2024",
      amount: "₦2,320,000",
      paymentMethod: "Corporate Visa •••• 4102",
      corridor: "Abuja FCT & Nnamdi Azikiwe Int. Airport",
      serviceType: "Executive SUV + Security Protocol",
    },
    {
      id: "LP-6890",
      vehicle: "Mercedes-Maybach GLS 600",
      dates: "June 10 – 12, 2024",
      amount: "₦1,700,000",
      paymentMethod: "Direct Corporate Wire",
      corridor: "Lagos Eko Atlantic & Marina",
      serviceType: "VIP Protocol Escort",
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="w-full pt-16 lg:pt-20 bg-surface flex-1">
        {/* TOP PROFILE BANNER */}
        <section className="w-full bg-surface-container-lowest shadow-sm border-b border-black/[0.04] py-8 lg:py-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {/* Action Required: Inline Phone Number Prompt for Users Without Phone */}
            {user && !user.phone && (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-primary">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        phone_iphone
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-primary">
                          Contact Phone Number Required for Chauffeur Dispatch
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                          Action Needed
                        </span>
                      </div>
                    </div>
                  </div>
                  <form
                    onSubmit={handleSaveInlinePhone}
                    className="flex items-center gap-2 w-full md:w-auto shrink-0"
                  >
                    <input
                      type="tel"
                      required
                      value={inlinePhone}
                      onChange={(e) => setInlinePhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-amber-500/40 text-xs font-mono text-primary focus:outline-none focus:border-secondary w-full md:w-48 shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={isSavingInlinePhone}
                      className="h-10 px-4 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm shrink-0 disabled:opacity-50"
                    >
                      {isSavingInlinePhone ? "Saving..." : "Save Phone"}
                    </button>
                  </form>
                </div>
                {inlinePhoneMsg && (
                  <div
                    className={`mt-3 text-xs font-medium ${
                      inlinePhoneMsg.type === "success"
                        ? "text-emerald-700"
                        : "text-destructive"
                    }`}
                  >
                    {inlinePhoneMsg.text}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Profile Info */}
              <div className="flex items-start sm:items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-md bg-surface-container border-2 border-secondary/20 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img
                        alt={user ? user.name : "Guest Profile"}
                        className="w-full h-full object-cover"
                        src={user.avatarUrl}
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center font-serif text-2xl font-bold text-primary">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-secondary-fixed shadow-sm">
                    <span className="material-symbols-outlined text-sm font-bold">
                      {isDemoUser ? "workspace_premium" : "verified"}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-serif text-2xl sm:text-3xl text-primary font-semibold tracking-tight">
                      {user ? user.name : "Guest Client"}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold uppercase tracking-wider">
                      {user?.vipTier || "Member"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        phone_iphone
                      </span>
                      {user?.phone ? (
                        <span className="font-mono">{user.phone}</span>
                      ) : (
                        <span className="italic text-on-surface-variant/70">
                          No phone added yet
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        mail
                      </span>
                      {user?.email || "No email on record"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-secondary">
                        key
                      </span>
                      Booking PIN:{" "}
                      <strong className="text-primary font-semibold font-mono">
                        {isDemoUser ? "#LP-8910" : "—"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 bg-surface-container-low/80 rounded-xl p-4 border border-black/[0.02]">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  Booking Status
                </span>
                <span className="text-sm font-semibold text-primary mt-0.5">
                  {isDemoUser ? "Active & Confirmed" : "—"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  Rental Days
                </span>
                <span className="text-sm font-semibold text-primary mt-0.5">
                  {isDemoUser ? "18 Days (Annual)" : "0 Days"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  Chauffeur Protocol
                </span>
                <span className="text-sm font-semibold text-primary mt-0.5">
                  {isDemoUser
                    ? "Dedicated Professional Driver"
                    : "None Assigned"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  Billing Type
                </span>
                <span className="text-sm font-semibold text-primary mt-0.5">
                  {isDemoUser ? "Corporate Account" : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SUB-TABS NAVIGATION BAR */}
        <section className="w-full bg-surface-container-lowest border-b border-black/[0.04] sticky top-20 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-8 overflow-x-auto">
              <button
                onClick={() => setCurrentTab("active")}
                className={`relative py-4 text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-colors ${
                  currentTab === "active"
                    ? "text-primary border-b-2 border-secondary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
                type="button"
              >
                <span>Active Reservations</span>
                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                  {isDemoUser ? 1 : 0}
                </span>
              </button>
              <button
                onClick={() => setCurrentTab("history")}
                className={`relative py-4 text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-colors ${
                  currentTab === "history"
                    ? "text-primary border-b-2 border-secondary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
                type="button"
              >
                <span>Past Trips &amp; Invoices</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-[10px] font-bold">
                  {isDemoUser ? 3 : 0}
                </span>
              </button>
              <button
                onClick={() => setCurrentTab("settings")}
                className={`relative py-4 text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-colors ${
                  currentTab === "settings"
                    ? "text-primary border-b-2 border-secondary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
                type="button"
              >
                <span>Profile Settings</span>
              </button>
            </div>
          </div>
        </section>

        {/* MAIN TAB CONTENT CONTAINER */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col gap-10">
          {/* TAB 1: ACTIVE RESERVATION */}
          {currentTab === "active" && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                    Active Itinerary
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-primary font-semibold">
                    Current Booking Overview
                  </h2>
                </div>
                {isDemoUser ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Chauffeur En Route for Handover</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>No Active Charters</span>
                  </div>
                )}
              </div>

              {isDemoUser ? (
                <>
                  {/* Dedicated En Route Live Telematics Corridor Banner */}
                  <div className="bg-gradient-to-r from-primary to-primary-container text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0 shadow-md">
                        <span className="material-symbols-outlined text-2xl animate-pulse">
                          satellite_alt
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-widest text-secondary-fixed font-bold">
                            En Route Vehicle Telematics
                          </span>
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-semibold text-white mt-0.5">
                          Range Rover Autobiography (LAG-892-XZ) is En Route
                        </h3>
                        <p className="text-xs text-white/70 font-mono mt-0.5">
                          Falomo Corridor • ETA ~17 mins (42 km/h) • Driver:
                          Emmanuel Okafor
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/live-tracking"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">
                        share_location
                      </span>
                      Track En Route Car (Live GPS) →
                    </Link>
                  </div>

                  {/* Active Booking Card */}
                  <div className="bg-surface-container-lowest rounded-2xl shadow-md border border-black/[0.04] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      {/* Left Column: Vehicle Visual */}
                      <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full bg-surface-container-low overflow-hidden">
                        <img
                          className="w-full h-full object-cover"
                          alt="Range Rover Autobiography"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcqGOlPZMKFl70boZOu8PPIDsdxhTW7sdwCr6DSVuoLgp3YwwEEDjLLxlyDOmusr14Y3CeEam6DK0JRk0cJNJFZfQ56ZTkKh_fA3UV6MXIPVouopev5KZxTZcw2mebDCtV_wBoyHSNMNQLp-4bZRCbV3hhpeAEC2IKlX6uhHAaoQthX6KUKEHFayR71dIBtAFRv_B4CO-KdbvPoDlPnt8uHWgh5egRV3yOo1_HhPEU9gTraL34BcJa"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-primary-container/90 text-white text-xs font-semibold backdrop-blur-md">
                            Executive SUV Class
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-secondary text-white text-xs font-semibold backdrop-blur-md">
                            VIP Protocol Ready
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <span className="text-[11px] uppercase tracking-widest text-secondary-fixed font-semibold">
                            Assigned Vehicle
                          </span>
                          <Link
                            href="/vehicle-details"
                            className="hover:underline block"
                          >
                            <h3 className="font-serif text-xl sm:text-2xl text-white font-semibold leading-tight">
                              Range Rover Autobiography LWB
                            </h3>
                          </Link>
                          <p className="text-xs text-[#c8c6c5] mt-0.5">
                            Plate: LAG-892-XZ • Executive Rear Cabin
                          </p>
                        </div>
                      </div>

                      {/* Right Column: Route & Chauffeur Details */}
                      <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-black/[0.04]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                                RESERVATION
                              </span>
                              <span className="text-lg font-mono text-primary font-bold">
                                #LP-8842
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-xs text-primary font-medium">
                              <span className="material-symbols-outlined text-sm text-secondary">
                                flight_land
                              </span>
                              LOS Airport VIP Protocol
                            </div>
                          </div>

                          {/* Real-time Concierge Request Alert Banners */}
                          {activeRequest &&
                            activeRequest.status === "pending" &&
                            activeRequest.type === "cancellation" && (
                              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3 text-xs animate-in fade-in duration-200">
                                <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
                                  pending_actions
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between font-semibold text-amber-950">
                                    <span>
                                      Cancellation Requested • Under Concierge Review
                                    </span>
                                    <span className="text-[10px] font-mono uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold">
                                      Pending Verification
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-amber-900/85 mt-1 leading-relaxed">
                                    Reason: &ldquo;{activeRequest.reason}&rdquo;.
                                    Our executive operations director is reviewing
                                    your itinerary. A concierge will call{" "}
                                    <strong className="font-mono">
                                      {activeRequest.guestPhone ||
                                        user?.phone ||
                                        "+234 802 345 6789"}
                                    </strong>{" "}
                                    shortly to confirm your manual wire refund of{" "}
                                    <strong className="text-amber-950 font-bold">
                                      {activeRequest.refundAmountFormatted ||
                                        "₦1,350,000"}
                                    </strong>{" "}
                                    to{" "}
                                    {activeRequest.refundBank || "your bank"}.
                                  </p>
                                </div>
                              </div>
                            )}

                          {activeRequest &&
                            activeRequest.status === "pending" &&
                            activeRequest.type === "extension" && (
                              <div className="mt-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-900 flex items-start gap-3 text-xs animate-in fade-in duration-200">
                                <span className="material-symbols-outlined text-blue-600 text-lg shrink-0 mt-0.5">
                                  update
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between font-semibold text-blue-950">
                                    <span>
                                      Extension Requested (+
                                      {activeRequest.extraDays} Days) • Pending Review
                                    </span>
                                    <span className="text-[10px] font-mono uppercase bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded font-bold">
                                      In Operations Queue
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-blue-900/85 mt-1 leading-relaxed">
                                    Requested Return:{" "}
                                    <strong className="text-blue-950">
                                      {activeRequest.newReturnDate}
                                    </strong>
                                    . Chauffeur roster &amp; corridor telematics
                                    allocation are being verified by the operations desk.
                                  </p>
                                </div>
                              </div>
                            )}

                          {activeRequest &&
                            activeRequest.status === "refunded_and_cancelled" && (
                              <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 flex items-start gap-3 text-xs animate-in fade-in duration-200">
                                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">
                                  check_circle
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between font-semibold text-emerald-950">
                                    <span>
                                      Charter Cancelled &amp; Refund Dispatched
                                    </span>
                                    <span className="text-[10px] font-mono uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold">
                                      Refund Settled
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-emerald-900/85 mt-1 leading-relaxed">
                                    Manual wire refund of{" "}
                                    <strong>
                                      {activeRequest.refundAmountFormatted ||
                                        "₦1,350,000"}
                                    </strong>{" "}
                                    has been processed to{" "}
                                    {activeRequest.refundBank || "your account"}.
                                    Confirmation receipt has been sent to your
                                    email.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Route Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 bg-surface-container-low/70 rounded-xl p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                                Rental Period
                              </span>
                              <span className="text-sm text-primary font-semibold">
                                Nov 14 – Nov 17, 2024
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                4 Days Executive Hire
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                                Delivery Destination
                              </span>
                              <span className="text-sm text-primary font-semibold">
                                The Wheatbaker Ikoyi
                              </span>
                              <span className="text-xs text-on-surface-variant">
                                4 Onitolo Rd, Ikoyi, Lagos
                              </span>
                            </div>
                          </div>

                          {/* Assigned Driver Card */}
                          <div className="flex items-center justify-between gap-4 p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-black/[0.04]">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container shrink-0">
                                <img
                                  className="w-full h-full object-cover"
                                  alt="Driver Emmanuel Okafor"
                                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZP6guV8VQUcpcoXuyQdctvwhwtwGoK5vA5kU8f0hi35_3Lj30r1A69H3EZUCkJbGPkialrd4TKt6bpq6X2E0Q87cDtg431RWkhEqDtgSOP7z_JHwqtua3Uu04Ye4LJvVVfulcXyOyntrW5lU45BRMlkyXkcoJgmqDfmcJGilhjeO2GPKhGkhC8JaK4WbGf8gUhegn2sfMY09E2-u3xUsbILUO8DUzT-gkw2gqeU0GHj1AxDyI3GW8"
                                />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-primary">
                                    Emmanuel Okafor
                                  </span>
                                  <span className="material-symbols-outlined text-sm text-secondary">
                                    verified_user
                                  </span>
                                </div>
                                <span className="text-xs text-on-surface-variant">
                                  Defensive Driving Certified • 11 Yrs
                                  Experience
                                </span>
                              </div>
                            </div>
                            <div className="hidden sm:flex flex-col text-right">
                              <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
                                Driver Phone
                              </span>
                              <span className="text-xs text-primary font-semibold font-mono">
                                +234 1 888 5275
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <Link
                            href="/reservation-pass"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary hover:bg-secondary text-white transition-all text-xs uppercase tracking-wider font-semibold shadow-md"
                          >
                            <span className="material-symbols-outlined text-base">
                              qr_code_scanner
                            </span>
                            Open QR Handover Pass
                          </Link>
                          <Link
                            href="/live-tracking"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-surface-container-high hover:bg-secondary-fixed hover:text-on-secondary-fixed text-primary transition-all text-xs uppercase tracking-wider font-semibold"
                          >
                            <span className="material-symbols-outlined text-base text-secondary">
                              share_location
                            </span>
                            Track Delivery (Live GPS)
                          </Link>
                          <button
                            onClick={() => setIsExtensionModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary transition-all text-xs uppercase tracking-wider font-semibold border border-black/[0.04]"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base text-secondary">
                              update
                            </span>
                            Request Extension
                          </button>
                          <button
                            onClick={() => setIsCancellationModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 transition-all text-xs uppercase tracking-wider font-semibold border border-red-200"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base text-red-600">
                              event_busy
                            </span>
                            Request Cancellation
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Clean Zero-State Card for New / Real Users */
                <div className="bg-surface-container-lowest rounded-2xl p-10 sm:p-14 text-center border border-black/[0.04] shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-5">
                  <div className="w-20 h-20 rounded-full bg-surface-container-low text-secondary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-4xl">
                      directions_car
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 max-w-md">
                    <h3 className="font-serif text-2xl text-primary font-semibold">
                      No Active Charters or Vehicles En Route
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      You do not have any vehicle reservations scheduled right
                      now. When you book a luxury charter, live GPS tracking,
                      telematics corridor status, and chauffeur protocols will
                      appear here.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/fleet"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-semibold transition-all shadow-md active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">
                        car_rental
                      </span>
                      Browse Fleet Catalog &amp; Book →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAST TRIPS & INVOICES */}
          {currentTab === "history" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                    Historical Itineraries
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-primary font-semibold">
                    Past Trips &amp; Audited Invoices
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {isDemoUser
                      ? "3 Total Completed Charters"
                      : "0 Total Completed Charters"}
                  </span>
                </div>
              </div>

              {isDemoUser ? (
                /* Table */
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-black/[0.04] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-low/80 text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold border-b border-black/[0.04]">
                          <th className="py-4 px-6">Vehicle &amp; Service</th>
                          <th className="py-4 px-6">
                            Rental Dates &amp; Corridor
                          </th>
                          <th className="py-4 px-6">Service Type</th>
                          <th className="py-4 px-6 text-right">Total Paid</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {pastInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="hover:bg-surface-container-low/40 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-primary">
                                  {inv.vehicle}
                                </span>
                                <span className="text-xs text-on-surface-variant">
                                  Booking Ref #{inv.id}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-primary">
                                  {inv.dates}
                                </span>
                                <span className="text-xs text-on-surface-variant">
                                  {inv.corridor}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                                <span className="material-symbols-outlined text-xs">
                                  directions_car
                                </span>
                                {inv.serviceType}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-sm font-bold text-primary block">
                                {inv.amount}
                              </span>
                              <span className="text-[11px] text-secondary font-medium">
                                {inv.paymentMethod}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-secondary hover:text-white text-primary text-xs font-semibold transition-colors"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    receipt_long
                                  </span>
                                  Invoice
                                </button>
                                <Link
                                  href="/fleet"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    replay
                                  </span>
                                  Re-Book
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Clean Zero-State Card for Real Users */
                <div className="bg-surface-container-lowest rounded-2xl p-10 sm:p-14 text-center border border-black/[0.04] shadow-sm flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-5">
                  <div className="w-20 h-20 rounded-full bg-surface-container-low text-secondary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-4xl">
                      receipt_long
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 max-w-md">
                    <h3 className="font-serif text-2xl text-primary font-semibold">
                      No Past Trips or Invoices Yet
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Once you complete an executive charter, all your trip
                      logs, audited VAT receipts, payment vouchers, and digital
                      handover inspection certificates will be securely archived
                      here.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/fleet"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface-container-high hover:bg-secondary hover:text-white text-primary text-xs uppercase tracking-wider font-semibold transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">
                        explore
                      </span>
                      Explore Fleet Catalog
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {currentTab === "settings" && (
            <div className="flex flex-col gap-8 max-w-3xl animate-in fade-in duration-200">
              <div>
                <span className="text-xs uppercase tracking-wider text-secondary font-semibold">
                  Executive Preferences
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-primary font-semibold">
                  Profile &amp; Executive Preferences
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Manage your personal details, contact phone for chauffeur
                  dispatch, and VIP account details.
                </p>
              </div>

              {profileSaved && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">
                    check_circle
                  </span>
                  <span className="font-semibold">
                    Your profile details have been saved successfully to your
                    account!
                  </span>
                </div>
              )}

              {profileUpdateError && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  <span>{profileUpdateError}</span>
                </div>
              )}

              <form
                onSubmit={handleSaveProfile}
                className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm border border-black/[0.04] flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Adekunle Balogun"
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:outline-none focus:border-secondary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={profileEmail}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container text-on-surface-variant text-sm border border-surface-container cursor-not-allowed opacity-80"
                    />
                    <span className="text-[10px] text-on-surface-variant">
                      Primary authentication identity
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      WhatsApp / Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-surface-container focus:outline-none focus:border-secondary font-mono"
                    />
                    <span className="text-[10px] text-secondary font-medium">
                      Required for chauffeur dispatch &amp; arrival SMS
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/[0.04] flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-semibold transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSavingProfile ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* BOTTOM PREFERENCES & ASSISTANCE SECTION */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Card 1: Primary Hub */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-black/[0.04] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Preferred Pickup Hub
                  </span>
                  <span className="material-symbols-outlined text-secondary text-lg">
                    apartment
                  </span>
                </div>
                <h3 className="font-serif text-lg text-primary font-semibold mb-1">
                  {isDemoUser
                    ? "The Wings Towers"
                    : "Default Hub: Pending Booking"}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isDemoUser
                    ? "Ozumba Mbadiwe Ave, Victoria Island, Lagos"
                    : "Select your delivery hub during vehicle checkout"}
                </p>
                <div className="mt-4 bg-surface-container-low rounded-xl p-3 flex flex-col gap-1 text-xs">
                  <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">
                    Access Details
                  </span>
                  <span className="text-on-surface">
                    {isDemoUser
                      ? "Tower A Valet Forecourt & VIP Reception"
                      : "VIP Airport Gate or Hotel Concierge Valet"}
                  </span>
                </div>
              </div>
              <Link
                href="/fleet"
                className="mt-6 inline-flex items-center justify-between w-full text-xs font-semibold text-primary hover:text-secondary transition-colors"
              >
                <span>
                  {isDemoUser ? "Manage Pickup Hubs" : "Book with Hub Delivery"}
                </span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Card 2: Corporate Billing */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-black/[0.04] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Active Payment Method
                  </span>
                  <span className="material-symbols-outlined text-secondary text-lg">
                    credit_card
                  </span>
                </div>
                <h3 className="font-serif text-lg text-primary font-semibold mb-1">
                  {isDemoUser
                    ? "Corporate Visa •••• 4102"
                    : "No Saved Payment Method"}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isDemoUser
                    ? "Direct Corporate Account Billing"
                    : "100% upfront secure payment per charter"}
                </p>
                <div className="mt-4 bg-surface-container-low rounded-xl p-3 flex flex-col gap-1 text-xs">
                  <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">
                    Billing Contact
                  </span>
                  <span className="text-on-surface">
                    {isDemoUser
                      ? "Finance Desk / Executive Holdings PLC"
                      : user?.email || "Personal Client Billing"}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  setCurrentTab(isDemoUser ? "history" : "settings")
                }
                className="mt-6 inline-flex items-center justify-between w-full text-xs font-semibold text-primary hover:text-secondary transition-colors"
                type="button"
              >
                <span>
                  {isDemoUser
                    ? "View Audited Invoices"
                    : "Manage Account Profile"}
                </span>
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Card 3: Dedicated Support Liaison */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-black/[0.04] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Executive Support Desk
                  </span>
                  <span className="material-symbols-outlined text-secondary text-lg">
                    support_agent
                  </span>
                </div>
                <h3 className="font-serif text-lg text-primary font-semibold mb-1">
                  Miss Clara Danjuma
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Senior Client Relationship Liaison
                </p>
                <div className="mt-4 bg-surface-container-low rounded-xl p-3 flex flex-col gap-1 text-xs">
                  <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">
                    Direct Liaison Line
                  </span>
                  <span className="text-on-surface">
                    +234 1 888 5275 (Ext. 04)
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-secondary text-white transition-all text-xs uppercase tracking-wider font-semibold shadow-sm"
                  href="https://wa.me/23418885275"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined text-base">
                    chat
                  </span>
                  Direct WhatsApp Desk
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* INVOICE PREVIEW MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/70 backdrop-blur-sm"
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden z-10 p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg text-primary font-bold uppercase">
                  LA PLANTA PRIME
                </span>
                <span className="text-xs text-secondary font-semibold">
                  INVOICE #{selectedInvoice.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Invoice Breakdown */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Client Name:</span>
                <span className="font-semibold text-primary">
                  {user?.name || "Dr. Adekunle Balogun"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Vehicle Hired:</span>
                <span className="font-semibold text-primary">
                  {selectedInvoice.vehicle}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Charter Dates:</span>
                <span className="font-semibold text-primary">
                  {selectedInvoice.dates}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">
                  Operational Corridor:
                </span>
                <span className="font-semibold text-primary">
                  {selectedInvoice.corridor}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Payment Method:</span>
                <span className="font-semibold text-primary">
                  {selectedInvoice.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-b border-black/[0.06] text-sm">
                <span className="font-bold text-primary">Total Settled:</span>
                <span className="font-bold text-primary font-mono">
                  {selectedInvoice.amount}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span>Security Escrow Deposit:</span>
                <span className="font-semibold">Released Post-Handover</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  print
                </span>
                Print / Download PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION REQUEST MODAL */}
      {isCancellationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/75 backdrop-blur-sm"
            onClick={() => setIsCancellationModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden z-10 p-6 sm:p-8 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    event_busy
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-primary font-bold">
                    Request Charter Cancellation
                  </h3>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    Booking #LP-8842 • Range Rover Autobiography
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCancellationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {cancellationSuccessMsg ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex flex-col gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">
                    check_circle
                  </span>
                  Cancellation Request Dispatched!
                </div>
                <p className="leading-relaxed">
                  {cancellationSuccessMsg}
                </p>
                <div className="p-3 bg-white/80 rounded-lg border border-emerald-100 flex items-center justify-between font-mono text-[11px]">
                  <span>Refund Amount In Review:</span>
                  <strong className="text-emerald-800 text-sm">₦1,350,000</strong>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitCancellation} className="flex flex-col gap-4 text-xs">
                {/* VIP Protocol Notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-950 flex items-start gap-2.5 leading-relaxed">
                  <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5">
                    info
                  </span>
                  <div>
                    <strong className="block font-semibold">
                      VIP Charter Protocol
                    </strong>
                    Guest users cannot unilaterally cancel active vehicle allocations. Our operations director will review your request, contact you via phone or WhatsApp within 15 minutes, and process your manual wire refund in accordance with charter terms.
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Reason for Cancellation
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container font-medium text-xs focus:outline-none focus:border-secondary"
                  >
                    <option value="Corporate schedule change / Board meeting rescheduled">
                      Corporate schedule change / Board meeting rescheduled
                    </option>
                    <option value="Flight delayed / International itinerary cancelled">
                      Flight delayed / International itinerary cancelled
                    </option>
                    <option value="Medical or personal emergency">
                      Medical or personal emergency
                    </option>
                    <option value="Switching to another fleet vehicle / corridor">
                      Switching to another fleet vehicle / corridor
                    </option>
                    <option value="Other VIP protocol adjustments">
                      Other VIP protocol adjustments
                    </option>
                  </select>
                </div>

                {/* Refund Bank Details */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-black/[0.04] flex flex-col gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                    Designated Account for Manual Refund Wire
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-semibold text-on-surface-variant">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={refundBank}
                        onChange={(e) => setRefundBank(e.target.value)}
                        placeholder="e.g. Zenith Bank, GTBank"
                        required
                        className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-surface-container text-xs font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-semibold text-on-surface-variant">
                        NUBAN Account Number
                      </label>
                      <input
                        type="text"
                        value={refundAccount}
                        onChange={(e) => setRefundAccount(e.target.value)}
                        placeholder="10-digit account"
                        required
                        className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-surface-container text-xs font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-semibold text-on-surface-variant">
                      Account Beneficiary Name
                    </label>
                    <input
                      type="text"
                      value={refundAccountName}
                      onChange={(e) => setRefundAccountName(e.target.value)}
                      placeholder="e.g. Dr. Adekunle Balogun"
                      required
                      className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-surface-container text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Additional Notes for Concierge Desk
                  </label>
                  <textarea
                    rows={2}
                    value={cancellationNotes}
                    onChange={(e) => setCancellationNotes(e.target.value)}
                    placeholder="Provide additional details regarding schedule changes..."
                    className="w-full p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCancellation}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingCancellation ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Transmitting to Concierge...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">
                          send
                        </span>
                        Submit Cancellation Request
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCancellationModalOpen(false)}
                    className="px-5 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                  >
                    Dismiss
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EXTENSION REQUEST MODAL */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/75 backdrop-blur-sm"
            onClick={() => setIsExtensionModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-black/[0.08] overflow-hidden z-10 p-6 sm:p-8 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary-container/60 text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    update
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-primary font-bold">
                    Request Itinerary Extension
                  </h3>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    Booking #LP-8842 • Current End: Nov 17, 2024
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {extensionSuccessMsg ? (
              <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex flex-col gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-800">
                  <span className="material-symbols-outlined text-blue-600 text-xl">
                    check_circle
                  </span>
                  Extension Request Dispatched!
                </div>
                <p className="leading-relaxed">
                  {extensionSuccessMsg}
                </p>
                <div className="p-3 bg-white/80 rounded-lg border border-blue-100 flex items-center justify-between font-mono text-[11px]">
                  <span>Requested Extension:</span>
                  <strong className="text-blue-800 text-sm">+{extensionDays} Extra Day(s)</strong>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitExtension} className="flex flex-col gap-4 text-xs">
                <p className="text-on-surface-variant leading-relaxed">
                  Extend your Range Rover Autobiography charter. Your assigned chauffeur Emmanuel Okafor will be retained on continuous protocol.
                </p>

                {/* Additional Days Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Select Additional Rental Days
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setExtensionDays(days);
                          const d = 17 + days;
                          setNewReturnDate(`Nov ${d}, 2024 (18:00 WAT)`);
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                          extensionDays === days
                            ? "bg-primary text-white border-primary shadow-sm font-bold"
                            : "bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container"
                        }`}
                      >
                        <div className="text-sm font-bold">+{days} {days === 1 ? "Day" : "Days"}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          ₦{(days * 450000).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                      New Return Date &amp; Time
                    </label>
                    <input
                      type="text"
                      value={newReturnDate}
                      onChange={(e) => setNewReturnDate(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container font-mono text-xs font-semibold text-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                      Chauffeur Protocol
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Retain Emmanuel Okafor"
                      className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container text-xs text-on-surface-variant"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Reason for Extension
                  </label>
                  <select
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container font-medium text-xs focus:outline-none focus:border-secondary"
                  >
                    <option value="Executive meetings extended in Victoria Island">
                      Executive meetings extended in Victoria Island
                    </option>
                    <option value="Flight delayed / International itinerary postponed">
                      Flight delayed / International itinerary postponed
                    </option>
                    <option value="Interstate corridor transfer required (Lagos - Abuja)">
                      Interstate corridor transfer required (Lagos - Abuja)
                    </option>
                    <option value="Private diplomatic escort engagement extended">
                      Private diplomatic escort engagement extended
                    </option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Special Instructions or Corridor Changes
                  </label>
                  <textarea
                    rows={2}
                    value={extensionNotes}
                    onChange={(e) => setExtensionNotes(e.target.value)}
                    placeholder="Provide any updated flight times or destination details..."
                    className="w-full p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingExtension}
                    className="flex-1 h-11 bg-primary hover:bg-secondary text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingExtension ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Transmitting to Desk...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">
                          send
                        </span>
                        Submit Extension Request (+{extensionDays} Days)
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExtensionModalOpen(false)}
                    className="px-5 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
