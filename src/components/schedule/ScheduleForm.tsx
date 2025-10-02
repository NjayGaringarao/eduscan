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
import { Switch } from "../Switch";

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
  handleToggle: () => Promise<void>;
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
        {mode === "EDIT" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                isOn={props.isActive}
                setIsOn={async () => await props.handleToggle()}
                disabled={isLoading}
              />
              <span className="text-sm text-primary">
                {props.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <TextBox
            title="Schedule Name"
            value={name}
            setValue={(value) =>
              setScheduleForm((prev) => ({ ...prev, name: value }))
            }
            disabled={isLoading || mode === "EDIT"}
            placeHolder="Enter schedule name"
          />

          <ParagraphBox
            title="Description"
            value={description}
            setValue={(value) =>
              setScheduleForm((prev) => ({
                ...prev,
                description: value,
              }))
            }
            disabled={isLoading || mode === "EDIT"}
            placeholder="Enter schedule description"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-primary">
              User Type
            </label>
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

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-primary">Time Slots</h3>
            {mode === "CREATE" && (
              <Button
                title="Add Block"
                className="md:w-32 md:self-end"
                onClick={HandleAddSlot}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
