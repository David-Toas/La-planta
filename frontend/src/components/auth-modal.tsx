"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthModal() {
  const router = useRouter();
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGoogleIdToken,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In form fields (clean start)
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up form fields
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Loading & Alert state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Google Identity Services (Native Popup / ID Token Sign In)
  const handleGoogleCredential = async (credential: string) => {
    try {
      setIsGoogleLoading(true);
      setAlertMessage({
        type: "info",
        text: "Authenticating VIP session with Google...",
      });
      const result = await signInWithGoogleIdToken(credential);
      if (result.success) {
        setAlertMessage({ type: "success", text: "Welcome back! Session authenticated." });
        setTimeout(() => {
          closeAuthModal();
        }, 500);
      } else {
        setAlertMessage({ type: "error", text: result.error || "Failed to sign in with Google" });
      }
    } catch (err: any) {
      setAlertMessage({
        type: "error",
        text: err.message || "Failed to process Google sign in",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setAlertMessage({
        type: "error",
        text: "Please enter your email and password.",
      });
      return;
    }

    setIsSubmitting(true);
    setAlertMessage({
      type: "info",
      text: "Authenticating executive credentials...",
    });

    const res = await signInWithEmail(signInEmail, signInPassword);
    setIsSubmitting(false);

    if (res.success) {
      setAlertMessage({ type: "success", text: "Welcome back! Signing in..." });
      setTimeout(() => {
        setAlertMessage(null);
        closeAuthModal();
        if (typeof window !== "undefined") {
          const redirectUrl = sessionStorage.getItem("laPlanta_intended_destination");
          if (redirectUrl) {
            sessionStorage.removeItem("laPlanta_intended_destination");
            router.push(redirectUrl);
          }
        }
      }, 500);
    } else {
      setAlertMessage({
        type: "error",
        text: res.error || "Invalid email or password.",
      });
    }
  };

  // Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPhone) {
      setAlertMessage({
        type: "error",
        text: "Please fill in your name, email, phone number, and password.",
      });
      return;
    }

    if (signUpPassword.length < 6) {
      setAlertMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsSubmitting(true);
    setAlertMessage({
      type: "info",
      text: "Creating your executive account...",
    });

    const res = await signUpWithEmail(
      signUpEmail,
      signUpPassword,
      signUpName,
      signUpPhone,
    );
    setIsSubmitting(false);

    if (res.success) {
      setAlertMessage({
        type: "success",
        text: "Account registered successfully! Proceeding to your reservation...",
      });
      setTimeout(() => {
        setAlertMessage(null);
        closeAuthModal();
        if (typeof window !== "undefined") {
          const redirectUrl = sessionStorage.getItem("laPlanta_intended_destination");
          if (redirectUrl) {
            sessionStorage.removeItem("laPlanta_intended_destination");
            router.push(redirectUrl);
          }
        }
      }, 700);
    } else {
      setAlertMessage({
        type: "error",
        text: res.error || "Failed to create account.",
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal();
        }
      }}
    >
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="relative bg-primary px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] border border-[#725b38]/50 text-amber-200 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4 7v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5zm0 3.18l6 3.75v4.32c0 4.41-2.9 8.54-6 9.68-3.1-1.14-6-5.27-6-9.68V8.93l6-3.75z" />
                </svg>
              </div>
              <div>
                <span className="font-serif text-base tracking-wider text-white font-semibold block uppercase">
                  LA PLANTA PRIME
                </span>
                <span className="text-[10px] text-amber-200/90 uppercase tracking-widest font-semibold block -mt-0.5">
                  Executive Access
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {/* Status Alert Banner */}
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
                {alertMessage.type === "error"
                  ? "error"
                  : alertMessage.type === "success"
                    ? "check_circle"
                    : "info"}
              </span>
              <span className="font-medium">{alertMessage.text}</span>
            </div>
          )}

          {/* Social Sign-In: Google Identity Services (Direct Popup / One Tap) */}
          <div className="flex flex-col gap-2.5">
            <GoogleSignInButton
              theme="outline"
              text="continue_with"
              onSuccess={handleGoogleCredential}
              onError={(err) => setAlertMessage({ type: "error", text: err })}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-stone-200 flex-1"></div>
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
              Or with email
            </span>
            <div className="h-px bg-stone-200 flex-1"></div>
          </div>

          {/* Interactive Tab Switcher */}
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

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignInSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. a.balogun@executivecorp.ng"
                    className="w-full h-11 pl-11 pr-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
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
                  <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-11 pr-11 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-700"
                    aria-label="Toggle password"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showSignInPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 mt-1 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-base animate-spin">
                    sync
                  </span>
                ) : (
                  <>
                    <span>Sign In &amp; Continue</span>
                    <span className="material-symbols-outlined text-base">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT FORM */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4">
              {/* Full Legal Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                  Full Legal Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Dr. Babatunde Adeyemi"
                    className="w-full h-11 pl-11 pr-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                  Corporate / Personal Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. b.adeyemi@capital.ng"
                    className="w-full h-11 pl-11 pr-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-secondary font-medium lowercase">for chauffeur contact</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                    phone
                  </span>
                  <input
                    type="tel"
                    required
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full h-11 pl-11 pr-4 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 material-symbols-outlined text-secondary text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-11 pl-11 pr-11 bg-stone-50 text-stone-900 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-secondary focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-700"
                    aria-label="Toggle password"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showSignUpPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 mt-1 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-secondary transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-base animate-spin">
                    sync
                  </span>
                ) : (
                  <>
                    <span>Create VIP Account</span>
                    <span className="material-symbols-outlined text-base">
                      check_circle
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Assistance */}
          <div className="pt-2 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5 border-t border-stone-100">
            <span className="material-symbols-outlined text-secondary text-sm">
              security
            </span>
            <span>256-Bit Encrypted Secure Mobility Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
