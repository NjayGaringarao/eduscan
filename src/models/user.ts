import { SmsReceiver } from "./smsReciever";
import { Student } from "./student";
import { Employee } from "./employee";

export type User = {
  user_id: string;
  name: string;
  picture_id?: string;
  student?: Student | null;
  employee?: Employee | null;
};

export type ExtendedUser = User & {
  birth_date?: Date;
  contact_number?: string;
  sex: "MALE" | "FEMALE";
  address?: string;
  sms_reciever?: SmsReceiver;
  facial_encoding?: number[];
};

export type AuthUser = User & {
  facial_encoding?: number[];
};
