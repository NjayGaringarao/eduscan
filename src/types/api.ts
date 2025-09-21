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

export type LogType =
  | "ALL" // All types of log
  | "ATTENDANCE" // Logs that is triggered in Kiosk
  | "SYSTEM.AUTH" // Auth action (create auth, update password, update email, etc)
  | "ADMIN.CONFIG" // Config action by admin (set name, set kiosk password, etc)
  | "ADMIN.DATA" // Database action by admin (create, update, delete user, etc)
  | "ADMIN.EXPORT" // PDF Download triggered by the user
  | "ADMIN.OPERATION"; // An action triggered by the admin (publish an announcement)
