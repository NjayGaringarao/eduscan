export interface IUserSearch {
  name?: string;
  sortAsc?: boolean;
  role?: string;
  studentDept?: string;
  studentProgram?: string;
  employeeType?: string;
  employeeDivision?: string;
  employeePosition?: string;
}

export interface IUserApplicationSearch extends IUserSearch {
  sortAscCreatedAt: boolean;
}

export interface ICreateUserApplication {
  user: {
    name: string;
    sex: string;
    birth_date: string;
    address: string;
    contact_number: string;
  };
  organizational: {
    user_id: string;
    role: string;
    student_department: string;
    student_program: string;
    employee_type: string;
    employee_division: string;
    employee_position: string;
  };
  updateReciever: {
    name: string;
    sex: string;
    address: string;
    contact_number: string;
  };
  captchaToken: string;
}

export interface ICreateUser {
  user: {
    name: string;
    sex: string;
    birth_date: string;
    address: string;
    contact_number: string;
  };
  organizational: {
    user_id: string;
    role: string;
    student_department: string;
    student_program: string;
    employee_type: string;
    employee_division: string;
    employee_position: string;
  };
  updateReciever: {
    name: string;
    sex: string;
    address: string;
    contact_number: string;
  };
  facialEncoding: number[] | null;
}
