export type FormErrorProp = {
  type: string | null;
  message: string | null;
};

export type PersonalFormProp = {
  first_name: string;
  middle_name?: string;
  last_name: string;
  sex: string;
  birth_date: string;
  address: string;
};

export type OrganizationalProp = {
  user_id: string;
  user_type: "EMPLOYEE" | "STUDENT";

  // STUDENT-only fields
  student_department: string;
  student_program: string;

  // EMPLOYEE-only fields
  employee_type: string;
  employee_division: string;
  employee_title: string;
  employee_contact_number: string;
};

export type GuardianProp = {
  first_name: string;
  middle_name?: string;
  last_name: string;
  sex: string;
  address: string;
  contact_number: string;
};
