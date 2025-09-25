"use client";

import React from "react";
import Button from "@/components/Button";
import Box from "../container/Box";
import ScheduleForm from "./ScheduleForm";
import { useScheduleEdit } from "@/contexts/schedule/useSchedule";

const EditSchedule = () => {
  const {
    selectedSchedule,
    scheduleForm,
    slots,
    isModified,
    isEditLoading,
    isActive,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    deleteSchedule,
    toggleScheduleActive,
  } = useScheduleEdit();

  // Wrapper functions to match ScheduleForm's expected prop types
  const setScheduleForm = (
    value: React.SetStateAction<typeof scheduleForm>
  ) => {
    if (typeof value === "function") {
      updateScheduleForm(value(scheduleForm));
    } else {
      updateScheduleForm(value);
    }
  };

  const setSlots = (value: React.SetStateAction<typeof slots>) => {
    if (typeof value === "function") {
      updateSlots(value(slots));
    } else {
      updateSlots(value);
    }
  };

  if (!selectedSchedule) {
    return null;
  }

  return (
    <div className="relative h-full w-full flex flex-col gap-4">
      <Box containerClassName="flex flex-col p-6 gap-4">
        <ScheduleForm
          mode="EDIT"
          isLoading={isEditLoading}
          scheduleForm={scheduleForm}
          setScheduleForm={setScheduleForm}
          slots={slots}
          setSlots={setSlots}
          isActive={isActive}
          handleToggle={toggleScheduleActive}
        />
        <div className="flex flex-row justify-end gap-4">
          <div className="flex-1">
            <Button
              title="Delete"
              className="w-32 bg-error"
              disabled={isEditLoading}
              onClick={deleteSchedule}
            />
          </div>
          <Button
            title="Submit"
            className="w-32"
            disabled={isEditLoading || !isModified}
            onClick={updateSchedule}
          />
          <Button
            title="Reset"
            className="w-32"
            disabled={isEditLoading || !isModified}
            onClick={resetForm}
            secondary
          />
        </div>
      </Box>
    </div>
  );
};

export default EditSchedule;
