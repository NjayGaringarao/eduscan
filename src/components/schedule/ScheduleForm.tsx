"use client";

import React, { useMemo } from "react";
import { ScheduleSlot, SlotSpan, DateTime } from "@/models";
import { cn } from "@/utils/style";
import TextBox from "../TextBox";
import Select from "../Select";
import ParagraphBox from "../ParagraphBox";
import Button from "../Button";
import SlotCard from "./SlotCard";

type UserType = "STUDENT" | "EMPLOYEE";

interface ScheduleFormState {
  name: string;
  description: string;
  user_type: UserType;
}

interface IScheduleFormProps {
  mode?: "CREATE" | "EDIT";
  isLoading: boolean;
  scheduleForm: ScheduleFormState;
  setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;
  slots: Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>;
  setSlots: React.Dispatch<
    React.SetStateAction<
      Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>
    >
  >;
}

const ScheduleForm = ({
  mode,
  isLoading,
  scheduleForm,
  setScheduleForm,
  slots,
  setSlots,
}: IScheduleFormProps) => {
  const name = scheduleForm.name;
  const description = scheduleForm.description;
  const userType = scheduleForm.user_type;

  // Convert slots to spans and maintain original order
  // Note: We maintain the original order from slots array to prevent reordering during editing
  const sortedSlots = useMemo(() => {
    const list = (slots ?? []).filter((s) => s._op !== "delete");

    // Sort only by the original order in the slots array, not by time values
    // This prevents slots from reordering while being edited
    return [...list];
  }, [slots]);

  // Helper function to convert legacy slot format to span format
  const convertLegacyToSpan = (slot: any): SlotSpan => {
    if (slot.span) return slot.span;

    const dayOfWeek = slot.day_of_week ?? 0;
    const endDayOfWeek = slot.end_day_of_week ?? dayOfWeek;
    const startTime = slot.start_time ?? "08:00:00";
    const endTime = slot.end_time ?? "09:00:00";

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    return {
      start: { day: dayOfWeek, hour: startHour, minute: startMinute },
      end: { day: endDayOfWeek, hour: endHour, minute: endMinute },
      label: slot.label,
    };
  };

  // Get disabled spans for a specific slot (exclude the slot being edited)
  const getDisabledSpans = (
    targetSlot: Partial<ScheduleSlot>,
    targetSlotIndex: number
  ): SlotSpan[] => {
    return sortedSlots
      .filter((s, index) => {
        // Exclude the slot being edited by index and slot_id
        if (index === targetSlotIndex) return false;
        if (s.slot_id && targetSlot.slot_id && s.slot_id === targetSlot.slot_id)
          return false;
        return true;
      })
      .map((s) => convertLegacyToSpan(s));
  };

  // Helper functions for time arithmetic
  const toMinutes = (dt: DateTime) => {
    return dt.day * 24 * 60 + dt.hour * 60 + dt.minute;
  };

  const fromMinutes = (totalMinutes: number): DateTime => {
    const day = Math.floor(totalMinutes / (24 * 60));
    const remaining = totalMinutes % (24 * 60);
    const hour = Math.floor(remaining / 60);
    const minute = remaining % 60;
    return {
      day: day % 7,
      hour,
      minute,
    };
  };

  const HandleAddSlot = () => {
    setSlots((prev) => {
      const current = [...(prev ?? [])].filter((s) => s._op !== "delete");

      let startMins = 8 * 60; // 8:00 AM

      if (current.length > 0) {
        // Find the last slot in sorted order
        const sortedCurrent = [...current].sort((a: any, b: any) => {
          const spanA = convertLegacyToSpan(a);
          const spanB = convertLegacyToSpan(b);
          return toMinutes(spanA.start) - toMinutes(spanB.start);
        });

        const lastSlot = sortedCurrent[sortedCurrent.length - 1];
        const lastSpan = convertLegacyToSpan(lastSlot);

        startMins =
          lastSpan.end.day * 24 * 60 +
          lastSpan.end.hour * 60 +
          lastSpan.end.minute;
      }

      const endMins = startMins + 60; // 1 hour later
      const endDateTime = fromMinutes(endMins);
      const startDateTime = fromMinutes(startMins);

      const newSlot = {
        slot_id: undefined,
        span: {
          start: startDateTime,
          end: endDateTime,
          label: "",
        },
        // Legacy fields for backward compatibility
        day_of_week: startDateTime.day,
        end_day_of_week: endDateTime.day,
        start_time: `${startDateTime.hour
          .toString()
          .padStart(2, "0")}:${startDateTime.minute
          .toString()
          .padStart(2, "0")}:00`,
        end_time: `${endDateTime.hour
          .toString()
          .padStart(2, "0")}:${endDateTime.minute
          .toString()
          .padStart(2, "0")}:00`,
        label: "",
        _op: "upsert" as const,
      };

      const next = [...current, newSlot];
      const deleted = (prev ?? []).filter((s) => s._op === "delete");

      // Don't sort - maintain order to prevent reordering during editing
      return [...next, ...deleted];
    });
  };

  const updateSlot = (
    slot: Partial<ScheduleSlot>,
    updates: Partial<ScheduleSlot>
  ) => {
    setSlots((prev) => {
      const next = (prev ?? []).map((s) =>
        s === slot ? { ...s, ...updates, _op: "upsert" as const } : s
      );

      // Don't sort - maintain order to prevent reordering during editing
      return [...next];
    });
  };

  const deleteSlot = (slot: Partial<ScheduleSlot>) => {
    setSlots((prev) =>
      (prev ?? []).map((s) => (s === slot ? { ...s, _op: "delete" } : s))
    );
  };

  // Removed automatic sorting to prevent reordering during editing
  // Slots will maintain their original order until explicitly reordered

  return (
    <div className={cn("flex flex-col gap-4 w-full")}>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}>
        <TextBox
          title="Schedule Name"
          value={name}
          setValue={(v) => setScheduleForm((prev) => ({ ...prev, name: v }))}
          isRequired
          disabled={isLoading}
          maxLength={30}
        />
        <Select
          title="User Type"
          value={userType}
          onChange={(e) =>
            setScheduleForm((prev) => ({
              ...prev,
              user_type: e.target.value as UserType,
            }))
          }
          className="self-end py-2 text-lg"
          disabled={isLoading || mode === "EDIT"}
        >
          <option value="STUDENT">STUDENT</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </Select>
        <ParagraphBox
          title="Description"
          value={description ?? ""}
          setValue={(v) =>
            setScheduleForm((prev) => ({ ...prev, description: v }))
          }
          containerClassName="col-span-2"
          disabled={isLoading}
        />
      </div>

      <div className={cn("flex flex-col gap-3")}>
        <div>
          <p className="text-primary text-lg">Schedule Block</p>
          <p className="text-textBody text-base">
            A schedule is composed of one or more blocks. Each block represents
            a continuous period of work or study (one or more subjects for
            students) within the schedule. They can span a single day or
            multiple days, such as a class period or an employee shift. Each
            block defines the start and end time, and the days it applies to.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedSlots.map((s, i) => (
            <SlotCard
              key={`${s.slot_id || "new"}-${i}`}
              slot={s}
              slotIndex={i}
              disabled={isLoading || mode === "EDIT"}
              disabledSpans={getDisabledSpans(s, i)}
              onChange={(update) => updateSlot(s, update)}
              onDelete={() => deleteSlot(s)}
            />
          ))}
        </div>

        <Button
          title="Add Block"
          className="md:w-32 md:self-end"
          onClick={HandleAddSlot}
        />
      </div>
    </div>
  );
};

export default ScheduleForm;
