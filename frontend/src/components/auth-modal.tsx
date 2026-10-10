"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Sign In form fields
  const [signInEmail, setSignInEmail] = useState("a.balogun@executivecorp.ng");
  const [signInPassword, setSignInPassword] = useState("client123456");
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

  if (!isAuthModalOpen) return null;

  // Google OAuth Login
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setAlertMessage({
        type: "info",
        text: "Connecting to Google Authentication...",
      });
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setAlertMessage({ type: "error", text: result.error });
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setAlertMessage({
        type: "error",
        text: err.message || "Failed to connect to Google",
      });
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
        text: "Account registered successfully! Check your email for confirmation if required.",
      });
      setTimeout(() => {
        setAlertMessage(null);
        closeAuthModal();
      }, 900);
    } else {
      setAlertMessage({
        type: "error",
        text: res.error || "Failed to create account.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-primary/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto">
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

          {/* Social Sign-In: Google OAuth */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full h-11 px-4 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <span className="material-symbols-outlined text-base animate-spin">
                  sync
                </span>
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
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
