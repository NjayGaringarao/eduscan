import {
  FormErrorProp,
  PersonalFormProp,
  OrganizationalProp,
  GuardianProp,
} from "./type";

export const defaultPersonalInfo: PersonalFormProp = {
  first_name: "",
  last_name: "",
  sex: "",
  birth_date: "",
  address: "",
};

export const defaultFormError: FormErrorProp = {
  type: null,
  message: null,
};

export const defaultOrganizational: OrganizationalProp = {
  user_id: "",
  user_type: "STUDENT",

  student_department: "",
  student_program: "",

  employee_type: "",
  employee_division: "",
  employee_title: "",
  employee_contact_number: "",
};

export const defaultGuardian: GuardianProp = {
  first_name: "",
  middle_name: "",
  last_name: "",
  sex: "",
  address: "",
  contact_number: "",
};
