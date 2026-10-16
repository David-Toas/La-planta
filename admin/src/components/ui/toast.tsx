"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "warning";
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({
      title,
      description,
      variant = "default",
      duration = 4000,
    }: Omit<ToastItem, "id">) => {
      const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
      const newToast: ToastItem = { id, title, description, variant, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 sm:p-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border text-xs transition-all duration-300 animate-in slide-in-from-bottom-5",
              t.variant === "success" &&
                "bg-emerald-950/95 border-emerald-500/40 text-emerald-100",
              t.variant === "destructive" &&
                "bg-red-950/95 border-red-500/40 text-red-100",
              t.variant === "warning" &&
                "bg-amber-950/95 border-amber-500/40 text-amber-100",
              (!t.variant || t.variant === "default") &&
                "bg-surface-container-lowest border-surface-container text-primary shadow-2xl"
            )}
          >
            {t.variant === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {t.variant === "destructive" && (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            {(!t.variant || t.variant === "default" || t.variant === "warning") && (
              <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {t.title && <div className="font-semibold text-sm leading-tight">{t.title}</div>}
              {t.description && (
                <div className="mt-1 opacity-90 leading-relaxed">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

