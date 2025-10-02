"use client";

import React, { useState } from "react";
import { createSchedule } from "@/lib/schedule";
import { Slot } from "@/models";
import Button from "@/components/Button";
import Box from "../container/Box";
import ScheduleForm from "./ScheduleForm";

const CreateSchedule = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    user_type: "STUDENT" as "STUDENT" | "EMPLOYEE",
  });
  const [slots, setSlots] = useState<Slot[]>([]);

  const clearHandle = () => {
    setScheduleForm({ name: "", description: "", user_type: "STUDENT" });
    setSlots([]);
  };

  const createHandle = async () => {
    if (!confirm("This will create a new schedule.")) return;
    setIsLoading(true);

    // Convert slots to the format expected by the server
    const serverSlots = slots.map((slot) => {
      return {
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        label: slot.label || null,
      };
    });

    const { error } = await createSchedule({
      name: scheduleForm.name,
      description: scheduleForm.description || null,
      user_type: scheduleForm.user_type,
      slots: serverSlots,
    } as any);

    if (error) {
      alert(error);
    } else {
      alert("✅ Schedule created successfully!");
      clearHandle();
    }
    setIsLoading(false);
  };

  return (
    <div className="relative h-full w-full flex flex-col gap-4 z-30">
      <Box containerClassName="p-6 z-20">
        <ScheduleForm
          mode="CREATE"
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
          disabled={
            isLoading || scheduleForm.name.length < 3 || slots.length === 0
          }
          onClick={createHandle}
        />
        <Button
          title="Clear"
          className="w-32"
          disabled={isLoading}
          onClick={clearHandle}
          secondary
        />
      </Box>
    </div>
  );
};

export default CreateSchedule;
