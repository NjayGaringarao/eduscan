"use client";

import React, { useState } from "react";
import { Slot } from "@/models";
import TextBox from "../TextBox";
import Button from "../Button";
import SlotTimePicker from "./SlotTimePicker";
import { Trash, ClockIcon } from "lucide-react";
import { cn } from "@/utils/style";

interface ISlotCardProps {
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

const SlotCard = ({
  slot,
  disabled,
  disabledSlots = [],
  onChange,
  onDelete,
}: ISlotCardProps) => {
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
    <div className="bg-background border border-primary/30 rounded-md p-4 flex flex-col gap-3 z-50">
      <div className="flex flex-row gap-4">
        <TextBox
          value={slot.label ?? ""}
          placeHolder="Label (Optional)"
          setValue={handleLabelChange}
          disabled={disabled}
          containerClassName="flex-1"
        />
        <Button className="bg-error p-2" onClick={onDelete} disabled={disabled}>
          <Trash className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base text-primary/70">Time Slot</p>
        <button
          onClick={() => setIsTimePickerOpen(true)}
          disabled={disabled}
          className={cn(
            "bg-background border border-primary/40 rounded-md px-3 py-2 text-primary",
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

export default SlotCard;
