import { Student } from "./student";
import { Employee } from "./employee";
import { Guardian } from "./guardian";

export type User = {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  picture_id?: string | null;
  student?: Student | null;
  guardian?: Guardian | null;
  employee?: Employee | null;
  schedule_id?: string | null;
  has_facial_encoding?: boolean;
};

export type ExtendedUser = User & {
  birth_date: Date;
  sex: "MALE" | "FEMALE";
  address?: string;
  has_facial_encoding?: boolean;
};

export type UserType = "STUDENT" | "EMPLOYEE";
