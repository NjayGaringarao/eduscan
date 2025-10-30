import { User } from "./user";

export type Slot = {
  id: string;
  schedule_id: string;
  day_of_week: number; // 0-6 (Sun-Sat)
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  label?: string | null;
};

export type Schedule = {
  id: string;
  name: string;
  description?: string | null;
  user_type: "STUDENT" | "EMPLOYEE";
  is_active: boolean;
  created_at: string; // ISO string
  slots: Slot[];
};

export type ExtendedSchedule = Schedule & {
  users: User[] | number;
};

export type DateTime = {
  day: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  minute: number; // 0-59
};

export type SlotSpan = {
  start: DateTime;
  end: DateTime;
  label?: string | null;
};
