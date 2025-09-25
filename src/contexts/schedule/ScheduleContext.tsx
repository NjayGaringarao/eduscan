"use client";

import { createContext } from "react";
import { Schedule, ScheduleSlot } from "@/models";

// Types for the context
export interface ScheduleFormState {
  name: string;
  description: string;
  user_type: "STUDENT" | "EMPLOYEE";
}

export interface ScheduleWithSlots extends Schedule {
  slots: ScheduleSlot[];
}

export interface ScheduleContextState {
  // Schedule list state
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;

  // Selected schedule state
  selectedSchedule: ScheduleWithSlots | null;
  isModalOpen: boolean;

  // Edit form state
  scheduleForm: ScheduleFormState;
  slots: Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>;
  originalSlots: ScheduleSlot[];
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
  openScheduleModal: (schedule: Schedule) => Promise<void>;
  closeScheduleModal: () => void;

  // Edit form actions
  updateScheduleForm: (form: Partial<ScheduleFormState>) => void;
  updateSlots: (
    slots: Array<Partial<ScheduleSlot> & { _op?: "upsert" | "delete" }>
  ) => void;
  resetForm: () => void;

  // Schedule operations
  updateSchedule: () => Promise<void>;
  deleteSchedule: () => Promise<void>;
  toggleScheduleActive: () => Promise<void>;
}

export type ScheduleContextType = ScheduleContextState & ScheduleContextActions;

// Create the context
export const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);
