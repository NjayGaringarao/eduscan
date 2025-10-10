"use client";

import { cn } from "@/utils/style";
import React from "react";

interface MonthPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  className = "",
  label,
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor="month-picker"
          className="text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      <input
        id="month-picker"
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-lg border border-primary text-primary flex items-center gap-2",
          "hover:brightness-110 transition"
        )}
      />
    </div>
  );
};

export default MonthPicker;
