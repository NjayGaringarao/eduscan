export type AttendanceLog = {
  id: number;
  user_id: string;
  timestamp: Date;
  action: "TIME_IN" | "TIME_OUT";
};
