"use client";

import React from "react";
import { Slot } from "@/models";
import { cn } from "@/utils/style";
import { findNextAvailableSlot } from "@/utils/scheduleUtils";
import TextBox from "../TextBox";
import Select from "../Select";
import ParagraphBox from "../ParagraphBox";
import Button from "../Button";
import SlotCard from "./SlotCard";
import { Plus } from "lucide-react";

type UserType = "STUDENT" | "EMPLOYEE";

interface ScheduleFormState {
  name: string;
  description: string;
  user_type: UserType;
}

interface CreateMode {
  mode: "CREATE";
  isLoading: boolean;
  scheduleForm: ScheduleFormState;
  setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;
  slots: Slot[];
  setSlots: React.Dispatch<React.SetStateAction<Slot[]>>;
}

interface EditMode {
  mode: "EDIT";
  isLoading: boolean;
  scheduleForm: ScheduleFormState;
  setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleFormState>>;
  slots: Slot[];
  setSlots: React.Dispatch<React.SetStateAction<Slot[]>>;
  isActive: boolean;
}

type ScheduleFormProps = CreateMode | EditMode;

const ScheduleForm = (props: ScheduleFormProps) => {
  const { mode, isLoading, scheduleForm, setScheduleForm, slots, setSlots } =
    props;
  const { name, description, user_type: userType } = scheduleForm;

  // Get disabled slots for a specific slot (exclude the slot being edited)
  const getDisabledSlots = (
    targetSlot: Slot,
    targetSlotIndex: number
  ): Array<{ day_of_week: number; start_time: string; end_time: string }> => {
    return slots
      .filter((s, index) => {
        // Exclude the slot being edited by index and slot_id
        if (index === targetSlotIndex) return false;
        if (s.id && targetSlot.id && s.id === targetSlot.id) return false;
        return true;
      })
      .map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      }));
  };

  const HandleAddSlot = () => {
    setSlots((prev) => {
      // If no slots exist, create the first one on Monday 8-9am
      if (prev.length === 0) {
        const newSlot: Slot = {
          id: `temp_${Date.now()}`,
          schedule_id: "",
          day_of_week: 1, // Monday
          start_time: "08:00",
          end_time: "09:00",
          label: "",
        };
        return [newSlot];
      }

      // Find the last slot to continue from the same day
      const lastSlot = prev[prev.length - 1];
      const existingSlots = prev.map((slot) => ({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }));

      // Check if we can add after the last slot on the same day
      const lastSlotEnd = parseInt(lastSlot.end_time.replace(":", ""));
      const endOfDay = 2400; // 24:00 in HHMM format

      if (endOfDay - lastSlotEnd >= 100) {
        // At least 1 hour available
        const newSlot: Slot = {
          id: `temp_${Date.now()}`,
          schedule_id: "",
          day_of_week: lastSlot.day_of_week,
          start_time: lastSlot.end_time,
          end_time: formatTime(lastSlotEnd + 100),
          label: "",
        };
        return [...prev, newSlot];
      }

      // If same day is full, use the original logic to find next available slot
      const nextSlot = findNextAvailableSlot(existingSlots, 60);

      const newSlot: Slot = {
        id: `temp_${Date.now()}`,
        schedule_id: "",
        day_of_week: nextSlot.day_of_week,
        start_time: nextSlot.start_time,
        end_time: nextSlot.end_time,
        label: "",
      };

      return [...prev, newSlot];
    });
  };

  // Helper function to format time in HHMM format to HH:MM format
  const formatTime = (timeInHHMM: number): string => {
    const hours = Math.floor(timeInHHMM / 100);
    const minutes = timeInHHMM % 100;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  // Check if we can add more slots (not at Saturday 11PM or all days full)
  const canAddMoreSlots = (): boolean => {
    if (slots.length === 0) return true;

    const lastSlot = slots[slots.length - 1];

    // Check if we're at Saturday (6) and end time is 23:00 (11PM) or later
    if (lastSlot.day_of_week === 6) {
      const endTime = parseInt(lastSlot.end_time.replace(":", ""));
      if (endTime >= 2300) {
        // 23:00 (11PM) or later
        return false;
      }
    }

    // Check if all days have slots that go until 11PM or later
    const daySlots = slots.reduce((acc, slot) => {
      if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {} as Record<number, Slot[]>);

    // Check if all 7 days (0-6) have slots ending at 23:00 or later
    const allDaysFull = [0, 1, 2, 3, 4, 5, 6].every((day) => {
      const daySlotList = daySlots[day];
      if (!daySlotList || daySlotList.length === 0) return false;

      // Find the latest ending slot for this day
      const latestEndTime = Math.max(
        ...daySlotList.map((slot) => parseInt(slot.end_time.replace(":", "")))
      );

      return latestEndTime >= 2300; // 23:00 (11PM) or later
    });

    return !allDaysFull;
  };

  const updateSlot = (slot: Slot, updates: Partial<Slot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, ...updates } : s))
    );
  };

  const deleteSlot = (slot: Slot) => {
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
  };

  return (
    <div className={cn("flex flex-col gap-4 w-full z-50")}>
      <div className={cn("flex flex-col gap-4")}>
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-col md:flex-row gap-4">
            <TextBox
              title="Schedule Name (Required)"
              value={name}
              setValue={(value) =>
                setScheduleForm((prev) => ({ ...prev, name: value }))
              }
              disabled={isLoading || mode === "EDIT"}
              placeHolder="Enter schedule name"
              containerClassName="w-full"
            />

            <div className="flex flex-col justify-end">
              <div
                className={cn("text-base text-textBody flex flex-row gap-2")}
              >
                <p>User Type </p>
              </div>
              <Select
                value={userType}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    user_type: e.target.value as UserType,
                  }))
                }
                disabled={isLoading || mode === "EDIT"}
              >
                <option value="STUDENT">Student</option>
                <option value="EMPLOYEE">Employee</option>
              </Select>
            </div>
          </div>
          <ParagraphBox
            title="Description"
            value={description}
            setValue={(value) =>
              setScheduleForm((prev) => ({
                ...prev,
                description: value,
              }))
            }
            disabled={isLoading}
            placeholder="Enter schedule description"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2 items-center">
            <h3 className="text-lg font-medium text-primary">Time Blocks</h3>
            <i className="text-textBody">(atleast one (1) required)</i>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.map((slot, index) => (
              <SlotCard
                key={slot.id || index}
                slot={slot}
                disabled={isLoading || mode === "EDIT"}
                disabledSlots={getDisabledSlots(slot, index)}
                onChange={(update) => updateSlot(slot, update)}
                onDelete={() => deleteSlot(slot)}
              />
            ))}
            {mode === "CREATE" && (
              <Button
                className="bg-secondary text-textBody w-full h-full min-h-36"
                onClick={HandleAddSlot}
                disabled={!canAddMoreSlots()}
              >
                <Plus className="h-6 w-6" />
                Add Block
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
