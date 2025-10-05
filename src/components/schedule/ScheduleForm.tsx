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
        if (s.slot_id && targetSlot.slot_id && s.slot_id === targetSlot.slot_id)
          return false;
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
      // Use smart auto-scheduling to find the next available slot
      const existingSlots = prev.map((slot) => ({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }));

      const nextSlot = findNextAvailableSlot(existingSlots, 60); // 60 minutes duration

      const newSlot: Slot = {
        slot_id: `temp_${Date.now()}`, // Temporary ID for new slots
        schedule_id: "", // Will be set when creating the schedule
        day_of_week: nextSlot.day_of_week,
        start_time: nextSlot.start_time,
        end_time: nextSlot.end_time,
        label: "",
      };

      return [...prev, newSlot];
    });
  };

  const updateSlot = (slot: Slot, updates: Partial<Slot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.slot_id === slot.slot_id ? { ...s, ...updates } : s))
    );
  };

  const deleteSlot = (slot: Slot) => {
    setSlots((prev) => prev.filter((s) => s.slot_id !== slot.slot_id));
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
                key={slot.slot_id || index}
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
