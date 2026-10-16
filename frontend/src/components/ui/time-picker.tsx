"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  label?: string;
  step?: number;
}

/**
 * Shadcn-styled TimePicker input component with icon, matching:
 * https://ui.shadcn.com/docs/components/base/date-picker#time-picker
 */
export function TimePicker({
  value = "10:00",
  onChange,
  disabled = false,
  className,
  inputClassName,
  label = "Time",
  step = 60,
}: TimePickerProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
          <Clock className="h-3 w-3 text-secondary" />
          <span>{label}</span>
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="time"
          step={step}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={cn(
            "w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container font-mono text-sm font-semibold text-primary focus:outline-none focus:border-secondary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
            inputClassName,
          )}
        />
      </div>
    </div>
  );
}
