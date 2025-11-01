"use client";

import React, { useState } from "react";
import SlotTimePicker from "../SlotTimePicker";
import { ClockIcon } from "lucide-react";
import { cn } from "@/utils/style";

interface TimeBlockProps {
  label: string; // e.g., "AM" or "PM"
  dayOfWeek: number; // 1 for regular days, 6 for saturdays
  startTime: string;
  endTime: string;
  disabled?: boolean;
  disabledSlots?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
  onChange: (startTime: string, endTime: string) => void;
}

const TimeBlock = ({
  label,
  dayOfWeek,
  startTime,
  endTime,
  disabled = false,
  disabledSlots = [],
  onChange,
}: TimeBlockProps) => {
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    let h12 = hour % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const handleSlotChange = (newSlot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    label?: string;
  }) => {
    onChange(newSlot.start_time, newSlot.end_time);
  };

  return (
    <div className="flex flex-row gap-2 items-center">
      <p className="text-base text-primary/70">{label}</p>
      <div className="flex flex-row gap-2 flex-1">
        <button
          onClick={() => setIsTimePickerOpen(true)}
          disabled={disabled}
          className={cn(
            "bg-background border border-primary/40 rounded-md px-3 py-2 text-primary",
            "flex items-center gap-2 w-full",
            "focus:outline-none focus:ring-2 focus:ring-primary/40",
            "hover:bg-primary/5 transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
            !startTime && !endTime && "text-textBody/70"
          )}
        >
          <ClockIcon className="w-5 h-5 text-primary/70" />
          {startTime && endTime
            ? `${formatTime(startTime)} - ${formatTime(endTime)}`
            : "Set time"}
        </button>

        <SlotTimePicker
          value={{
            day_of_week: dayOfWeek,
            start_time: startTime || "08:00",
            end_time: endTime || "09:00",
          }}
          onChange={handleSlotChange}
          disabled={disabled}
          disabledSlots={disabledSlots}
          stepMinutes={15}
          isOpen={isTimePickerOpen}
          onClose={() => setIsTimePickerOpen(false)}
          user_type="EMPLOYEE"
        />
      </div>
    </div>
  );
};

export default TimeBlock;
