export type ActiveSession = {
  session_id: string;
  user_id: string;
  login_time: Date;
};

export type AttendanceLog = {
  log_id: string;
  user_id?: string;
  timestamp: Date;
  action: string;
};

export type Student = {
  department: string;
  program: string;
};

export type Employee = {
  type: string;
  division: string;
  position: string;
};

export type User = {
  user_id: string;
  name: string;
  picture_id?: string;
  student?: Student | null;
  employee?: Employee | null;
};
export type SmsReceiver = {
  name: string;
  sex: "MALE" | "FEMALE";
  address?: string;
  contact_number?: string;
};

export type ExtendedUser = User & {
  birth_date?: Date;
  contact_number?: string;
  sex: "MALE" | "FEMALE";
  birth_date?: Date;
  address?: string;
  sms_reciever?: SmsReceiver;
  facial_encoding?: number[];
};

export type AuthUser = User & {
  facial_encoding?: number[];
};

export type UserApplication = {
  id: string;
  user_id: string;
  name: string;
  student_department: string | null;
  student_program: string | null;
  employee_type: string | null;
  employee_division: string | null;
  employee_position: string | null;
  created_at?: Date;
};

export type ExtendedUserApplication = UserApplication & {
  sex: "MALE" | "FEMALE";
  birth_date?: Date;
  address: string;
  contact_number: string;
  update_reciever_name: string;
  update_reciever_sex: "MALE" | "FEMALE";
  update_reciever_address: string;
  update_reciever_contact_number: string;
};

export type Settings = {
  key: string;
  value: any;
};
