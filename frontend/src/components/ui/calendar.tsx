"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none", className)}
      classNames={{
        root: `${defaultClassNames.root} shadow-none`,
        chevron: `fill-current text-primary`,
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-3",
        caption_label: "text-sm font-serif font-bold text-primary",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute left-1 border-black/[0.08] hover:bg-secondary/20"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute right-1 border-black/[0.08] hover:bg-secondary/20"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday:
          "text-on-surface-variant rounded-md w-9 font-medium text-[0.8rem] text-center uppercase tracking-wider",
        week: "flex w-full mt-2 justify-between",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-secondary-fixed/50 hover:text-on-secondary-fixed transition-colors rounded-xl"
        ),
        range_end: "day-range-end",
        selected:
          "bg-secondary !text-primary font-bold hover:bg-secondary hover:text-primary focus:bg-secondary focus:text-primary rounded-xl shadow-md",
        today: "border border-secondary text-secondary font-bold rounded-xl",
        outside:
          "day-outside text-on-surface-variant/40 aria-selected:bg-accent/50 aria-selected:text-on-surface-variant aria-selected:opacity-30",
        disabled: "text-on-surface-variant/30 opacity-40 cursor-not-allowed",
        range_middle:
          "aria-selected:bg-secondary-fixed/30 aria-selected:text-on-secondary-fixed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4 text-primary" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

