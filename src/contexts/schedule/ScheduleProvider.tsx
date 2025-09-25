"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ScheduleContext,
  ScheduleContextType,
  ScheduleFormState,
} from "./ScheduleContext";
import { Schedule, ScheduleSlot } from "@/models";
import {
  getAll,
  getById,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
} from "@/lib/schedule";

interface ScheduleProviderProps {
  children: React.ReactNode;
}

const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  // Schedule list state
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected schedule state
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit form state
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>({
    name: "",
    description: "",
    user_type: "STUDENT",
  });
  const [slots, setSlots] = useState<
    Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>
  >([]);
  const [originalSlots, setOriginalSlots] = useState<ScheduleSlot[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Helper function to convert legacy slot to span format
  const convertLegacyToSpan = useCallback((slot: any) => {
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
  }, []);

  // Load schedules list
  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { schedules: fetchedSchedules, error: fetchError } = await getAll();

      if (fetchError) {
        setError(fetchError);
      } else {
        setSchedules(fetchedSchedules);
      }
    } catch (err) {
      setError("Failed to load schedules");
      console.error("Error loading schedules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh schedules (alias for loadSchedules)
  const refreshSchedules = useCallback(async () => {
    await loadSchedules();
  }, [loadSchedules]);

  // Open schedule modal and load full schedule data
  const openScheduleModal = useCallback(
    async (schedule: Schedule) => {
      setSelectedSchedule(schedule);
      setIsModalOpen(true);
      setIsEditLoading(true);
      setError(null);

      try {
        // Fetch the complete schedule data with slots
        const { schedule: fullSchedule, error: fetchError } = await getById(
          schedule.schedule_id
        );

        if (fetchError) {
          setError(fetchError);
          return;
        }

        if (fullSchedule) {
          // Update the selected schedule with full data
          setSelectedSchedule(fullSchedule);

          // Initialize form state
          setScheduleForm({
            name: fullSchedule.name,
            description: fullSchedule.description ?? "",
            user_type: fullSchedule.user_type as "STUDENT" | "EMPLOYEE",
          });

          // Initialize slots
          const scheduleSlots = fullSchedule.slots || [];
          setOriginalSlots(scheduleSlots);
          setIsActive(Boolean(fullSchedule.is_active));

          // Convert server slots to include span format
          const slotsWithSpans = scheduleSlots.map((slot) => ({
            ...slot,
            span: convertLegacyToSpan(slot),
          }));

          setSlots(slotsWithSpans);
          setIsModified(false);
        }
      } catch (err) {
        setError("Failed to load schedule details");
        console.error("Error loading schedule details:", err);
      } finally {
        setIsEditLoading(false);
      }
    },
    [convertLegacyToSpan]
  );

  // Close schedule modal
  const closeScheduleModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
    setScheduleForm({
      name: "",
      description: "",
      user_type: "STUDENT",
    });
    setSlots([]);
    setOriginalSlots([]);
    setIsModified(false);
    setIsActive(false);
    setError(null);
  }, []);

  // Update schedule form
  const updateScheduleForm = useCallback((form: Partial<ScheduleFormState>) => {
    setScheduleForm((prev) => ({ ...prev, ...form }));
  }, []);

  // Update slots
  const updateSlots = useCallback(
    (
      newSlots: Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>
    ) => {
      setSlots(newSlots);
    },
    []
  );

  // Reset form to original state
  const resetForm = useCallback(() => {
    if (!selectedSchedule) return;

    setScheduleForm({
      name: selectedSchedule.name,
      description: selectedSchedule.description ?? "",
      user_type: selectedSchedule.user_type as "STUDENT" | "EMPLOYEE",
    });

    // Reset slots to original state
    const slotsWithSpans = originalSlots.map((slot: any) => ({
      ...slot,
      span: convertLegacyToSpan(slot),
    }));
    setSlots(slotsWithSpans);
    setIsModified(false);
  }, [selectedSchedule, originalSlots, convertLegacyToSpan]);

  // Update schedule
  const updateScheduleHandler = useCallback(async () => {
    if (!selectedSchedule) return;
    if (!confirm("This will update the schedule.")) return;

    setIsEditLoading(true);

    try {
      const { error: updateError } = await updateSchedule({
        schedule_id: selectedSchedule.schedule_id,
        name: scheduleForm.name,
        description: scheduleForm.description || null,
        user_type: scheduleForm.user_type,
      } as any);

      if (updateError) {
        alert(updateError);
      } else {
        alert("✅ Schedule updated successfully!");
        // Refresh the schedules list
        await refreshSchedules();
        // Close the modal
        closeScheduleModal();
      }
    } catch (err) {
      alert("Failed to update schedule");
      console.error("Error updating schedule:", err);
    } finally {
      setIsEditLoading(false);
    }
  }, [
    selectedSchedule,
    scheduleForm,
    slots,
    refreshSchedules,
    closeScheduleModal,
  ]);

  // Delete schedule
  const deleteScheduleHandler = useCallback(async () => {
    if (!selectedSchedule) return;
    if (!confirm("This will delete the schedule.")) return;

    setIsEditLoading(true);

    try {
      const { error: deleteError } = await deleteSchedule(
        selectedSchedule.schedule_id
      );

      if (deleteError) {
        alert(deleteError);
      } else {
        alert("✅ Schedule deleted successfully!");
        // Refresh the schedules list
        await refreshSchedules();
        // Close the modal
        closeScheduleModal();
      }
    } catch (err) {
      alert("Failed to delete schedule");
      console.error("Error deleting schedule:", err);
    } finally {
      setIsEditLoading(false);
    }
  }, [selectedSchedule, refreshSchedules, closeScheduleModal]);

  // Toggle schedule active status
  const toggleScheduleActiveHandler = useCallback(async () => {
    if (!selectedSchedule) return;

    const newState = !isActive;
    setIsActive(newState);

    try {
      const { error: toggleError } = await toggleScheduleActive(
        selectedSchedule.schedule_id,
        newState
      );

      if (toggleError) {
        setIsActive(!newState); // Revert on error
        alert(toggleError);
      } else {
        // Refresh the schedules list to reflect the change
        await refreshSchedules();
      }
    } catch (err) {
      setIsActive(!newState); // Revert on error
      alert("Failed to toggle schedule status");
      console.error("Error toggling schedule status:", err);
    }
  }, [selectedSchedule, isActive, refreshSchedules]);

  // Check if form is modified
  useEffect(() => {
    if (!selectedSchedule) {
      setIsModified(false);
      return;
    }

    const baseForm = {
      name: selectedSchedule.name,
      description: selectedSchedule.description ?? "",
      user_type: selectedSchedule.user_type as "STUDENT" | "EMPLOYEE",
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
  }, [
    scheduleForm,
    slots,
    selectedSchedule,
    originalSlots,
    convertLegacyToSpan,
  ]);

  // Load schedules on mount
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const contextValue: ScheduleContextType = {
    // State
    schedules,
    isLoading,
    error,
    selectedSchedule,
    isModalOpen,
    scheduleForm,
    slots,
    originalSlots,
    isModified,
    isEditLoading,
    isActive,

    // Actions
    loadSchedules,
    refreshSchedules,
    openScheduleModal,
    closeScheduleModal,
    updateScheduleForm,
    updateSlots,
    resetForm,
    updateSchedule: updateScheduleHandler,
    deleteSchedule: deleteScheduleHandler,
    toggleScheduleActive: toggleScheduleActiveHandler,
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export default ScheduleProvider;
