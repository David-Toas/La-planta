"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  activeIcon?: string;
  badge?: string;
  isAction?: boolean;
}

export function MobileDock() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  const navItems: NavItem[] = [
    {
      id: "home",
      name: "Home",
      href: "/",
      icon: "home",
    },
    {
      id: "fleet",
      name: "Fleet",
      href: "/fleet",
      icon: "directions_car",
    },
    {
      id: "track",
      name: "Live Track",
      href: "/live-tracking",
      icon: "near_me",
      badge: "LIVE",
    },
    {
      id: "pass",
      name: "VIP Pass",
      href: "/reservation-pass",
      icon: "qr_code_2",
    },
    {
      id: "account",
      name: user ? "Profile" : "Sign In",
      href: user ? "/account" : "#",
      icon: user ? "account_circle" : "login",
      isAction: !user,
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    if (item.href === "#") return false;
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#07090f]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-10px_35px_rgba(0,0,0,0.6)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item);

          const content = (
            <div className="flex flex-col items-center justify-center py-1 px-1 relative group transition-transform active:scale-90">
              {/* Active Ambient Glow Pill */}
              {active && (
                <span className="absolute -top-1.5 w-8 h-1 rounded-full bg-secondary shadow-[0_0_8px_#d4af37]" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-2xl transition-all duration-200 ${
                    active
                      ? "text-secondary scale-110 drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]"
                      : "text-stone-400 group-hover:text-stone-200"
                  }`}
                >
                  {item.icon}
                </span>

                {/* Optional Pulsing Live Radar Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-emerald-500 text-[8px] font-black tracking-wider text-black font-mono shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors ${
                  active
                    ? "text-secondary font-bold"
                    : "text-stone-400 group-hover:text-stone-200"
                }`}
              >
                {item.name}
              </span>
            </div>
          );

          if (item.isAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openAuthModal();
                }}
                className="w-full focus:outline-none cursor-pointer"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className="w-full focus:outline-none"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
