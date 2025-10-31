export type Action = "TIME_IN" | "TIME_OUT";

export interface DebugInfo {
  hasSchedule: boolean;
  scheduleId: string | null;
  dayOfWeek: number | null;
  slotFound: boolean;
  slotError: string | null;
  timeCalculation: TimeCalculation | null;
}

export interface TimeCalculation {
  arrival: string;
  scheduledTime: string;
  arrivalOffsetMinute: number;
  matchedSlot: SlotData;
}

export interface SlotData {
  start_time: string;
  end_time: string;
  label: string;
}

export interface UserData {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  sex: string;
  employee?: {
    type: string;
    division: string;
    title: string;
  };
  student?: {
    department: string;
    program: string;
  };
  guardian?: {
    first_name: string;
    middle_name: string;
    last_name: string;
    sex: string;
    contact_number: string;
  };
}

export interface SessionData {
  user_id: string;
  arrival: string;
  departure: string | null;
  duration: string | null;
  time_balance: number | null;
  is_active: boolean;
  punctuality: number | null;
  remarks: string | null;
}

export interface ScheduleCalculationResult {
  arrivalOffsetMinute: number | null;
  remarks: string;
  matchedSlot: SlotData | null;
  debugInfo: Partial<DebugInfo>;
}
