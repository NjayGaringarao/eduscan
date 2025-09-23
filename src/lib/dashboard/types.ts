export type RealtimeUserStatus = {
  totalUser: number;
  presentUser: number;
  totalEmployee: number;
  totalStudent: number;
  presentStudent: number;
  presentEmployee: number;
};

export type ComparisonMode =
  | "EMPLOYEE_VS_STUDENT"
  | "MALE_VS_FEMALE"
  | "AGE_GROUPS";

export type ComparisonValue = {
  name: string;
  value: number;
  color: string;
};

export type UserSet = "PRESENT" | "TOTAL";

export type AttendancePoint = {
  hour: string;
  timein: number;
  timeout: number;
  occupancy: number; // Show occupancy per bucket
};

export type AttendancePeriod = "04:00-19:00" | "00:00-23:59"; // deprecated for range mode
export type AttendanceChartInterval =
  | "5 minutes"
  | "10 minutes"
  | "15 minutes"
  | "30 minutes"
  | "45 minutes"
  | "1 hour"
  | "2 hours"
  | "4 hours"
  | "6 hours"
  | "8 hours"
  | "12 hours";
export type UserRole = "ALL" | "STUDENT" | "EMPLOYEE";
