"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date | string;
  date?: Date | string;
  onChange?: (date: Date | undefined, dateString?: string) => void;
  onDateChange?: (date: Date | undefined, dateString?: string) => void;
  minDate?: Date | string;
  maxDate?: Date | string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  align?: "start" | "center" | "end";
}

function parseDateSafely(val?: Date | string): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) ? val : undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      try {
        const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
        if (isValid(parsed)) return parsed;
      } catch {}
    }
    // YYYY-MM-DDTHH:mm
    try {
      const parsed = parse(trimmed, "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(parsed)) return parsed;
    } catch {}
    const d = new Date(trimmed);
    if (isValid(d)) return d;
  }
  return undefined;
}

export function DatePicker({
  value,
  date,
  onChange,
  onDateChange,
  minDate,
  maxDate,
  placeholder = "Select Date",
  disabled = false,
  className,
  buttonClassName,
  align = "start",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const activeValue = value !== undefined ? value : date;
  const parsedDate = React.useMemo(
    () => parseDateSafely(activeValue),
    [activeValue]
  );
  const parsedMinDate = React.useMemo(
    () => parseDateSafely(minDate),
    [minDate]
  );
  const parsedMaxDate = React.useMemo(
    () => parseDateSafely(maxDate),
    [maxDate]
  );

  const handleSelect = (selectedDate: Date | undefined) => {
    const formatted = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    if (onChange) onChange(selectedDate, formatted);
    if (onDateChange) onDateChange(selectedDate, formatted);
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            disabled={disabled}
            variant="outline"
            className={cn(
              "w-full h-12 px-4 justify-start text-left font-normal bg-surface-container-lowest border border-surface-container rounded-xl hover:bg-secondary-fixed/30 hover:border-secondary/40 transition-colors shadow-sm",
              !parsedDate && "text-on-surface-variant/70",
              buttonClassName
            )}
          >
            <CalendarIcon className="mr-2.5 h-4 w-4 text-secondary shrink-0" />
            <span className="text-sm font-semibold text-primary truncate">
              {parsedDate ? format(parsedDate, "EEE, MMM d, yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-surface-container-lowest border border-black/[0.08] shadow-2xl rounded-2xl"
          align={align}
        >
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            disabled={(day) => {
              if (parsedMinDate) {
                const minDay = new Date(parsedMinDate);
                minDay.setHours(0, 0, 0, 0);
                if (day < minDay) return true;
              }
              if (parsedMaxDate) {
                const maxDay = new Date(parsedMaxDate);
                maxDay.setHours(23, 59, 59, 999);
                if (day > maxDay) return true;
              }
              return false;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
