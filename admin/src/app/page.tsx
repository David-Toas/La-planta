"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { adminApi } from "@/lib/api";
import { GoogleFleetMap } from "@/components/google-fleet-map";
import { supabase } from "@/lib/supabase";

type TabType =
  | "overview"
  | "map"
  | "fleet"
  | "handover"
  | "drivers"
  | "vip"
  | "revenue"
  | "requests";

interface FleetVehicle {
  id: string;
  name?: string;
  brand?: string;
  make?: string;
  model: string;
  year?: number;
  license_plate?: string;
  plate_number?: string;
  status: string;
  category?: string;
  armored_level?: string;
  daily_rate_ngn?: number;
  daily_rate_usd?: number;
  seats?: number;
  luggage_capacity?: number;
  transmission?: string;
  current_location_name?: string;
  current_hub?: string;
  fuel_battery_level?: number;
  battery_percent?: number;
  driver_name?: string;
  color?: string;
  hero_image_url?: string;
  gallery_image_urls?: string[];
  features?: string[];
  assigned_tracker_id?: string;
  tracker_code?: string;
  tracker_sim_phone?: string;
  tracker_devices?: any;
}

interface DriverItem {
  id: string;
  full_name: string;
  phone: string;
  badge_number?: string;
  rating?: number;
  status?: string;
  assigned_vehicle?: string;
  current_client?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  vip_tier?: string;
  role?: string;
  created_at?: string;
  avatar_url?: string;
}

export default function AdminDashboardPage() {
  const { adminUser, logout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [backendHealth, setBackendHealth] = useState<string>("connecting");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Live Data States
  const [overviewKpis, setOverviewKpis] = useState<any>(null);
  const [fleetList, setFleetList] = useState<FleetVehicle[]>([]);
  const [driverList, setDriverList] = useState<DriverItem[]>([]);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [fleetFilter, setFleetFilter] = useState<"all" | "active" | "reserve">(
    "all",
  );
  const [fleetSearchQuery, setFleetSearchQuery] = useState("");
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  // Concierge Requests State (Cancellations & Extensions)
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [requestFilter, setRequestFilter] = useState<
    "pending" | "cancellation" | "extension" | "all"
  >("pending");
  const [processingRequestId, setProcessingRequestId] = useState<
    string | null
  >(null);
  const [refundActionModal, setRefundActionModal] = useState<any | null>(null);
  const [refundWireReference, setRefundWireReference] = useState("");
  const [refundInternalNotes, setRefundInternalNotes] = useState("");
  const [requestActionSuccess, setRequestActionSuccess] = useState<
    string | null
  >(null);

  // Transactional Email Logs State
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [previewingEmail, setPreviewingEmail] = useState<any | null>(null);

  // Interaction States
  const [isPinging, setIsPinging] = useState(false);
  const [pingAlert, setPingAlert] = useState<string | null>(null);

  // VIP Update State
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [vipFeedback, setVipFeedback] = useState<{
    id: string;
    text: string;
  } | null>(null);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastCorridor, setBroadcastCorridor] = useState(
    "Lagos & Abuja All Corridors",
  );
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Initial Fetch & Live Polling
  useEffect(() => {
    // 1. Health check
    adminApi.getHealth().then((res) => {
      setBackendHealth(res?.status === "ok" ? "online" : "offline");
    });

    // 2. Overview KPIs
    adminApi.getOverview().then((res) => {
      if (res?.success && res.kpis) {
        setOverviewKpis(res.kpis);
      }
    });

    // 3. Fleet
    adminApi.getFleet().then((res) => {
      if (res?.success && res.vehicles) {
        setFleetList(res.vehicles);
      }
    });

    // 4. Drivers
    adminApi.getDrivers().then((res) => {
      if (res?.success && res.drivers) {
        setDriverList(res.drivers);
      }
    });

    // 5. Users for VIP management
    adminApi.getUsers().then((res) => {
      if (res?.success && res.users) {
        setUserList(res.users);
      }
    });

    // 6. Paystack Payment Logs
    adminApi.getPaymentLogs().then((res) => {
      if (res?.success && res.logs) {
        setPaymentLogs(res.logs);
        setPaymentSummary({
          total: res.total_settled_formatted || "₦0",
          count: res.count || res.logs.length,
        });
      }
    });

    // 7. Concierge Requests (Cancellations & Extensions)
    adminApi.getBookingRequests().then((res) => {
      if (res?.success && res.requests) {
        setBookingRequests(res.requests);
      }
    });

    // 8. Transactional Email Logs
    adminApi.getEmailLogs().then((res) => {
      if (res?.success && res.logs) {
        setEmailLogs(res.logs);
      }
    });

    // 9. Automated 10-second telemetry & fleet refresh poller
    const poller = setInterval(() => {
      adminApi.getFleet().then((res) => {
        if (res?.success && res.vehicles) {
          setFleetList(res.vehicles);
        }
      });
      adminApi.getOverview().then((res) => {
        if (res?.success && res.kpis) {
          setOverviewKpis(res.kpis);
        }
      });
    }, 10000);

    // 10. Real-time PostgreSQL Change Listeners via Supabase Websockets
    const channel = supabase
      .channel("admin-app-fleet-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => {
          reloadFleetAndKpis();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => {
          reloadDrivers();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          reloadRequests();
          reloadFleetAndKpis();
        }
      )
      .subscribe();

    return () => {
      clearInterval(poller);
      supabase.removeChannel(channel);
    };
  }, []);

  const reloadRequests = async () => {
    const res = await adminApi.getBookingRequests();
    if (res?.success && res.requests) {
      setBookingRequests(res.requests);
    }
    const mailRes = await adminApi.getEmailLogs();
    if (mailRes?.success && mailRes.logs) {
      setEmailLogs(mailRes.logs);
    }
  };

  const handleConfirmCancellationAndRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundActionModal) return;
    setProcessingRequestId(refundActionModal.id);
    const note = `Manual Wire Ref: ${
      refundWireReference || "LP-WIRE-" + Date.now()
    }. ${refundInternalNotes || "Confirmed by operations director."}`;
    const res = await adminApi.updateBookingRequest(
      refundActionModal.id,
      "refunded_and_cancelled",
      note,
    );
    setProcessingRequestId(null);
    if (res?.success) {
      setRefundActionModal(null);
      setRefundWireReference("");
      setRefundInternalNotes("");
      setRequestActionSuccess(
        `Cancellation confirmed for ${refundActionModal.bookingCode}. Manual refund logged & VIP email dispatched.`,
      );
      await reloadRequests();
      await reloadFleetAndKpis();
      setTimeout(() => setRequestActionSuccess(null), 4000);
    } else {
      alert(res?.error || "Failed to process cancellation");
    }
  };

  const handleApproveExtension = async (reqItem: any) => {
    if (
      !confirm(
        `Approve +${reqItem.extraDays || 1} day(s) extension for booking ${
          reqItem.bookingCode
        }?`,
      )
    )
      return;
    setProcessingRequestId(reqItem.id);
    const res = await adminApi.updateBookingRequest(
      reqItem.id,
      "approved",
      `Extension of ${reqItem.extraDays} days approved by operations director.`,
    );
    setProcessingRequestId(null);
    if (res?.success) {
      setRequestActionSuccess(
        `Extension approved for ${reqItem.bookingCode}. Schedule updated.`,
      );
      await reloadRequests();
      setTimeout(() => setRequestActionSuccess(null), 4000);
    } else {
      alert(res?.error || "Failed to approve extension");
    }
  };

  const handleRejectRequest = async (reqItem: any) => {
    const reason = prompt("Enter reason for declining this request:");
    if (reason === null) return;
    setProcessingRequestId(reqItem.id);
    const res = await adminApi.updateBookingRequest(
      reqItem.id,
      "rejected",
      reason || "Operational capacity unavailable",
    );
    setProcessingRequestId(null);
    if (res?.success) {
      await reloadRequests();
    }
  };

  // Vehicle Management Modal States
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(
    null,
  );
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [vehicleFormError, setVehicleFormError] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(
    null,
  );

  const initialVehicleForm = {
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    color: "Obsidian Black",
    category: "Executive SUV",
    armored_level: "None",
    daily_rate_ngn: 450000,
    daily_rate_usd: 350,
    seats: 4,
    luggage_capacity: 4,
    transmission: "Automatic",
    status: "available",
    current_location_name: "Victoria Island Operations Hub",
    hero_image_url: "",
    gallery_image_urls: "",
    features:
      "Starlink Wi-Fi, Executive Rear Seating, Chilled Refreshments Console, Acoustic Privacy Glass, Massage Seats",
    tracker_code: "",
    tracker_sim_phone: "",
  };
  const [vehicleFormData, setVehicleFormData] = useState(initialVehicleForm);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Driver Management Modal States
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [driverFormError, setDriverFormError] = useState<string | null>(null);
  const initialDriverForm = {
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    badge_number: "",
    security_clearance_level: "Airside VIP & Diplomatic Escort",
  };
  const [driverFormData, setDriverFormData] = useState(initialDriverForm);

  // Reload helpers
  const reloadFleetAndKpis = async () => {
    const [fleetRes, kpiRes] = await Promise.all([
      adminApi.getFleet(),
      adminApi.getOverview(),
    ]);
    if (fleetRes?.success && fleetRes.vehicles) {
      setFleetList(fleetRes.vehicles);
    }
    if (kpiRes?.success && kpiRes.kpis) {
      setOverviewKpis(kpiRes.kpis);
    }
  };

  const reloadDrivers = async () => {
    const res = await adminApi.getDrivers();
    if (res?.success && res.drivers) {
      setDriverList(res.drivers);
    }
  };

  const handleOpenAddVehicle = () => {
    setVehicleFormData(initialVehicleForm);
    setVehicleFormError(null);
    setIsAddVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (v: FleetVehicle) => {
    setEditingVehicle(v);
    const resolvedTracker = Array.isArray(v.tracker_devices)
      ? v.tracker_devices[0]
      : v.tracker_devices;

    setVehicleFormData({
      brand: v.brand || v.make || "",
      model: v.model || "",
      year: v.year || new Date().getFullYear(),
      license_plate: v.license_plate || v.plate_number || "",
      color: v.color || "Obsidian Black",
      category: v.category || "Executive SUV",
      armored_level: v.armored_level || "None",
      daily_rate_ngn: Number(v.daily_rate_ngn) || 450000,
      daily_rate_usd:
        Number(v.daily_rate_usd) ||
        Math.round((Number(v.daily_rate_ngn) || 450000) / 1500),
      seats: v.seats || 4,
      luggage_capacity: v.luggage_capacity || 4,
      transmission: v.transmission || "Automatic",
      status: v.status || "available",
      current_location_name:
        v.current_location_name ||
        v.current_hub ||
        "Victoria Island Operations Hub",
      hero_image_url: v.hero_image_url || "",
      gallery_image_urls: (v.gallery_image_urls || []).join("\n"),
      features:
        (v.features || []).join(", ") ||
        "Starlink Wi-Fi, Executive Rear Seating",
      tracker_code: v.tracker_code || resolvedTracker?.device_code || "",
      tracker_sim_phone: v.tracker_sim_phone || resolvedTracker?.sim_phone_number || "",
    });
    setVehicleFormError(null);
    setImageUploadError(null);
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    setImageUploadError(null);
    try {
      const res = await adminApi.uploadFile(file);
      if (res?.success && res.url) {
        setVehicleFormData((prev) => ({ ...prev, hero_image_url: res.url! }));
      } else {
        setImageUploadError(
          res?.error || "Failed to upload photo from device.",
        );
      }
    } catch (err: any) {
      setImageUploadError(err.message || "Failed to upload photo.");
    } finally {
      setIsUploadingHero(false);
      e.target.value = "";
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    setImageUploadError(null);
    try {
      const uploadPromises = Array.from(files).map((f) =>
        adminApi.uploadFile(f),
      );
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results
        .filter((r) => r?.success && r.url)
        .map((r) => r.url as string);

      if (successfulUrls.length > 0) {
        setVehicleFormData((prev) => {
          const existing = prev.gallery_image_urls
            ? prev.gallery_image_urls
                .split("\n")
                .filter((s) => s.trim().length > 0)
            : [];
          return {
            ...prev,
            gallery_image_urls: [...existing, ...successfulUrls].join("\n"),
          };
        });
      } else {
        setImageUploadError("Could not upload photos. Please try again.");
      }
    } catch (err: any) {
      setImageUploadError(err.message || "Failed to upload gallery photos.");
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setVehicleFormData((prev) => {
      const existing = prev.gallery_image_urls
        ? prev.gallery_image_urls.split("\n").filter((s) => s.trim().length > 0)
        : [];
      const updated = existing.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        gallery_image_urls: updated.join("\n"),
      };
    });
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !vehicleFormData.brand.trim() ||
      !vehicleFormData.model.trim() ||
      !vehicleFormData.license_plate.trim()
    ) {
      setVehicleFormError("Brand, Model, and License Plate are required.");
      return;
    }
    if (
      !vehicleFormData.daily_rate_ngn ||
      vehicleFormData.daily_rate_ngn <= 0
    ) {
      setVehicleFormError("Please enter a valid daily rate in NGN.");
      return;
    }

    setIsSubmittingVehicle(true);
    setVehicleFormError(null);

    const payload = {
      name: `${vehicleFormData.brand.trim()} ${vehicleFormData.model.trim()}`,
      brand: vehicleFormData.brand.trim(),
      model: vehicleFormData.model.trim(),
      year: Number(vehicleFormData.year),
      license_plate: vehicleFormData.license_plate.trim().toUpperCase(),
      color: vehicleFormData.color.trim(),
      category: vehicleFormData.category,
      armored_level: vehicleFormData.armored_level,
      daily_rate_ngn: Number(vehicleFormData.daily_rate_ngn),
      daily_rate_usd:
        Number(vehicleFormData.daily_rate_usd) ||
        Math.round(Number(vehicleFormData.daily_rate_ngn) / 1500),
      seats: Number(vehicleFormData.seats),
      luggage_capacity: Number(vehicleFormData.luggage_capacity),
      transmission: vehicleFormData.transmission,
      status: vehicleFormData.status,
      current_location_name: vehicleFormData.current_location_name.trim(),
      hero_image_url: vehicleFormData.hero_image_url.trim() || null,
      gallery_image_urls: vehicleFormData.gallery_image_urls
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5),
      features: vehicleFormData.features
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      tracker_code: vehicleFormData.tracker_code.trim() || undefined,
      tracker_sim_phone: vehicleFormData.tracker_sim_phone.trim() || undefined,
    };

    try {
      if (editingVehicle) {
        const res = await adminApi.updateVehicle(editingVehicle.id, payload);
        if (res?.success) {
          setEditingVehicle(null);
          await reloadFleetAndKpis();
        } else {
          setVehicleFormError(res?.error || "Failed to update vehicle");
        }
      } else {
        const res = await adminApi.createVehicle(payload);
        if (res?.success) {
          setIsAddVehicleModalOpen(false);
          await reloadFleetAndKpis();
        } else {
          setVehicleFormError(res?.error || "Failed to register vehicle");
        }
      }
    } catch (err: any) {
      setVehicleFormError(err.message || "Operation failed");
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${name} from the active fleet inventory?`,
      )
    ) {
      return;
    }
    setDeletingVehicleId(id);
    const res = await adminApi.deleteVehicle(id);
    setDeletingVehicleId(null);
    if (res?.success) {
      await reloadFleetAndKpis();
    } else {
      alert(`Could not delete: ${res?.error || "Unknown error"}`);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !driverFormData.full_name.trim() ||
      !driverFormData.phone.trim() ||
      !driverFormData.license_number.trim()
    ) {
      setDriverFormError("Full Name, Phone, and License Number are required.");
      return;
    }
    setIsSubmittingDriver(true);
    setDriverFormError(null);
    const res = await adminApi.createDriver({
      full_name: driverFormData.full_name.trim(),
      phone: driverFormData.phone.trim(),
      email: driverFormData.email.trim() || null,
      license_number: driverFormData.license_number.trim(),
      badge_number:
        driverFormData.badge_number.trim() ||
        `CH-${Math.floor(100 + Math.random() * 900)}`,
      security_clearance_level: driverFormData.security_clearance_level,
    });
    setIsSubmittingDriver(false);
    if (res?.success) {
      setIsAddDriverModalOpen(false);
      setDriverFormData(initialDriverForm);
      await reloadDrivers();
    } else {
      setDriverFormError(res?.error || "Failed to add driver");
    }
  };

  const handleDeleteDriver = async (id: string, name: string) => {
    if (!confirm(`Remove chauffeur ${name} from active roster?`)) return;
    const res = await adminApi.deleteDriver(id);
    if (res?.success) {
      await reloadDrivers();
    } else {
      alert(`Could not delete: ${res?.error || "Unknown error"}`);
    }
  };

  // Dynamic Ping Tracker action
  const handleAdminPing = async (
    target?:
      | string
      | { vehicleId?: string; deviceCode?: string; vehicleName?: string }
      | any,
  ) => {
    setIsPinging(true);
    let payload: any = "TRK-892-SIM";
    let assetLabel = "";

    // Guard against React ClickEvent being passed as target
    if (target && typeof target === "object" && ("nativeEvent" in target || "currentTarget" in target)) {
      target = undefined;
    }

    if (typeof target === "string") {
      payload = { deviceCode: target };
      assetLabel = ` (${target})`;
    } else if (target && typeof target === "object") {
      payload = {
        vehicleId: target.vehicleId,
        deviceCode: target.deviceCode,
      };
      if (target.vehicleName) assetLabel = ` for ${target.vehicleName}`;
    }

    const res = await adminApi.pingTracker(payload);
    if (res?.success) {
      const simDisplay = res.simPhone || "Database SIM";
      const unitDisplay = res.deviceCode ? ` [${res.deviceCode}]` : "";
      setPingAlert(
        `✓ Sent "WHERE#" ping to SIM ${simDisplay}${unitDisplay}${assetLabel} (Telematics ACK)`,
      );
    } else {
      setPingAlert(`Notice: ${res?.error || "Dispatched"}`);
    }
    setIsPinging(false);
    setTimeout(() => setPingAlert(null), 6000);
  };

  // Admin VIP Tier Update handler
  const handleUpdateTier = async (userId: string, newTier: string) => {
    setUpdatingUserId(userId);
    setVipFeedback(null);
    const res = await adminApi.updateUserVipTier(userId, newTier);
    setUpdatingUserId(null);
    if (res?.success) {
      setUserList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, vip_tier: newTier } : u)),
      );
      setVipFeedback({
        id: userId,
        text: `✓ Tier successfully updated to ${newTier.toUpperCase()}`,
      });
      setTimeout(() => setVipFeedback(null), 4000);
    } else {
      setVipFeedback({
        id: userId,
        text: `Error: ${res?.error || "Failed to update"}`,
      });
    }
  };

  // Fleet broadcast handler
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    const res = await adminApi.broadcastNotice(broadcastMsg, broadcastCorridor);
    if (res?.success) {
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setIsBroadcastModalOpen(false);
        setBroadcastMsg("");
      }, 2000);
    }
  };

  // Filtered fleet
  const displayedFleet = fleetList.filter((v) => {
    if (fleetFilter === "active") {
      if (v.status !== "in_transit" && v.status !== "reserved") return false;
    } else if (fleetFilter === "reserve") {
      if (v.status !== "available") return false;
    }

    if (fleetSearchQuery.trim()) {
      const q = fleetSearchQuery.toLowerCase();
      const matchBrand = (v.brand || v.make || "").toLowerCase().includes(q);
      const matchModel = (v.model || "").toLowerCase().includes(q);
      const matchName = (v.name || "").toLowerCase().includes(q);
      const matchPlate = (v.license_plate || v.plate_number || "").toLowerCase().includes(q);
      const matchHub = (v.current_location_name || v.current_hub || "").toLowerCase().includes(q);
      return matchBrand || matchModel || matchName || matchPlate || matchHub;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* OPERATIONS SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-surface-container-lowest border-r border-surface-container flex flex-col justify-between z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-xl lg:shadow-none`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand & Console Title */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-surface-container shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-md shrink-0">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18 8.5v7l-6 3.75-6-3.75v-7l6-4.3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg text-primary tracking-tight font-bold leading-none">
                  LA PLANTA
                </span>
                <span className="text-[10px] tracking-widest uppercase text-secondary font-semibold mt-1">
                  ADMIN CONSOLE
                </span>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                  Operations Modules
                </span>
                <span className="text-[9px] bg-secondary-container/60 text-on-secondary-container px-1.5 py-0.5 rounded uppercase font-semibold">
                  Live
                </span>
              </div>

              {/* Sub-Nav 1: Overview */}
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "overview"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "overview"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    dashboard
                  </span>
                  <span>Overview &amp; KPIs</span>
                </div>
                {activeTab === "overview" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse" />
                )}
              </button>

              {/* Sub-Nav 2: Live Map */}
              <button
                onClick={() => {
                  setActiveTab("map");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "map"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "map"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    share_location
                  </span>
                  <span>Live GPS Map</span>
                </div>
              </button>

              {/* Sub-Nav 3: Fleet */}
              <button
                onClick={() => {
                  setActiveTab("fleet");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "fleet"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "fleet"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    directions_car
                  </span>
                  <span>Fleet Inventory</span>
                </div>
              </button>

              {/* Sub-Nav 4: Handover Queue */}
              <button
                onClick={() => {
                  setActiveTab("handover");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "handover"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "handover"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    fact_check
                  </span>
                  <span>Handover &amp; Checks</span>
                </div>
              </button>

              {/* Sub-Nav 5: Chauffeurs */}
              <button
                onClick={() => {
                  setActiveTab("drivers");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "drivers"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "drivers"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    supervised_user_circle
                  </span>
                  <span>Chauffeur Roster</span>
                </div>
              </button>

              {/* Sub-Nav 6: VIP Management (Crucial User Requirement) */}
              <button
                onClick={() => {
                  setActiveTab("vip");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "vip"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "vip"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    workspace_premium
                  </span>
                  <span>Members / Clients</span>
                </div>
              </button>

              {/* Sub-Nav 7: Revenue */}
              <button
                onClick={() => {
                  setActiveTab("revenue");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "revenue"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "revenue"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    payments
                  </span>
                  <span>Revenue &amp; Invoices</span>
                </div>
              </button>

              {/* Sub-Nav 8: Concierge Requests & Refunds */}
              <button
                onClick={() => {
                  setActiveTab("requests");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activeTab === "requests"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-lg ${
                      activeTab === "requests"
                        ? "text-secondary-fixed"
                        : "text-secondary"
                    }`}
                  >
                    assignment_return
                  </span>
                  <span>Requests &amp; Refunds</span>
                </div>
                {bookingRequests.filter((r) => r.status === "pending").length >
                  0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {
                      bookingRequests.filter((r) => r.status === "pending")
                        .length
                    }
                  </span>
                )}
              </button>
            </div>

            {/* General Navigation Separator */}
            <div className="pt-2 pb-1 border-t border-surface-container">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold px-3 block mb-1">
                External Links
              </span>
              <a
                href={
                  process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-secondary">
                    home
                  </span>
                  <span>Client Website</span>
                </div>
                <span className="material-symbols-outlined text-sm">
                  open_in_new
                </span>
              </a>
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="p-3.5 border-t border-surface-container bg-surface-container-low/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  alt="Admin"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-secondary/40"
                  src={
                    adminUser?.avatarUrl ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                  }
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-primary font-semibold truncate leading-tight">
                  {adminUser?.name || "Dr. Adekunle B."}
                </span>
                <span className="text-[10px] text-secondary truncate">
                  Fleet Administrator
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-destructive hover:bg-surface-container transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen bg-surface">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-20 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              className="lg:hidden p-2 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg sm:text-xl text-primary font-semibold">
                  Admin Command Cockpit
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />{" "}
                  LIVE
                </span>
              </div>
              <span className="text-xs text-on-surface-variant hidden md:block">
                Autonomous telematics monitoring, chauffeur dispatch &amp; VIP
                tier control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Ping SIM Tracker Button (Express :4000) */}
            <button
              onClick={() => handleAdminPing()}
              disabled={isPinging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-white font-semibold hover:bg-secondary/90 transition-all text-xs shadow-sm disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-sm ${
                  isPinging ? "animate-spin" : ""
                }`}
              >
                {isPinging ? "sync" : "satellite_alt"}
              </span>
              <span>{isPinging ? "Pinging :4000..." : "Test SIM Ping"}</span>
            </button>

            {/* Broadcast Button */}
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">
                campaign
              </span>
              <span>Broadcast</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          {/* Real-time Ping Alert Banner */}
          {pingAlert && (
            <div className="w-full bg-primary text-secondary-fixed px-4 py-3 rounded-xl text-xs font-mono flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary-fixed">
                  cell_tower
                </span>
                <span>{pingAlert}</span>
              </div>
              <button
                onClick={() => setPingAlert(null)}
                className="text-secondary-fixed/70 hover:text-secondary-fixed"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: OPERATIONS OVERVIEW & KPIS */}
          {activeTab === "overview" && (
            <section className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Concierge Action Notification Banner */}
              {bookingRequests.filter((r) => r.status === "pending").length >
                0 && (
                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">
                        assignment_late
                      </span>
                    </div>
                    <div>
                      <strong className="block text-sm font-bold text-amber-950">
                        {
                          bookingRequests.filter((r) => r.status === "pending")
                            .length
                        }{" "}
                        Pending Concierge Request(s) Awaiting Clearance
                      </strong>
                      <span className="text-[11px] text-amber-900/80">
                        Guests have requested charter cancellations (manual wire
                        refunds required) or extensions. Review and contact guests.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("requests")}
                    className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shrink-0 shadow-sm"
                  >
                    Open Requests Desk &rarr;
                  </button>
                </div>
              )}

              {/* Telematics Status Ribbon */}
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-4 border border-surface-container/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
                    </span>
                    <span className="text-xs uppercase tracking-wider text-primary font-bold">
                      Lagos &amp; Abuja Telematics Dispatch
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      | Live Feed
                    </span>
                  </div>
                  <div className="hidden sm:inline-block h-4 w-[1px] bg-surface-container" />
                  <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full text-xs text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      sensors
                    </span>
                    <span>{fleetList.length} Active Fleet Monitored</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      satellite_alt
                    </span>
                    GPS Accuracy: 99.8%
                  </span>
                </div>
              </div>

              {/* KPI Cards Quartet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Cars on Trip */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Cars on Trip
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        directions_car
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {overviewKpis?.carsOnTrip?.active ??
                        fleetList.filter(
                          (v) =>
                            v.status === "in_transit" ||
                            v.status === "reserved",
                        ).length}{" "}
                      <span className="text-sm text-on-surface-variant font-normal">
                        / {overviewKpis?.carsOnTrip?.total ?? fleetList.length}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                      {overviewKpis?.carsOnTrip?.percentage ??
                        (fleetList.length > 0
                          ? Math.round(
                              (fleetList.filter(
                                (v) => v.status === "in_transit",
                              ).length /
                                fleetList.length) *
                                100,
                            )
                          : 0)}
                      % Active
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span>
                      {overviewKpis?.carsOnTrip?.reserveCount ??
                        fleetList.filter((v) => v.status === "available")
                          .length}{" "}
                      In Reserve
                    </span>
                    <span className="text-primary font-semibold">Ready</span>
                  </div>
                </div>

                {/* Card 2: Today's Transfers */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Today&apos;s Transfers
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        flight_takeoff
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {overviewKpis?.transfersToday?.count ?? 0}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Active Charters
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>
                      {overviewKpis?.transfersToday?.vipMeetAndGreets ?? 0} VIP
                      Escorts / Transfers
                    </span>
                  </div>
                </div>

                {/* Card 3: Monthly Revenue */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Monthly Revenue
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        payments
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary font-mono">
                      {overviewKpis?.revenue?.amountFormatted || "₦0"}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="text-emerald-700 font-medium">
                      100% Upfront Settled
                    </span>
                    <span className="text-secondary font-semibold">
                      {overviewKpis?.revenue?.growthPercent
                        ? `+${overviewKpis.revenue.growthPercent}%`
                        : "Zero Outstanding"}
                    </span>
                  </div>
                </div>

                {/* Card 4: Drivers on Duty */}
                <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                      Drivers on Duty
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-lg">
                        supervised_user_circle
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {overviewKpis?.driversOnDuty?.active ?? driverList.length}{" "}
                      <span className="text-sm text-on-surface-variant font-normal">
                        /{" "}
                        {overviewKpis?.driversOnDuty?.total ??
                          driverList.length}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      All Vetted
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span>
                      Lead:{" "}
                      {overviewKpis?.driversOnDuty?.leadChauffeur ||
                        (driverList.length > 0
                          ? driverList[0].full_name
                          : "None assigned")}
                    </span>
                    <span className="text-secondary font-semibold">5.0 ★</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab("map")}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-secondary-fixed/40 text-secondary flex items-center justify-center material-symbols-outlined text-xl">
                      share_location
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-primary">
                        Live GPS Corridor Map
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Monitor active vehicles en route to guests
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    Open Telematics Map →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("vip")}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center material-symbols-outlined text-xl">
                      workspace_premium
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-primary">
                        VIP Membership Management
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Promote client accounts to VIP statuses
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    Manage VIP Accounts →
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab("handover")}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-secondary cursor-pointer transition-all shadow-sm flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center material-symbols-outlined text-xl">
                      fact_check
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-primary">
                        Vehicle Handover Sign-off
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Review pre-trip &amp; post-trip inspections
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                    Inspect Handover Queue →
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: LIVE GPS MAP */}
          {activeTab === "map" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-secondary font-semibold">
                      Live Telematics Corridor
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                      Google Maps Live
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Nationwide Executive Fleet Corridor (Nigeria)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                    GPS Accuracy: 99.9%
                  </span>
                </div>
              </div>

              {/* Google Fleet Map Engine with Nationwide Bounds, Traffic & Telematics */}
              <GoogleFleetMap
                vehicles={fleetList as any}
                onPingTracker={handleAdminPing}
              />
            </section>
          )}

          {/* TAB 3: FLEET INVENTORY REGISTER */}
          {activeTab === "fleet" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-surface-container/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                      Fleet Inventory Management
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-semibold">
                      Live Supabase Sync
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-primary font-semibold mt-0.5">
                    Executive Fleet Register ({fleetList.length} Units)
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Register new vehicles, set daily charter rates, manage
                    armored specifications, and track fleet availability.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-surface-container-low rounded-lg px-3 py-1.5 flex items-center gap-2 border border-surface-container text-xs">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      search
                    </span>
                    <input
                      value={fleetSearchQuery}
                      onChange={(e) => setFleetSearchQuery(e.target.value)}
                      placeholder="Search plate or model..."
                      className="bg-transparent border-none text-xs text-primary focus:outline-none w-32 sm:w-44 placeholder-on-surface-variant"
                    />
                    {fleetSearchQuery && (
                      <button
                        onClick={() => setFleetSearchQuery("")}
                        className="text-on-surface-variant hover:text-primary text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex items-center bg-surface-container-low rounded-lg p-0.5 border border-surface-container text-xs">
                    <button
                      onClick={() => setFleetFilter("all")}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        fleetFilter === "all"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      All ({fleetList.length})
                    </button>
                    <button
                      onClick={() => setFleetFilter("active")}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        fleetFilter === "active"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      Active (
                      {
                        fleetList.filter(
                          (v) =>
                            v.status === "in_transit" ||
                            v.status === "reserved",
                        ).length
                      }
                      )
                    </button>
                    <button
                      onClick={() => setFleetFilter("reserve")}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                        fleetFilter === "reserve"
                          ? "bg-surface-container-lowest text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      Available (
                      {fleetList.filter((v) => v.status === "available").length}
                      )
                    </button>
                  </div>
                  <button
                    onClick={handleOpenAddVehicle}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">
                      add_circle
                    </span>
                    <span>+ Add Vehicle</span>
                  </button>
                </div>
              </div>

              {/* Table / Grid */}
              {displayedFleet.length === 0 ? (
                <div className="py-16 px-4 text-center rounded-xl bg-surface-container-low/40 border border-dashed border-surface-container flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-3xl">
                      directions_car
                    </span>
                  </div>
                  <h4 className="font-serif text-lg text-primary font-semibold">
                    No Vehicles Found
                  </h4>
                  <p className="text-xs text-on-surface-variant max-w-sm">
                    {fleetList.length === 0
                      ? "Your fleet inventory is empty. Click '+ Add Vehicle' above to register your first automobile."
                      : "No vehicles match the selected filter criteria."}
                  </p>
                  <button
                    onClick={handleOpenAddVehicle}
                    className="mt-2 px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">
                      add
                    </span>
                    Register Vehicle
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto w-full rounded-xl border border-surface-container/60">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-on-surface-variant uppercase tracking-wider bg-surface-container-low/80 border-b border-surface-container">
                        <th className="py-3 px-4 rounded-l-lg">Automobile</th>
                        <th className="py-3 px-4">License Plate</th>
                        <th className="py-3 px-4">Category &amp; Armor</th>
                        <th className="py-3 px-4">Daily Rate</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Capacity</th>
                        <th className="py-3 px-4">Operational Hub</th>
                        <th className="py-3 px-4 rounded-r-lg text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container/50">
                      {displayedFleet.map((v) => {
                        const vehicleBrand = v.brand || v.make || "";
                        const vehiclePlate =
                          v.license_plate || v.plate_number || "NO-PLATE";
                        const vehicleName =
                          v.name || `${vehicleBrand} ${v.model}`;
                        const rateNgn = Number(v.daily_rate_ngn) || 0;
                        const rateUsd =
                          Number(v.daily_rate_usd) ||
                          Math.round(rateNgn / 1500);

                        return (
                          <tr
                            key={v.id}
                            className="hover:bg-surface-container-low/50 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-10 rounded-lg overflow-hidden bg-surface-container shrink-0 border border-surface-container/70 flex items-center justify-center relative">
                                  {v.hero_image_url ? (
                                    <img
                                      src={v.hero_image_url}
                                      alt={vehicleName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback if image fails to load
                                        (
                                          e.target as HTMLElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span className="material-symbols-outlined text-secondary text-xl">
                                      directions_car
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-primary truncate max-w-[180px]">
                                    {vehicleName}
                                  </span>
                                  <span className="text-[10px] text-on-surface-variant">
                                    {v.year || 2024} •{" "}
                                    {v.color || "Obsidian Black"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-secondary font-bold text-xs">
                              {vehiclePlate}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="font-medium text-primary">
                                  {v.category || "Executive"}
                                </span>
                                {v.armored_level &&
                                  v.armored_level !== "None" && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold uppercase tracking-wider">
                                      <span className="material-symbols-outlined text-[10px]">
                                        shield
                                      </span>
                                      {v.armored_level}
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-primary">
                                  ₦{rateNgn.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-mono">
                                  (~${rateUsd.toLocaleString()} USD)
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  v.status === "in_transit"
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : v.status === "reserved"
                                      ? "bg-amber-100 text-amber-800"
                                      : v.status === "maintenance"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {v.status === "in_transit"
                                  ? "On Trip"
                                  : v.status === "reserved"
                                    ? "Reserved"
                                    : v.status === "maintenance"
                                      ? "Maintenance"
                                      : "Available"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant">
                              <div className="flex items-center gap-2">
                                <span
                                  title="Seats"
                                  className="flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-xs">
                                    person
                                  </span>
                                  {v.seats || 4}
                                </span>
                                <span
                                  title="Luggage"
                                  className="flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-xs">
                                    luggage
                                  </span>
                                  {v.luggage_capacity || 4}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant max-w-[140px] truncate">
                              {v.current_location_name ||
                                v.current_hub ||
                                "Victoria Island Hub"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    handleAdminPing({
                                      vehicleId: v.id,
                                      vehicleName,
                                      deviceCode: v.tracker_code,
                                    })
                                  }
                                  disabled={isPinging}
                                  className="p-1.5 rounded-lg bg-surface-container-low hover:bg-secondary hover:text-white text-secondary transition-colors"
                                  title={`Ping Tracker (${vehicleName})`}
                                >
                                  <span className="material-symbols-outlined text-base">
                                    satellite_alt
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleOpenEditVehicle(v)}
                                  className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary transition-colors"
                                  title="Edit Vehicle"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    edit
                                  </span>
                                </button>
                                <button
                                  disabled={deletingVehicleId === v.id}
                                  onClick={() =>
                                    handleDeleteVehicle(v.id, vehicleName)
                                  }
                                  className="p-1.5 rounded-lg bg-surface-container-low hover:bg-red-50 text-on-surface-variant hover:text-red-700 transition-colors disabled:opacity-50"
                                  title="Delete Vehicle"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    delete
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 4: HANDOVER & INSPECTION QUEUE */}
          {activeTab === "handover" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Key Handover Queue
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Digital Handover &amp; Inspection Queue
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  1 Inspection Ready for Sign-off
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Handover Card 1 */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
                        LP
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary font-semibold">
                            Booking #LP-8842
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                            READY AT VALET
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          Guest: Dr. Adekunle Balogun • VIP Client
                        </span>
                      </div>
                    </div>
                    <span className="text-secondary font-mono font-semibold text-xs">
                      17:25 WAT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-lowest p-2.5 rounded-lg">
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Vehicle
                      </span>
                      <span className="font-semibold text-primary">
                        Range Rover Autobiography
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Assigned Chauffeur
                      </span>
                      <span className="font-semibold text-primary">
                        Emmanuel Okafor
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between text-[11px]">
                      <span>Location: The Wheatbaker Hotel, Ikoyi</span>
                      <span className="text-emerald-700 font-semibold">
                        4/4 Photos Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="http://localhost:3000/reservation-pass"
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary hover:underline text-xs font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">
                        qr_code_2
                      </span>
                      View QR Pass
                    </a>
                    <a
                      href="http://localhost:3000/handover-inspection"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-secondary transition-colors"
                    >
                      Launch Inspection Console →
                    </a>
                  </div>
                </div>

                {/* Handover Card 2 */}
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold text-sm">
                        ABV
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary font-semibold">
                            Booking #LP-8850
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                            AIRPORT PICKUP
                          </span>
                        </div>
                        <span className="text-xs text-on-surface-variant">
                          Guest: Chief O. Fernandez
                        </span>
                      </div>
                    </div>
                    <span className="text-secondary font-mono font-semibold text-xs">
                      19:15 WAT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low p-2.5 rounded-lg">
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Vehicle
                      </span>
                      <span className="font-semibold text-primary">
                        Toyota LC 300 VXR
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px] uppercase">
                        Assigned Chauffeur
                      </span>
                      <span className="font-semibold text-primary">
                        Segun Alabi
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between text-[11px]">
                      <span>Location: Nnamdi Azikiwe VIP Wing</span>
                      <span className="text-secondary font-semibold">
                        Flight: BA 083 (Tracked)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-on-surface-variant">
                      Chauffeur staged at terminal
                    </span>
                    <button
                      onClick={() => handleAdminPing()}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      Ping Tracker
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: CHAUFFEUR ROSTER */}
          {activeTab === "drivers" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Driver Management
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Chauffeur Duty Roster ({driverList.length} Active
                    Chauffeurs)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDriverFormData(initialDriverForm);
                      setDriverFormError(null);
                      setIsAddDriverModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">
                      person_add
                    </span>
                    <span>+ Add Chauffeur</span>
                  </button>
                  <button
                    onClick={() => setIsBroadcastModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-colors"
                  >
                    Broadcast Notice
                  </button>
                </div>
              </div>

              {driverList.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-xl bg-surface-container-low/40 border border-dashed border-surface-container flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-secondary">
                    badge
                  </span>
                  <h4 className="font-serif text-base text-primary font-semibold">
                    No Chauffeurs On Roster
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Click '+ Add Chauffeur' to recruit and vet your first
                    executive driver.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {driverList.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-3 group relative"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container">
                          <img
                            className="w-full h-full object-cover"
                            alt={d.full_name}
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full ring-2 ring-surface-container-lowest" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm text-primary font-semibold truncate">
                            {d.full_name}
                          </span>
                          <span className="text-xs text-secondary font-semibold">
                            {d.rating || 5.0} ★ • Senior Chauffeur
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteDriver(d.id, d.full_name)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-on-surface-variant hover:text-red-700 hover:bg-red-50 transition-all"
                          title="Remove Chauffeur"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                      <div className="text-xs text-on-surface-variant space-y-1">
                        <div className="flex justify-between">
                          <span>Assigned:</span>{" "}
                          <span className="font-medium text-primary truncate max-w-[140px]">
                            {d.assigned_vehicle || "Standby"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shift:</span>{" "}
                          <span className="text-emerald-700 font-semibold">
                            {d.status || "Active On Shift"}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
                        <a
                          href={`tel:${d.phone}`}
                          className="text-secondary hover:underline font-semibold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">
                            call
                          </span>
                          Call
                        </a>
                        <span className="text-primary font-mono">
                          {d.badge_number || "CH-400"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 6: VIP MEMBER MANAGEMENT (CRITICAL USER REQUIREMENT) */}
          {activeTab === "vip" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 sm:p-6 shadow-sm border border-surface-container/40 flex flex-col gap-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-700 font-bold">
                    User Governance &amp; Privilege Protocol
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-primary font-semibold mt-0.5">
                    Client Membership &amp; VIP Status Administration
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
                    Newly registered users default to <strong>Member</strong>{" "}
                    status. Only fleet administrators can promote clients to VIP
                    tiers based on annual charters and security profile
                    requirements.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                  <span className="material-symbols-outlined text-base text-amber-600">
                    shield
                  </span>
                  <span>Admin Privilege Only</span>
                </div>
              </div>

              {/* User Directory Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-on-surface-variant uppercase tracking-wider bg-surface-container-low/70">
                      <th className="py-3 px-4 rounded-l-lg">Client Name</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Current Tier</th>
                      <th className="py-3 px-4 rounded-r-lg text-right">
                        Change / Promote VIP Tier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container/50">
                    {userList.map((u) => {
                      const currentTier = u.vip_tier || "standard";
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-surface-container-low/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-primary">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-primary">
                                {u.full_name
                                  ? u.full_name.charAt(0).toUpperCase()
                                  : "M"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-primary">
                                  {u.full_name || "Registered Member"}
                                </span>
                                <span className="text-[10px] text-on-surface-variant">
                                  UUID: {u.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-on-surface">
                            {u.phone || (
                              <span className="text-on-surface-variant italic">
                                No phone yet
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                currentTier === "standard" ||
                                currentTier === "member"
                                  ? "bg-surface-container text-on-surface"
                                  : currentTier === "executive"
                                    ? "bg-secondary-fixed text-on-secondary-fixed"
                                    : currentTier === "first_class"
                                      ? "bg-amber-100 text-amber-900"
                                      : "bg-purple-100 text-purple-900"
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">
                                verified
                              </span>
                              {currentTier === "standard" ||
                              currentTier === "member"
                                ? "Member"
                                : currentTier === "executive"
                                  ? "VIP Executive"
                                  : currentTier === "first_class"
                                    ? "VIP First Class"
                                    : "VIP Diplomatic"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                disabled={updatingUserId === u.id}
                                value={currentTier}
                                onChange={(e) =>
                                  handleUpdateTier(u.id, e.target.value)
                                }
                                className="h-8 px-2.5 rounded-lg bg-surface-container-low border border-surface-container text-xs font-semibold text-primary focus:outline-none focus:border-secondary cursor-pointer disabled:opacity-50"
                              >
                                <option value="standard">
                                  Member (Default)
                                </option>
                                <option value="executive">VIP Executive</option>
                                <option value="first_class">
                                  VIP First Class
                                </option>
                                <option value="diplomatic">
                                  VIP Diplomatic
                                </option>
                              </select>
                              {vipFeedback && vipFeedback.id === u.id && (
                                <span className="text-[11px] font-medium text-emerald-700 animate-in fade-in">
                                  {vipFeedback.text}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 7: REVENUE & INVOICES */}
          {activeTab === "revenue" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/40">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Financial Ledger
                  </span>
                  <h3 className="font-serif text-xl text-primary font-semibold">
                    Settlement Audit &amp; Revenue Ledger
                  </h3>
                </div>
                <span className="text-xs text-on-surface-variant">
                  Billing Cycle: Oct 2026
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    Gross Charter Billings
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    {paymentSummary?.total || "₦0"}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      trending_up
                    </span>{" "}
                    {paymentLogs.length > 0
                      ? "+14.2% month-on-month"
                      : "Awaiting Settlements"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    100% Upfront Verified Settlements
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    {paymentSummary?.total || "₦0"}
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    Zero Outstanding Receivables
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    Verified Transactions
                  </span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    {paymentLogs.length} Verified
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    100% Gateway Reconciliation
                  </span>
                </div>
              </div>

              {/* Paystack Payment Transaction Audit Trail */}
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">
                      receipt_long
                    </span>
                    <h4 className="font-title-md text-base text-primary font-semibold">
                      Paystack Payment Logs &amp; Gateway Audit Trail
                    </h4>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {paymentLogs.length} Records Logged
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-surface-container">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-surface-container text-on-surface-variant uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 font-semibold">
                          Payment Ref / Code
                        </th>
                        <th className="py-3 px-4 font-semibold">Customer</th>
                        <th className="py-3 px-4 font-semibold">Vehicle</th>
                        <th className="py-3 px-4 font-semibold">Channel</th>
                        <th className="py-3 px-4 font-semibold">Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">
                          Settled At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-y-surface-container text-primary">
                      {paymentLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-6 text-center text-on-surface-variant"
                          >
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        paymentLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-surface-container-low/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-mono font-semibold text-secondary">
                                  {log.reference}
                                </span>
                                <span className="text-[10px] text-on-surface-variant">
                                  {log.booking_code}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-primary">
                                  {log.customer_name}
                                </span>
                                <span className="text-[10px] text-on-surface-variant">
                                  {log.customer_email}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-on-surface">
                              {log.vehicle_name || "Range Rover Autobiography"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] uppercase font-semibold">
                                <span className="material-symbols-outlined text-xs text-secondary">
                                  {log.channel === "card"
                                    ? "credit_card"
                                    : "account_balance"}
                                </span>
                                {log.channel || "card"}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-primary">
                              {log.amount_formatted ||
                                `₦${Number(log.amount).toLocaleString()}`}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-xs">
                                  check_circle
                                </span>
                                Settled
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-on-surface-variant text-[11px]">
                              {new Date(log.paid_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB 8: CONCIERGE REQUESTS & REFUNDS (CANCELLATIONS & EXTENSIONS) */}
          {activeTab === "requests" && (
            <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/40 flex flex-col gap-5 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      Concierge Operations Desk
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold">
                      {bookingRequests.filter((r) => r.status === "pending").length}{" "}
                      Pending Review
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-primary font-semibold mt-0.5">
                    Guest Requests &amp; Manual Refund Clearance
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reloadRequests}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Refresh Queue
                  </button>
                </div>
              </div>

              {/* Action Success Toast */}
              {requestActionSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3 shadow-sm animate-in fade-in">
                  <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0">
                    check_circle
                  </span>
                  <div className="flex-1 font-semibold">
                    {requestActionSuccess}
                  </div>
                </div>
              )}

              {/* Quick KPI Quartet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-amber-900 font-semibold">
                    Pending Cancellations
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-950">
                    {
                      bookingRequests.filter(
                        (r) =>
                          r.status === "pending" && r.type === "cancellation",
                      ).length
                    }
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Requires phone contact &amp; wire refund
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-blue-900 font-semibold">
                    Pending Extensions
                  </span>
                  <span className="text-2xl font-bold font-mono text-blue-950">
                    {
                      bookingRequests.filter(
                        (r) =>
                          r.status === "pending" && r.type === "extension",
                      ).length
                    }
                  </span>
                  <span className="text-[11px] text-blue-800">
                    Chauffeur &amp; corridor continuity
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Total Value in Refund Review
                  </span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    ₦
                    {bookingRequests
                      .filter(
                        (r) =>
                          r.status === "pending" && r.type === "cancellation",
                      )
                      .reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0)
                      .toLocaleString()}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Subject to executive sign-off
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    Transactional Emails
                  </span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {emailLogs.length} Sent
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Resend / SMTP &bull; 100% Logged
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-surface-container/30">
                <button
                  onClick={() => setRequestFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    requestFilter === "pending"
                      ? "bg-primary text-white"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  Pending Action (
                  {bookingRequests.filter((r) => r.status === "pending").length})
                </button>
                <button
                  onClick={() => setRequestFilter("cancellation")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    requestFilter === "cancellation"
                      ? "bg-primary text-white"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  Cancellations Only (
                  {bookingRequests.filter((r) => r.type === "cancellation").length}
                  )
                </button>
                <button
                  onClick={() => setRequestFilter("extension")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    requestFilter === "extension"
                      ? "bg-primary text-white"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  Extensions Only (
                  {bookingRequests.filter((r) => r.type === "extension").length})
                </button>
                <button
                  onClick={() => setRequestFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    requestFilter === "all"
                      ? "bg-primary text-white"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  All Requests ({bookingRequests.length})
                </button>
              </div>

              {/* Requests List */}
              {(() => {
                const displayedRequests = bookingRequests.filter((r) => {
                  if (requestFilter === "pending") return r.status === "pending";
                  if (requestFilter === "cancellation")
                    return r.type === "cancellation";
                  if (requestFilter === "extension")
                    return r.type === "extension";
                  return true;
                });

                if (displayedRequests.length === 0) {
                  return (
                    <div className="py-16 px-4 text-center rounded-2xl bg-surface-container-low/40 border border-dashed border-surface-container flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-secondary">
                        done_all
                      </span>
                      <h4 className="font-serif text-lg text-primary font-semibold">
                        No Requests Awaiting Review
                      </h4>
                      <p className="text-xs text-on-surface-variant max-w-md">
                        All guest cancellation requests have been settled and all
                        itinerary extensions have been resolved by the operations
                        desk.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayedRequests.map((req) => {
                      const isPending = req.status === "pending";
                      const isCancellation = req.type === "cancellation";
                      const cleanPhone = (req.guestPhone || "").replace(/\D/g, "");

                      return (
                        <div
                          key={req.id}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                            isPending
                              ? isCancellation
                                ? "bg-amber-500/[0.04] border-amber-500/30 shadow-sm"
                                : "bg-blue-500/[0.04] border-blue-500/30 shadow-sm"
                              : "bg-surface-container-low border-surface-container/60 opacity-90"
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            {/* Card Top Pill Bar */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isCancellation
                                    ? "bg-red-500/10 text-red-700 border border-red-500/20"
                                    : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                                }`}
                              >
                                {isCancellation
                                  ? "Cancellation & Refund Request"
                                  : `Extension Request (+${
                                      req.extraDays || 1
                                    } Days)`}
                              </span>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                                  req.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : req.status === "refunded_and_cancelled"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : req.status === "approved"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {req.status === "pending"
                                  ? "Pending Review"
                                  : req.status === "refunded_and_cancelled"
                                    ? "Refunded & Cancelled"
                                    : req.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Client & Booking Summary */}
                            <div className="flex items-start justify-between gap-3 pt-1">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif text-base text-primary font-bold">
                                    {req.guestName}
                                  </h4>
                                  <span className="px-2 py-0.2 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase">
                                    {req.vipTier || "Member"}
                                  </span>
                                </div>
                                <div className="text-xs text-on-surface-variant mt-0.5 font-mono">
                                  Booking:{" "}
                                  <strong className="text-primary">
                                    {req.bookingCode}
                                  </strong>{" "}
                                  &bull; {req.vehicleName}
                                </div>
                              </div>

                              <div className="text-right text-[11px] text-on-surface-variant shrink-0">
                                {new Date(req.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>

                            {/* Request Details Box */}
                            {isCancellation ? (
                              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-black/[0.04] text-xs flex flex-col gap-2">
                                <div>
                                  <span className="text-[10px] uppercase font-semibold text-on-surface-variant">
                                    Client Stated Reason:
                                  </span>
                                  <p className="font-medium text-primary mt-0.5">
                                    &ldquo;{req.reason}&rdquo;
                                  </p>
                                </div>

                                {req.notes && (
                                  <div>
                                    <span className="text-[10px] uppercase font-semibold text-on-surface-variant">
                                      Additional Notes:
                                    </span>
                                    <p className="text-on-surface-variant mt-0.5">
                                      {req.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Bank Details Box */}
                                <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container/60 grid grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-on-surface-variant block text-[10px] uppercase">
                                      Refund Destination
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {req.refundBank || "Zenith Bank Plc"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-on-surface-variant block text-[10px] uppercase">
                                      Account NUBAN
                                    </span>
                                    <span className="font-mono font-bold text-primary">
                                      {req.refundAccount || "1029384756"}
                                    </span>
                                  </div>
                                  <div className="col-span-2 pt-1 border-t border-surface-container flex items-center justify-between">
                                    <span className="text-on-surface-variant">
                                      Beneficiary:{" "}
                                      <strong className="text-primary">
                                        {req.refundAccountName || req.guestName}
                                      </strong>
                                    </span>
                                    <span className="font-mono font-bold text-emerald-700 text-xs">
                                      Refund:{" "}
                                      {req.refundAmountFormatted ||
                                        "₦1,350,000"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-black/[0.04] text-xs flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-on-surface-variant block text-[10px] uppercase">
                                      Requested Duration
                                    </span>
                                    <span className="font-bold text-primary text-xs">
                                      +{req.extraDays || 1} Extra Day(s)
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-on-surface-variant block text-[10px] uppercase">
                                      Proposed Return
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {req.newReturnDate || "Nov 19, 2024"}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-semibold text-on-surface-variant">
                                    Reason &amp; Itinerary:
                                  </span>
                                  <p className="font-medium text-primary mt-0.5">
                                    {req.reason}
                                  </p>
                                </div>
                                {req.notes && (
                                  <p className="text-[11px] text-on-surface-variant">
                                    {req.notes}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Resolution Notes if resolved */}
                            {req.adminNotes && (
                              <div className="p-2.5 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant">
                                <strong className="text-primary block text-[10px] uppercase">
                                  Director Clearance Note:
                                </strong>
                                {req.adminNotes}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons Bar */}
                          <div className="pt-2 border-t border-surface-container/60 flex flex-wrap items-center justify-between gap-2">
                            {/* 1-Click Call & WhatsApp Direct Outreach */}
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${req.guestPhone || "+2348023456789"}`}
                                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors flex items-center gap-1.5"
                                title="Call Guest directly"
                              >
                                <span className="material-symbols-outlined text-sm text-secondary">
                                  call
                                </span>
                                Call Guest
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Hello ${req.guestName}, this is La Planta Prime VIP Concierge reaching out regarding your ${
                                    isCancellation ? "cancellation" : "extension"
                                  } request for booking ${req.bookingCode}.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition-colors flex items-center gap-1.5"
                                title="Chat on WhatsApp"
                              >
                                <span className="material-symbols-outlined text-sm text-emerald-600">
                                  chat
                                </span>
                                WhatsApp
                              </a>
                            </div>

                            {/* Primary Operational Decisions */}
                            {isPending && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRejectRequest(req)}
                                  disabled={processingRequestId === req.id}
                                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-red-50 hover:text-red-700 text-xs font-semibold text-on-surface-variant transition-colors"
                                >
                                  Decline
                                </button>

                                {isCancellation ? (
                                  <button
                                    type="button"
                                    onClick={() => setRefundActionModal(req)}
                                    disabled={processingRequestId === req.id}
                                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                                  >
                                    <span className="material-symbols-outlined text-sm">
                                      check
                                    </span>
                                    Confirm Cancellation &amp; Refund
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveExtension(req)}
                                    disabled={processingRequestId === req.id}
                                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                                  >
                                    <span className="material-symbols-outlined text-sm">
                                      check
                                    </span>
                                    Approve Extension (+{req.extraDays || 1}d)
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Transactional Email Audit Ledger Sub-Section */}
              <div className="mt-6 pt-6 border-t border-surface-container/40 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-serif text-lg text-primary font-bold">
                      Transactional Email Dispatch Ledger
                    </h4>
                    <p className="text-xs text-on-surface-variant">
                      Audit trail of VIP Welcome, Booking Confirmation, and
                      Cancellation Notice emails sent via Resend REST API or
                      Nodemailer SMTP.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-secondary font-semibold">
                    Provider: Resend / Luxury Simulation
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-surface-container/60 bg-surface-container-low/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Email Subject &bull; Type</th>
                        <th className="py-3 px-4">Gateway</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Sent At</th>
                        <th className="py-3 px-4 text-right">Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container/40">
                      {emailLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-on-surface-variant italic"
                          >
                            No transactional emails logged yet. Emails are
                            dispatched upon signup, booking payment, or
                            cancellation.
                          </td>
                        </tr>
                      ) : (
                        emailLogs.map((mail) => (
                          <tr
                            key={mail.id}
                            className="hover:bg-surface-container/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-medium text-primary">
                              {mail.to}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-primary truncate max-w-xs">
                                  {mail.subject}
                                </span>
                                <span className="text-[10px] uppercase font-mono text-secondary">
                                  {mail.type}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px]">
                              {mail.provider}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                {mail.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                              {new Date(mail.sentAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {mail.html ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewingEmail(mail)}
                                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-secondary hover:text-white text-[11px] font-semibold text-primary transition-colors"
                                >
                                  Preview HTML
                                </button>
                              ) : (
                                <span className="text-on-surface-variant/60 text-[11px]">
                                  &mdash;
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-surface-container-lowest border-t border-surface-container px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">
                La Planta Fleet Command Console
              </span>
              <span>•</span>
            </div>
            <div className="flex items-center gap-4">
              <span>&copy; 2026 La Planta Luxury Car Hire Ltd.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/70 backdrop-blur-sm"
            onClick={() => setIsBroadcastModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container p-6 flex flex-col gap-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  campaign
                </span>
                <h3 className="font-serif text-lg text-primary font-semibold">
                  Fleet Chauffeur Broadcast
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-emerald-600">
                  check_circle
                </span>
                <span>
                  Broadcast message dispatched to 14 active chauffeurs!
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSendBroadcast}
                className="flex flex-col gap-4 text-xs"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Target Operational Corridor
                  </label>
                  <select
                    value={broadcastCorridor}
                    onChange={(e) => setBroadcastCorridor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container font-medium text-xs"
                  >
                    <option>Lagos &amp; Abuja All Corridors</option>
                    <option>Lagos VI &amp; Lekki Corridor</option>
                    <option>Lagos MMA Airport Corridor</option>
                    <option>Abuja FCT Central Corridor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                    Broadcast Message / Advisory
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="e.g. VIP convoy staging at Wings Tower valet forecourt. Maintain defensive protocol..."
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-secondary text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all shadow-md mt-2"
                >
                  Dispatch Advisory Notice
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Vehicle Modal */}
      {(isAddVehicleModalOpen || editingVehicle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/75 backdrop-blur-sm"
            onClick={() => {
              setIsAddVehicleModalOpen(false);
              setEditingVehicle(null);
            }}
          />
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container p-6 flex flex-col gap-5 z-10 animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">
                    directions_car
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-primary font-semibold">
                    {editingVehicle
                      ? "Edit Vehicle Details"
                      : "Register New Automobile"}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    {editingVehicle
                      ? `Updating ${editingVehicle.name || `${editingVehicle.brand} ${editingVehicle.model}`}`
                      : "Add a genuine executive car, pricing, specifications, and imagery to the live catalog."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddVehicleModalOpen(false);
                  setEditingVehicle(null);
                }}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {vehicleFormError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2 font-medium">
                <span className="material-symbols-outlined text-red-600 text-base">
                  error
                </span>
                <span>{vehicleFormError}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveVehicle}
              className="flex flex-col gap-4 text-xs"
            >
              {/* Row 1: Brand, Model, Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.brand}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        brand: e.target.value,
                      })
                    }
                    placeholder="e.g. Mercedes-Benz, Land Rover"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.model}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        model: e.target.value,
                      })
                    }
                    placeholder="e.g. Maybach S 580, Autobiography"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Model Year
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2030}
                    value={vehicleFormData.year}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        year: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Row 2: License Plate, Color, Transmission */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.license_plate}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        license_plate: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. LAG-892-XZ"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono font-bold text-secondary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Exterior Color
                  </label>
                  <input
                    type="text"
                    value={vehicleFormData.color}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        color: e.target.value,
                      })
                    }
                    placeholder="e.g. Obsidian Black, Santorini Black"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Transmission
                  </label>
                  <select
                    value={vehicleFormData.transmission}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        transmission: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Category, Armored Level, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Category
                  </label>
                  <select
                    value={vehicleFormData.category}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        category: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="Executive SUV">Executive SUV</option>
                    <option value="Ultra-Luxury Sedan">
                      Ultra-Luxury Sedan
                    </option>
                    <option value="Armored Transport">Armored Transport</option>
                    <option value="VIP Minivan">VIP Minivan</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Armored Level
                  </label>
                  <select
                    value={vehicleFormData.armored_level}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        armored_level: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="None">None (Standard Luxury)</option>
                    <option value="B6 Ballistic">
                      B6 Ballistic (AK-47 / 7.62mm Protection)
                    </option>
                    <option value="B7 VR7">
                      B7 VR7 (Maximum Armor Defense)
                    </option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Operational Status
                  </label>
                  <select
                    value={vehicleFormData.status}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        status: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  >
                    <option value="available">Available (In Yard)</option>
                    <option value="reserved">
                      Reserved (Upcoming Charter)
                    </option>
                    <option value="in_transit">On Trip (Active Charter)</option>
                    <option value="maintenance">
                      Maintenance (Service Bay)
                    </option>
                  </select>
                </div>
              </div>

              {/* Row 4: Daily Rate NGN, Daily Rate USD, Operational Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Daily Rate (₦ NGN) *
                  </label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={vehicleFormData.daily_rate_ngn}
                    onChange={(e) => {
                      const ngn = Number(e.target.value);
                      setVehicleFormData({
                        ...vehicleFormData,
                        daily_rate_ngn: ngn,
                        daily_rate_usd: Math.round(ngn / 1500),
                      });
                    }}
                    placeholder="e.g. 550000"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono font-bold text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Daily Rate ($ USD)
                  </label>
                  <input
                    type="number"
                    value={vehicleFormData.daily_rate_usd}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        daily_rate_usd: Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 380"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Operational Hub / Location
                  </label>
                  <input
                    type="text"
                    value={vehicleFormData.current_location_name}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        current_location_name: e.target.value,
                      })
                    }
                    placeholder="e.g. Victoria Island Operations Hub"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Row 5: Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Guest Capacity (Seats)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={vehicleFormData.seats}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        seats: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Luggage Capacity (Cases)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={vehicleFormData.luggage_capacity}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        luggage_capacity: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Row 5.5: Telematics Tracker & Dedicated GSM SIM Configuration */}
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface-container-low/70 border border-secondary/20">
                <div className="flex items-center justify-between">
                  <label className="text-primary uppercase font-bold text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-base">
                      satellite_alt
                    </span>
                    Dedicated Telematics Tracker &amp; SIM Card
                  </label>
                  <span className="text-[10px] text-secondary font-semibold">
                    Autonomous 60s Ping Target
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Each vehicle has its own dedicated hardware GPS tracker SIM card. The system dispatches automated cellular &amp; SMS ping commands directly to this SIM.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                      Tracker Device Code
                    </label>
                    <input
                      type="text"
                      value={vehicleFormData.tracker_code}
                      onChange={(e) =>
                        setVehicleFormData({
                          ...vehicleFormData,
                          tracker_code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. TRK-892-SIM or TRK-MAYBACH-01"
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs font-mono font-medium text-primary focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                      Tracker SIM Phone Number (MSISDN) *
                    </label>
                    <input
                      type="tel"
                      value={vehicleFormData.tracker_sim_phone}
                      onChange={(e) =>
                        setVehicleFormData({
                          ...vehicleFormData,
                          tracker_sim_phone: e.target.value,
                        })
                      }
                      placeholder="e.g. +2348140313381"
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs font-mono font-bold text-primary focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Error Notice */}
              {imageUploadError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  <span>{imageUploadError}</span>
                </div>
              )}

              {/* Row 6: Hero / Primary Image Direct Upload */}
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container">
                <div className="flex items-center justify-between">
                  <label className="text-primary uppercase font-bold text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-base">
                      photo_camera
                    </span>
                    Hero / Primary Vehicle Photo
                  </label>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    Displayed on catalog cards &amp; headers
                  </span>
                </div>

                {/* Upload from Laptop Button & Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="hero-file-input"
                    className="hidden"
                    onChange={handleHeroUpload}
                    disabled={isUploadingHero}
                  />

                  <label
                    htmlFor="hero-file-input"
                    className={`cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed border-secondary/40 hover:border-secondary bg-surface-container-lowest flex items-center gap-2.5 text-xs font-semibold text-primary transition-all shadow-sm ${
                      isUploadingHero ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isUploadingHero ? (
                      <>
                        <span className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Uploading from Device...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-secondary text-base">
                          upload_file
                        </span>
                        <span>Upload Photo from Laptop</span>
                      </>
                    )}
                  </label>

                  {/* Or Direct URL Input */}
                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="url"
                      value={vehicleFormData.hero_image_url}
                      onChange={(e) =>
                        setVehicleFormData({
                          ...vehicleFormData,
                          hero_image_url: e.target.value,
                        })
                      }
                      placeholder="Or paste external photo URL..."
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                    />
                    {vehicleFormData.hero_image_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setVehicleFormData({
                            ...vehicleFormData,
                            hero_image_url: "",
                          })
                        }
                        className="px-2 py-1 text-[10px] text-destructive hover:underline shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Thumbnail Preview */}
                {vehicleFormData.hero_image_url && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-surface-container bg-surface-container mt-1 group">
                    <img
                      src={vehicleFormData.hero_image_url}
                      alt="Hero Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Primary Photo Active
                    </div>
                  </div>
                )}
              </div>

              {/* Row 7: Gallery Images Direct Upload (Multiple Files) */}
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container">
                <div className="flex items-center justify-between">
                  <label className="text-primary uppercase font-bold text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-base">
                      collections
                    </span>
                    Vehicle Gallery Photos (Multi-Angle &amp; Interior)
                  </label>
                  <span className="text-[10px] text-secondary font-semibold">
                    {vehicleFormData.gallery_image_urls
                      ? `${vehicleFormData.gallery_image_urls.split("\n").filter((s) => s.trim().length > 0).length} Photos Attached`
                      : "0 Photos"}
                  </span>
                </div>

                {/* Direct File Picker (Multiple) */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="gallery-file-input"
                    className="hidden"
                    onChange={handleGalleryUpload}
                    disabled={isUploadingGallery}
                  />

                  <label
                    htmlFor="gallery-file-input"
                    className={`cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed border-secondary/40 hover:border-secondary bg-surface-container-lowest flex items-center gap-2.5 text-xs font-semibold text-primary transition-all shadow-sm ${
                      isUploadingGallery ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isUploadingGallery ? (
                      <>
                        <span className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Uploading Selected Photos...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-secondary text-base">
                          add_photo_alternate
                        </span>
                        <span>Upload Multiple Photos from Laptop</span>
                      </>
                    )}
                  </label>

                  <span className="text-[11px] text-on-surface-variant">
                    Select 2–8 images (e.g. side angles, dashboard, rear
                    executive lounge, trunk)
                  </span>
                </div>

                {/* Gallery Thumbnails Grid with Delete (✕) on each */}
                {vehicleFormData.gallery_image_urls &&
                  vehicleFormData.gallery_image_urls
                    .split("\n")
                    .filter((s) => s.trim().length > 0).length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                      {vehicleFormData.gallery_image_urls
                        .split("\n")
                        .filter((s) => s.trim().length > 0)
                        .map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group h-20 rounded-lg overflow-hidden border border-surface-container bg-surface-container"
                          >
                            <img
                              src={url.trim()}
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              title="Remove Photo"
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 hover:bg-destructive text-white flex items-center justify-center transition-colors shadow-md text-xs font-bold"
                            >
                              ✕
                            </button>
                            <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[9px] text-white">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                {/* Collapsible raw URLs textarea for advanced editing */}
                <details className="text-[10px] text-on-surface-variant pt-1 cursor-pointer">
                  <summary className="hover:text-primary transition-colors">
                    Advanced: View or paste raw image URLs
                  </summary>
                  <textarea
                    rows={2}
                    value={vehicleFormData.gallery_image_urls}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        gallery_image_urls: e.target.value,
                      })
                    }
                    placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                    className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-[11px] font-mono mt-1.5 focus:outline-none focus:border-secondary"
                  />
                </details>
              </div>

              {/* Row 8: Features */}
              <div className="flex flex-col gap-1">
                <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                  Executive Features (Comma-separated)
                </label>
                <input
                  type="text"
                  value={vehicleFormData.features}
                  onChange={(e) =>
                    setVehicleFormData({
                      ...vehicleFormData,
                      features: e.target.value,
                    })
                  }
                  placeholder="Starlink Wi-Fi, Executive Rear Seating, Chilled Console, Privacy Glass, Massage Seats"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddVehicleModalOpen(false);
                    setEditingVehicle(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVehicle}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingVehicle
                    ? "Saving Vehicle..."
                    : editingVehicle
                      ? "Save Changes"
                      : "Register Automobile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Chauffeur Modal */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/75 backdrop-blur-sm"
            onClick={() => setIsAddDriverModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container p-6 flex flex-col gap-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">
                    person_add
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-primary font-semibold">
                    Enroll Executive Chauffeur
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Add a vetted, licensed chauffeur to the operational roster.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDriverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {driverFormError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium">
                {driverFormError}
              </div>
            )}

            <form
              onSubmit={handleCreateDriver}
              className="flex flex-col gap-4 text-xs"
            >
              <div className="flex flex-col gap-1">
                <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={driverFormData.full_name}
                  onChange={(e) =>
                    setDriverFormData({
                      ...driverFormData,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Segun Alabi"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverFormData.phone}
                    onChange={(e) =>
                      setDriverFormData({
                        ...driverFormData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+234 803 000 0000"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                    Badge Number
                  </label>
                  <input
                    type="text"
                    value={driverFormData.badge_number}
                    onChange={(e) =>
                      setDriverFormData({
                        ...driverFormData,
                        badge_number: e.target.value,
                      })
                    }
                    placeholder="e.g. CH-408"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono font-medium text-primary focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                  Driver License Number *
                </label>
                <input
                  type="text"
                  required
                  value={driverFormData.license_number}
                  onChange={(e) =>
                    setDriverFormData({
                      ...driverFormData,
                      license_number: e.target.value,
                    })
                  }
                  placeholder="e.g. DL-LA-992140"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-mono text-primary focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-on-surface-variant uppercase font-semibold text-[10px]">
                  Security Clearance Level
                </label>
                <select
                  value={driverFormData.security_clearance_level}
                  onChange={(e) =>
                    setDriverFormData({
                      ...driverFormData,
                      security_clearance_level: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container text-xs font-medium text-primary focus:outline-none focus:border-secondary"
                >
                  <option value="Airside VIP & Diplomatic Escort">
                    Airside VIP &amp; Diplomatic Escort
                  </option>
                  <option value="Executive Chauffeur Certified">
                    Executive Chauffeur Certified
                  </option>
                  <option value="Defensive Armed Escort">
                    Defensive Armed Escort
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setIsAddDriverModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDriver}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingDriver ? "Enrolling..." : "Enroll Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM CANCELLATION & MANUAL REFUND MODAL */}
      {refundActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/75 backdrop-blur-sm"
            onClick={() => setRefundActionModal(null)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container p-6 sm:p-7 flex flex-col gap-5 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    price_check
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-primary font-bold">
                    Authorize Cancellation &amp; Manual Refund
                  </h3>
                  <span className="text-[11px] text-on-surface-variant font-mono">
                    Booking {refundActionModal.bookingCode} &bull;{" "}
                    {refundActionModal.guestName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRefundActionModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form
              onSubmit={handleConfirmCancellationAndRefund}
              className="flex flex-col gap-4 text-xs"
            >
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-950 flex flex-col gap-2">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>Refund Amount to Wire:</span>
                  <span className="font-mono text-base text-amber-950">
                    {refundActionModal.refundAmountFormatted || "₦1,350,000"}
                  </span>
                </div>
                <div className="text-[11px] text-amber-900/90 leading-relaxed border-t border-amber-500/20 pt-2">
                  <span>Destination Account: </span>
                  <strong>
                    {refundActionModal.refundBank || "Zenith Bank"} &bull;{" "}
                    {refundActionModal.refundAccount || "1029384756"} (
                    {refundActionModal.refundAccountName ||
                      refundActionModal.guestName}
                    )
                  </strong>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                  Bank Wire Transfer Reference Code *
                </label>
                <input
                  type="text"
                  required
                  value={refundWireReference}
                  onChange={(e) => setRefundWireReference(e.target.value)}
                  placeholder="e.g. ZENITH-WIRE-992140 or NIP-TX-8842"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container font-mono text-xs text-primary font-bold focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-on-surface-variant uppercase font-semibold text-[11px]">
                  Internal Settlement &amp; Operations Notes
                </label>
                <textarea
                  rows={2}
                  value={refundInternalNotes}
                  onChange={(e) => setRefundInternalNotes(e.target.value)}
                  placeholder="Verified identity by phone with client. Chauffeur notified..."
                  className="w-full p-3 rounded-lg bg-surface-container-low border border-surface-container text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low/70 text-[11px] text-on-surface-variant leading-relaxed">
                <strong className="block text-primary text-[10px] uppercase font-bold mb-1">
                  Automated Actions on Confirmation:
                </strong>
                &bull; Vehicle availability is released back to active fleet.
                <br />
                &bull; Booking record updated to &lsquo;cancelled / refunded&rsquo;.
                <br />
                &bull; VIP Cancellation &amp; Refund Notice email dispatched to{" "}
                <span className="font-mono text-primary font-semibold">
                  {refundActionModal.guestEmail}
                </span>
                .
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setRefundActionModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRequestId === refundActionModal.id}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {processingRequestId === refundActionModal.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Refund...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        check
                      </span>
                      Confirm Cancellation &amp; Refund
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTIONAL EMAIL HTML PREVIEW MODAL */}
      {previewingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-primary/75 backdrop-blur-sm"
            onClick={() => setPreviewingEmail(null)}
          />
          <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">
                    mark_email_read
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-base text-primary font-bold truncate max-w-md">
                    {previewingEmail.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                    <span>
                      To: <strong>{previewingEmail.to}</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono uppercase text-secondary">
                      {previewingEmail.type}
                    </span>
                    <span>&bull;</span>
                    <span className="font-mono">{previewingEmail.provider}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewingEmail(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#07090e]">
              <iframe
                title="Email Preview"
                srcDoc={previewingEmail.html}
                className="w-full min-h-[550px] border-0 rounded-xl bg-[#07090e]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
