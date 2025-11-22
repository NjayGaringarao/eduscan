"use client";

import React, { useState } from "react";
import { Slot } from "@/models";
import TextBox from "@/components/TextBox";
import SlotTimePicker from "@/components/schedule/SlotTimePicker";
import { ClockIcon, X } from "lucide-react";
import { cn } from "@/utils/style";

interface TimeBlockProps {
  slot: Slot;
  disabled?: boolean;
  disabledSlots?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>; // Array of occupied slots to disable
  onChange: (update: Partial<Slot>) => void;
  onDelete: () => void;
}

const TimeBlock = ({
  slot,
  disabled,
  disabledSlots = [],
  onChange,
  onDelete,
}: TimeBlockProps) => {
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const handleSlotChange = (newSlot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    label?: string;
  }) => {
    onChange({
      day_of_week: newSlot.day_of_week,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      label: newSlot.label,
    });
  };

  const handleLabelChange = (label: string) => {
    onChange({ ...slot, label });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    let h12 = hour % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const formatSlot = (slot: Slot) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[slot.day_of_week] || "Sun";
    return `${dayName} ${formatTime(slot.start_time)} - ${formatTime(
      slot.end_time
    )}`;
  };

  return (
    <div className="  border border-primary/30 bg-secondary rounded-md p-4 flex flex-col z-50 gap-2">
      <div className="flex flex-row items-center gap-4">
        <TextBox
          value={slot.label ?? ""}
          placeHolder="Label (Optional)"
          setValue={handleLabelChange}
          disabled={disabled}
          containerClassName="flex-1"
          inputClassName="bg-background rounded-sm"
        />
        <button
          className=" hover:text-uRed"
          onClick={onDelete}
          disabled={disabled}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={() => setIsTimePickerOpen(true)}
          disabled={disabled}
          className={cn(
            "bg-background border border-primary/40 rounded-sm px-3 py-2 text-primary",
            "flex items-center gap-2 w-full",
            "focus:outline-none focus:ring-2 focus:ring-primary/40",
            "hover:bg-primary/5 transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <ClockIcon className="w-5 h-5 text-primary/70" />
          {formatSlot(slot)}
        </button>

        <SlotTimePicker
          value={{
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            label: slot.label ?? undefined,
          }}
          onChange={handleSlotChange}
          disabled={disabled}
          disabledSlots={disabledSlots}
          stepMinutes={15}
          isOpen={isTimePickerOpen}
          onClose={() => setIsTimePickerOpen(false)}
        />
      </div>
    </div>
  );
};

export default TimeBlock;
