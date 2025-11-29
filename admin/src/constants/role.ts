export type RoleOptionsType = {
  STUDENT: {
    departments: {
      CCIT: ["BSCS"];
      CTE: ["BSED", "BEED"];
      CBAPA: ["BSBA", "BSA"];
    };
  };
  EMPLOYEE: {
    types: {
      TEACHING: {
        division: {
          CCIT: ["INSTRUCTOR", "PROFESSOR", "PROGRAM CHAIR"];
          CTE: ["INSTRUCTOR", "PROFESSOR", "PROGRAM CHAIR"];
          CBAPA: ["INSTRUCTOR", "PROFESSOR", "PROGRAM CHAIR"];
        };
      };
      "NON-TEACHING": {
        division: {
          UTILITY: ["SGT", "MAINTENANCE", "JANITOR"];
          ADMIN: ["CAMPUS HEAD", "REGISTRAR", "COLLECTION", "ADMIN STAFF"];
        };
      };
    };
  };
};

export const roleOptions: RoleOptionsType = {
  STUDENT: {
    departments: {
      CCIT: ["BSCS"],
      CTE: ["BSED", "BEED"],
      CBAPA: ["BSBA", "BSA"],
    },
  },
  EMPLOYEE: {
    types: {
      TEACHING: {
        division: {
          CCIT: ["INSTRUCTOR", "PROFESSOR", "PROGRAM CHAIR"],
          CTE: ["INSTRUCTOR", "PROFESSOR", "PROGRAM CHAIR"],
          CBAPA: ["INSTRUCTOR", "PROFESSOR", "PROGRAM CHAIR"],
        },
      },
      "NON-TEACHING": {
        division: {
          UTILITY: ["SGT", "MAINTENANCE", "JANITOR"],
          ADMIN: ["CAMPUS HEAD", "REGISTRAR", "COLLECTION", "ADMIN STAFF"],
        },
      },
    },
  },
} as const;

export type StudentDepartment = keyof typeof roleOptions.STUDENT.departments;
export type StudentProgram =
  (typeof roleOptions.STUDENT.departments)[StudentDepartment][number];

export type TeachingStaff =
  keyof typeof roleOptions.EMPLOYEE.types.TEACHING.division;
export type NonTeachingStaff =
  keyof (typeof roleOptions.EMPLOYEE.types)["NON-TEACHING"]["division"];
export type EmployeeType = TeachingStaff | NonTeachingStaff;

export type TeachingTitle = "INSTRUCTOR" | "PROFESSOR" | "PROGRAM CHAIR";
export type NonTeachingTitle =
  | "GATE-SGT"
  | "MAINTENANCE"
  | "JANITOR"
  | "CAMPUS HEAD"
  | "REGISTRAR"
  | "COLLECTION"
  | "ADMIN STAFF";
