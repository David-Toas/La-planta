"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateTimePickerProps {
  value?: Date | string;
  date?: Date | string;
  onChange?: (date: Date | undefined, isoString?: string) => void;
  onDateChange?: (date: Date | undefined, isoString?: string) => void;
  minDate?: Date | string;
  maxDate?: Date | string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  align?: "start" | "center" | "end";
}

// Normal hourly & half-hourly handover times (no restrictive 2-hour gaps)
const NORMAL_TIME_SLOTS = [
  { label: "07:00 AM", hours: 7, minutes: 0 },
  { label: "08:00 AM", hours: 8, minutes: 0 },
  { label: "08:30 AM", hours: 8, minutes: 30 },
  { label: "09:00 AM", hours: 9, minutes: 0 },
  { label: "09:30 AM", hours: 9, minutes: 30 },
  { label: "10:00 AM", hours: 10, minutes: 0 },
  { label: "10:30 AM", hours: 10, minutes: 30 },
  { label: "11:00 AM", hours: 11, minutes: 0 },
  { label: "11:30 AM", hours: 11, minutes: 30 },
  { label: "12:00 PM", hours: 12, minutes: 0 },
  { label: "12:30 PM", hours: 12, minutes: 30 },
  { label: "01:00 PM", hours: 13, minutes: 0 },
  { label: "01:30 PM", hours: 13, minutes: 30 },
  { label: "02:00 PM", hours: 14, minutes: 0 },
  { label: "02:30 PM", hours: 14, minutes: 30 },
  { label: "03:00 PM", hours: 15, minutes: 0 },
  { label: "03:30 PM", hours: 15, minutes: 30 },
  { label: "04:00 PM", hours: 16, minutes: 0 },
  { label: "04:30 PM", hours: 16, minutes: 30 },
  { label: "05:00 PM", hours: 17, minutes: 0 },
  { label: "05:30 PM", hours: 17, minutes: 30 },
  { label: "06:00 PM", hours: 18, minutes: 0 },
  { label: "06:30 PM", hours: 18, minutes: 30 },
  { label: "07:00 PM", hours: 19, minutes: 0 },
  { label: "08:00 PM", hours: 20, minutes: 0 },
  { label: "09:00 PM", hours: 21, minutes: 0 },
  { label: "10:00 PM", hours: 22, minutes: 0 },
];

function parseDateTimeSafely(val?: Date | string): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) ? val : undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return undefined;

    // YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
    try {
      const parsedIso = parse(trimmed.slice(0, 16), "yyyy-MM-dd'T'HH:mm", new Date());
      if (isValid(parsedIso)) return parsedIso;
    } catch {}

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      try {
        const parsedDateOnly = parse(trimmed, "yyyy-MM-dd", new Date());
        if (isValid(parsedDateOnly)) return parsedDateOnly;
      } catch {}
    }

    // Try standard JS Date constructor
    const d = new Date(trimmed);
    if (isValid(d)) return d;
  }
  return undefined;
}

export function DateTimePicker({
  value,
  date,
  onChange,
  onDateChange,
  minDate,
  maxDate,
  placeholder = "Select Date & Time",
  disabled = false,
  className,
  buttonClassName,
  align = "start",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const activeValue = value !== undefined ? value : date;
  const parsedDate = React.useMemo(
    () => parseDateTimeSafely(activeValue),
    [activeValue]
  );
  const parsedMinDate = React.useMemo(
    () => parseDateTimeSafely(minDate),
    [minDate]
  );
  const parsedMaxDate = React.useMemo(
    () => parseDateTimeSafely(maxDate),
    [maxDate]
  );

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    parsedDate
  );
  const [hours, setHours] = React.useState<number>(
    parsedDate ? parsedDate.getHours() : 10
  );
  const [minutes, setMinutes] = React.useState<number>(
    parsedDate ? parsedDate.getMinutes() : 0
  );

  React.useEffect(() => {
    setSelectedDate(parsedDate);
    if (parsedDate) {
      setHours(parsedDate.getHours());
      setMinutes(parsedDate.getMinutes());
    }
  }, [parsedDate]);

  const notifyChange = (nextDate: Date | undefined) => {
    const isoString = nextDate ? format(nextDate, "yyyy-MM-dd'T'HH:mm") : "";
    if (onChange) onChange(nextDate, isoString);
    if (onDateChange) onDateChange(nextDate, isoString);
  };

  const handleSelectDate = (newDay: Date | undefined) => {
    if (!newDay) {
      setSelectedDate(undefined);
      notifyChange(undefined);
      return;
    }
    const next = new Date(newDay);
    next.setHours(hours, minutes, 0, 0);
    setSelectedDate(next);
    notifyChange(next);
  };

  const handleSelectTime = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
    const base = selectedDate || parsedDate || new Date();
    const next = new Date(base);
    next.setHours(h, m, 0, 0);
    setSelectedDate(next);
    notifyChange(next);
  };

  const formattedDisplay = React.useMemo(() => {
    const target = parsedDate || selectedDate;
    if (!target) return placeholder;
    return format(target, "MMM d, yyyy • h:mm a");
  }, [parsedDate, selectedDate, placeholder]);

  const timeInputValue = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            disabled={disabled}
            variant="outline"
            className={cn(
              "w-full h-12 px-4 justify-between text-left font-normal bg-surface-container-lowest border border-surface-container rounded-xl hover:bg-secondary-fixed/30 hover:border-secondary/40 transition-colors shadow-sm",
              !parsedDate && !selectedDate && "text-on-surface-variant/70",
              buttonClassName
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 text-secondary shrink-0" />
              <span className="text-sm font-semibold text-primary truncate">
                {formattedDisplay}
              </span>
            </div>
            <Clock className="h-3.5 w-3.5 text-on-surface-variant/60 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 bg-surface-container-lowest border border-black/[0.08] shadow-2xl rounded-2xl overflow-hidden z-[100]"
          align={align}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Calendar Stage */}
            <div className="p-1">
              <Calendar
                mode="single"
                selected={selectedDate || parsedDate}
                onSelect={handleSelectDate}
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
            </div>

            {/* Time Selector Column */}
            <div className="p-3.5 sm:border-l border-t sm:border-t-0 border-black/[0.06] flex flex-col justify-between sm:w-56 bg-surface-container-low/40">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Normal Time
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-secondary font-bold">
                    {format(
                      new Date().setHours(hours, minutes, 0, 0),
                      "h:mm a"
                    )}
                  </span>
                </div>

                {/* Standard HTML5 Time Input (Exact hour and minute selection) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Custom Time (Any Minute)
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={timeInputValue}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [hStr, mStr] = e.target.value.split(":");
                      const h = parseInt(hStr, 10);
                      const m = parseInt(mStr, 10);
                      if (!isNaN(h) && !isNaN(m)) {
                        handleSelectTime(h, m);
                      }
                    }}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-surface-container font-mono text-xs font-semibold text-primary focus:outline-none focus:border-secondary shadow-sm cursor-pointer"
                  />
                </div>

                {/* Quick Selection Scrollable Slots */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Standard Slots
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1">
                    {NORMAL_TIME_SLOTS.map((slot) => {
                      const isSelected =
                        hours === slot.hours && minutes === slot.minutes;
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() => handleSelectTime(slot.hours, slot.minutes)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center justify-between transition-colors text-left",
                            isSelected
                              ? "bg-secondary text-primary font-bold shadow-sm"
                              : "bg-surface-container-lowest hover:bg-secondary-fixed/50 text-on-surface"
                          )}
                        >
                          <span>{slot.label}</span>
                          {isSelected && <Check className="h-3 w-3 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Confirm Done Button */}
              <div className="pt-3 mt-3 border-t border-black/[0.05]">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="w-full bg-primary hover:bg-secondary text-white text-xs font-semibold uppercase tracking-wider h-8 rounded-lg shadow-sm"
                >
                  Set Time &amp; Date
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
