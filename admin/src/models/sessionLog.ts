export type SessionLog = {
  session_id: number;
  user_id: string;
  full_name: string;
  time_in: string; // ISO timestamp
  time_out: string | null; // ISO timestamp or null
  is_active: boolean;
};

