import {
  PersonalFormProp,
  FormErrorProp,
  OrganizationalProp,
  GuardianProp,
} from "./type";
import { regex } from "@/constants/regex";

export const validatPersonalForm = (
  form: PersonalFormProp
): FormErrorProp | null => {
  if (!regex.name.test(form.first_name)) {
    return {
      type: "personal.first_name",
      message: "* A valid first name is required.",
    };
  }

  if (form.middle_name && !regex.name.test(form.middle_name)) {
    return {
      type: "personal.middle_name",
      message: "* Middle name must be valid if provided.",
    };
  }

  if (!regex.name.test(form.last_name)) {
    return {
      type: "personal.last_name",
      message: "* A valid last name is required.",
    };
  }

  if (!form.birth_date) {
    return {
      type: "personal.birthday",
      message: "* Date of Birth is required.",
    };
  }

  if (form.sex.length === 0) {
    return { type: "personal.sex", message: "* Biological sex is required." };
  }

  if (!regex.address.test(form.address)) {
    return {
      type: "personal.address",
      message: "* A valid residential address is required.",
    };
  }

  return null;
};

export const validateOrganizationalForm = (
  form: OrganizationalProp
): FormErrorProp | null => {
  if (!form.user_type) {
    return {
      type: "organizational.user_type",
      message: "* User type is required.",
    };
  }

  if (form.user_type === "STUDENT" && !regex.studentNumber.test(form.user_id)) {
    return {
      type: "organizational.user_id",
      message: "* A valid student number is required.",
    };
  }

  if (
    form.user_type === "EMPLOYEE" &&
    !regex.employeeNumber.test(form.user_id)
  ) {
    return {
      type: "organizational.user_id",
      message: "* A valid employee number is required.",
    };
  }

  if (form.user_type === "STUDENT") {
    if (!form.student_department) {
      return {
        type: "organizational.student_department",
        message: "* Please select a department.",
      };
    }
    if (!form.student_program) {
      return {
        type: "organizational.student_program",
        message: "* Please select a program.",
      };
    }
  }

  if (form.user_type === "EMPLOYEE") {
    if (!regex.mobile.test(form.employee_contact_number)) {
      return {
        type: "organizational.employee_contact_number",
        message: "* A valid Philippine Mobile Number is required.",
      };
    }
    if (!form.employee_type) {
      return {
        type: "organizational.employee_type",
        message: "* Please select employee type.",
      };
    }
    if (!form.employee_division) {
      return {
        type: "organizational.employee_division",
        message: "* Please select a division.",
      };
    }
    if (!form.employee_title) {
      return {
        type: "organizational.employee_title",
        message: "* Please select a title.",
      };
    }
  }

  return null;
};

export const validateGuardianForm = (
  form: GuardianProp
): FormErrorProp | null => {
  if (!regex.name.test(form.first_name)) {
    return {
      type: "guardian.first_name",
      message: "* A valid first name is required.",
    };
  }

  if (form.middle_name && !regex.name.test(form.middle_name)) {
    return {
      type: "guardian.middle_name",
      message: "* Middle name must be valid if provided.",
    };
  }

  if (!regex.name.test(form.last_name)) {
    return {
      type: "guardian.last_name",
      message: "* A valid last name is required.",
    };
  }

  if (!form.sex) {
    return { type: "guardian.sex", message: "* Biological sex is required." };
  }

  if (!regex.address.test(form.address)) {
    return {
      type: "guardian.address",
      message: "* A valid residential address is required.",
    };
  }

  if (!regex.mobile.test(form.contact_number)) {
    return {
      type: "guardian.contact_number",
      message: "* A valid Philippine Mobile Number is required.",
    };
  }

  return null;
};
