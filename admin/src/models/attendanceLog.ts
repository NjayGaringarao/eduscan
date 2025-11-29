export type AttendanceLog = {
  log_id: string;
  user_id?: string;
  timestamp: Date;
  action: string;
};
