"use client";

import { cn } from "@/utils/style";
import React, { useRef } from "react";
import { Calendar } from "lucide-react";

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  label?: string;
  excludeCurrentMonth?: boolean; // New prop to exclude current month
  disabled?: boolean;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  containerClassName = "",
  inputClassName = "",
  label,
  excludeCurrentMonth = false,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Calculate the maximum selectable month (previous month if excluding current)
  const maxMonth = excludeCurrentMonth
    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 7)
    : currentMonth;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedMonth = e.target.value;

    // If excluding current month and user tries to select current month, don't update
    if (excludeCurrentMonth && selectedMonth === currentMonth) {
      return;
    }

    onChange(selectedMonth);
  };

  const handleClick = () => {
    inputRef.current?.showPicker();
  };

  // Format the display value
  const formatDisplayValue = (monthValue: string) => {
    if (!monthValue) return "Select Month";

    const [year, month] = monthValue.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        disabled && "opacity-60 cursor-disable",
        containerClassName
      )}
    >
      {label && (
        <label
          htmlFor="month-picker"
          className="text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "w-full px-3 py-2 rounded-lg border border-primary text-primary",
            "hover:brightness-110 transition cursor-pointer",
            "flex flex-row items-center justify-center gap-2",
            inputClassName
          )}
          disabled={disabled}
        >
          <Calendar className="w-5 h-5 text-primary/70" />
          <p>{formatDisplayValue(value)}</p>
        </button>
        <input
          ref={inputRef}
          id="month-picker"
          type="month"
          value={value}
          max={maxMonth}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
};

export default MonthPicker;
