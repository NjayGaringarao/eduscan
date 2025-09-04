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
