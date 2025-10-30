export type Session = {
  id: string;
  user_id: string;
  arrival: Date;
  departure?: Date;
  duration?: string; // interval type
  undertime?: string; // interval type
  is_active: boolean;
  punctuality?: number | null;
  remarks?: "ON_TIME" | "LATE" | "EARLY" | "UNSCHEDULED";
};

// Keep ActiveSession for backward compatibility during migration
export type ActiveSession = {
  id: string;
  user_id: string;
  login_time: Date;
};
