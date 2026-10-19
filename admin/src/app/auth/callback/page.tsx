"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying operator credentials...");

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        // 1. Check for error in query params
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const errorParam = urlParams.get("error_description") || urlParams.get("error");
          const code = urlParams.get("code");

          if (errorParam) {
            console.error("[Admin OAuth Error]", errorParam);
            if (isMounted) setStatus(`Authorization error: ${errorParam}`);
            setTimeout(() => router.replace("/login?error=" + encodeURIComponent(errorParam)), 2000);
            return;
          }

          // 2. Exchange code for session if present
          if (code) {
            if (isMounted) setStatus("Exchanging authorization token...");
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("[Admin OAuth Exchange Error]", error);
              if (isMounted) setStatus(`Handshake error: ${error.message}`);
              setTimeout(() => router.replace("/login?error=" + encodeURIComponent(error.message)), 2000);
              return;
            }
          }
        }

        // 3. Check session and verify admin role in profiles
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          if (isMounted) setStatus("Verifying administrative permissions...");
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, role, full_name")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile?.role === "admin") {
            if (isMounted) setStatus("Welcome, Administrator. Opening command cockpit...");
            router.replace("/");
            return;
          } else {
            // Not an admin
            await supabase.auth.signOut();
            const msg = `Access Denied: The Google account "${session.user.email}" is not registered as an administrator. Please ask a system admin to promote your member account.`;
            if (isMounted) setStatus(msg);
            setTimeout(() => router.replace("/login?error=" + encodeURIComponent(msg)), 2500);
            return;
          }
        }

        // Fallback
        setTimeout(() => router.replace("/login"), 2000);
      } catch (err: any) {
        console.error("[Admin Callback Error]", err);
        router.replace("/login");
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-secondary-fixed flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L18 8.5v7l-6 3.75-6-3.75v-7l6-4.3z" />
          </svg>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        <h2 className="text-base font-bold text-primary font-serif">
          La Planta Admin Command Cockpit
        </h2>
        <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
          {status}
        </p>
      </div>
    </div>
  );
}

