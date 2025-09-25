"use client";

import { useContext } from "react";
import { ScheduleContext } from "./ScheduleContext";

export const useSchedule = () => {
  const context = useContext(ScheduleContext);

  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }

  return context;
};

// Additional specialized hooks for specific parts of the context
export const useScheduleList = () => {
  const {
    schedules,
    isLoading,
    error,
    loadSchedules,
    refreshSchedules,
    openScheduleModal,
  } = useSchedule();

  return {
    schedules,
    isLoading,
    error,
    loadSchedules,
    refreshSchedules,
    openScheduleModal,
  };
};

export const useScheduleModal = () => {
  const {
    selectedSchedule,
    isModalOpen,
    openScheduleModal,
    closeScheduleModal,
  } = useSchedule();

  return {
    selectedSchedule,
    isModalOpen,
    openScheduleModal,
    closeScheduleModal,
  };
};

export const useScheduleEdit = () => {
  const {
    selectedSchedule,
    scheduleForm,
    slots,
    originalSlots,
    isModified,
    isEditLoading,
    isActive,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    deleteSchedule,
    toggleScheduleActive,
  } = useSchedule();

  return {
    selectedSchedule,
    scheduleForm,
    slots,
    originalSlots,
    isModified,
    isEditLoading,
    isActive,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    deleteSchedule,
    toggleScheduleActive,
  };
};
