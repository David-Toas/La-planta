"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/context/auth-context";

export default function VehicleDetailsPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleReserve = (destination = "/checkout") => {
    if (user) {
      router.push(destination);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("laPlanta_intended_destination", destination);
      }
      openAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
<main className="w-full pt-16 lg:pt-20 bg-surface min-h-[calc(100vh-80px)]"><div className="flex flex-col w-full">
<div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full">
{/*  Top Breadcrumbs & Classification Meta  */}
<nav className="flex items-center gap-2 mb-6">
<a className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors" href="/fleet">Fleet Catalog</a>
<span className="text-secondary text-xs">/</span>
<a className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors" href="/fleet">First-Class SUVs</a>
<span className="text-secondary text-xs">/</span>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Range Rover Autobiography LWB</span>
</nav>
{/*  Header Strip  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 mb-10 bg-gradient-to-r from-transparent via-surface-container-low to-transparent p-6 rounded-2xl">
<div className="flex flex-col gap-2">
<div className="flex items-center gap-3">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm">
<span className="material-symbols-outlined text-xs">star</span>
            Flagship Luxury • Driver Included
          </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
            Model Year 2024
          </span>
</div>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif mt-1">
          Range Rover Autobiography Long Wheelbase
        </h1>
<p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          The executive choice for corporate leaders, private VIP transit, weddings, and diaspora travelers navigating Victoria Island, Ikoyi, Ikeja, and Abuja.
        </p>
</div>
<div className="flex items-center gap-3 shrink-0">
<button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:text-secondary font-label-md text-label-md uppercase tracking-wider shadow-sm transition-colors" type="button">
<span className="material-symbols-outlined text-base">share</span>
          Share Vehicle
        </button>
<button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface hover:text-secondary font-label-md text-label-md uppercase tracking-wider shadow-sm transition-colors" type="button">
<span className="material-symbols-outlined text-base">download</span>
          Download Spec Sheet
        </button>
</div>
</div>
{/*  Main Asymmetric 2-Column Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
{/*  LEFT COLUMN: 60% Rich Media, Specs Matrix, Driver Spotlight  */}
<div className="lg:col-span-7 flex flex-col gap-12 min-w-0">
{/*  Primary Gallery Showcase  */}
<section className="flex flex-col gap-4">
<div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-lg bg-surface-container-high group">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="Luxurious black Range Rover Autobiography LWB 2024 parked seamlessly on private jet airside runway tarmac at sunset next to a sleek private executive aircraft and presidential private terminal, golden warm light illuminating sleek metallic surfaces and red carpet boarding." id="main-gallery-view" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJkYRdhTwQ3X1F8Z2ZGSdwfKFwBPuaHl6qrwbkJyoaRwK1WQPv6tPBoXiyUrjmYwpsEyNtVGIHlXjCoaIeErWu8OCjR96Ipmvt9_73IffGUA6X8Yxo-WNSICQ1BRdCjAIteK1aN-_igKwgSv70KxYSaAeigakxSTSQ6KLYK11UWwrtZLffHbnqYyNA876gtzoWZIC_Wkm9J6wngxIWdcVEISmIj1G9ZDPOR4hc-YcOsOOoxCjZ03Q9" />
<div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60"></div>
<div className="absolute bottom-5 left-6 right-6 flex items-end justify-between text-on-primary">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">VIP Airport Pickup</span>
<span className="font-title-lg text-title-lg font-serif">Murtala Muhammed VIP Terminal • Lagos</span>
</div>
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/80 backdrop-blur-md font-label-sm text-label-sm text-on-primary shadow-sm">
<span className="material-symbols-outlined text-xs text-secondary-fixed">photo_camera</span>
                Gallery 1 / 5
              </div>
</div>
</div>
{/*  Thumbnails Row  */}
<div className="grid grid-cols-4 gap-3">
<button className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low p-0.5 shadow-sm focus:outline-none transition-transform hover:-translate-y-0.5" onClick={() => {}} type="button">
<img className="w-full h-full object-cover rounded-lg" data-alt="Luxurious black Range Rover Autobiography LWB 2024 parked seamlessly on private jet airside runway tarmac at sunset next to a sleek private executive aircraft." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhdtKQUAyW3EbCEGGsJh5TTgYE7bq1zXG_vkGmZRd5GBZNpyidnAzvYn8I4POQp0dQmoFLOicQXjsSs3Ak5kCo4b0zZd9TD4YHDzqv5OmagreIH2LihjIDHKGCymML5iPSXyVqvky0PUP3LPhytGnL5zN0Wq_DovtPg1HnKhihguaHNuu8qWkU-WuGUOijB4ldH3koXViqAeSecYvXrYT6YbLS0g0bqAf-62ukM6ptgcdMlwr6KXmm" />
</button>
<button className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low p-0.5 shadow-sm focus:outline-none transition-transform hover:-translate-y-0.5" onClick={() => {}} type="button">
<img className="w-full h-full object-cover rounded-lg" data-alt="Sumptuous tan semi-aniline leather rear executive lounge seating in a 2024 Range Rover Autobiography LWB with deployed motorized veneer tray table, refrigerated champagne cooler, and crystal glasses." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEYZSMD7r0J8_k8hlMk24b89_4m5dOaKd-sCoITTB97bjI6reYv_rpnl5Yyl9BH1QKGZoreob1zPWHfVb9Yg1993LBTWKKYCD9vA6X8yyaiM08vH2AdCWMV9lVLQQ2qhxhqB5LjY1ZtWPV-F5ZGCiHaFOOi7F9Al-u2gvPc4QjoJwE2OuamQvMJAvrO0plswFTQjqMCwbsTYVeDd7X4CeaAF1D1s-REFmoSK8XTPSFfsUnByCPeVOn" />
</button>
<button className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low p-0.5 shadow-sm focus:outline-none transition-transform hover:-translate-y-0.5" onClick={() => {}} type="button">
<img className="w-full h-full object-cover rounded-lg" data-alt="Spacious open trunk of Range Rover Autobiography holding four large dark aluminum Rimowa luxury travel suitcases with bespoke luggage organization and soft ambient cargo lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRS8nUzHOSmJinbFzevVfXkM5Ag4aeqg_VETI_mRrhxw98UcYq7NRPLk7utxIMIdHb92NAS5s89dV8qBFx_X4T0ePPOnWCertCx3cfdq-FCFiYrDGaaXrtUKFO_CxDZlZg-YWQa6q44xt843yIDD6TjbUU5-0SAO-Awh5JnbfT4RXG93MyvpVeh7P5cREuf5ioAIR2-iYvneeS-PTcxjWtalSFVYdaQqX7xUI-zHzl9Adp87Y0aQKB" />
</button>
<button className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low p-0.5 shadow-sm focus:outline-none transition-transform hover:-translate-y-0.5" onClick={() => {}} type="button">
<img className="w-full h-full object-cover rounded-lg" data-alt="Minimalist driver cockpit and front cabin dashboard of modern luxury SUV featuring curved digital glass display, natural dark walnut wood accents, and high-tech satellite telematics." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB63CX73tDnoDJbj9lFqLCA4tXXkZn5P5k_A3D6Q7lCUN0UJAbvIwbvEtJ5cZa3ZB19jXAq-IJCTC2_ckdbeBAQ0aK7X4uqydnqoYw2Z67W7ZEqenMgpV0lIbOOJ4QMs4hvUXA48DMPnS_0rw5qDuVnc3jUEyN_LTwlIV3omTp8ccIJ27ylP093HFXlUh2m0hMrjgb56U4qGZ0EGXpNn17NXzq1tWiOak0P-lEjMotu0ySHk2XAxifP" />
</button>
</div>
</section>
{/*  Executive Specification Matrix (Bento style)  */}
<section className="flex flex-col gap-6">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-primary font-serif">Executive Architecture</h2>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Vehicle Specifications</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">airline_seat_recline_extra</span>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">First-Class 2+2</span>
</div>
<div>
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">Seating Architecture</span>
<span className="font-title-lg text-title-lg text-primary block">4 Executive Guests</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Full rear business lounge with 24-way heated, ventilated, and hot stone massage recline functions.</p>
</div>
</div>
<div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">luggage</span>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">1,050 L Capacity</span>
</div>
<div>
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">Luggage Threshold</span>
<span className="font-title-lg text-title-lg text-primary block">4 Large + 2 Cabin Cases</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Engineered to accommodate 4 large travel cases alongside executive carry-ons with ease.</p>
</div>
</div>
<div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">tune</span>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface">Dynamic Response Pro</span>
</div>
<div>
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">Chassis Dynamics</span>
<span className="font-title-lg text-title-lg text-primary block">Electronic Air Suspension</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Active noise cancellation embedded headrests creating an acoustically isolated, ultra-quiet cabin.</p>
</div>
</div>
<div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col justify-between gap-4">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">wifi</span>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">Executive Suite</span>
</div>
<div>
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant block mb-1">Cabin Telematics</span>
<span className="font-title-lg text-title-lg text-primary block">5G Satellite Wi-Fi &amp; Dual 11.4" Screens</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">1,600W Meridian Signature Sound system with center refrigerated console cooling drinks to 5°C.</p>
</div>
</div>
</div>
</section>
{/*  Chauffeur Spotlight & Standard Inclusions  */}
<section className="flex flex-col gap-6">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-primary font-serif">What's Included</h2>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Included as Standard</span>
</div>
{/*  Chauffeur Spotlight Card  */}
<div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col md:flex-row gap-6 items-center">
<div className="relative shrink-0">
<img className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm ring-4 ring-surface-container" data-alt="Dignified professional Black African executive chauffeur in sharp black suit, white crisp collared shirt, black necktie, chauffeur peak cap, and white gloves smiling warmly with understated elegance outside luxury hotel entrance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuARWL88DqVjPu6K1BUp45G3KXKtvIZO9Mpj_OTa3gML8ead26fnpNmIPB6cBv9vpI0DmmpMki4rLmd_QkFefTyqTpe-6e8wza91aBrnqegeMn8l6j9WcWBR2rg1pdhZcKQkEfBJbYbIvlqhBe05T196C2O8yayDNQ8RPAj3U8LT12JpleUzqLpeOzsAamJlmJKm_8Zm7tA8KcPhP_eP-FwVDcEi2_Rn4n57rIAjQ0yZ69rNFQqkYDIB" />
<span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider">
                Vetted Driver
              </span>
</div>
<div className="flex flex-col gap-2 w-full">
<div className="flex items-center justify-between flex-wrap gap-2">
<div>
<span className="font-title-lg text-title-lg text-primary block">Professional Dedicated Chauffeur</span>
<span className="font-body-sm text-body-sm text-secondary">Defensive Driving Certified • Bilingual (English / French)</span>
</div>
<div className="flex items-center gap-1 text-secondary">
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings": "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings": "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings": "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings": "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-sm" style={{"fontVariationSettings": "'FILL' 1"}}>star</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold ml-1">5.0</span>
</div>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
                Every booking includes a formally attired, professional driver trained in executive transit, defensive driving, route optimization, and discreet client care across Lagos and Abuja.
              </p>
<div className="flex flex-wrap gap-2 pt-1">
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface">
<span className="material-symbols-outlined text-xs text-secondary">verified</span>
                  Vetted &amp; Background Checked
                </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface">
<span className="material-symbols-outlined text-xs text-secondary">security</span>
                  Defensive Driving Certified
                </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-on-surface">
<span className="material-symbols-outlined text-xs text-secondary">lock</span>
                  Strict Confidentiality
                </span>
</div>
</div>
</div>
{/*  Feature Inclusions Grid  */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low"><div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm"><span className="material-symbols-outlined text-lg">person_pin</span></div><div className="flex flex-col"><span className="font-title-md text-title-md text-primary">Dedicated Chauffeur</span><span className="font-body-sm text-body-sm text-on-surface-variant">Defensively trained, licensed professional driver with complete route mastery.</span></div></div><div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low"><div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm"><span className="material-symbols-outlined text-lg">shield</span></div><div className="flex flex-col"><span className="font-title-md text-title-md text-primary">Comprehensive Insurance</span><span className="font-body-sm text-body-sm text-on-surface-variant">Full passenger liability, comprehensive collision cover, and 24/7 roadside backup.</span></div></div><div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low"><div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm"><span className="material-symbols-outlined text-lg">satellite_alt</span></div><div className="flex flex-col"><span className="font-title-md text-title-md text-primary">24/7 Telematics</span><span className="font-body-sm text-body-sm text-on-surface-variant">Real-time GPS tracking sync and 24/7 fleet operations support.</span></div></div><div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low"><div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary shadow-sm"><span className="material-symbols-outlined text-lg">water_drop</span></div><div className="flex flex-col"><span className="font-title-md text-title-md text-primary">Complimentary In-Cabin Refreshments</span><span className="font-body-sm text-body-sm text-on-surface-variant">Chilled premium bottled water, refreshing wipes, mints, and multi-device fast charging cables.</span></div></div></div>
</section>
</div>
{/*  RIGHT COLUMN: 40% Sticky Interactive Hire Configurator & Investment Breakdown  */}
<div className="lg:col-span-5 sticky top-28">
<div className="p-8 rounded-3xl bg-surface-container-lowest shadow-[0_20px_50px_rgba(26,26,26,0.06)] flex flex-col gap-6">
{/*  Pricing Header  */}
<div className="flex items-baseline justify-between border-b pb-6 border-outline-variant/30">
<div>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block">Daily Rental Rate</span>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg font-serif text-primary">₦620,000</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">/ calendar day</span>
</div>
</div>
<span className="font-label-md text-label-md text-secondary bg-secondary-fixed/50 px-3 py-1.5 rounded-full font-semibold">
              ≈ $440 USD
            </span>
</div>
{/*  Interactive Form Controls  */}
<form className="flex flex-col gap-5" id="charter-form" onSubmit={(e) => e.preventDefault()}>
{/*  Handover Location Segmented Picker  */}
<div className="flex flex-col gap-2">
<label className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold flex items-center gap-1.5">
<span className="material-symbols-outlined text-sm text-secondary">pin_drop</span>
                Handover &amp; Retrieval Location
              </label>
<div className="grid grid-cols-1 gap-2.5"><label className="relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all bg-surface-container-low hover:bg-surface-container border-2 border-transparent has-[:checked]:border-secondary has-[:checked]:bg-secondary-fixed/20"><div className="flex items-center gap-3"><input defaultChecked className="w-4 h-4 text-secondary accent-secondary" name="handover" onChange={() => {}} type="radio" defaultValue="35000" /><div className="flex flex-col"><span className="font-title-md text-title-md text-primary leading-tight">Direct Delivery</span><span className="font-body-sm text-body-sm text-on-surface-variant">Airport terminal pickup or private residence / hotel delivery</span></div></div><span className="font-label-sm text-label-sm font-semibold text-secondary">+₦35,000</span></label><label className="relative flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all bg-surface-container-low hover:bg-surface-container border-2 border-transparent has-[:checked]:border-secondary has-[:checked]:bg-secondary-fixed/20"><div className="flex items-center gap-3"><input className="w-4 h-4 text-secondary accent-secondary" name="handover" onChange={() => {}} type="radio" defaultValue="0" /><div className="flex flex-col"><span className="font-title-md text-title-md text-primary leading-tight">Office Pickup</span><span className="font-body-sm text-body-sm text-on-surface-variant">Victoria Island Operations Office (Ozumba Mbadiwe)</span></div></div><span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Complimentary</span></label></div>
</div>
{/*  Schedule Dates Card  */}
<div className="flex flex-col gap-2">
<label className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold flex items-center justify-between">
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-sm text-secondary">calendar_today</span>
                  Rental Period &amp; Duration
                </span>
<span className="text-secondary font-semibold">3 Days Duration</span>
</label>
<div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-xl">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Commencement</span>
<span className="font-title-md text-title-md text-primary mt-0.5">Nov 14, 2024</span>
<span className="font-body-sm text-body-sm text-secondary">09:00 AM Handover</span>
</div>
<div className="flex flex-col pl-3 border-l border-outline-variant/30">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Conclusion</span>
<span className="font-title-md text-title-md text-primary mt-0.5">Nov 17, 2024</span>
<span className="font-body-sm text-body-sm text-secondary">06:00 PM Release</span>
</div>
</div>
</div>
{/*  Protocol Add-ons Checkboxes  */}
<div className="flex flex-col gap-2 pt-1">
<label className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold flex items-center gap-1.5">
<span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
                Executive Add-ons &amp; Services
              </label>
<div className="flex flex-col gap-2">
{/*  Tarmac Meet & Greet  */}
<label className="flex items-start justify-between p-3.5 rounded-xl cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all has-[:checked]:bg-secondary-fixed/20 border-2 border-transparent has-[:checked]:border-secondary">
<div className="flex items-start gap-3">
<input defaultChecked className="mt-1 w-4 h-4 rounded text-secondary accent-secondary" id="addon-tarmac" onChange={() => {}} type="checkbox" defaultValue="50000" />
<div className="flex flex-col">
<span className="font-title-md text-title-md text-primary leading-tight">VIP Airport Meet &amp; Greet (LOS / ABV)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Terminal pickup, luggage assistance, and expedited escort to vehicle</span>
</div>
</div>
<span className="font-label-sm text-label-sm font-semibold text-secondary shrink-0 ml-2">+₦50,000</span>
</label>
{/*  Dedicated Security Escort Option  */}
<label className="flex items-start justify-between p-3.5 rounded-xl cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all has-[:checked]:bg-secondary-fixed/20 border-2 border-transparent has-[:checked]:border-secondary">
<div className="flex items-start gap-3">
<input className="mt-1 w-4 h-4 rounded text-secondary accent-secondary" id="addon-escort" onChange={() => {}} type="checkbox" defaultValue="540000" />
<div className="flex flex-col">
<span className="font-title-md text-title-md text-primary leading-tight">Dedicated Security Escort Unit</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Certified security pilot vehicle with vetted personnel</span>
</div>
</div>
<span className="font-label-sm text-label-sm font-semibold text-secondary shrink-0 ml-2">+₦540,000</span>
</label>
</div>
</div>
{/*  Investment Breakdown Ledger  */}
<div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-surface-container mt-2">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Rental Cost Breakdown</span>
<div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface">
<span className="">Base Rental (3 Days @ ₦620,000)</span>
<span className="font-semibold text-primary">₦1,860,000</span>
</div>
<div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface">
<span className="">Direct Handover Protocol</span>
<span className="font-semibold text-primary" id="ledger-handover">₦35,000</span>
</div>
<div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface" id="ledger-tarmac-row">
<span className="">VIP Airport Meet &amp; Greet</span>
<span className="font-semibold text-primary" id="ledger-tarmac">₦50,000</span>
</div>
<div className="hidden justify-between items-center font-body-sm text-body-sm text-on-surface" id="ledger-escort-row">
<span className="">Dedicated Security Escort Unit</span>
<span className="font-semibold text-primary" id="ledger-escort">₦540,000</span>
</div>
<div className="flex justify-between items-center font-body-sm text-body-sm text-secondary pt-1 border-t border-outline-variant/30">
<span className="">Driver Allowance &amp; Fuel Reserve</span>
<span className="font-semibold uppercase text-xs">Included</span>
</div>
<div className="flex justify-between items-baseline pt-2 border-t border-outline-variant/40 mt-1">
<div>
<span className="font-title-md text-title-md text-primary block leading-none">Total Rental Cost</span>
<span className="font-body-sm text-body-sm text-on-surface-variant" id="total-usd">≈ $1,380 USD</span>
</div>
<span className="font-headline-md text-headline-md font-serif text-primary" id="total-amount">₦1,945,000</span>
</div>
</div>
{/*  CTA Button  */}
<button onClick={() => handleReserve("/checkout")} className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold shadow-md hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-2 group mt-1 cursor-pointer" type="button"><span className="">Proceed to Reservation</span><span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span></button>
{/*  Trust / Guarantee Badges  */}
<div className="flex flex-col gap-2 pt-2">
<div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-secondary text-sm">lock_person</span>
<span className="">100% Upfront Online Guarantee • Instant Digital Pass</span>
</div>
<div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-secondary text-sm">event_repeat</span>
<span className="">Complimentary rescheduling up to 24h prior to flight arrival</span>
</div>
</div>
</form>
</div>
</div>
</div>
</div>
</div>
</main>

      {/* Mobile Sticky Booking Bar (Visible only on mobile, sits above bottom dock) */}
      <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden p-3 bg-[#0a0d14]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-8px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
            Daily Charter
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white font-serif">₦620,000</span>
            <span className="text-[10px] text-stone-400">/day</span>
          </div>
        </div>
        <button
          onClick={() => handleReserve("/checkout")}
          type="button"
          className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <span>Reserve Now</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <Footer />
    </div>
  );
}
