"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getAll = async (
  user_id: string
): Promise<{ users: User[]; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user")
      .select(
        "user_id,first_name,middle_name,last_name,picture_id,sex,birth_date,address,facial_encoding,guardian(first_name,middle_name,last_name,sex,address,contact_number),student(department,program),employee(type,division,position,contact_number)"
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
        student: user.student.length ? user.student[0] : undefined,
        employee: user.employee.length ? user.employee[0] : undefined,
      };
      users.push(_user);
    });

    return { users };
  } catch (error) {
    return { users: [], error: `FAILED TO GET USER INFORMATION: ${error}` };
  }
};
