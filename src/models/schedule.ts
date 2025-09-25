export type ScheduleSlot = {
  slot_id: string;
  schedule_id: string;
  span?: SlotSpan; // Optional for backward compatibility
  day_of_week?: number; // 0-6 (Sun-Sat)
  end_day_of_week?: number; // 0-6 to support spanning days
  start_time?: string; // HH:MM:SS
  end_time?: string; // HH:MM:SS
  label?: string | null;
};

export type Schedule = {
  schedule_id: string;
  name: string;
  description?: string | null;
  user_type: "STUDENT" | "EMPLOYEE";
  is_active: boolean;
  created_at: string; // ISO string
  slots: ScheduleSlot[]; // Optional for backward compatibility
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
