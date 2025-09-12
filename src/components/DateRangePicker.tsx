"use client";

import React from "react";
import { cn } from "@/utils/style";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  containerClassName?: string;
}

const DateRangePicker = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  containerClassName,
}: DateRangePickerProps) => {
  // convert stored ISO strings into Date objects
  const safeDate = (value: string) =>
    value ? new Date(value + "T00:00:00") : undefined;

  // format user-facing label
  const formatDisplay = (start: string, end: string) => {
    if (!start && !end) return "Select date range";
    if (start && !end)
      return new Date(start).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      });
    if (start && end)
      return `${new Date(start).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      })} - ${new Date(end).toLocaleDateString("en-PH", {
        dateStyle: "medium",
      })}`;
    return "Select date range";
  };

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          "px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
          "hover:bg-primary/10 transition",
          containerClassName
        )}
      >
        <CalendarIcon className="w-4 h-4" />
        {formatDisplay(fromDate, toDate)}
      </PopoverButton>

      <PopoverPanel className="absolute z-50 mt-2 rounded-md border bg-background shadow-lg">
        <Calendar
          mode="range"
          selected={{
            from: safeDate(fromDate),
            to: safeDate(toDate),
          }}
          onSelect={(range) => {
            if (!range) {
              setFromDate("");
              setToDate("");
              return;
            }
            if (range.from) {
              setFromDate(range.from.toISOString().split("T")[0]);
            }
            if (range.to) {
              setToDate(range.to.toISOString().split("T")[0]);
            }
          }}
          numberOfMonths={2} // shows two months side by side (better for ranges)
          className="rounded-md text-textBody"
        />
      </PopoverPanel>
    </Popover>
  );
};

export default DateRangePicker;
