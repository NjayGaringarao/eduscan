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
    openViewModal,
  } = useSchedule();

  return {
    schedules,
    isLoading,
    error,
    loadSchedules,
    refreshSchedules,
    openViewModal,
  };
};

export const useScheduleModal = () => {
  const {
    selectedSchedule,
    isViewModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    openViewModal,
    closeViewModal,
    openEditModal,
    closeEditModal,
    openCreateModal,
    closeCreateModal,
  } = useSchedule();

  return {
    selectedSchedule,
    isViewModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    openViewModal,
    closeViewModal,
    openEditModal,
    closeEditModal,
    openCreateModal,
    closeCreateModal,
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
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    deleteSchedule,
    closeEditModal,
  } = useSchedule();

  return {
    selectedSchedule,
    scheduleForm,
    slots,
    originalSlots,
    isModified,
    isEditLoading,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule,
    deleteSchedule,
    closeEditModal,
  };
};
