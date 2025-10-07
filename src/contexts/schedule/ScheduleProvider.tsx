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

  // Individual modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  // Open view modal and load full schedule data
  const openViewModal = useCallback(async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsViewModalOpen(true);
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
        setSelectedSchedule(fullSchedule);
      }
    } catch (err) {
      console.error("Error loading schedule details:", err);
      setError("Failed to load schedule details");
    }
  }, []);

  // Close view modal
  const closeViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setSelectedSchedule(null);
    setError(null);
  }, []);

  // Open edit modal
  const openEditModal = useCallback(async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsEditModalOpen(true);
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

  // Close edit modal (without affecting view modal)
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    // Don't clear selectedSchedule - keep it for view modal
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

  // Open create modal
  const openCreateModal = useCallback(() => {
    console.log("Opening create modal");
    setIsCreateModalOpen(true);
  }, []);

  // Close create modal
  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
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
      });

      if (updateError) {
        alert(updateError);
      } else {
        alert("✅ Schedule updated successfully!");
        // Refresh the schedules list
        await refreshSchedules();

        // Refresh the selected schedule data for view modal
        if (selectedSchedule) {
          const { schedule: updatedSchedule, error: fetchError } =
            await getById(selectedSchedule.schedule_id);
          if (!fetchError && updatedSchedule) {
            setSelectedSchedule(updatedSchedule);
          }
        }

        // Close the edit modal
        closeEditModal();
      }
    } catch (err) {
      alert("Failed to update schedule");
      console.error("Error updating schedule:", err);
    } finally {
      setIsEditLoading(false);
    }
  }, [selectedSchedule, scheduleForm, refreshSchedules, closeEditModal]);

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
        // Close both modals
        closeEditModal();
        closeViewModal();
      }
    } catch (err) {
      alert("Failed to delete schedule");
      console.error("Error deleting schedule:", err);
    } finally {
      setIsEditLoading(false);
    }
  }, [selectedSchedule, refreshSchedules, closeEditModal, closeViewModal]);

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
    isViewModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    scheduleForm,
    slots,
    originalSlots,
    isModified,
    isEditLoading,
    isActive,

    // Actions
    loadSchedules,
    refreshSchedules,
    openViewModal,
    closeViewModal,
    openEditModal,
    closeEditModal,
    openCreateModal,
    closeCreateModal,
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
