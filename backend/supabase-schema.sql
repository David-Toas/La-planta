-- ==============================================================================
-- LA PLANTA PRIME • EXECUTIVE MOBILITY & BESPOKE CHAUFFEUR DISPATCH
-- SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION SCRIPT
-- ==============================================================================
-- Run this entire script in Supabase SQL Editor (All-at-once execution)
-- It creates:
--   1. Extensions & Custom Enum Types
--   2. Tables (Profiles, Drivers, Vehicles, Trackers, Bookings, Telematics, Inspections, Invoices, Audit Logs, Notifications)
--   3. Foreign Key Constraints & Indexes
--   4. Stored Procedures & Automated Triggers (Auth Sync, Auto-location update, Timestamps)
--   5. Row Level Security (RLS) Policies (Admin / Client / Driver isolation)
--   6. Comprehensive Seed Data (Vehicles, Chauffeurs, SIM Trackers, Active Booking #LP-8842, Telematics Logs)
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- SECTION 2: ENUM TYPES
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'client', 'driver');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vip_tier AS ENUM ('standard', 'executive', 'first_class', 'diplomatic');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM ('available', 'reserved', 'in_transit', 'maintenance', 'decommissioned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('chauffeur_driven', 'self_drive', 'airport_transfer', 'diplomatic_escort');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_transit', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded', 'partially_paid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway AS ENUM ('paystack', 'flutterwave', 'bank_transfer', 'crypto', 'pos_terminal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inspection_type AS ENUM ('pickup_handover', 'return_handover', 'routine');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tracker_status AS ENUM ('online', 'offline', 'standby', 'tamper_alert');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ping_trigger_type AS ENUM ('auto_periodic', 'manual_admin', 'client_request', 'geofence_trigger', 'ignition_alert');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ==============================================================================
-- SECTION 3: CORE TABLES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 3.1 PROFILES (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    vip_tier vip_tier NOT NULL DEFAULT 'standard',
    company_name TEXT,
    avatar_url TEXT,
    identification_number TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.2 DRIVERS / CHAUFFEURS (Assigned by Admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    license_number TEXT NOT NULL UNIQUE,
    license_expiry DATE NOT NULL,
    badge_number TEXT UNIQUE, -- e.g. "CH-409"
    vetting_status BOOLEAN NOT NULL DEFAULT true,
    security_clearance_level TEXT NOT NULL DEFAULT 'Airside VIP & Diplomatic Escort',
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    total_trips INT NOT NULL DEFAULT 0,
    avatar_url TEXT,
    languages TEXT[] NOT NULL DEFAULT ARRAY['EN'],
    certifications TEXT[] NOT NULL DEFAULT ARRAY['Master Chauffeur Certified', 'Executive Etiquette', 'Airside VIP Escort'],
    is_available BOOLEAN NOT NULL DEFAULT true,
    current_status TEXT NOT NULL DEFAULT 'available', -- 'available', 'on_trip', 'off_duty'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.3 VEHICLES (Fleet Inventory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g. "Range Rover Autobiography LWB"
    brand TEXT NOT NULL, -- e.g. "Land Rover"
    model TEXT NOT NULL, -- e.g. "Autobiography LWB"
    year INT NOT NULL,
    license_plate TEXT NOT NULL UNIQUE, -- e.g. "LAG-892-XZ"
    vin TEXT UNIQUE,
    color TEXT NOT NULL DEFAULT 'Santorini Black',
    category TEXT NOT NULL DEFAULT 'Executive SUV', -- 'Executive SUV', 'Ultra-Luxury Sedan', 'Armored Transport', 'VIP Minivan'
    armored_level TEXT NOT NULL DEFAULT 'None', -- 'None', 'B6 Ballistic', 'B7 VR7'
    daily_rate_ngn NUMERIC(12,2) NOT NULL,
    daily_rate_usd NUMERIC(10,2),
    hourly_rate_ngn NUMERIC(12,2),
    seats INT NOT NULL DEFAULT 4,
    luggage_capacity INT NOT NULL DEFAULT 4,
    transmission TEXT NOT NULL DEFAULT 'Automatic',
    engine_spec TEXT DEFAULT '4.4L Twin-Turbo V8',
    fuel_battery_level INT NOT NULL DEFAULT 100, -- percentage 0-100
    odometer_km INT NOT NULL DEFAULT 12000,
    status vehicle_status NOT NULL DEFAULT 'available',
    features TEXT[] NOT NULL DEFAULT ARRAY['Starlink Wi-Fi', 'Executive Rear Seating', 'Chilled Refreshments Console', 'Acoustic Privacy Glass', 'Massage Seats'],
    hero_image_url TEXT,
    gallery_image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    current_latitude NUMERIC(10,6),
    current_longitude NUMERIC(10,6),
    current_location_name TEXT NOT NULL DEFAULT 'Victoria Island Operations Hub',
    assigned_tracker_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.4 TRACKER DEVICES (GSM SIM Card Telematics Hardware)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracker_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code TEXT NOT NULL UNIQUE, -- e.g. "TRK-892-SIM"
    imei TEXT UNIQUE,
    sim_phone_number TEXT NOT NULL, -- MSISDN e.g. "+2348037294810"
    sim_carrier TEXT NOT NULL DEFAULT 'MTN Nigeria',
    tracker_model TEXT NOT NULL DEFAULT 'Coban TK103 / Teltonika FMB920',
    protocol_type TEXT NOT NULL DEFAULT 'SMS_NMEA_HYBRID', -- 'SMS_NMEA_HYBRID', 'TCP_GPRS', 'HTTP_POST'
    polling_interval_seconds INT NOT NULL DEFAULT 300, -- default 5 minutes
    assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    status tracker_status NOT NULL DEFAULT 'online',
    battery_percentage INT NOT NULL DEFAULT 98,
    signal_rssi_dbm INT NOT NULL DEFAULT -65,
    last_heartbeat TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    last_latitude NUMERIC(10,6),
    last_longitude NUMERIC(10,6),
    last_speed_kmh NUMERIC(5,2) DEFAULT 0,
    last_heading_deg NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add vehicle foreign key to tracker device
DO $$ BEGIN
    ALTER TABLE public.vehicles
        ADD CONSTRAINT fk_vehicles_tracker
        FOREIGN KEY (assigned_tracker_id) REFERENCES public.tracker_devices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 3.5 BOOKINGS / RESERVATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE, -- e.g. "LP-8842"
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL, -- Nullable for self-drive or pending assignment
    service_type service_type NOT NULL DEFAULT 'chauffeur_driven',
    status booking_status NOT NULL DEFAULT 'pending',
    pickup_location TEXT NOT NULL,
    pickup_datetime TIMESTAMPTZ NOT NULL,
    dropoff_location TEXT NOT NULL,
    dropoff_datetime TIMESTAMPTZ NOT NULL,
    flight_number TEXT,
    flight_terminal TEXT,
    base_price_ngn NUMERIC(12,2) NOT NULL,
    security_deposit_ngn NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    protection_plan_ngn NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    chauffeur_surcharge_ngn NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount_ngn NUMERIC(12,2) NOT NULL,
    total_amount_usd NUMERIC(10,2),
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_gateway payment_gateway NOT NULL DEFAULT 'paystack',
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    special_instructions TEXT,
    verification_pin TEXT NOT NULL DEFAULT '8842-09',
    qr_pass_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    is_tarmac_intake_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.6 TELEMATICS PINGS & GPS LOGS (Decoded SIM coordinates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telematics_pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracker_id UUID NOT NULL REFERENCES public.tracker_devices(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    altitude_m NUMERIC(7,2),
    speed_kmh NUMERIC(5,2) NOT NULL DEFAULT 0,
    heading_deg NUMERIC(5,2) NOT NULL DEFAULT 0,
    satellites_count INT NOT NULL DEFAULT 12,
    gsm_rssi_dbm INT NOT NULL DEFAULT -65,
    ignition_status BOOLEAN NOT NULL DEFAULT true,
    battery_percentage INT NOT NULL DEFAULT 98,
    trigger_type ping_trigger_type NOT NULL DEFAULT 'auto_periodic',
    raw_sms_payload TEXT, -- e.g. "GPRMC:0626.85N,00325.47E,42km/h,98%bat,OK"
    geocoded_address TEXT, -- e.g. "Falomo Bridge, Ikoyi Corridor, Lagos"
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.7 VEHICLE HANDOVER INSPECTIONS (Pickup & Return Audits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.handover_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspection_type inspection_type NOT NULL,
    odometer_reading INT NOT NULL,
    fuel_battery_percentage INT NOT NULL,
    exterior_condition JSONB NOT NULL DEFAULT '{"scratches": false, "dents": false, "windshield": "intact", "rims": "flawless", "notes": "Sanitized and spotless"}'::jsonb,
    interior_condition JSONB NOT NULL DEFAULT '{"cleanliness": "white_glove", "amenities_stocked": true, "starlink_active": true, "notes": "Bottled waters and cold towels prepped"}'::jsonb,
    photos TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    client_signature_url TEXT,
    client_acknowledged_at TIMESTAMPTZ,
    inspector_signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.8 INVOICES & FISCAL LEDGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE, -- e.g. "INV-2024-8842"
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal_ngn NUMERIC(12,2) NOT NULL,
    tax_ngn NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    security_deposit_ngn NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount_ngn NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'pending', 'cancelled'
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.9 ADMIN AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action TEXT NOT NULL, -- e.g. 'ASSIGN_DRIVER', 'UPDATE_VEHICLE_STATUS', 'MANUAL_PING_SIM'
    target_entity TEXT NOT NULL, -- e.g. 'bookings', 'vehicles', 'tracker_devices'
    target_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3.10 NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'booking_update',
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- ==============================================================================
-- SECTION 4: PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(current_status);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON public.drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON public.bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_telematics_vehicle_time ON public.telematics_pings(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telematics_booking ON public.telematics_pings(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_inspections_booking ON public.handover_inspections(booking_id);


-- ==============================================================================
-- SECTION 5: FUNCTIONS & AUTOMATED TRIGGERS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 5.1 Helper Function: Check if current authenticated user is an Admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ------------------------------------------------------------------------------
-- 5.2 Trigger: Automatically update updated_at timestamp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_trackers_updated_at BEFORE UPDATE ON public.tracker_devices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 5.3 Trigger: Automatically create Profile when a new User signs up in Supabase Auth
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        email,
        phone,
        vip_tier,
        avatar_url
    )
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        COALESCE((NEW.raw_user_meta_data->>'vip_tier')::vip_tier, 'standard'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
    RETURN NEW;
END;
$$;

-- Connect trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5.4 Trigger: Auto-update vehicle and tracker live location when a new ping arrives
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_vehicle_telematics_on_ping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update tracker device status
    UPDATE public.tracker_devices
    SET
        last_heartbeat = NEW.timestamp,
        last_latitude = NEW.latitude,
        last_longitude = NEW.longitude,
        last_speed_kmh = NEW.speed_kmh,
        last_heading_deg = NEW.heading_deg,
        battery_percentage = NEW.battery_percentage,
        signal_rssi_dbm = NEW.gsm_rssi_dbm,
        status = 'online'
    WHERE id = NEW.tracker_id;

    -- Update vehicle live coordinates
    UPDATE public.vehicles
    SET
        current_latitude = NEW.latitude,
        current_longitude = NEW.longitude,
        current_location_name = COALESCE(NEW.geocoded_address, current_location_name)
    WHERE id = NEW.vehicle_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_telematics ON public.telematics_pings;
CREATE TRIGGER trg_sync_telematics
    AFTER INSERT ON public.telematics_pings
    FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_telematics_on_ping();


-- ==============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telematics_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6.1 PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.2 VEHICLES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public & authenticated can browse available vehicles"
    ON public.vehicles FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage vehicles"
    ON public.vehicles FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.3 DRIVERS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view assigned or active drivers"
    ON public.drivers FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage drivers"
    ON public.drivers FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.4 TRACKER DEVICES POLICIES (Hardware sensitive)
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can view and manage tracker devices"
    ON public.tracker_devices FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.5 BOOKINGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Clients can view their own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can insert their own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Admins can update and manage all bookings"
    ON public.bookings FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.6 TELEMATICS PINGS POLICIES (Live Tracking Access)
-- ------------------------------------------------------------------------------
CREATE POLICY "Clients can view live pings for their active bookings"
    ON public.telematics_pings FOR SELECT
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = telematics_pings.booking_id
              AND b.client_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.vehicle_id = telematics_pings.vehicle_id
              AND b.client_id = auth.uid()
              AND b.status IN ('in_transit', 'confirmed')
        )
    );

CREATE POLICY "Admins and Service Workers can insert telematics pings"
    ON public.telematics_pings FOR INSERT
    WITH CHECK (true); -- Allows API webhook or admin to ingest GSM pings

-- ------------------------------------------------------------------------------
-- 6.7 HANDOVER INSPECTIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Clients can view inspections for their bookings"
    ON public.handover_inspections FOR SELECT
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = handover_inspections.booking_id AND b.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins and inspectors can create and manage inspections"
    ON public.handover_inspections FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.8 INVOICES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Clients can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Admins have full access to invoices"
    ON public.invoices FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6.9 AUDIT LOGS & NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can mark notifications as read"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());


-- ==============================================================================
-- SECTION 7: SEED DATA (PROD & DEMO READY)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 7.1 Seed Fleet Vehicles
-- ------------------------------------------------------------------------------
INSERT INTO public.vehicles (
    id,
    name,
    brand,
    model,
    year,
    license_plate,
    vin,
    color,
    category,
    armored_level,
    daily_rate_ngn,
    daily_rate_usd,
    hourly_rate_ngn,
    seats,
    luggage_capacity,
    transmission,
    engine_spec,
    fuel_battery_level,
    odometer_km,
    status,
    features,
    hero_image_url,
    current_latitude,
    current_longitude,
    current_location_name
)
VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'Range Rover Autobiography LWB',
    'Land Rover',
    'Autobiography LWB',
    2024,
    'LAG-892-XZ',
    'SALWR2V45RA892019',
    'Santorini Black',
    'Executive SUV',
    'None',
    450000.00,
    350.00,
    45000.00,
    4,
    4,
    'Automatic',
    '4.4L Twin-Turbo V8 (523 hp)',
    88,
    8420,
    'in_transit',
    ARRAY['Starlink Wi-Fi', 'Executive Rear Seating', 'Chilled Refreshments Console', 'Acoustic Privacy Glazing', 'Hot-Stone Massage Seats', 'Rear Entertainment Screens'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAjQFZW12oM7m6WX-Ld8G0mUKKhY9UYh2Dxu2Z0JtzHQLydZ1pQhLIQfFBCJnI4_cRMwvYo_DwsOokYQAfcfiv_nWL_Knw6Ty0utKFAlkOacWozClahF9IaRXrtm81B3LdKnxuclmr4g3Dzr-u6t3h3xYkN6TLsPbB-uM6ukFeBL5TuCzPf7y310sa2o5k5KGjsOSD5UoRs2E-97o3uovNa936deExwyq0nKFvdw82BYpYZVlS5BWLt',
    6.447492,
    3.424310,
    'Falomo Bridge, Ikoyi Corridor, Lagos'
),
(
    'a1b2c3d4-e5f6-7890-abcd-222222222222',
    'Mercedes-Maybach S 580',
    'Mercedes-Benz',
    'Maybach S 580 4MATIC',
    2024,
    'LAG-104-XX',
    'WDD2231761A490123',
    'Obsidian Black / Kalahari Gold',
    'Ultra-Luxury Sedan',
    'None',
    550000.00,
    420.00,
    55000.00,
    4,
    3,
    'Automatic',
    '4.0L V8 Biturbo with EQ Boost',
    95,
    5200,
    'available',
    ARRAY['Burmester 4D High-End Sound', 'First-Class Rear Compartment', 'Silver-Plated Champagne Flutes', 'Active Road Noise Compensation', 'Calf Rest Massage'],
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1200',
    6.428100,
    3.421900,
    'The Wings Towers Forecourt, Victoria Island'
),
(
    'a1b2c3d4-e5f6-7890-abcd-333333333333',
    'Cadillac Escalade ESV Sport Platinum',
    'Cadillac',
    'Escalade ESV Platinum',
    2024,
    'ABJ-771-PR',
    '1GYS4HKL8RR192837',
    'Black Raven',
    'Executive SUV',
    'None',
    420000.00,
    320.00,
    42000.00,
    7,
    6,
    'Automatic',
    '6.2L V8 Engine',
    82,
    14100,
    'available',
    ARRAY['38-inch Curved OLED Display', 'AKG Studio Reference 36-Speaker Audio', 'Super Cruise Available', 'Panoramic Sunroof', 'Rear Seat Entertainment'],
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200',
    6.435200,
    3.438900,
    'Victoria Island Operations Hub'
),
(
    'a1b2c3d4-e5f6-7890-abcd-444444444444',
    'Toyota Land Cruiser 300 Armored B6',
    'Toyota',
    'Land Cruiser 300 GR Sport',
    2024,
    'LAG-552-AR',
    'JTMAC07J404098124',
    'Graphite Metallic',
    'Armored Transport',
    'B6 Ballistic',
    750000.00,
    580.00,
    75000.00,
    5,
    4,
    'Automatic',
    '3.5L Twin-Turbo V6 Armored Upgraded Suspension',
    90,
    9800,
    'available',
    ARRAY['Certified CEN B6 Armor Plating', 'Run-Flat Tire Inserts', 'PA Intercom System', 'Dual Fire Suppression', 'Reinforced Air Filtration'],
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1200',
    6.431000,
    3.425000,
    'Diplomatic Escort Staging Yard, Victoria Island'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7.2 Seed GSM SIM Tracker Devices
-- ------------------------------------------------------------------------------
INSERT INTO public.tracker_devices (
    id,
    device_code,
    imei,
    sim_phone_number,
    sim_carrier,
    tracker_model,
    protocol_type,
    polling_interval_seconds,
    assigned_vehicle_id,
    status,
    battery_percentage,
    signal_rssi_dbm,
    last_latitude,
    last_longitude,
    last_speed_kmh,
    last_heading_deg
)
VALUES
(
    'f1e2d3c4-b5a6-7890-1234-555555555555',
    'TRK-892-SIM',
    '864920049182741',
    '+2348037294810',
    'MTN Nigeria IoT',
    'Teltonika FMB920 4G LTE',
    'SMS_NMEA_HYBRID',
    300,
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'online',
    98,
    -65,
    6.447492,
    3.424310,
    42.00,
    24.00
)
ON CONFLICT (id) DO NOTHING;

-- Update Range Rover assigned tracker reference
UPDATE public.vehicles
SET assigned_tracker_id = 'f1e2d3c4-b5a6-7890-1234-555555555555'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-111111111111';

-- ------------------------------------------------------------------------------
-- 7.3 Seed Executive Chauffeurs
-- ------------------------------------------------------------------------------
INSERT INTO public.drivers (
    id,
    full_name,
    phone,
    email,
    license_number,
    license_expiry,
    badge_number,
    vetting_status,
    security_clearance_level,
    rating,
    total_trips,
    avatar_url,
    languages,
    certifications,
    is_available,
    current_status
)
VALUES
(
    'd1c2b3a4-5678-90ab-cdef-1234567890ab',
    'Emmanuel Okafor',
    '+2348035550192',
    'e.okafor@laplantaprime.com',
    'FRSC-LAG-09281-EXP',
    '2028-11-30',
    'CH-409',
    true,
    'Airside VIP & Diplomatic Escort',
    4.98,
    1420,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBKbjhRjrCmhkNlNkML6SVprykttgquwqWvriXkbf51jsmHySi6yGrZW7ZJSluSjBFkdDZ8NJ2TismICR836d98noMAJJdUUZZjpt0JxtEM9FxNzWymZH9c00BiE4llpKb4bXYsZuCuoikHPm85V8b8o3PtMiKGswUciXjbf9vpKSFsjNerRJ0f54oAOGAH-IAOK5c1Z6j0A2AlKQ8TETBHFXSM3YMTFoUIS7sSk1WZ4TEyd_pRdrRQ',
    ARRAY['EN', 'FR', 'IG'],
    ARRAY['Master Chauffeur Certified', 'Executive Etiquette', 'Airside VIP Escort', 'Defensive Evasive Driving'],
    false,
    'on_trip'
),
(
    'd2c3b4a5-6789-01ab-cdef-2345678901bc',
    'Babajide Adeleke',
    '+2348021194022',
    'b.adeleke@laplantaprime.com',
    'FRSC-LAG-77312-EXP',
    '2027-08-15',
    'CH-312',
    true,
    'Airside VIP Escort',
    4.95,
    980,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    ARRAY['EN', 'YO'],
    ARRAY['Executive Hospitality Lead', 'VIP Route Specialist'],
    true,
    'available'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- 7.4 Seed Auth Users & VIP Client Demo Account
-- ------------------------------------------------------------------------------
-- First insert into auth.users so foreign key constraint (profiles_id_fkey) is satisfied
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001' OR email = 'admin@laplantaprime.com') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000001',
            'authenticated',
            'authenticated',
            'admin@laplantaprime.com',
            crypt('admin123456', gen_salt('bf')),
            timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Operations Fleet Dispatcher","role":"admin"}'::jsonb,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002' OR email = 'a.balogun@executivecorp.ng') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000002',
            'authenticated',
            'authenticated',
            'a.balogun@executivecorp.ng',
            crypt('client123456', gen_salt('bf')),
            timezone('utc'::text, now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Dr. Adekunle Balogun","role":"client"}'::jsonb,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );
    END IF;
END $$;

INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email,
    phone,
    vip_tier,
    company_name,
    is_verified
)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Operations Fleet Dispatcher',
    'admin@laplantaprime.com',
    '+23418885275',
    'diplomatic',
    'La Planta Prime Command',
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    'client',
    'Dr. Adekunle Balogun',
    'a.balogun@executivecorp.ng',
    '+2348035550192',
    'first_class',
    'Balogun International Holdings',
    true
)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    vip_tier = EXCLUDED.vip_tier,
    company_name = EXCLUDED.company_name;

-- ------------------------------------------------------------------------------
-- 7.5 Seed Active Booking #LP-8842 (Connected to Live Tracking)
-- ------------------------------------------------------------------------------
INSERT INTO public.bookings (
    id,
    booking_reference,
    client_id,
    vehicle_id,
    driver_id,
    service_type,
    status,
    pickup_location,
    pickup_datetime,
    dropoff_location,
    dropoff_datetime,
    flight_number,
    flight_terminal,
    base_price_ngn,
    security_deposit_ngn,
    protection_plan_ngn,
    chauffeur_surcharge_ngn,
    total_amount_ngn,
    total_amount_usd,
    payment_status,
    payment_gateway,
    payment_reference,
    paid_at,
    special_instructions,
    verification_pin,
    qr_pass_token,
    is_tarmac_intake_required
)
VALUES
(
    'b1a2c3d4-e5f6-7890-abcd-884288428842',
    'LP-8842',
    '00000000-0000-0000-0000-000000000002',
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'd1c2b3a4-5678-90ab-cdef-1234567890ab',
    'chauffeur_driven',
    'in_transit',
    'LOS Murtala Muhammed Airport VIP Terminal Gate 4',
    timezone('utc'::text, now()) - interval '30 minutes',
    'The Wheatbaker Hotel, 4 Onitolo Rd, Ikoyi, Lagos',
    timezone('utc'::text, now()) + interval '4 hours',
    '9H-VTA (BA 075 Link)',
    'LOS MMA Executive Private Jet Terminal',
    450000.00,
    150000.00,
    35000.00,
    50000.00,
    685000.00,
    520.00,
    'paid',
    'paystack',
    'pstk_ref_98a710bc44',
    timezone('utc'::text, now()) - interval '2 days',
    'VIP Portico Staging requested. Chilled San Pellegrino and Starlink Wi-Fi enabled.',
    '8842-09',
    'a8842f9901bc471288bde1049281726a',
    true
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7.6 Seed Breadcrumb Telematics Pings (Falomo Corridor)
-- ------------------------------------------------------------------------------
INSERT INTO public.telematics_pings (
    tracker_id,
    vehicle_id,
    booking_id,
    timestamp,
    latitude,
    longitude,
    speed_kmh,
    heading_deg,
    satellites_count,
    gsm_rssi_dbm,
    ignition_status,
    battery_percentage,
    trigger_type,
    raw_sms_payload,
    geocoded_address
)
VALUES
(
    'f1e2d3c4-b5a6-7890-1234-555555555555',
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'b1a2c3d4-e5f6-7890-abcd-884288428842',
    timezone('utc'::text, now()) - interval '25 minutes',
    6.429810,
    3.422100,
    0.00,
    0.00,
    14,
    -60,
    true,
    99,
    'auto_periodic',
    'GPRMC:0625.78N,00325.32E,0.0km/h,99%bat,VI_GARAGE',
    'The Wings Towers Forecourt, Victoria Island'
),
(
    'f1e2d3c4-b5a6-7890-1234-555555555555',
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'b1a2c3d4-e5f6-7890-abcd-884288428842',
    timezone('utc'::text, now()) - interval '12 minutes',
    6.438920,
    3.423400,
    38.50,
    22.00,
    13,
    -64,
    true,
    98,
    'auto_periodic',
    'GPRMC:0626.33N,00325.40E,38.5km/h,98%bat,OZUMBA_MBADIWE',
    'Ozumba Mbadiwe Ave Approach, Victoria Island'
),
(
    'f1e2d3c4-b5a6-7890-1234-555555555555',
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    'b1a2c3d4-e5f6-7890-abcd-884288428842',
    timezone('utc'::text, now()) - interval '2 minutes',
    6.447492,
    3.424310,
    42.00,
    24.00,
    12,
    -65,
    true,
    98,
    'auto_periodic',
    'GPRMC:0626.85N,00325.47E,42.0km/h,98%bat,FALOMO_SPAN',
    'Falomo Bridge Crossing Corridor, Ikoyi Approach'
);

-- ------------------------------------------------------------------------------
-- 7.7 Seed Handover Inspection
-- ------------------------------------------------------------------------------
INSERT INTO public.handover_inspections (
    booking_id,
    vehicle_id,
    inspector_id,
    inspection_type,
    odometer_reading,
    fuel_battery_percentage,
    exterior_condition,
    interior_condition,
    photos
)
VALUES
(
    'b1a2c3d4-e5f6-7890-abcd-884288428842',
    'a1b2c3d4-e5f6-7890-abcd-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'pickup_handover',
    8420,
    88,
    '{"scratches": false, "dents": false, "windshield": "flawless", "rims": "inspected", "tire_pressure_psi": 36, "notes": "Sanitized and prepped for VIP arrival at LOS MMA Gate 4"}'::jsonb,
    '{"cleanliness": "white_glove", "amenities_stocked": true, "starlink_active": true, "fragrance": "Royal Oud", "notes": "Two chilled San Pellegrino bottles and sanitizers verified"}'::jsonb,
    ARRAY['https://lh3.googleusercontent.com/aida-public/AB6AXuAjQFZW12oM7m6WX-Ld8G0mUKKhY9UYh2Dxu2Z0JtzHQLydZ1pQhLIQfFBCJnI4_cRMwvYo_DwsOokYQAfcfiv_nWL_Knw6Ty0utKFAlkOacWozClahF9IaRXrtm81B3LdKnxuclmr4g3Dzr-u6t3h3xYkN6TLsPbB-uM6ukFeBL5TuCzPf7y310sa2o5k5KGjsOSD5UoRs2E-97o3uovNa936deExwyq0nKFvdw82BYpYZVlS5BWLt']
);

-- ------------------------------------------------------------------------------
-- 7.8 Seed Invoice #INV-2024-8842
-- ------------------------------------------------------------------------------
INSERT INTO public.invoices (
    id,
    invoice_number,
    booking_id,
    client_id,
    issue_date,
    due_date,
    subtotal_ngn,
    tax_ngn,
    security_deposit_ngn,
    total_amount_ngn,
    currency,
    status
)
VALUES
(
    'e1f2a3b4-5678-90ab-cdef-884288428842',
    'INV-2024-8842',
    'b1a2c3d4-e5f6-7890-abcd-884288428842',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE,
    CURRENT_DATE,
    500000.00,
    35000.00,
    150000.00,
    685000.00,
    'NGN',
    'paid'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- END OF LA PLANTA PRIME SUPABASE DATABASE SCHEMA SCRIPT
-- ==============================================================================
