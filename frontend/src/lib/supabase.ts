import { createClient } from "@supabase/supabase-js";

// Supabase Environment Credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Singleton Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==============================================================================
// TYPE DEFINITIONS CORRESPONDING TO SUPABASE DATABASE SCHEMA
// ==============================================================================

export type UserRole = "admin" | "client" | "driver";
export type VipTier = "standard" | "executive" | "first_class" | "diplomatic";
export type VehicleStatus = "available" | "reserved" | "in_transit" | "maintenance" | "decommissioned";
export type ServiceType = "chauffeur_driven" | "self_drive" | "airport_transfer" | "diplomatic_escort";
export type BookingStatus = "pending" | "confirmed" | "in_transit" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "partially_paid";
export type PaymentGateway = "paystack" | "flutterwave" | "bank_transfer" | "crypto" | "pos_terminal";
export type InspectionType = "pickup_handover" | "return_handover" | "routine";
export type TrackerStatus = "online" | "offline" | "standby" | "tamper_alert";
export type PingTriggerType = "auto_periodic" | "manual_admin" | "client_request" | "geofence_trigger" | "ignition_alert";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string | null;
  vip_tier: VipTier;
  company_name?: string | null;
  avatar_url?: string | null;
  identification_number?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  license_number: string;
  license_expiry: string;
  badge_number?: string | null;
  vetting_status: boolean;
  security_clearance_level: string;
  rating: number;
  total_trips: number;
  avatar_url?: string | null;
  languages: string[];
  certifications: string[];
  is_available: boolean;
  current_status: "available" | "on_trip" | "off_duty";
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string | null;
  color: string;
  category: string;
  armored_level: string;
  daily_rate_ngn: number;
  daily_rate_usd?: number | null;
  hourly_rate_ngn?: number | null;
  seats: number;
  luggage_capacity: number;
  transmission: string;
  engine_spec?: string | null;
  fuel_battery_level: number;
  odometer_km: number;
  status: VehicleStatus;
  features: string[];
  hero_image_url?: string | null;
  gallery_image_urls: string[];
  current_latitude?: number | null;
  current_longitude?: number | null;
  current_location_name: string;
  assigned_tracker_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackerDevice {
  id: string;
  device_code: string;
  imei?: string | null;
  sim_phone_number: string;
  sim_carrier: string;
  tracker_model: string;
  protocol_type: string;
  polling_interval_seconds: number;
  assigned_vehicle_id?: string | null;
  status: TrackerStatus;
  battery_percentage: number;
  signal_rssi_dbm: number;
  last_heartbeat?: string | null;
  last_latitude?: number | null;
  last_longitude?: number | null;
  last_speed_kmh: number;
  last_heading_deg: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  client_id: string;
  vehicle_id: string;
  driver_id?: string | null;
  service_type: ServiceType;
  status: BookingStatus;
  pickup_location: string;
  pickup_datetime: string;
  dropoff_location: string;
  dropoff_datetime: string;
  flight_number?: string | null;
  flight_terminal?: string | null;
  base_price_ngn: number;
  security_deposit_ngn: number;
  protection_plan_ngn: number;
  chauffeur_surcharge_ngn: number;
  total_amount_ngn: number;
  total_amount_usd?: number | null;
  payment_status: PaymentStatus;
  payment_gateway: PaymentGateway;
  payment_reference?: string | null;
  paid_at?: string | null;
  special_instructions?: string | null;
  verification_pin: string;
  qr_pass_token: string;
  is_tarmac_intake_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface TelematicsPing {
  id: string;
  tracker_id: string;
  vehicle_id: string;
  booking_id?: string | null;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude_m?: number | null;
  speed_kmh: number;
  heading_deg: number;
  satellites_count: number;
  gsm_rssi_dbm: number;
  ignition_status: boolean;
  battery_percentage: number;
  trigger_type: PingTriggerType;
  raw_sms_payload?: string | null;
  geocoded_address?: string | null;
  created_at: string;
}

export interface HandoverInspection {
  id: string;
  booking_id: string;
  vehicle_id: string;
  inspector_id: string;
  inspection_type: InspectionType;
  odometer_reading: number;
  fuel_battery_percentage: number;
  exterior_condition: Record<string, any>;
  interior_condition: Record<string, any>;
  photos: string[];
  client_signature_url?: string | null;
  client_acknowledged_at?: string | null;
  inspector_signature_url?: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  subtotal_ngn: number;
  tax_ngn: number;
  security_deposit_ngn: number;
  total_amount_ngn: number;
  currency: string;
  status: string;
  pdf_url?: string | null;
  created_at: string;
  updated_at: string;
}
