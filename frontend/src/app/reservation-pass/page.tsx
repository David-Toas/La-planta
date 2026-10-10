"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function ReservationPassPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
<main className="w-full pt-20 bg-surface min-h-[calc(100vh-20rem)]"><div className="flex flex-col w-full">
<div className="max-w-[1280px] w-full mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
{/*  Status Notification Pill Banner  */}
<div className="w-full bg-surface-container-low rounded-xl p-space-sm flex flex-col md:flex-row items-center justify-between gap-space-sm shadow-sm"><div className="flex items-center gap-space-sm flex-wrap"><span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>Payment Confirmed</span><span className="text-secondary font-label-md text-label-md">•</span><span className="font-body-md text-body-sm text-on-surface font-semibold">Chauffeur Scheduled</span><span className="text-secondary font-label-md text-label-md">•</span><span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant bg-surface px-2.5 py-1 rounded-md">Reservation ID #LP-8842</span></div><div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm"><span className="material-symbols-outlined text-secondary text-base">check_circle</span><span className="">Private Service Confirmed &amp; Ready</span></div></div>
{/*  Editorial Header  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md"><div><div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-secondary text-sm">hotel_class</span><span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary font-semibold">VIP Guest Reservation</span></div><h1 className="font-display text-headline-lg text-primary tracking-tight">Booking Confirmation &amp; Digital Pass</h1></div><div className="flex items-center gap-space-xs"><span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Service Tier:</span><span className="px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold tracking-wider uppercase">Executive First Class</span></div></div>
{/*  Main 2-Column Grid (60% / 40%)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
{/*  Left Column: Security Pass, Actions & Chauffeur Profile (7 Cols / ~58%)  */}
<div className="lg:col-span-7 flex flex-col gap-space-lg">
{/*  Scannable Digital Handover Pass  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md relative overflow-hidden">
{/*  Subtle Luxury Accent Bar  */}
<div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm"><div><span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Handover Pass</span><h2 className="font-display text-headline-sm text-primary">Digital Handover Voucher</h2></div><span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>Terminal &amp; Forecourt Cleared</span></div>
{/*  Digital QR Voucher  */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-center gap-space-lg relative">
{/*  High-Contrast Authentic QR Module  */}
<div className="w-48 h-48 bg-primary p-3 rounded-lg flex items-center justify-center shrink-0 shadow-md">
<svg className="w-full h-full text-on-primary fill-current" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
{/*  QR Corner Finders  */}
<rect fill="#FFFFFF" height="46" rx="6" width="46" x="0" y="0"></rect>
<rect fill="#040505" height="32" rx="4" width="32" x="7" y="7"></rect>
<rect fill="#FFFFFF" height="18" width="18" x="14" y="14"></rect>
<rect fill="#FFFFFF" height="46" rx="6" width="46" x="114" y="0"></rect>
<rect fill="#040505" height="32" rx="4" width="32" x="121" y="7"></rect>
<rect fill="#FFFFFF" height="18" width="18" x="128" y="14"></rect>
<rect fill="#FFFFFF" height="46" rx="6" width="46" x="0" y="114"></rect>
<rect fill="#040505" height="32" rx="4" width="32" x="7" y="121"></rect>
<rect fill="#FFFFFF" height="18" width="18" x="14" y="128"></rect>
{/*  QR Data Matrix Blocks  */}
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="58" y="8"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="74" y="8"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="90" y="8"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="58" y="24"></rect>
<rect fill="#FEDEB2" height="10" rx="1" width="10" x="74" y="24"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="90" y="24"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="8" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="24" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="40" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="56" y="58"></rect>
<rect fill="#FEDEB2" height="16" rx="3" width="16" x="72" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="94" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="110" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="126" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="142" y="58"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="8" y="74"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="24" y="74"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="40" y="74"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="94" y="74"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="110" y="74"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="142" y="74"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="8" y="90"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="24" y="90"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="56" y="90"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="72" y="90"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="88" y="90"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="126" y="90"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="58" y="114"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="74" y="114"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="90" y="114"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="106" y="114"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="122" y="114"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="138" y="114"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="58" y="130"></rect>
<rect fill="#FEDEB2" height="10" rx="1" width="10" x="74" y="130"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="90" y="130"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="122" y="130"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="138" y="130"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="58" y="146"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="90" y="146"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="106" y="146"></rect>
<rect fill="#FFFFFF" height="10" rx="1" width="10" x="138" y="146"></rect>
</svg>
</div>
{/*  PIN & Instructions  */}
<div className="flex flex-col gap-space-xs text-left"><span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">Reservation QR &amp; Verification PIN</span><div className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-lg shadow-sm"><span className="font-display text-headline-sm text-primary tracking-widest font-bold">#LP-8842</span><span className="material-symbols-outlined text-secondary text-sm">qr_code_scanner</span></div><p className="font-body-md text-body-sm text-on-surface-variant pt-1 leading-relaxed">Present this QR pass or reference code #LP-8842 upon arrival. Your assigned chauffeur will scan the code at vehicle handover to commence your itinerary.</p><div className="flex items-center gap-space-sm pt-2 text-on-surface-variant"><span className="material-symbols-outlined text-secondary text-sm">verified</span><span className="font-label-sm text-label-sm">VIP Handover Protocol • PIN: 8842-09</span></div></div>
</div>
{/*  Primary Action Bar  */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs"><Link href="/live-tracking" className="w-full flex items-center justify-center gap-space-xs px-space-md py-3 rounded-lg bg-primary text-on-primary font-title-md text-body-sm hover:bg-secondary hover:text-on-secondary transition-all shadow-md"><span className="material-symbols-outlined text-lg">near_me</span><span className="">Track Delivery</span></Link><button className="w-full flex items-center justify-center gap-space-xs px-space-md py-3 rounded-lg bg-surface-container font-title-md text-body-sm text-on-surface hover:bg-surface-container-high transition-all" type="button"><span className="material-symbols-outlined text-lg">account_balance_wallet</span><span className="">Add to Apple / Google Wallet</span></button><button className="w-full flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low font-title-md text-body-sm text-on-surface-variant hover:text-on-surface transition-all" type="button"><span className="material-symbols-outlined text-base">picture_as_pdf</span><span className="">Download PDF Invoice</span></button><a className="w-full flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container-low font-title-md text-body-sm text-on-surface-variant hover:text-on-surface transition-all" href="https://wa.me/23418885275" target="_blank"><span className="material-symbols-outlined text-base">chat</span><span className="">WhatsApp Support</span></a></div>
</div>
{/*  Assigned Professional Chauffeur Profile Card  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md"><div className="flex items-center justify-between"><div className="flex flex-col"><span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Assigned Professional Chauffeur</span><h2 className="font-display text-headline-sm text-primary">Executive Chauffeur Profile</h2></div><span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold"><span className="material-symbols-outlined text-sm">verified</span>ON SCHEDULE</span></div><div className="flex flex-col sm:flex-row items-center sm:items-start gap-space-md pt-space-xs"><div className="relative shrink-0"><img className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl object-cover shadow-md" data-alt="Editorial portrait photograph of a confident and distinguished male African executive chauffeur in his early forties, wearing a tailored charcoal black formal suit, silk necktie, white dress gloves, and a prestigious peaked chauffeur cap with a silver insignia, standing serenely in front of an upscale luxury hotel forecourt in golden late afternoon sunlight." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMGsEvO_1GOp0YaK2imFr1ZmxaV19f_vSRSkNmNtqAvUba8_vI7GEojytyS-ZPdQYTWafwIQFWDtLftfcpclpYCPOVCg0j9vXvMijijI-jkeMD9W23u0Hb1fIcXOeYO0GG9xDVD0MVhob-_aU8rV9n1y2TOATKzp_w6im9uX7jmHEBRP4zeoAYzrxpePvDhAXBClOtCegiRkuKxZEOYMAjJZQmx_K-96PWmYwz40MOx6eOQFuutnc1" /><span className="absolute -bottom-2 -right-2 bg-primary text-on-primary text-[10px] font-title-md font-semibold px-2 py-0.5 rounded-full shadow">CHAUFFEUR #409</span></div><div className="flex flex-col gap-space-xs flex-1 text-center sm:text-left"><div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1"><h3 className="font-title-lg text-title-lg text-primary">Mr. Emmanuel Okafor</h3><div className="flex items-center justify-center sm:justify-start gap-1 text-secondary"><span className="material-symbols-outlined text-sm" style={{"fontVariationSettings": "'FILL' 1"}}>star</span><span className="font-title-md text-body-sm font-bold text-primary">4.98</span><span className="font-body-sm text-body-sm text-on-surface-variant">(340+ completed trips)</span></div></div><p className="font-body-md text-body-sm text-on-surface-variant leading-relaxed">Senior Executive Chauffeur with 12 years of white-glove luxury hospitality service across premium Nigerian and international executive itineraries. Flawless hospitality record.</p><div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1"><span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">Master Chauffeur Certified</span><span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">Executive Etiquette</span><span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">Discreet &amp; Bilingual (EN/FR)</span><span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface">Airside VIP Escort</span></div></div></div><div className="pt-space-xs flex flex-col sm:flex-row gap-space-sm"><button className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary-container text-on-primary font-title-md text-body-sm hover:bg-secondary hover:text-on-secondary transition-colors" type="button"><span className="material-symbols-outlined text-base">call</span><span className="">Call Chauffeur Directly</span></button><a className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container font-title-md text-body-sm text-on-surface hover:bg-surface-container-high transition-colors" href="https://wa.me/23418885275" target="_blank"><span className="material-symbols-outlined text-base">chat</span><span className="">WhatsApp Chauffeur</span></a></div></div>
</div>
{/*  Right Column: Designated Fleet Vehicle & Reservation Logistics (5 Cols / ~42%)  */}
<div className="lg:col-span-5 flex flex-col gap-space-lg">
{/*  Designated Fleet Vehicle Card  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Designated Fleet Asset</span>
<a href="/vehicle-details" className="hover:underline"><h2 className="font-title-lg text-title-lg text-primary">Range Rover Autobiography LWB</h2></a>
</div>
<span className="px-2.5 py-1 rounded bg-secondary-container font-label-sm text-label-sm font-semibold text-on-secondary-container">FIRST CLASS SPEC</span>
</div>
{/*  Vehicle Tarmac Real Picture Reference  */}
<div className="relative w-full h-52 rounded-lg overflow-hidden shadow-sm">
<img className="w-full h-full object-cover" data-alt="Cinematic luxury wide photograph of a pristine Santorini Black Range Rover Autobiography parked on an airport tarmac beside a sleek private jet during a radiant golden hour sunset in Lagos, Nigeria, with professional chauffeur in dark uniform opening the door onto an executive red carpet." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjQFZW12oM7m6WX-Ld8G0mUKKhY9UYh2Dxu2Z0JtzHQLydZ1pQhLIQfFBCJnI4_cRMwvYo_DwsOokYQAfcfiv_nWL_Knw6Ty0utKFAlkOacWozClahF9IaRXrtm81B3LdKnxuclmr4g3Dzr-u6t3h3xYkN6TLsPbB-uM6ukFeBL5TuCzPf7y310sa2o5k5KGjsOSD5UoRs2E-97o3uovNa936deExwyq0nKFvdw82BYpYZVlS5BWLt" />
<div className="absolute bottom-2 left-2 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-md text-on-primary font-label-sm text-label-sm">
              Santorini Black • Lagos • LAG 892 XZ
            </div>
</div>
{/*  In-Cabin Amenities  */}
<div className="flex flex-col gap-2 pt-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Executive Vehicle Amenities</span>
<div className="grid grid-cols-2 gap-2"><div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm"><span className="material-symbols-outlined text-secondary text-base">wifi</span><span className="">High-Speed Starlink Wi-Fi</span></div><div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm"><span className="material-symbols-outlined text-secondary text-base">wine_bar</span><span className="">Chilled Refreshments &amp; Water</span></div><div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm"><span className="material-symbols-outlined text-secondary text-base">volume_off</span><span className="">Acoustic Privacy Glazing</span></div><div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm"><span className="material-symbols-outlined text-secondary text-base">airline_seat_recline_extra</span><span className="">Executive Massaging Seats</span></div></div>
</div>
</div>
{/*  Reservation & Trip Summary  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<h2 className="font-title-lg text-title-lg text-primary">Reservation &amp; Trip Summary</h2>
<span className="material-symbols-outlined text-secondary">flight_land</span>
</div>
<div className="flex flex-col gap-space-md">
{/*  Dates / Timeline  */}
<div className="flex items-start gap-space-sm">
<div className="p-2 rounded-lg bg-surface-container text-secondary shrink-0">
<span className="material-symbols-outlined text-lg">calendar_today</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Handover Schedule</span>
<span className="font-title-md text-body-md text-primary font-semibold">Nov 14, 2024 at 17:30 WAT</span>
<span className="font-body-sm text-body-sm text-secondary">Return: Nov 17, 2024 at 17:30 WAT (3 Full Days Reserved)</span>
</div>
</div>
{/*  Flight Details  */}
<div className="flex items-start gap-space-sm">
<div className="p-2 rounded-lg bg-secondary-container text-on-secondary-container shrink-0">
<span className="material-symbols-outlined text-lg">flight</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Flight Arrival Connection</span>
<div className="flex items-center gap-2">
<span className="font-title-md text-body-md text-primary font-semibold">British Airways BA 075</span>
<span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">LHR → LOS</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">On Schedule • ETA 16:45 WAT • Chauffeur at VIP Arrivals</span>
</div>
</div>
{/*  Delivery Destination  */}
<div className="flex items-start gap-space-sm">
<div className="p-2 rounded-lg bg-surface-container text-secondary shrink-0">
<span className="material-symbols-outlined text-lg">location_on</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Delivery Destination</span>
<span className="font-title-md text-body-md text-primary font-semibold">The Wheatbaker Hotel</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">4 Onitolo Rd, Ikoyi, Lagos (Valet Forecourt)</span>
</div>
</div>
</div>
{/*  24/7 Concierge Support Callout  */}
<div className="mt-space-xs p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between gap-space-sm"><div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm"><span className="material-symbols-outlined text-secondary text-base">support_agent</span><span>Need to make changes to your itinerary?</span></div><a href="tel:+23418885275" className="text-secondary font-title-md text-body-sm font-semibold hover:underline">+234 1 888 5275</a></div>
</div>
</div>
</div>
</div>
</div></main>
      <Footer />
    </div>
  );
}
