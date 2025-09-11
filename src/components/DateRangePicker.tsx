"use client";

import React, { ChangeEvent } from "react";
import { cn } from "@/utils/style";

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  containerClassName?: string;
  inputClassName?: string;
}

const DateRangePicker = ({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  containerClassName,
  inputClassName,
}: DateRangePickerProps) => {
  const handleFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromDate(value);

    // lock if fromDate > toDate
    if (toDate && new Date(value) > new Date(toDate)) {
      setToDate(value);
    }
  };

  const handleToChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToDate(value);

    // lock if toDate < fromDate
    if (fromDate && new Date(value) < new Date(fromDate)) {
      setFromDate(value);
    }
  };

  // fallback bounds for history: 120 years ago -> today
  const minSelectable = new Date(
    new Date().setFullYear(new Date().getFullYear() - 120)
  )
    .toISOString()
    .split("T")[0];

  const maxSelectable = new Date().toISOString().split("T")[0];

  return (
    <div
      className={cn(
        "flex flex-row gap-2 items-center bg-background/50 px-2",
        "border border-textBody rounded-lg focus:border-2 hover:border-2",
        containerClassName
      )}
    >
      <input
        type="date"
        className={cn(
          "border-none text-lg text-primary py-1 font-mono focus:outline-none",
          inputClassName
        )}
        value={fromDate}
        onChange={handleFromChange}
        min={minSelectable}
        max={toDate || maxSelectable}
      />

      <p className="text-base text-primary/80">-</p>

      <input
        type="date"
        className={cn(
          "border-none text-lg text-primary py-1 font-mono focus:outline-none",
          inputClassName
        )}
        value={toDate}
        onChange={handleToChange}
        min={fromDate || minSelectable}
        max={maxSelectable}
      />
    </div>
  );
};

export default DateRangePicker;
