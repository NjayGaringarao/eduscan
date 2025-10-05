"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ScheduleContext,
  ScheduleContextType,
  ScheduleFormState,
} from "./ScheduleContext";
import { Schedule, Slot } from "@/models";
import {
  getAll,
  getById,
  updateSchedule,
  deleteSchedule,
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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [originalSlots, setOriginalSlots] = useState<Slot[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Load schedules list
  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading schedules...");
      const { schedules: fetchedSchedules, error: fetchError } = await getAll();

      if (fetchError) {
        console.error("Error loading schedules:", fetchError);
        setError(fetchError);
      } else {
        console.log("Schedules loaded:", fetchedSchedules);
        setSchedules(fetchedSchedules);
      }
    } catch (err) {
      console.error("Error loading schedules:", err);
      setError("Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh schedules (alias for loadSchedules)
  const refreshSchedules = useCallback(async () => {
    await loadSchedules();
  }, [loadSchedules]);

  // Open schedule modal and load full schedule data
  const openScheduleModal = useCallback(async (schedule: Schedule) => {
    console.log("Opening schedule modal for:", schedule);
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
        console.error("Error fetching schedule details:", fetchError);
        setError(fetchError);
        return;
      }

      if (fullSchedule) {
        console.log("Full schedule loaded:", fullSchedule);
        // Update the selected schedule with full data
        setSelectedSchedule(fullSchedule);

        // Initialize form state
        setScheduleForm({
          name: fullSchedule.name,
          description: fullSchedule.description ?? "",
          user_type: fullSchedule.user_type as "STUDENT" | "EMPLOYEE",
        });

        // Initialize slots (use the new Slot type directly)
        const scheduleSlots = fullSchedule.slots || [];
        setOriginalSlots(scheduleSlots);
        setSlots(scheduleSlots);
        setIsActive(Boolean(fullSchedule.is_active));
        setIsModified(false);
      }
    } catch (err) {
      console.error("Error loading schedule details:", err);
      setError("Failed to load schedule details");
    } finally {
      setIsEditLoading(false);
    }
  }, []);

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
  const updateSlots = useCallback((newSlots: Slot[]) => {
    setSlots(newSlots);
  }, []);

  // Reset form to original state
  const resetForm = useCallback(() => {
    if (!selectedSchedule) return;

    setScheduleForm({
      name: selectedSchedule.name,
      description: selectedSchedule.description ?? "",
      user_type: selectedSchedule.user_type as "STUDENT" | "EMPLOYEE",
    });

    // Reset slots to original state
    setSlots(originalSlots);
    setIsModified(false);
  }, [selectedSchedule, originalSlots]);

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
  }, [selectedSchedule, scheduleForm, refreshSchedules, closeScheduleModal]);

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

    // Check if form has been modified
    const formModified =
      JSON.stringify(scheduleForm) !== JSON.stringify(baseForm);

    // Check if slots have been modified
    const slotsModified =
      JSON.stringify(slots) !== JSON.stringify(originalSlots);

    setIsModified(formModified || slotsModified);
  }, [scheduleForm, slots, selectedSchedule, originalSlots]);

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
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export default ScheduleProvider;
