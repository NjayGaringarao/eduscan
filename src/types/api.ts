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

export interface DTRRow {
  date: string; // yyyy-mm-dd
  amArrival?: string;
  amDeparture?: string;
  pmArrival?: string;
  pmDeparture?: string;
  hoursWorked?: string; // formatted "Xh Ym"
}

export type DateRange = {
  fromDate: string;
  toDate: string;
};
