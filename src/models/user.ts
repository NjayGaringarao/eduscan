import { Student } from "./student";
import { Employee } from "./employee";
import { Guardian } from "./guardian";

export type User = {
  user_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  picture_id?: string | null;
  student?: Student | null;
  guardian?: Guardian | null;
  employee?: Employee | null;
};

export type ExtendedUser = User & {
  birth_date?: Date;
  contact_number?: string;
  sex: "MALE" | "FEMALE";
  address?: string;
  facial_encoding?: number[];
};

export type AuthUser = User & {
  facial_encoding?: number[];
};
