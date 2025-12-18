"use client";

import React, { useCallback, useMemo, useState } from "react";
import { cn } from "@/utils/style";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

// ---------- Date utilities ----------
const parseIsoDate = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const formatToLocalISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

interface DatePickerProps {
  date: string;
  setDate: (date: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
  title?: string;
  isRequired?: boolean;
  titleClassName?: string;
}

const DatePicker = ({
  date,
  setDate,
  containerClassName,
  inputClassName,
  maxDate,
  minDate,
  disabled = false,
  title,
  isRequired = false,
  titleClassName,
}: DatePickerProps) => {
  const safeDate = useCallback((value: string) => parseIsoDate(value), []);
  const toLocalISO = useCallback((date: Date) => formatToLocalISO(date), []);

  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);

  const selectedDateObj = useMemo(
    () => (date ? safeDate(date) : undefined),
    [date, safeDate]
  );

  function formatDisplay(selectedDate: string) {
    if (!selectedDate) return "Select date";
    const d = new Date(selectedDate);
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
      .getDate()
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    const dateStr = toLocalISO(selectedDate);
    setDate(dateStr);
    setOpen(false);
  };

  const disabledDates = useMemo(() => {
    const disabled: any[] = [];
    if (maxDate) {
      // Disable dates after maxDate (maxDate itself is selectable)
      disabled.push({ after: maxDate });
    }
    if (minDate) {
      // Disable dates before minDate (minDate itself is selectable)
      disabled.push({ before: minDate });
    }
    // Default: disable future dates (allow today, disable tomorrow and beyond)
    if (!maxDate && !minDate) {
      disabled.push({ after: today });
    }
    return disabled;
  }, [maxDate, minDate, today]);

  return (
    <div className={cn("relative flex flex-col", containerClassName)}>
      {title && (
        <div
          className={cn(
            "text-base text-textBody flex flex-row gap-2",
            titleClassName
          )}
        >
          <p>{title} </p>
          {isRequired === true && <p className="text-error"> *</p>}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
              "hover:brightness-110 transition",
              disabled && "opacity-50 cursor-not-allowed",
              inputClassName
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {formatDisplay(date)}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-background border border-primary/20"
          align="start"
        >
          <div className="p-3">
            <Calendar
              mode="single"
              selected={selectedDateObj}
              captionLayout="dropdown"
              disabled={disabledDates}
              onSelect={handleDateSelect}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
