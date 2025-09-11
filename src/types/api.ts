export type AdminStatus = {
  isInitialized: boolean;
  isVerified: boolean;
};

export type UserApplicationStatus = {
  isOn: boolean;
  count: number;
};

export type KioskStatus = {
  isInitialized: boolean;
  isEnabled: boolean;
};

export type TrendPoint = {
  hour: string;
  percentage: number;
};

export interface UserAttendanceShift {
  date: [string, string?];
  time_in: string | null;
  time_out: string | null;
  total_hours: number | null;
}
