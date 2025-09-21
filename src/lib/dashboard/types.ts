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
