"use client";

import { createContext } from "react";
import { Schedule, Slot } from "@/models";

// Types for the context
export interface ScheduleFormState {
  name: string;
  description: string;
  user_type: "STUDENT" | "EMPLOYEE";
}

export interface ScheduleContextState {
  // Schedule list state
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;

  // Selected schedule state
  selectedSchedule: Schedule | null;

  // Individual modal states
  isViewModalOpen: boolean;
  isEditModalOpen: boolean;
  isCreateModalOpen: boolean;

  // Edit form state
  scheduleForm: ScheduleFormState;
  slots: Slot[];
  originalSlots: Slot[];
  isModified: boolean;
  isEditLoading: boolean;

  // Schedule status
  isActive: boolean;
}

export interface ScheduleContextActions {
  // Schedule list actions
  loadSchedules: () => Promise<void>;
  refreshSchedules: () => Promise<void>;

  // Modal actions
  openViewModal: (schedule: Schedule) => Promise<void>;
  closeViewModal: () => void;

  openEditModal: (schedule: Schedule) => Promise<void>;
  closeEditModal: () => void;

  openCreateModal: () => void;
  closeCreateModal: () => void;

  // Edit form actions
  updateScheduleForm: (form: Partial<ScheduleFormState>) => void;
  updateSlots: (slots: Slot[]) => void;
  resetForm: () => void;

  // Schedule operations
  updateSchedule: () => Promise<void>;
  deleteSchedule: () => Promise<void>;
}

export type ScheduleContextType = ScheduleContextState & ScheduleContextActions;

// Create the context
export const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);
