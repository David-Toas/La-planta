"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export default function HandoverInspectionPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar /><main className="w-full pt-20 bg-surface min-h-[calc(100vh-20rem)]"><div className="flex flex-col w-full">
{/*  Status & Context Master Banner  */}
<div className="w-full bg-surface-container-low py-space-sm px-margin">
<div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm flex-wrap">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm tracking-wider uppercase"><span className="w-2 h-2 rounded-full bg-secondary-fixed animate-ping"></span> Vehicle Handover &amp; Inspection Console</span>
<a href="/reservation-pass" className="font-label-md text-label-md text-secondary font-semibold hover:underline">BOOKING #LP-8842</a>
<span className="text-on-surface-variant font-body-sm hidden sm:inline">•</span>
<span className="font-body-sm text-body-sm text-on-surface">The Wheatbaker Hotel (Valet Forecourt, Ikoyi)</span>
</div>
<div className="flex items-center gap-space-md">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Live Dispatch Status</span>
<span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold"><span className="material-symbols-outlined text-sm">wifi_tethering</span> REAL-TIME GPS SYNCED</span>
</div>
</div>
</div>
{/*  Operational Core Workspace  */}
<div className="w-full max-w-[1280px] mx-auto px-margin py-space-md">
{/*  Booking Header & Vehicle Manifest Strip  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
<span className="material-symbols-outlined text-3xl">verified_user</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Executive Booking Verification</span>
<span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">VIP Client</span>
</div>
<h1 className="font-headline-sm text-headline-sm text-primary">Dr. Adekunle Balogun</h1>
<span className="font-body-sm text-body-sm text-on-surface-variant">Delivery Destination: The Wheatbaker Hotel, 4 Onitolo Rd, Ikoyi, Lagos</span>
</div>
</div>
<div className="flex items-center gap-space-lg flex-wrap lg:justify-end">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Assigned Motorcar</span>
<a href="/vehicle-details" className="hover:underline font-title-md text-title-md text-primary font-semibold">Range Rover Autobiography LWB</a>
<span className="font-label-sm text-label-sm text-secondary font-mono">PLATE: LAG-892-XZ</span>
</div>
<div className="h-10 w-[1px] bg-surface-container-high hidden md:block"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Assigned Professional Driver</span>
<span className="font-title-md text-title-md text-primary font-semibold">Mr. Emmanuel Okafor</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">12 Years Professional Experience • Vetted</span>
</div>
</div>
</div>
{/*  3-Column Structured Handover Architecture (30% / 45% / 25%)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
{/*  COLUMN 1 (30% -> col-span-1 lg:col-span-4): Guest Pass & Booking Summary  */}
<div className="lg:col-span-4 flex flex-col gap-space-md">
{/*  Handover Verification Summary Card  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low -mx-space-md -mt-space-md p-space-md rounded-t-xl">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-xl">qr_code_scanner</span>
<span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">Pass Verification</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-semibold">QR VERIFIED</span>
</div>
{/*  Booking Pass Detail Box  */}
<div className="relative bg-primary rounded-lg p-space-md text-on-primary overflow-hidden mb-space-sm">
<div className="flex items-center justify-between mb-space-xs">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed"></span>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">Confirmed Reservation</span>
</div>
<span className="font-mono text-body-sm text-tertiary-fixed">PIN: 8842-09</span>
</div>
<div className="flex items-center gap-space-sm my-space-xs">
<div className="p-2 rounded bg-surface-container-lowest text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-3xl text-secondary">verified</span>
</div>
<div>
<div className="font-title-md text-title-md text-on-primary"><a href="/reservation-pass" className="hover:underline text-secondary-fixed">Digital Pass #LP-8842</a> <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-700/80 text-white font-semibold uppercase">100% PAID</span></div>
<div className="font-label-sm text-label-sm text-outline-variant">Guest &amp; Chauffeur Pairing Confirmed</div>
</div>
</div>
<div className="mt-space-xs pt-space-xs font-mono text-body-sm text-tertiary-fixed flex justify-between">
<span className="">Handover Time: 17:30 WAT</span>
<span className="">Term: 3 Full Days</span>
</div>
</div>
{/*  Practical Car Hire Inspection Checklist  */}
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">local_gas_station</span>
<span className="font-body-sm text-body-sm text-on-surface font-medium">Fuel Level</span>
</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">100% Full Tank</span>
</div>
<div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">speed</span>
<span className="font-body-sm text-body-sm text-on-surface font-medium">Odometer Start</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">14,280 KM</span>
</div>
<div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">payments</span>
<span className="font-body-sm text-body-sm text-on-surface font-medium">Online Settlement</span>
</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">₦1,895,000 Settled</span>
</div>
<div className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">flight_takeoff</span>
<span className="font-body-sm text-body-sm text-on-surface font-medium">Airport Tarmac Access</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">FAAN Pre-Cleared</span>
</div>
</div>
</div>
{/*  Tarmac Staging Context Card  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div className="flex items-center gap-space-xs mb-space-sm">
<span className="material-symbols-outlined text-secondary text-xl">flight_land</span>
<span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">Flight Integration Log</span>
</div>
<div className="relative rounded-lg overflow-hidden h-36 mb-space-sm bg-surface-container-high">
<img className="w-full h-full object-cover" data-alt="High luxury private jet Gulfstream parked on Lagos private airport apron with luxury chauffeur Range Rover parked on tarmac at golden hour sunset, cinematic editorial lighting, pristine concrete runway and executive terminal in background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI17qCsTIb251Qssb05Bwjj7aph21oVWe9q8fu7x-op0Vb6rBbLCzMQtEY9WZSK1sMxovUa0Ih7S4me1kEFr5ITA0VUEWAMy75eW91ylcr6dRfWv1AXPeZAmzedvmdIGkSJhWGuUDJjklQHThJ8zhX5h8YLlztLFDc9uNeZtYXKC2PTxlOs4z8q4KxHynJazT5YfsfTKt7xhLpew4jFoOIPG3niqPt2EeoyBVr_5GVkxDsW6MWpNSM" />
<div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-space-sm">
<div className="text-on-primary">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">Private Charter Inbound</div>
<div className="font-title-md text-title-md text-on-primary font-semibold">Digital Pass #LP-8842 <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-700/80 text-white font-semibold uppercase">PAID &amp; VERIFIED</span></div>
</div>
</div>
</div>
<div className="grid grid-cols-2 gap-space-xs font-body-sm text-body-sm">
<div className="p-2 rounded bg-surface-container-low">
<span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">Origin</span>
<span className="font-medium text-on-surface">London Luton (LTN)</span>
</div>
<div className="p-2 rounded bg-surface-container-low">
<span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">Wheels Down</span>
<span className="font-medium text-on-surface">17:15 WAT (On Schedule)</span>
</div>
</div>
</div>
{/*  Airside Security Clearance Token  */}
<div className="bg-secondary-container/40 rounded-xl p-space-md flex items-center justify-between"><div className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-secondary text-2xl">room_service</span><div><div className="font-title-md text-body-sm text-primary font-semibold">VIP Terminal Concierge Reception</div><div className="font-body-sm text-body-sm text-on-surface-variant">Concierge Officer M. Garba Assigned • Gate Meet Active</div></div></div><span className="material-symbols-outlined text-secondary">check_circle</span></div>
</div>
{/*  COLUMN 2 (45% -> col-span-1 lg:col-span-5): Pre-Trip Vehicle Inspection Photos  */}
<div className="lg:col-span-5 flex flex-col gap-space-md">
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-sm gap-space-xs"><div className="flex flex-col gap-1"><div><div className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-xl">camera_outdoor</span><span className="font-title-md text-title-md text-primary font-semibold">Pre-Trip Inspection Photos</span></div><span className="font-body-sm text-body-sm text-on-surface-variant">Mandatory 4-angle vehicle verification prior to trip departure</span></div></div><div className="flex items-center gap-2"><div className="flex items-center bg-surface-container-low p-0.5 rounded-lg"><button type="button" className="px-3 py-1 rounded-md bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-sm">Pickup Condition</button><button type="button" className="px-3 py-1 rounded-md text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm">Return Condition</button></div><span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold"><span className="material-symbols-outlined text-xs text-secondary">verified</span> 4 OF 4 LOGGED</span></div></div>
{/*  Photo Grid 2x2  */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mb-space-md">
{/*  Angle 1: Front & Grille  */}
<div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-sm transition-transform hover:-translate-y-0.5">
<div className="relative h-44 w-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Close frontal inspection photo of a gleaming black Range Rover Autobiography LWB on pristine Lagos airport tarmac, chrome grille immaculate, signature headlights reflecting soft late afternoon sun." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfd_rPLrTsKMRJd_s4OLUxH0T6MV9dtN2aIf_A_Pag2q8giG4GvDp1fWHwAaDSV86yMNCeTW9zqLsSdOTB3beVJLcwF_en28eQ6gj_yxGl2rWpGgWBTJr0kH6iyBGxg3qw-sAHKyeidzuRBLHzrR_mrp9q-lVD3et2ZTlHvJagOy82o0oNHZWu2YrVGr7rraCBj6YfopTSLg90fmNmHlte4qn8VO2IMAkNxnvucf8VB-mNEzGcityR" />
<span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-on-primary font-label-sm text-label-sm tracking-wider">ANGLE 01</span>
<span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                </span>
</div>
<div className="p-space-xs px-space-sm bg-surface-container-low flex flex-col">
<span className="font-title-md text-body-sm text-primary font-medium">Front Fascia &amp; Panoramic Glass</span>
<div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-0.5">
<span className="">Logged: 17:22 WAT</span>
<span className="text-secondary font-mono">Grade: Flawless</span>
</div>
</div>
</div>
{/*  Angle 2: Right Profile & Wheels  */}
<div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-sm transition-transform hover:-translate-y-0.5">
<div className="relative h-44 w-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Side profile photographic inspection of luxury Range Rover Autobiography long wheelbase on runway apron, polished 22 inch turbine wheels pristine, metallic paint reflecting sunset clouds." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD95CSUlqI3RO9rqQI-252vIWQI0vMq8wyI8h30W2FU2b4uAq2YJcyx3xTsRAqKey5PeoBmMJy7SDzPzS92RuZnFjZUnC494v5usJ3Fx9hxvQ1XVgdukW4U5TVkBY9Ik7OANNhyxpWCt5UtPY0echs8kmit6vH0fEVibPnZjga3SB-aw-fpnHRJ2hMwjJ99-N90Mm1lQbVh6kq_Pk7Kv15rNVaX2CwZfeX2UoIclPlWxk797EEKFAc2" />
<span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-on-primary font-label-sm text-label-sm tracking-wider">ANGLE 02</span>
<span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                </span>
</div>
<div className="p-space-xs px-space-sm bg-surface-container-low flex flex-col">
<span className="font-title-md text-body-sm text-primary font-medium">Right Side Profile &amp; Wheels</span>
<div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-0.5">
<span className="">Logged: 17:23 WAT</span>
<span className="text-secondary font-mono">Tread: 98%</span>
</div>
</div>
</div>
{/*  Angle 3: Rear & Trunk  */}
<div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-sm transition-transform hover:-translate-y-0.5">
<div className="relative h-44 w-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Rear view inspection photograph of black luxury executive SUV tailgate open showing immaculate carpeted luggage compartment with VIP leather protection matting on airport tarmac." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBOF9EKvLGGpJSUd5iAL8LU0v2RPF8G20MsG90vFcdjPKi0uhC8FKEP8-WLKOKsyd338saiGKos2F4vIZIjR3SzZzN7TNDqRUJ07JeXXhi5Xolxn-v20_VzQg_GWIwqhhxgDTtZGq3V4yzs6fqgnXMYfLRlgY8DZ6fsiYt2KtlxmBmnl6jM_iW3McDoMhEcO2TISZvafiFHkehN0GpNBpRyR-O87TEupKBoUfbXlK46VkBWxrdRNC2" />
<span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-on-primary font-label-sm text-label-sm tracking-wider">ANGLE 03</span>
<span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                </span>
</div>
<div className="p-space-xs px-space-sm bg-surface-container-low flex flex-col">
<span className="font-title-md text-body-sm text-primary font-medium">Rear Profile &amp; Luggage Compartment</span>
<div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-0.5">
<span className="">Logged: 17:24 WAT</span>
<span className="text-secondary font-mono">Boot: Sanitized</span>
</div>
</div>
</div>
{/*  Angle 4: Cockpit & Cluster  */}
<div className="group relative rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-sm transition-transform hover:-translate-y-0.5">
<div className="relative h-44 w-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Cockpit instrument cluster and digital dashboard display inside Range Rover Autobiography luxury interior, showing full fuel tank gauge and crisp odometer reading." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0Bu18zs1WG57l5juN7ShhcXJ1KPoVUWUesswQt8DdTDAKkcR6Sn3CXzl9N2RJCxITXvQ5ICxpprTVwkxVjXxO2W4KV7HoQgizLg86HiBeqCNT6JP59eNNVu-y9_a9YrmDCZKNaBv2koMSOEAj0ht0tIIJtl0j7_7ybpUcisa8edql_j5scyCONAr2J_wsLgeVKP5bzlIzXtKJ1BZO_zMoptjbYbLWdV9tlgE40WaEjph5LW4Css7-" />
<span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-on-primary font-label-sm text-label-sm tracking-wider">ANGLE 04</span>
<span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                </span>
</div>
<div className="p-space-xs px-space-sm bg-surface-container-low flex flex-col">
<span className="font-title-md text-body-sm text-primary font-medium">Digital Cluster &amp; Fuel Reserve</span>
<div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant pt-0.5">
<span className="">Logged: 17:25 WAT</span>
<span className="text-secondary font-mono">100% Fuel • 14,210 km</span>
</div>
</div>
</div>
</div>
{/*  Digital Verification Stamp  */}
<div className="rounded-xl bg-surface-container-low p-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
<div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-secondary text-base">verified</span>
<span>Inspection Timestamp: <strong className="text-on-surface">17:25 WAT • 02 Oct 2026</strong></span>
</div>
<div className="flex items-center gap-2 text-on-surface font-label-sm text-label-sm">
<span className="text-on-surface-variant">Inspected By:</span> <span className="font-semibold text-primary">Mr. Emmanuel Okafor (Driver #042)</span>
</div>
</div>
</div>
{/*  Interior Protocol Check Strip  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-semibold block mb-space-xs">Executive Amenities Checklist</span>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-space-xs font-body-sm text-body-sm text-on-surface">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span> Chilled Voss Water
            </div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span> Hot Towels Prepared
            </div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span> Financial Times / ThisDay
            </div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span> High-Speed Starlink WiFi
            </div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span> Fragrance: Baobab Vetiver
            </div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span> Dual USB-C Fast Charge
            </div>
</div>
</div>
</div>
{/*  COLUMN 3 (25% -> col-span-1 lg:col-span-3): Sign-on-Glass Pad & Charter Initiation  */}
<div className="lg:col-span-3 flex flex-col gap-space-md">
{/*  Sign-on-Glass Acceptance Console  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col">
<div className="flex items-center justify-between mb-space-xs">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-lg">draw</span>
<span className="font-title-md text-title-md text-primary">Guest Sign-off</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-mono">DIGITAL-PAD</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
            Digital signature confirming vehicle handover and readiness.
          </p>
{/*  Interactive Signature Canvas Box  */}
<div className="relative bg-surface-container-low rounded-xl p-space-sm mb-space-sm">
<div className="h-28 w-full bg-surface-container-lowest rounded-lg relative overflow-hidden flex items-center justify-center">
{/*  Stylized Curated Vector Signature  */}
<svg className="w-full h-full max-w-[200px] text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 240 100">
<path d="M 20 60 Q 50 15 75 55 T 120 40 T 150 70 Q 170 30 190 45 T 225 35"></path>
<path d="M 40 75 C 90 75 140 80 200 65" strokeDasharray="4 4" strokeWidth="1.5"></path>
</svg>
<div className="absolute bottom-1 right-2 font-mono text-[9px] text-on-surface-variant/70">DIGITAL-SIGN: #AB8842-VERIFIED</div>
</div>
<div className="flex items-center justify-between mt-2 font-label-sm text-label-sm text-on-surface-variant">
<span className="">Biometric captured</span>
<button className="text-secondary hover:underline cursor-pointer" type="button">Clear Pad</button>
</div>
</div>
{/*  Protocol Confirmation Checklist  */}
<div className="p-space-xs rounded-lg bg-surface-container-low mb-space-md">
<label className="flex items-start gap-2 cursor-pointer">
<input defaultChecked className="mt-1 accent-primary w-4 h-4 rounded" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface leading-tight">
                Guest verifies vehicle condition is pristine, executive amenities are confirmed, and vehicle handover is complete.
              </span>
</label>
</div>
{/*  Primary & Secondary Action Execution  */}
<div className="flex flex-col gap-space-xs">
<button className="w-full py-3 px-space-md rounded-lg bg-primary text-on-primary font-title-md text-body-sm flex items-center justify-center gap-2 hover:bg-secondary hover:text-on-secondary transition-all shadow-md" id="start-charter-btn" type="button"><span className="material-symbols-outlined text-lg">key</span><span className="">Confirm Handover &amp; Begin Trip</span><span className="material-symbols-outlined text-sm">arrow_forward</span></button>
<button className="w-full py-2.5 px-space-md rounded-lg bg-surface-container text-on-surface font-title-md text-body-sm flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-base">sms</span>
<span className="">Sync Later via SMS Pin</span>
</button>
</div>
{/*  Quick Dispatch Emergency Link  */}
<div className="mt-space-md pt-space-sm border-t border-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm"><span>VIP Support: Lagos Desk</span><a className="text-secondary font-semibold hover:underline flex items-center gap-1" href="tel:+23418885275"><span className="material-symbols-outlined text-xs">call</span> Direct Support (+234 1 888 5275)</a></div>
</div>
{/*  Live Route Preview Snippet  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div className="flex items-center justify-between mb-space-xs">
<span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">Planned Route</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">EST. 32 MIN</span>
</div>
<div className="space-y-space-xs font-body-sm text-body-sm">
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
<span className="text-on-surface font-medium">MMA2 VIP Executive Terminal</span>
</div>
<div className="ml-1 pl-3.5 border-l-2 border-dashed border-secondary/40 py-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Ikoyi Link Bridge Corridor</span>
</div>
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
<span className="text-on-surface font-medium">The Wheatbaker, Onitolo Rd, Ikoyi</span>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</main><footer className="w-full bg-surface-container-lowest border-t-0 shadow-[0_-1px_12px_rgba(0,0,0,0.03)]"><div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-12"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12"><div className="flex flex-col gap-4"><div className="flex items-center gap-2"><span className="font-headline-sm text-headline-sm text-primary font-serif">La Planta</span><span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Nigeria</span></div><p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">The premier benchmark for luxury car rentals, executive airport transfers, and chauffeur services across Lagos and Abuja.</p><div className="flex items-center gap-3 pt-2"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm"><span className="material-symbols-outlined text-sm">verified_user</span>Vetted &amp; Certified Drivers</span></div></div><div className="flex flex-col gap-3"><span className="font-title-md text-title-md text-on-surface tracking-wide">Locations &amp; Hubs</span><div className="flex flex-col gap-1"><span className="font-label-md text-label-md uppercase tracking-wider text-secondary">Lagos Office</span><span className="font-body-sm text-body-sm text-on-surface-variant">The Wings Office Complex, East Tower, Victoria Island, Lagos</span></div><div className="flex flex-col gap-1 pt-2"><span className="font-label-md text-label-md uppercase tracking-wider text-secondary">Abuja Office</span><span className="font-body-sm text-body-sm text-on-surface-variant">Transcorp Hilton Suites &amp; Nnamdi Azikiwe Airport VIP Lounge, FCT Abuja</span></div></div><div className="flex flex-col gap-3"><span className="font-title-md text-title-md text-on-surface tracking-wide">Client Services</span><div className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant"><span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-secondary">call</span>24/7 Support: +234 1 888 5275</span><span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-secondary">mail</span>reservations@laplanta-luxury.ng</span><span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-secondary">flight_takeoff</span>LOS / ABV VIP Airport Pickup</span></div></div><div className="flex flex-col gap-4"><span className="font-title-md text-title-md text-on-surface tracking-wide">Direct WhatsApp Support</span><p className="font-body-sm text-body-sm text-on-surface-variant">Instant luxury vehicle reservations, customized daily bookings, and real-time support.</p><a className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-colors shadow-sm" href="https://wa.me/23418885275"><span className="material-symbols-outlined text-sm">chat</span>Chat on WhatsApp</a></div></div><div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-on-surface-variant"><div className="flex flex-wrap items-center gap-6"><span className="font-label-sm text-label-sm uppercase tracking-wider">&copy; 2025 La Planta Luxury Car Hire Ltd.</span><a className="hover:text-on-surface transition-colors font-label-sm text-label-sm uppercase tracking-wider" href="#">Rental Terms &amp; Conditions</a><a className="hover:text-on-surface transition-colors font-label-sm text-label-sm uppercase tracking-wider" href="#">Privacy Policy</a><a className="hover:text-on-surface transition-colors font-label-sm text-label-sm uppercase tracking-wider" href="#">Insurance Policy</a><a className="hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold" href="/admin-login">Fleet Admin Console</a></div><span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Victoria Island • Maitama • Ikoyi</span></div></div></footer>




    </div>
  );
}
