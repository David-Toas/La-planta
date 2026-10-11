"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Securing VIP session with Google credentials...");

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const getDestination = () => {
          if (typeof window !== "undefined") {
            const dest = sessionStorage.getItem("laPlanta_intended_destination");
            if (dest) {
              sessionStorage.removeItem("laPlanta_intended_destination");
              return dest;
            }
          }
          return "/account";
        };

        // 1. Check if Supabase client already auto-resolved the session from the URL hash/code
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session) {
          if (isMounted) setStatus("VIP credentials verified. Opening executive suite...");
          router.replace(getDestination());
          return;
        }

        // 2. If PKCE code is present in URL search params, exchange it client-side
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          const errorParam = urlParams.get("error_description") || urlParams.get("error");

          if (errorParam) {
            console.error("[OAuth Error]", errorParam);
            if (isMounted) setStatus(`Authorization error: ${errorParam}`);
            setTimeout(() => router.replace("/guest-login?error=" + encodeURIComponent(errorParam)), 2500);
            return;
          }

          if (code) {
            if (isMounted) setStatus("Exchanging authorization token...");
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("[OAuth Exchange Error]", error);
              if (isMounted) setStatus(`Handshake notice: ${error.message}`);
              setTimeout(() => router.replace("/guest-login?error=" + encodeURIComponent(error.message)), 2500);
              return;
            }

            if (data?.session) {
              if (isMounted) setStatus("Welcome to La Planta Prime. Loading your account...");
              router.replace(getDestination());
              return;
            }
          }
        }

        // 3. Fallback: Listen for auth state change
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            if (isMounted) setStatus("Session active. Redirecting...");
            router.replace(getDestination());
          }
        });

        // 4. Fallback timeout if no auth found
        const timer = setTimeout(() => {
          if (isMounted) {
            router.replace("/account");
          }
        }, 3500);

        return () => {
          authListener.subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: any) {
        console.error("[Auth Callback Exception]", err);
        if (isMounted) setStatus("Redirecting...");
        router.replace("/account");
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0C0F17] flex items-center justify-center text-[#E5E2DC] px-4 font-sans">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm p-8 rounded-2xl bg-[#181C26] border border-[#2E3447]/60 shadow-2xl">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        <div className="flex flex-col">
          <span className="font-serif text-lg font-bold tracking-tight text-[#E5E2DC] uppercase">
            LA PLANTA PRIME
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mt-0.5">
            Executive Single Sign-On
          </span>
        </div>
        <p className="text-xs text-[#959FA8] font-mono mt-2 leading-relaxed">{status}</p>
      </div>
    </div>
  );
}

