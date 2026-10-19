"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function GuestLoginPage() {
  const router = useRouter();
  const { login, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGoogleIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("a.balogun@executivecorp.ng");
  const [signInPassword, setSignInPassword] = useState("client123456");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error) {
        setAlertMessage({ type: "error", text: `Google Sign-in notice: ${decodeURIComponent(error)}` });
      }
    }
  }, []);

  const handleGoogleCredential = async (credential: string) => {
    try {
      setIsGoogleLoading(true);
      setAlertMessage({ type: "info", text: "Authenticating with Google..." });
      const res = await signInWithGoogleIdToken(credential);
      if (res.success) {
        setAlertMessage({ type: "success", text: "Signed in successfully. Redirecting..." });
        router.push(getReturnUrl());
      } else {
        setAlertMessage({ type: "error", text: res.error || "Failed to sign in with Google" });
      }
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message || "Failed to sign in with Google" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getReturnUrl = () => {
    if (typeof window !== "undefined") {
      const intended = sessionStorage.getItem("laPlanta_intended_destination");
      if (intended) {
        sessionStorage.removeItem("laPlanta_intended_destination");
        return intended;
      }
      const returnPage = sessionStorage.getItem("laPlanta_current_page");
      if (returnPage && !returnPage.includes("/account") && !returnPage.includes("/guest-login")) {
        sessionStorage.removeItem("laPlanta_current_page");
        return returnPage;
      }
    }
    return "/fleet";
  };

  const handleDemoSignIn = () => {
    login({
      id: "00000000-0000-0000-0000-000000000002",
      name: "Dr. Adekunle Balogun",
      email: "a.balogun@executivecorp.ng",
      phone: "+234 803 555 0192",
      vipTier: "VIP First Class",
      role: "client",
    });
    setAlertMessage({ type: "success", text: "Logged in as VIP Demo Guest! Returning to session..." });
    setTimeout(() => {
      router.push(getReturnUrl());
    }, 400);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setAlertMessage({ type: "error", text: "Please enter your email and password." });
      return;
    }

    setIsSubmitting(true);
    setAlertMessage({ type: "info", text: "Authenticating..." });

    const res = await signInWithEmail(signInEmail, signInPassword);
    setIsSubmitting(false);

    if (res.success) {
      setAlertMessage({ type: "success", text: "Welcome back! Returning to session..." });
      setTimeout(() => {
        router.push(getReturnUrl());
      }, 500);
    } else {
      setAlertMessage({ type: "error", text: res.error || "Invalid credentials." });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPhone) {
      setAlertMessage({ type: "error", text: "Please enter your name, email, phone number, and password." });
      return;
    }

    if (signUpPassword.length < 6) {
      setAlertMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setIsSubmitting(true);
    setAlertMessage({ type: "info", text: "Creating your account..." });

    const res = await signUpWithEmail(signUpEmail, signUpPassword, signUpName, signUpPhone);
    setIsSubmitting(false);

    if (res.success) {
      setAlertMessage({ type: "success", text: "Account created! Returning to session..." });
      setTimeout(() => {
        router.push(getReturnUrl());
      }, 600);
    } else {
      setAlertMessage({ type: "error", text: res.error || "Failed to create account." });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="h-16 max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              aria-label="Return home"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-stone-100 transition-colors"
              href="/"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary text-amber-200 flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4 7v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5zm0 3.18l6 3.75v4.32c0 4.41-2.9 8.54-6 9.68-3.1-1.14-6-5.27-6-9.68V8.93l6-3.75z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base sm:text-lg tracking-tight text-primary leading-none font-semibold uppercase">
                  LA PLANTA PRIME
                </span>
                <span className="text-[10px] text-secondary uppercase tracking-[0.16em] mt-0.5 font-semibold">
                  Executive Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/fleet"
              className="text-xs uppercase tracking-wider text-stone-600 hover:text-primary transition-colors font-semibold"
            >
              Fleet Catalog
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-28">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Header Card Ribbon */}
          <div className="bg-primary px-6 py-6 text-white text-center">
            <h1 className="font-serif text-xl sm:text-2xl font-bold">
              {activeTab === "signin" ? "Welcome Back" : "Create VIP Account"}
            </h1>
            <p className="text-xs text-stone-300 mt-1">
              {activeTab === "signin"
                ? "Sign in to manage your executive bookings and live chauffeur tracking"
                : "Join the premier bespoke mobility network in Lagos & West Africa"}
            </p>
          </div>

          <div className="p-6 sm:p-8 flex flex-col gap-5">
            {/* Alert Message */}
            {alertMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  alertMessage.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : alertMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {alertMessage.type === "error" ? "error" : alertMessage.type === "success" ? "check_circle" : "info"}
                </span>
                <span className="font-medium">{alertMessage.text}</span>
              </div>
            )}

            {/* Social Google Login Button: Google Identity Services (Direct Popup / One Tap) */}
            <div className="flex flex-col gap-2">
              <GoogleSignInButton
                theme="outline"
                text="continue_with"
                onSuccess={handleGoogleCredential}
                onError={(err) => setAlertMessage({ type: "error", text: err })}
              />

              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full h-9 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl text-[11px] font-semibold text-amber-900 flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-sm text-amber-700">stars</span>
                <span>1-Click VIP Demo: Dr. Adekunle Balogun</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-stone-200 flex-1"></div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Or with email
              </span>
              <div className="h-px bg-stone-200 flex-1"></div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setAlertMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
                  activeTab === "signin"
                    ? "bg-white text-primary shadow-sm"
                    : "text-stone-500 hover:text-primary font-medium"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setAlertMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center ${
                  activeTab === "signup"
                    ? "bg-white text-primary shadow-sm"
                    : "text-stone-500 hover:text-primary font-medium"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            {activeTab === "signin" ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. a.balogun@executivecorp.ng"
                    className="w-full h-11 px-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                      Password
                    </label>
                    <span className="text-xs text-secondary hover:underline cursor-pointer">
                      Forgot Password?
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-4 pr-11 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 text-stone-400 hover:text-stone-700"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showSignInPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 mt-1 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Dr. Babatunde Adeyemi"
                    className="w-full h-11 px-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. b.adeyemi@capital.ng"
                    className="w-full h-11 px-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold flex items-center justify-between">
                    <span>Phone Number</span>
                    <span className="text-[10px] text-secondary font-medium lowercase">for chauffeur contact</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full h-11 px-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-11 pl-4 pr-11 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 text-stone-400 hover:text-stone-700"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showSignUpPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 mt-1 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  ) : (
                    <>
                      <span>Create VIP Account</span>
                      <span className="material-symbols-outlined text-base">check_circle</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-stone-500 hover:text-primary transition-colors">
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
