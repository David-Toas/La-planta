"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/context/auth-context";

export default function CheckoutPage() {
  const { user, openAuthModal } = useAuth();
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
<main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]"><div className="flex flex-col w-full">
<div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-10">
{/*  Top Stepper Header  */}
<div className="flex flex-col gap-6 mb-12">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<div className="flex items-center gap-2 mb-2">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
<span className="material-symbols-outlined text-sm text-secondary" style={{"fontVariationSettings": "'FILL' 1"}}>lock</span>
              256-Bit Encrypted Secure Session
            </span>
<span className="text-outline-variant">•</span>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Instant QR Voucher Issued Upon Completion</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">Complete Your Vehicle Reservation</h1>
</div>
<div className="flex items-center gap-2 self-start md:self-auto bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Booking Ref:</span>
<span className="font-title-md text-title-md text-secondary font-serif">LP-LOS-89240</span>
</div>
</div>
{/*  Stepper Progress Bar  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-label-md shrink-0">
<span className="material-symbols-outlined text-base">check</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Step 01</span>
<span className="font-title-md text-title-md text-on-surface truncate">Handover Details</span>
</div>
</div>
<div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-lowest shadow-sm">
<div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-md text-label-md font-bold shrink-0">
            2
          </div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Step 02</span>
<span className="font-title-md text-title-md text-on-surface truncate">Guest Identification</span>
</div>
</div>
<div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low shadow-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md font-bold shrink-0">
            3
          </div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Step 03</span>
<span className="font-title-md text-title-md text-on-surface-variant truncate">Upfront Online Payment</span>
</div>
</div>
</div>
</div>
{/*  Main Layout Grid: 65% Funnel / 35% Sticky Summary  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
{/*  LEFT COLUMN: 65% Interactive Funnel  */}
<div className="lg:col-span-8 flex flex-col gap-6">
{/*  STEP 1 ACCORDION (COMPLETED / VERIFIED)  */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all duration-300"><div className="p-6 md:p-8 flex flex-col gap-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-semibold">1</span><div><h2 className="font-headline-sm text-headline-sm text-primary font-serif">Handover Choice &amp; Location</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Select vehicle handover location, schedule, and optional flight tracking</p></div></div><span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Confirmed</span></div><div className="flex flex-col gap-4"><label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Handover Mode</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="cursor-pointer p-4 rounded-xl bg-surface-container-low border-2 border-transparent flex items-center justify-between transition-colors hover:bg-surface-container-high/60"><div className="flex items-center gap-3"><input className="sr-only" name="handover_type" type="radio" defaultValue="office" /><div className="w-5 h-5 rounded-full border-2 border-outline flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-secondary hidden"></div></div><div className="flex flex-col"><span className="font-title-md text-title-md text-on-surface font-semibold">Office Pickup</span><span className="font-body-sm text-body-sm text-on-surface-variant">Lagos / Abuja VIP Executive Lounge</span></div></div><span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold uppercase">Free</span></label><label className="cursor-pointer p-4 rounded-xl bg-surface-container-high/60 border-2 border-secondary flex items-center justify-between transition-colors"><div className="flex items-center gap-3"><input defaultChecked className="sr-only" name="handover_type" type="radio" defaultValue="delivery" /><div className="w-5 h-5 rounded-full border-2 border-secondary flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-secondary"></div></div><div className="flex flex-col"><span className="font-title-md text-title-md text-on-surface font-semibold">Direct Delivery</span><span className="font-body-sm text-body-sm text-on-surface-variant">Delivery to hotel, residence, or airport</span></div></div><span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-label-sm font-semibold uppercase">Included</span></label></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"><div className="flex flex-col gap-1.5 md:col-span-3"><label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Delivery Address</label><div className="relative flex items-center"><input className="w-full h-12 px-4 pl-11 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none" placeholder="Enter destination hotel, private address, or airport terminal" type="text" defaultValue="The Wheatbaker Hotel, 4 Onitolo Rd, Ikoyi, Lagos" /><span className="material-symbols-outlined absolute left-3.5 text-secondary text-lg">location_on</span></div></div><div className="flex flex-col gap-1.5 md:col-span-2"><label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Delivery Date &amp; Time Window</label><div className="relative flex items-center"><input className="w-full h-12 px-4 pl-11 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none" type="text" defaultValue="Nov 14, 2024 • 17:30 WAT" /><span className="material-symbols-outlined absolute left-3.5 text-secondary text-lg">schedule</span></div></div><div className="flex flex-col gap-1.5"><div className="flex items-center justify-between"><label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Flight Number</label><span className="font-label-sm text-[10px] uppercase text-secondary font-semibold">Optional Flight Sync</span></div><div className="relative flex items-center"><input className="w-full h-12 px-4 pl-11 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none" placeholder="e.g. BA 075" type="text" defaultValue="BA 075" /><span className="material-symbols-outlined absolute left-3.5 text-secondary text-lg">flight_land</span></div></div></div></div></div>
{/*  STEP 2 ACCORDION: IN-LINE VIP IDENTIFICATION (EXPANDED)  */}
<div id="step2-container" className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden transition-all">
  <div className="p-6 md:p-8 flex flex-col gap-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-semibold">2</span>
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary font-serif">Guest Account &amp; Verification</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Sign in or create account to verify your booking and receive background dispatch confirmations</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openAuthModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-secondary-fixed text-primary font-label-sm text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          <span className="material-symbols-outlined text-sm text-secondary">login</span>
          <span>{user ? "Switch Account" : "Sign In / Create Account"}</span>
        </button>
      </div>
    </div>

    {/*  Active Authenticated Guest View  */}
    <div id="step2-authenticated-box" className="p-4 sm:p-5 rounded-xl bg-surface-container-low/90 border border-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div id="step2-avatar" className="w-12 h-12 rounded-full bg-primary text-secondary-fixed flex items-center justify-center font-bold text-base shadow-sm shrink-0">
          {user ? (user.name ? user.name.charAt(0) : "V") : "G"}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span id="step2-name" className="font-title-md text-base text-primary font-semibold">
              {user ? user.name : "Guest Client (Click to sign in)"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] font-bold uppercase tracking-wider">
              {user ? (user.vipTier || "Verified VIP") : "Guest Checkout"}
            </span>
          </div>
          <span id="step2-contact" className="font-body-sm text-xs text-on-surface-variant">
            {user ? `${user.email} ${user.phone ? "• " + user.phone : ""}` : "Sign in to save trip history and earn loyalty rewards"}
          </span>
          <span className="font-label-sm text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-sm">check_circle</span> Automated background confirmation ready (Email, SMS &amp; WhatsApp)
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={openAuthModal}
          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold uppercase tracking-wider text-on-surface transition-colors"
        >
          {user ? "Switch User" : "Sign In"}
        </button>
      </div>
    </div>

    {/*  Unauthenticated Quick Form View  */}
    <div id="step2-guest-form" className="hidden flex flex-col gap-4">
      <div className="p-3 rounded-lg bg-secondary-fixed/30 border border-secondary/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-primary">
          <span className="material-symbols-outlined text-secondary text-base">info</span>
          <span>Sign in or register below to secure your vehicle.</span>
        </div>
        <button type="button" onClick={() => {}} className="px-2.5 py-1 rounded-md bg-primary hover:bg-secondary text-on-primary font-label-sm text-[11px] font-semibold uppercase tracking-wider transition-colors">
          1-Click Demo Guest
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="inline-guest-name">Full Name</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">person</span>
            <input id="inline-guest-name" className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface font-body-md text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary" placeholder="e.g. Dr. Adekunle Balogun" type="text" defaultValue="Dr. Adekunle Balogun" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="inline-guest-phone">WhatsApp Phone</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">call</span>
            <input id="inline-guest-phone" className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface font-body-md text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary" placeholder="+234 803 555 0192" type="tel" defaultValue="+234 803 555 0192" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="inline-guest-email">Corporate or Personal Email</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">mail</span>
            <input id="inline-guest-email" className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface font-body-md text-sm rounded-xl border border-surface-container focus:outline-none focus:border-secondary" placeholder="a.balogun@executivecorp.ng" type="email" defaultValue="a.balogun@executivecorp.ng" />
          </div>
          <span className="font-label-sm text-[10px] text-secondary">Your booking voucher, invoice, and QR pass will be emailed here.</span>
        </div>
      </div>
    </div>
  </div>
</div>
{/*  STEP 3 ACCORDION: 100% UPFRONT PAYMENT GATEWAY  */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
<div className="p-6 md:p-8 flex flex-col gap-6">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
<div className="flex items-center gap-3">
<span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-semibold">3</span>
<div>
<h2 className="font-headline-sm text-headline-sm text-primary font-serif">100% Upfront Online Payment</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Secure online payment with instant confirmation via SMS, WhatsApp &amp; Email</p>
</div>
</div>
<span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm uppercase tracking-widest font-semibold">
<span className="material-symbols-outlined text-sm">shield</span> Bank-Grade Encryption
              </span>
</div>
{/*  Payment Gateway Selector Cards  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
{/*  Gateway 1: Card (Active)  */}
<label className="cursor-pointer relative p-4 rounded-xl bg-surface-container-high/60 shadow-sm flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5">
<input defaultChecked className="sr-only" name="payment_method" type="radio" defaultValue="card" />
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-serif">International Card</span>
<span className="material-symbols-outlined text-secondary text-lg" style={{"fontVariationSettings": "'FILL' 1"}}>radio_button_checked</span>
</div>
<div className="flex flex-col gap-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Paystack / Flutterwave</span>
<div className="flex items-center gap-1.5 pt-1">
<span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-[10px] font-bold">VISA</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-[10px] font-bold">MC</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-[10px] font-bold">AMEX</span>
</div>
</div>
</label>
{/*  Gateway 2: NIBSS Virtual Transfer  */}
<label className="cursor-pointer relative p-4 rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5">
<input className="sr-only" name="payment_method" type="radio" defaultValue="transfer" />
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-serif">Instant Bank Transfer</span>
<span className="material-symbols-outlined text-outline text-lg">radio_button_unchecked</span>
</div>
<div className="flex flex-col gap-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Virtual Account Transfer</span>
<span className="font-label-sm text-label-sm text-secondary font-medium">Auto-confirmed in 45s</span>
</div>
</label>
{/*  Gateway 3: Digital Wallet  */}
<label className="cursor-pointer relative p-4 rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5">
<input className="sr-only" name="payment_method" type="radio" defaultValue="wallet" />
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-serif">Apple / Google Pay</span>
<span className="material-symbols-outlined text-outline text-lg">radio_button_unchecked</span>
</div>
<div className="flex flex-col gap-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">One-Tap Checkout</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">USD / GBP / EUR Native</span>
</div>
</label>
</div>
{/*  Card Input Fields Form Container  */}
<div className="p-5 rounded-xl bg-surface-container-low/50 flex flex-col gap-4">
<div className="flex flex-col gap-1.5">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Cardholder Full Name</label>
<input className="h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none" type="text" defaultValue="ADEKUNLE BALOGUN" />
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Card Number</label>
<div className="relative flex items-center">
<input className="w-full h-12 px-4 pl-11 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none font-mono tracking-wider" type="text" defaultValue="•••• •••• •••• 4092" />
<span className="material-symbols-outlined absolute left-3.5 text-secondary text-lg">credit_card</span>
<div className="absolute right-3.5 flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Amex Platinum</span>
</div>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="flex flex-col gap-1.5">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Expiry Date</label>
<input className="h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none font-mono" type="text" defaultValue="09 / 28" />
</div>
<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Security Code</label>
<span className="font-label-sm text-label-sm text-secondary cursor-pointer">4-digit CID</span>
</div>
<input className="h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none font-mono" type="password" defaultValue="8421" />
</div>
</div>
</div>
{/*  Settlement CTA Button  */}
<div className="flex flex-col gap-3 pt-2">
<button id="pay-checkout-btn" onClick={() => {}} className="w-full h-14 rounded-xl bg-primary hover:bg-secondary text-on-primary font-title-md text-title-md transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] font-semibold cursor-pointer" type="button">
  <span>Pay ₦1,895,000 &amp; Issue Instant QR Pass</span>
  <span className="material-symbols-outlined text-base">lock</span>
</button>
{/*  Guarantees Pill Array  */}
<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 text-center font-label-sm text-label-sm text-on-surface-variant">
<span className="inline-flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-sm">verified</span>
                  100% Refundable up to 24h prior to handover
                </span>
<span className="hidden sm:inline text-outline-variant">•</span>
<span className="inline-flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-sm">security</span>
                  Professional driver assigned &amp; vehicle prepared prior to handover
                </span>
</div>
</div>
</div>
</div>
</div>
{/*  RIGHT COLUMN: 35% Sticky Transparent Order Summary & Vehicle Card  */}
<div className="lg:col-span-4 sticky top-28 flex flex-col gap-5">
{/*  Vehicle Summary Card  */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="High-end studio side view of an executive Range Rover Autobiography LWB in Santorini Black finish with discreet privacy glass and subtle ambient luxury lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcPPvtpBMMHhGYDZgYeiN9MSSoJDn5EL2iwwQIFvLdLq2wXTdv-7bX6rVU81xIkwPEeoZQXXUTS3f3wAC6AuZb4WJOYpoXMxE5a6GlSX0CZTBxoTRGHZdVion5bSXvox3rFPiR1wEz7K0MNeeEvklFhjwHWBhso8a8fOKuv2jMP5ccgpyKyuHOWkbRh_VUengNDFOt8KrevURwkaKfllO5acC7dO-q_6WM4_jiJ7e1RTx6B82QO-Yr" />
<div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent"></div>
<div className="absolute top-3 left-3 flex gap-2">
<span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-sm text-label-sm font-semibold tracking-wide">Autobiography Spec</span>
<span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">Executive Class</span>
</div>
<div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
<div>
<span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest">Executive Fleet</span>
<a href="/vehicle-details" className="block hover:underline"><h3 className="font-headline-sm text-headline-sm text-on-primary font-serif">Range Rover Autobiography LWB</h3></a>
</div>
<span className="font-label-sm text-label-sm text-primary-fixed">Santorini Black</span>
</div>
</div>
<div className="p-6 flex flex-col gap-5"><div className="flex items-center justify-between py-2 px-3 bg-surface-container-low rounded-lg text-on-surface-variant font-label-sm text-label-sm"><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-secondary">person</span> 3 VIP Passengers</span><span className="">•</span><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-secondary">luggage</span> 4 Executive Cases</span><span className="">•</span><span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-secondary">wifi</span> Onboard Starlink Wi-Fi</span></div><div className="flex flex-col gap-3"><span className="font-label-md text-label-md uppercase tracking-wider text-secondary">Itinerary Schedule</span><div className="flex items-start gap-3"><div className="flex flex-col items-center gap-1 pt-1"><span className="w-2 h-2 rounded-full bg-secondary"></span><div className="w-0.5 h-7 bg-surface-variant"></div><span className="w-2 h-2 rounded-full bg-primary"></span></div><div className="flex flex-col gap-2 w-full"><div className="flex items-center justify-between"><span className="font-title-md text-title-md text-on-surface">Start: Nov 14, 2024</span><span className="font-label-sm text-label-sm text-on-surface-variant">17:30 WAT</span></div><div className="flex items-center justify-between"><span className="font-title-md text-title-md text-on-surface">Conclude: Nov 17, 2024</span><span className="font-label-sm text-label-sm text-on-surface-variant">17:30 WAT</span></div></div></div><span className="font-body-sm text-body-sm text-secondary font-medium">Total Term: 3 Full Days (72 Consec. Hours)</span></div><div className="flex flex-col gap-2.5 pt-2"><div className="flex items-center justify-between font-body-sm text-body-sm"><span className="text-on-surface-variant">Range Rover Rental (3 Days × ₦550,000)</span><span className="text-on-surface font-medium">₦1,650,000</span></div><div className="flex items-center justify-between font-body-sm text-body-sm"><span className="text-on-surface-variant">Professional Chauffeur Service</span><span className="text-on-surface font-medium">₦180,000</span></div><div className="flex items-center justify-between font-body-sm text-body-sm"><span className="text-on-surface-variant">Direct Delivery &amp; Airport Meet-and-Greet</span><span className="text-secondary font-medium uppercase font-label-sm text-label-sm">Complimentary</span></div><div className="flex items-center justify-between font-body-sm text-body-sm"><span className="text-on-surface-variant">Standard Fuel &amp; Highway Toll Reserve</span><span className="text-on-surface font-medium">₦65,000</span></div></div><div className="pt-4 flex flex-col gap-1 bg-surface-container-low p-4 rounded-xl"><div className="flex items-baseline justify-between"><span className="font-title-md text-title-md text-on-surface font-semibold">Total Order Due</span><span className="font-headline-md text-headline-md text-primary font-serif">₦1,895,000</span></div><div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant"><span className="">100% Upfront Online Settlement:</span><span className="font-semibold text-secondary">$1,345.00 USD</span></div></div><div className="p-3 rounded-lg bg-surface-container-high/60 flex items-center gap-2 font-label-sm text-label-sm text-secondary font-semibold"><span className="material-symbols-outlined text-base">qr_code_2</span><span className="">Instant QR Voucher issued immediately upon payment</span></div></div>
</div>
{/*  WhatsApp Concierge Fast Help Widget  */}
<div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
<span className="material-symbols-outlined text-xl">support_agent</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface font-medium truncate">Executive Support Desk</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Have questions or need assistance with your booking?</span>
<a className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors font-semibold uppercase tracking-wider mt-1 flex items-center gap-1" href="https://wa.me/23418885275">
              Chat on WhatsApp <span className="material-symbols-outlined text-xs">arrow_forward</span>
</a>
</div>
</div>
{/*  Trust Badges  */}
<div className="px-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-secondary">verified_user</span>Airport VIP Pickup Available</span>
<span className="">•</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-secondary">encrypted</span>PCI-DSS Level 1</span>
</div>
</div>
</div>
</div>
</div></main>
      <Footer />
    </div>
  );
}
