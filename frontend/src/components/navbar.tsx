"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openAuthModal, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // The header only shows Home and Fleet Catalog
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Fleet Catalog", href: "/fleet" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-black/[0.03]">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
        {/* Brand Logo - LA PLANTA PRIME */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-secondary-fixed shadow-sm">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L9.5 7.5L4 8.5L8 12.5L7 18L12 15L17 18L16 12.5L20 8.5L14.5 7.5L12 2Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl text-primary tracking-tight uppercase font-semibold">
                LA PLANTA PRIME
              </span>
              <span className="text-[10px] uppercase tracking-widest text-secondary -mt-1 font-semibold">
                Executive Mobility
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links: Only Home and Fleet Catalog */}
        <nav className="flex items-center gap-2">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-xs uppercase tracking-wider rounded-lg transition-all ${
                  active
                    ? "bg-secondary-fixed text-on-secondary-fixed font-semibold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            /* Signed In User: Small round avatar image with dropdown arrow */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-full bg-surface-container-low hover:bg-surface-container border border-border/80 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 group"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label="User Account Menu"
              >
                {/* Small Round Avatar Image */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary text-secondary-fixed flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-secondary/30 shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || "VIP Guest"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.name?.charAt(0).toUpperCase() || "V"}</span>
                  )}
                </div>

                {/* User First Name on sm+ */}
                <span className="hidden sm:inline text-xs font-semibold text-primary max-w-[110px] truncate">
                  {user.name?.split(" ")[0]}
                </span>

                {/* Dropdown Arrow */}
                <span
                  className={`material-symbols-outlined text-base text-on-surface-variant group-hover:text-primary transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-secondary" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-surface-container-lowest border border-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                  {/* User Profile Header */}
                  <div className="px-3 py-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary text-secondary-fixed flex items-center justify-center font-bold text-sm shrink-0 ring-1 ring-secondary/30">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name || "VIP Guest"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{user.name?.charAt(0).toUpperCase() || "V"}</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-primary truncate">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-on-surface-variant truncate font-mono">
                          {user.email}
                        </span>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[9px] uppercase tracking-wider font-bold w-fit">
                          {user.vipTier || "VIP Executive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  <div className="py-1.5 flex flex-col gap-1">
                    {/* Option 1: Guest Account */}
                    <Link
                      href="/account"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors text-xs font-semibold text-primary group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-secondary-fixed transition-colors">
                        <span className="material-symbols-outlined text-base">
                          person
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <span>Guest Account</span>
                        <span className="text-[10px] text-on-surface-variant font-normal">
                          Reservations, live tracking &amp; invoices
                        </span>
                      </div>
                    </Link>

                    {/* Option 2: Log Out */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors text-left group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-base">
                          logout
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <span>Log Out</span>
                        <span className="text-[10px] text-red-400 font-normal">
                          End your VIP session
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out: Sign In / Sign Up button */
            <button
              onClick={openAuthModal}
              type="button"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
