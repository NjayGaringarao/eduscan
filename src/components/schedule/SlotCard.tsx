"use client";

import React from "react";
import { ScheduleSlot, SlotSpan } from "@/models";
import TextBox from "../TextBox";
import Button from "../Button";
import SlotSpanPicker from "./SlotSpanPicker";
import { Trash } from "lucide-react";

interface ISlotCardProps {
  slot: Partial<ScheduleSlot> & { _op?: "upsert" | "delete" };
  disabled?: boolean;
  disabledSpans?: SlotSpan[]; // Array of occupied spans to disable
  onChange: (update: Partial<ScheduleSlot>) => void;
  onDelete: () => void;
}

const SlotCard = ({
  slot,
  disabled,
  disabledSpans = [],
  onChange,
  onDelete,
}: ISlotCardProps) => {
  // Convert legacy format to new span format if needed
  const getSlotSpan = (): SlotSpan | null => {
    if (slot.span) {
      return slot.span;
    }

    // Convert from legacy format
    if (slot.day_of_week !== undefined && slot.start_time && slot.end_time) {
      const startHour = parseInt(slot.start_time.split(":")[0], 10);
      const startMinute = parseInt(slot.start_time.split(":")[1], 10);
      const endHour = parseInt(slot.end_time.split(":")[0], 10);
      const endMinute = parseInt(slot.end_time.split(":")[1], 10);

      return {
        start: {
          day: slot.day_of_week,
          hour: startHour,
          minute: startMinute,
        },
        end: {
          day: slot.end_day_of_week ?? slot.day_of_week,
          hour: endHour,
          minute: endMinute,
        },
        label: slot.label ?? undefined,
      };
    }

    return null;
  };

  const handleSpanChange = (newSpan: SlotSpan) => {
    onChange({
      span: newSpan,
      // Update legacy fields for backward compatibility
      day_of_week: newSpan.start.day,
      end_day_of_week: newSpan.end.day,
      start_time: `${newSpan.start.hour
        .toString()
        .padStart(2, "0")}:${newSpan.start.minute
        .toString()
        .padStart(2, "0")}:00`,
      end_time: `${newSpan.end.hour
        .toString()
        .padStart(2, "0")}:${newSpan.end.minute
        .toString()
        .padStart(2, "0")}:00`,
      label: newSpan.label,
    });
  };

  const handleLabelChange = (label: string) => {
    const currentSpan = getSlotSpan();
    if (currentSpan) {
      handleSpanChange({ ...currentSpan, label });
    }
  };

  const currentSpan = getSlotSpan();

  return (
    <div className="bg-background border border-primary/30 rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-row gap-4">
        <TextBox
          value={currentSpan?.label ?? ""}
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
        <p className="text-base text-primary/70">Time Span</p>
        <SlotSpanPicker
          value={currentSpan}
          onChange={handleSpanChange}
          disabled={disabled}
          disabledSpans={disabledSpans}
          className="w-full"
          stepMinutes={15}
        />
      </div>
    </div>
  );
};

export default SlotCard;
