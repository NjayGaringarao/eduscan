"use client";

import React from "react";
import { Slot } from "@/models";
import TextBox from "../TextBox";
import Button from "../Button";
import SlotTimePicker from "./SlotTimePicker";
import { Trash } from "lucide-react";

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
          className="w-full"
          stepMinutes={15}
        />
      </div>
    </div>
  );
};

export default SlotCard;
