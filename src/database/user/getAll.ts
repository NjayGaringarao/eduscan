"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getAll = async (
  userType?: string
): Promise<{ users: User[]; error?: string }> => {
  try {
    const supabase = await createClient();

    if (userType === "STUDENT" || "EMPLOYEE") {
    }
    const { data, error } = await supabase
      .from("user")
      .select(
        `
          user_id,
          first_name,
          middle_name,
          last_name,
          picture_id,
          student${userType === "STUDENT" ? "!inner" : ""}(department, program),
          employee${
            userType === "EMPLOYEE" ? "!inner" : ""
          }(type, division, position, contact_number)
        `
      )
      .range(0, 3000);

    if (error) throw new Error(error.message);

    const users: User[] = [];
    data.forEach((user) => {
      const _user: User = {
        user_id: user.user_id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        picture_id: user.picture_id,
        student: Array.isArray(user.student)
          ? user.student[0] ?? null
          : user.student,
        employee: Array.isArray(user.employee)
          ? user.employee[0] ?? null
          : user.employee,
      };
      users.push(_user);
    });

    return { users };
  } catch (error) {
    return { users: [], error: `FAILED TO GET USER INFORMATION: ${error}` };
  }
};
