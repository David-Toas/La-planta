"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function FleetPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
<main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]"><div className="flex flex-col w-full">
<div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-10">
{/*  Top Editorial Header & Operational Status Bar  */}
<div className="flex flex-col gap-6 mb-10">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
<div className="max-w-3xl">
<div className="flex items-center gap-2 mb-3">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-md text-label-md uppercase tracking-widest text-secondary font-semibold">Premium Rentals • Lagos &amp; Abuja</span>
</div>
<h1 className="font-display text-display text-primary tracking-tight font-serif">The Executive Fleet</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mt-3 leading-relaxed">
            Every executive vehicle is provisioned with a professional, vetted driver, in-city fuel allowance, high-speed Wi-Fi, and real-time GPS tracking across Lagos and Abuja.
          </p>
</div>
{/*  Quick Summary & Controls  */}
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
<div className="flex items-center gap-2 bg-surface-container px-4 py-2.5 rounded-lg shadow-sm">
<span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">18 Vehicles Available Today</span>
</div>
<div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant" htmlFor="fleet-sort">Sort By:</label>
<select className="bg-transparent font-label-md text-label-md text-on-surface font-semibold focus:outline-none cursor-pointer" id="fleet-sort">
<option value="popular">Most Requested</option>
<option value="armored">Armored Vehicles (B6)</option>
<option value="price-desc">Rate: High to Low</option>
<option value="price-asc">Rate: Low to High</option>
</select>
</div>
</div>
</div>
{/*  Quick Ticker Bar  */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low"><div className="flex items-center gap-3 px-2">
  <span className="material-symbols-outlined text-secondary text-2xl">verified_user</span>
  <div>
    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Executive Service</div>
    <div className="font-title-md text-title-md text-on-surface">Professional Drivers</div>
  </div>
</div>
<div className="flex items-center gap-3 px-2">
  <span className="material-symbols-outlined text-secondary text-2xl">flight_land</span>
  <div>
    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Airport Service</div>
    <div className="font-title-md text-title-md text-on-surface">Airport Fast-Track</div>
  </div>
</div>
<div className="flex items-center gap-3 px-2">
  <span className="material-symbols-outlined text-secondary text-2xl">wifi</span>
  <div>
    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Onboard Connectivity</div>
    <div className="font-title-md text-title-md text-on-surface">Complimentary 5G Wi-Fi</div>
  </div>
</div>
<div className="flex items-center gap-3 px-2">
  <span className="material-symbols-outlined text-secondary text-2xl">tonality</span>
  <div>
    <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Privacy Level</div>
    <div className="font-title-md text-title-md text-on-surface">Bespoke Luxury &amp; Tint</div>
  </div>
</div></div>
</div>
{/*  Layout Grid: 12 Columns (4 col Sticky Sidebar + 8 col Catalog Grid)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
{/*  STICKY FILTER SIDEBAR (4 Cols)  */}
<aside className="lg:col-span-4 sticky top-28 space-y-6"><div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] flex flex-col gap-6">
  <div className="flex items-center justify-between pb-3 border-b-0">
    <h3 className="font-headline-sm text-headline-sm text-primary font-serif">Refine Fleet</h3>
    <button className="font-label-sm text-label-sm uppercase tracking-widest text-secondary hover:text-on-surface transition-colors" type="button">Reset</button>
  </div>
  <div className="flex flex-col gap-2.5">
    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Category</span>
    <div className="flex flex-wrap gap-2">
      <button className="px-3.5 py-1.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold shadow-sm" type="button">All</button>
      <button className="px-3.5 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant hover:bg-secondary-fixed/50 hover:text-on-secondary-fixed transition-colors" type="button">Sedans</button>
      <button className="px-3.5 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant hover:bg-secondary-fixed/50 hover:text-on-secondary-fixed transition-colors" type="button">SUVs</button>
      <button className="px-3.5 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant hover:bg-secondary-fixed/50 hover:text-on-secondary-fixed transition-colors" type="button">Armored</button>
      <button className="px-3.5 py-1.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant hover:bg-secondary-fixed/50 hover:text-on-secondary-fixed transition-colors" type="button">Executive Vans</button>
    </div>
  </div>
  <div className="flex flex-col gap-2.5">
    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Reservation Dates</span>
    <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container">
      <span className="material-symbols-outlined text-secondary text-base">calendar_month</span>
      <input type="date" className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none w-full cursor-pointer" defaultValue="2025-05-15" />
    </div>
  </div>
  <div className="flex flex-col gap-2.5">
    <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Capacity</span>
    <div className="grid grid-cols-3 gap-2">
      <button className="py-2 text-center rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors font-medium" type="button">1-2 Guests</button>
      <button className="py-2 text-center rounded-lg bg-secondary-fixed font-label-sm text-label-sm text-on-secondary-fixed font-semibold shadow-sm" type="button">3-4 Guests</button>
      <button className="py-2 text-center rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors font-medium" type="button">5+ Guests</button>
    </div>
  </div>
  <div className="flex flex-col gap-2.5">
    <div className="flex items-center justify-between">
      <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Price per Day</span>
      <span className="font-label-md text-label-md text-secondary font-semibold">₦300k - ₦1.2M</span>
    </div>
    <input type="range" min="300000" max="1200000" step="50000" defaultValue="850000" className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg" />
    <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
      <span className="">₦300,000</span>
      <span className="">₦1,200,000</span>
    </div>
  </div>
  <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3 mt-2">
    <span className="material-symbols-outlined text-secondary text-2xl shrink-0 mt-0.5">verified</span>
    <div className="flex flex-col">
      <span className="font-title-md text-title-md text-on-surface leading-snug">Driver Assurance</span>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
        Dedicated, vetted executive drivers with expert route knowledge and flight monitoring.
      </p>
    </div>
  </div>
</div>
<div className="bg-primary-container text-on-primary p-6 rounded-xl shadow-md flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed font-semibold">VIP Support Desk</span>
  </div>
  <div className="font-headline-sm text-headline-sm font-serif">Need Bespoke Itinerary?</div>
  <p className="font-body-sm text-body-sm text-on-primary-container">
    Specialized transfers, multiple-day bookings, or airport VIP arrivals can be organized instantly with our desk.
  </p>
  <a className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-secondary-fixed transition-colors font-semibold" href="tel:+23418885275">
    <span className="material-symbols-outlined text-base">support_agent</span>
    Contact Support
  </a>
</div></aside>
{/*  CATALOG GRID CONTENT (8 Cols)  */}
<main className="lg:col-span-8 space-y-8">
{/*  CARD 1: RANGE ROVER AUTOBIOGRAPHY LWB  */}
<article className="bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] overflow-hidden transition-all duration-300 hover:shadow-[0_18px_40px_rgba(197,168,128,0.12)] hover:-translate-y-0.5 flex flex-col"><div className="relative w-full h-80 overflow-hidden">
  <img className="w-full h-full object-cover" data-alt="Black luxury Range Rover Autobiography parked on tarmac" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD62Y29mg8HpZ4YalilZeutLMaeY9FSSfrQH1USRy7J8S6FhYW81VGD20NpbCSpmsh8B0IcYAh47lPlsE7ZNfs0aWy2ajQLq-_uF7XxxcQyoFyFUCwC1Y4qy1fhj4PqY_yAItM6DDp2-Y6C6edouPri_ffn4CxfNUESDyAkSoXSRnsa-uwr-jj5B8K-dNg__CTLgiVPwzzgPa6_aH_xqm1eJzhN8OTcBF7z6-Bd8lNcUoCRkl8OFSio" />
  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
    <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm flex items-center gap-1.5">
      <span className="material-symbols-outlined text-secondary text-sm">flight_takeoff</span>
      Airport Fast-Track
    </span>
    <span className="px-3 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
      Professional Driver Included
    </span>
  </div>
  <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-semibold shadow-sm">
    <span className="material-symbols-outlined text-sm">photo_library</span>
    <span className="">1/6 Photos</span>
  </div>
  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-on-primary">
    <div>
      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">Santorini Black • Long Wheelbase</span>
      <h2 className="font-headline-lg text-headline-lg font-serif leading-tight">Range Rover Autobiography LWB</h2>
    </div>
    <div className="text-right">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container block">Daily Rate</span>
      <div className="flex items-baseline gap-1">
        <span className="font-display-mobile text-display-mobile font-serif font-semibold">₦620,000</span>
        <span className="font-label-sm text-label-sm text-secondary-fixed">(~$420 USD)</span>
      </div>
    </div>
  </div>
</div>
<div className="p-6 md:p-8 flex flex-col gap-6">
  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
    Engineered for uncompromised poise during high-profile transit. Features executive class rear seating, dynamic noise cancellation, bespoke cooler compartment, and supreme road presence.
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">person</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Passengers</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">4 Guests</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">luggage</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Luggage</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">4 Cases</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">wifi</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Wi-Fi</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">High-Speed 5G</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">tonality</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Privacy</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">Tinted Windows</span>
      </div>
    </div>
  </div>
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
    <div className="flex items-center gap-3">
      <img alt="Assigned Driver" className="w-10 h-10 rounded-full object-cover ring-2 ring-secondary-fixed" src="https://lh3.googleusercontent.com/aida/AEtjO1WYXdvzJzo6cdN3Gyr3nvgR3mArcOVJbzV2a2r96N7t0H1XUriC_a07oOlFU4iuU3lN8kO7a-_iNYYjNxJRBrpgUbGSqplOpFpKevda5JMNXPX6gpWgeDRQC34asiCnsma5ULpvQJ_0Q3yhAzGh8meMqkte3w60aA1D8VrHzxxo5EK9meIadYg6K_BxH7EajFwuHZYZVupzK3_O29mQMnNSEWjFWp5oC7jkoW4If_OoAowSPaE0simNCc" />
      <div className="flex flex-col">
        <span className="font-title-md text-title-md text-on-surface text-sm">Assigned Driver: Mr. Emmanuel Okafor</span>
        <span className="font-label-sm text-label-sm text-secondary">Professional Executive Driver • 12 Yrs Experience</span>
      </div>
    </div>
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <button className="w-full sm:w-auto px-5 py-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors font-semibold" onClick={() => {}} type="button">
        View Gallery
      </button>
      <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm" onClick={() => {}} type="button">
        <span className="">Reserve Vehicle</span>
        <span className="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </div>
  </div>
</div></article>
{/*  CARD 2: MERCEDES-BENZ S580 4MATIC  */}
<article className="bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] overflow-hidden transition-all duration-300 hover:shadow-[0_18px_40px_rgba(197,168,128,0.12)] hover:-translate-y-0.5 flex flex-col"><div className="relative w-full h-80 overflow-hidden">
  <img className="w-full h-full object-cover" data-alt="Mercedes-Benz S-Class sedan outside headquarters" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4Z95PMfe1-btZITJkkT5UsIdk8cpPsMR2G9UHoHHN_wzFV6vjlpPL-SmZkMMU6V-utGa2yuBMXORvUBjOACNWKTX_q2bFpWKqGv-sbo-cFFAVRaJcH3Q0fmK7W38-Dt9tviOvQeP3QuC6K2c2Ld53wPdy_pKrT7bHxFQjihKgiYkICJuJ3DB4L9V0sihXkbGtQc2arh_vWxaJ8aehQ8ZX2Vc09XwSAAOk7bzSMYVncI10v1W_QFlk" />
  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
    <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm flex items-center gap-1.5">
      <span className="material-symbols-outlined text-secondary text-sm">workspace_premium</span>
      Bespoke Luxury
    </span>
    <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold">
      Professional Driver Included
    </span>
  </div>
  <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-semibold shadow-sm">
    <span className="material-symbols-outlined text-sm">photo_library</span>
    <span className="">1/8 Photos</span>
  </div>
  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-on-primary">
    <div>
      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">Obsidian Black • Executive Rear Suite</span>
      <h2 className="font-headline-lg text-headline-lg font-serif leading-tight">Mercedes-Benz S580 4MATIC</h2>
    </div>
    <div className="text-right">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container block">Daily Rate</span>
      <div className="flex items-baseline gap-1">
        <span className="font-display-mobile text-display-mobile font-serif font-semibold">₦450,000</span>
        <span className="font-label-sm text-label-sm text-secondary-fixed">(~$305 USD)</span>
      </div>
    </div>
  </div>
</div>
<div className="p-6 md:p-8 flex flex-col gap-6">
  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
    The benchmark of executive transit. Featuring active calf massage seating, 4D Burmester spatial audio, rear vanity suite, and acoustic insulation for calm executive deliberations.
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">person</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Passengers</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">3 Guests</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">luggage</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Luggage</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">2 Cases</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">wifi</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Wi-Fi</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">High-Speed 5G</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">tonality</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Privacy</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">Tinted Windows</span>
      </div>
    </div>
  </div>
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
    <div className="flex items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
      <span className="font-body-sm text-body-sm">Complimentary toll passes &amp; bottled artisanal refreshments</span>
    </div>
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <button className="w-full sm:w-auto px-5 py-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors font-semibold" onClick={() => {}} type="button">
        View Gallery
      </button>
      <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm" onClick={() => {}} type="button">
        <span className="">Reserve Vehicle</span>
        <span className="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </div>
  </div>
</div></article>
{/*  CARD 3: TOYOTA LAND CRUISER 300 VXR (B6 BALLISTIC)  */}
<article className="bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] overflow-hidden transition-all duration-300 hover:shadow-[0_18px_40px_rgba(197,168,128,0.12)] hover:-translate-y-0.5 flex flex-col"><div className="relative w-full h-80 overflow-hidden">
  <img className="w-full h-full object-cover" data-alt="Armored luxury Toyota Land Cruiser 300 VXR" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY1J5EoPuoBuItzSnN9dh1wCaq-_O9exsviSMq8cL_t2rmqUewaQEuFG86cQSd4xSJMgXST7zISnWcDqriNU9S5wMadox8KjIuGgH1F5mlnWc40NdRaYMbB2Lk2XCd5H6TwG6zKI_keMsk6h5V5A-MHmIoE-P0_EAnyeZ5RvCkeNRHyNCBSJhnyVjPBgG7iz8XcMt-KxRd8fIBHgL39ypc0RXqzo-NplRVsb1vKekPXCv3-m2zPC_u" />
  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
    <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm flex items-center gap-1.5">
      <span className="material-symbols-outlined text-secondary text-sm">workspace_premium</span>
      Bespoke Luxury
    </span>
    <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold">
      Professional Driver Included
    </span>
  </div>
  <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-semibold shadow-sm">
    <span className="material-symbols-outlined text-sm">photo_library</span>
    <span className="">1/5 Photos</span>
  </div>
  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-on-primary">
    <div>
      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">Titanium Pearl • Armored Security</span>
      <h2 className="font-headline-lg text-headline-lg font-serif leading-tight">Land Cruiser 300 VXR Armored</h2>
    </div>
    <div className="text-right">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container block">Daily Rate</span>
      <div className="flex items-baseline gap-1">
        <span className="font-display-mobile text-display-mobile font-serif font-semibold">₦580,000</span>
        <span className="font-label-sm text-label-sm text-secondary-fixed">(~$390 USD)</span>
      </div>
    </div>
  </div>
</div>
<div className="p-6 md:p-8 flex flex-col gap-6">
  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
    Reinforced protective luxury SUV featuring certified multi-layered ballistic protection, reinforced suspension, run-flat tyres, and whisper-quiet interior privacy for serene travel.
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">person</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Passengers</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">5 Guests</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">luggage</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Luggage</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">5 Cases</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">wifi</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Wi-Fi</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">High-Speed 5G</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">tonality</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Privacy</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">Tinted Windows</span>
      </div>
    </div>
  </div>
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
    <div className="flex items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-secondary text-base">security</span>
      <span className="font-body-sm text-body-sm">Equipped with certified B6 armor and defensive driving certified drivers</span>
    </div>
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <button className="w-full sm:w-auto px-5 py-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors font-semibold" onClick={() => {}} type="button">
        View Gallery
      </button>
      <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm" onClick={() => {}} type="button">
        <span className="">Reserve Vehicle</span>
        <span className="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </div>
  </div>
</div></article>
{/*  CARD 4: MERCEDES-MAYBACH GLS 600  */}
<article className="bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(26,26,26,0.035)] overflow-hidden transition-all duration-300 hover:shadow-[0_18px_40px_rgba(197,168,128,0.12)] hover:-translate-y-0.5 flex flex-col"><div className="relative w-full h-80 overflow-hidden">
  <img className="w-full h-full object-cover" data-alt="Mercedes-Maybach GLS 600 ultra luxury SUV" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXadkWjZzB-lTOrXw3-GGeOO3QVc6JcMh6oBmGf28sTeSlDLPJg0e3wu8eoGWB3aGt7NzkZSjkZOhPegbM3B875BBPj59Bx3DI3IkEWJ8cTAfwrjjjb7PoxIFVmV1vdrJnJLLA-9faIr93hOM1_zCULkav468AZ04UAvPNo0rnOn6DolwemIveQyFVW1YcVwZkwAlGT2Br5J2PNiYxXlTOyPKbk70kuiE9k9s6arETgwChqC0v_Rwa" />
  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
    <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold shadow-sm flex items-center gap-1.5">
      <span className="material-symbols-outlined text-secondary text-sm">workspace_premium</span>
      Bespoke Luxury
    </span>
    <span className="px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold">
      Airport Fast-Track
    </span>
  </div>
  <div className="absolute top-4 right-4 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface font-semibold shadow-sm">
    <span className="material-symbols-outlined text-sm">photo_library</span>
    <span className="">1/10 Photos</span>
  </div>
  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-on-primary">
    <div>
      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">Two-Tone Onyx / Kalahari Gold • First Class Cabin</span>
      <h2 className="font-headline-lg text-headline-lg font-serif leading-tight">Mercedes-Maybach GLS 600</h2>
    </div>
    <div className="text-right">
      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container block">Daily Rate</span>
      <div className="flex items-baseline gap-1">
        <span className="font-display-mobile text-display-mobile font-serif font-semibold">₦850,000</span>
        <span className="font-label-sm text-label-sm text-secondary-fixed">(~$575 USD)</span>
      </div>
    </div>
  </div>
</div>
<div className="p-6 md:p-8 flex flex-col gap-6">
  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
    The pinnacle of elevated transit for discerning guests. Complete with heated calf rests, silver-plated champagne flutes, acoustic laminated double glazing, and dedicated concierge liaison.
  </p>
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container-low">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">person</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Passengers</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">3 Guests</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">luggage</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Luggage</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">3 Cases</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">wifi</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Wi-Fi</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">High-Speed 5G</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-secondary text-lg">tonality</span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Privacy</span>
        <span className="font-title-md text-title-md text-on-surface leading-tight">Tinted Windows</span>
      </div>
    </div>
  </div>
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
    <div className="flex items-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-secondary text-base">verified</span>
      <span className="font-body-sm text-body-sm">Professional Driver Included with complimentary refreshments</span>
    </div>
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <button className="w-full sm:w-auto px-5 py-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors font-semibold" onClick={() => {}} type="button">
        View Gallery
      </button>
      <button className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm" onClick={() => {}} type="button">
        <span className="">Reserve Vehicle</span>
        <span className="material-symbols-outlined text-base">arrow_forward</span>
      </button>
    </div>
  </div>
</div></article>
</main>
</div>
{/*  BOTTOM BESPOKE CONVOY & RAMP PROTOCOL BANNER  */}
<section className="mt-16 bg-surface-container-lowest rounded-2xl p-8 lg:p-12 shadow-[0_10px_30px_rgba(26,26,26,0.035)] relative overflow-hidden">
<div className="absolute -right-16 -bottom-16 w-96 h-96 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none"></div>
<div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
<div className="max-w-2xl">
<div className="flex items-center gap-2 mb-2">
<span className="material-symbols-outlined text-secondary text-lg">local_police</span>
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">Executive Services • Escort &amp; Airport Protocol</span>
</div>
<h3 className="font-headline-md text-headline-md font-serif text-primary">Need a multi-vehicle escort convoy or VIP airport meet-and-greet?</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
            From luxury executive convoys with dedicated escort vehicles to VIP airport arrivals at Murtala Muhammed (LOS) and Nnamdi Azikiwe (ABV), our operations team coordinates seamless executive movement.
          </p>
</div>
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
<a className="px-6 py-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-secondary hover:text-on-secondary transition-all flex items-center justify-center gap-3 shadow-md font-semibold" href="https://wa.me/23418885275" rel="noopener noreferrer" target="_blank">
<span className="material-symbols-outlined text-xl">chat</span>
<span className="">WhatsApp Support Desk</span>
</a>
<a className="px-6 py-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 font-semibold" href="tel:+23418885275">
<span className="material-symbols-outlined text-lg">call</span>
<span className="">Priority Hotline</span>
</a>
</div>
</div>
</section>
</div>
</div>
</main>
      <Footer />
    </div>
  );
}
