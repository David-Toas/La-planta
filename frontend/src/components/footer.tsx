import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#040505] text-[#c8c6c5] border-t border-[#725b38]/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] border border-[#725b38]/40 flex items-center justify-center text-[#fedeb2]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L9.5 7.5L4 8.5L8 12.5L7 18L12 15L17 18L16 12.5L20 8.5L14.5 7.5L12 2Z" />
                </svg>
              </div>
              <span className="font-serif text-xl tracking-wider text-white uppercase font-semibold">
                LA PLANTA PRIME
              </span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Nigeria&apos;s premier chauffeur car-hire service for corporate leaders, diplomatic delegates, and discerning international travelers.
            </p>
            <div className="text-xs text-[#fedeb2] font-semibold tracking-wider uppercase">
              Lagos • Abuja • Inter-State Charters
            </div>
          </div>

          {/* Fleet Categories */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-white text-sm font-semibold tracking-wide uppercase">
              Executive Fleet
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/fleet" className="hover:text-[#fedeb2] transition-colors">
                  Mercedes-Benz S-Class (S580)
                </Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-[#fedeb2] transition-colors">
                  Range Rover Autobiography LWB
                </Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-[#fedeb2] transition-colors">
                  Toyota Land Cruiser 300 VXR
                </Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-[#fedeb2] transition-colors">
                  Mercedes-Benz V-Class &amp; Sprinter
                </Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-[#fedeb2] transition-colors">
                  Armored Escort Vehicles (B6/B7)
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Portals */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-white text-sm font-semibold tracking-wide uppercase">
              Portals &amp; Operations
            </h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/account" className="hover:text-[#fedeb2] transition-colors">
                  VIP Guest Account &amp; Invoices
                </Link>
              </li>
              <li>
                <Link href="/live-tracking" className="hover:text-[#fedeb2] transition-colors">
                  Live Chauffeur Tracking Map
                </Link>
              </li>
              <li>
                <Link href="/reservation-pass" className="hover:text-[#fedeb2] transition-colors">
                  Digital QR Handover Voucher
                </Link>
              </li>
              <li>
                <Link href="/admin-login" className="text-[#fedeb2] font-medium hover:underline">
                  Fleet Operations Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-white text-sm font-semibold tracking-wide uppercase">
              24/7 Support Desk
            </h4>
            <p className="text-xs text-white/70">
              The Wings Office Complex, Ozumba Mbadiwe Ave, Victoria Island, Lagos
            </p>
            <p className="text-xs text-[#fedeb2] font-semibold">
              Hotline: +234 1 888 5275
            </p>
            <p className="text-xs text-white/70">
              Email: reservations@laplanta.com
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
          <div>
            &copy; {new Date().getFullYear()} LA PLANTA PRIME Mobility Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Rental Terms</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Insurance Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
