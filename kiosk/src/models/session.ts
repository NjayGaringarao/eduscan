export type Session = {
  id: number;
  user_id: string;
  arrival: Date;
  departure?: Date;
  duration?: string; // interval type
  time_balance?: number | null; // minutes: positive = overtime, negative = undertime
  is_active: boolean;
  punctuality?: number | null;
  remarks?: "ON_TIME" | "LATE" | "EARLY" | "UNSCHEDULED";
};
