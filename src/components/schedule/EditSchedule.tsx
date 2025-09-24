"use client";

import React, { useEffect, useState } from "react";
import { Schedule, ScheduleSlot } from "@/models";
import {
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "@/lib/schedule";
import Button from "@/components/Button";
import Box from "../container/Box";
import ScheduleForm from "./ScheduleForm";

interface IEditScheduleProps {
  scheduleId: string;
}

const EditSchedule = ({ scheduleId }: IEditScheduleProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [originalSlots, setOriginalSlots] = useState<ScheduleSlot[]>([]);
  const [slots, setSlots] = useState<
    Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>
  >([]);

  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    user_type: "STUDENT" as "STUDENT" | "EMPLOYEE",
  });
  const [isModified, setIsModified] = useState(false);

  // Helper function to convert legacy slot to span format
  const convertLegacyToSpan = (slot: any) => {
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

  const load = async () => {
    setIsLoading(true);
    const res = await getScheduleById(scheduleId);
    if (!res.error && res.schedule) {
      setSchedule(res.schedule);
      setOriginalSlots(res.slots);

      // Convert server slots to include span format
      const slotsWithSpans = res.slots.map((slot: any) => ({
        ...slot,
        span: convertLegacyToSpan(slot),
      }));

      setSlots(slotsWithSpans);
      setScheduleForm({
        name: res.schedule.name,
        description: res.schedule.description ?? "",
        user_type: res.schedule.user_type as "STUDENT" | "EMPLOYEE",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, [scheduleId]);

  useEffect(() => {
    if (!schedule) {
      setIsModified(false);
      return;
    }

    const baseForm = {
      name: schedule.name,
      description: schedule.description ?? "",
      user_type: schedule.user_type as "STUDENT" | "EMPLOYEE",
    };

    // Check if form or slots have been modified
    const formModified =
      JSON.stringify(scheduleForm) !== JSON.stringify(baseForm);
    const slotsModified = slots.some((slot, index) => {
      const originalSlot = originalSlots[index];
      if (!originalSlot) return true;

      const currentSpan = slot.span || convertLegacyToSpan(slot);
      const originalSpan = convertLegacyToSpan(originalSlot);

      return JSON.stringify(currentSpan) !== JSON.stringify(originalSpan);
    });

    setIsModified(formModified || slotsModified);
  }, [scheduleForm, slots, schedule]);

  const resetHandle = () => {
    if (!schedule) return;
    setScheduleForm({
      name: schedule.name,
      description: schedule.description ?? "",
      user_type: schedule.user_type as "STUDENT" | "EMPLOYEE",
    });

    // Reset slots to original state
    const slotsWithSpans = originalSlots.map((slot: any) => ({
      ...slot,
      span: convertLegacyToSpan(slot),
    }));
    setSlots(slotsWithSpans);
  };

  const updateHandle = async () => {
    if (!schedule) return;
    if (!confirm("This will update the schedule.")) return;
    setIsLoading(true);

    // Convert slots to server format
    const serverSlots = slots
      .filter((s) => s._op !== "delete")
      .map((slot) => {
        if (slot.span) {
          return {
            slot_id: slot.slot_id,
            day_of_week: slot.span.start.day,
            end_day_of_week: slot.span.end.day,
            start_time: `${slot.span.start.hour
              .toString()
              .padStart(2, "0")}:${slot.span.start.minute
              .toString()
              .padStart(2, "0")}:00`,
            end_time: `${slot.span.end.hour
              .toString()
              .padStart(2, "0")}:${slot.span.end.minute
              .toString()
              .padStart(2, "0")}:00`,
            label: slot.span.label || null,
          };
        }

        return {
          slot_id: slot.slot_id,
          day_of_week: slot.day_of_week,
          end_day_of_week: slot.end_day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          label: slot.label || null,
        };
      });

    const { error } = await updateSchedule({
      schedule_id: schedule.schedule_id,
      name: scheduleForm.name,
      description: scheduleForm.description || null,
      user_type: scheduleForm.user_type,
      slots: serverSlots,
    } as any);

    if (error) {
      alert(error);
    } else {
      alert("✅ Schedule updated successfully!");
      await load();
    }
    setIsLoading(false);
  };

  const deleteHandle = async () => {
    if (!schedule) return;
    if (!confirm("This will delete the schedule.")) return;
    setIsLoading(true);
    const { error } = await deleteSchedule(schedule.schedule_id);
    if (error) {
      alert(error);
    } else {
      alert("✅ Schedule deleted successfully!");
    }
    setIsLoading(false);
  };

  return (
    <div className="relative h-full w-full flex flex-col gap-4">
      <Box containerClassName="p-6">
        <ScheduleForm
          isLoading={isLoading}
          scheduleForm={scheduleForm}
          setScheduleForm={setScheduleForm}
          slots={slots}
          setSlots={setSlots}
        />
      </Box>

      <Box containerClassName="flex flex-row justify-end gap-4 p-6">
        <Button
          title="Submit"
          className="w-32"
          disabled={isLoading || !isModified}
          onClick={updateHandle}
        />
        <Button
          title="Reset"
          className="w-32"
          disabled={isLoading || !isModified}
          onClick={resetHandle}
          secondary
        />
        <Button
          title="Delete"
          className="w-32 bg-error"
          disabled={isLoading}
          onClick={deleteHandle}
        />
      </Box>
    </div>
  );
};

export default EditSchedule;
