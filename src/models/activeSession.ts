export type Session = {
  session_id: string;
  user_id: string;
  schedule_id?: string;
  arrival: Date;
  departure?: Date;
  undertime?: string; // interval type
  is_active: boolean;
  arrival_offset_minute?: number;
  remarks?: "ON_TIME" | "LATE" | "EARLY" | "UNSCHEDULED";
};

// Keep ActiveSession for backward compatibility during migration
export type ActiveSession = {
  session_id: string;
  user_id: string;
  login_time: Date;
};
