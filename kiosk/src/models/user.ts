import { Student } from "./student";
import { Employee } from "./employee";
import { Guardian } from "./guardian";

export type User = {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  picture_id?: string;
  sex?: "MALE" | "FEMALE";
  birth_date?: Date;
  address?: string;
  facial_encoding?: number[];
  schedule_id?: number;
  student?: Student | null;
  employee?: Employee | null;
  guardian?: Guardian | null;
};
