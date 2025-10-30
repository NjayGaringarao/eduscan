"use server";

import { ExtendedUser } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const get = async (
  user_id: string
): Promise<{ user: ExtendedUser | null; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user")
      .select(
        `
          id,
          first_name,
          middle_name,
          last_name,
          picture_id,
          sex,
          birth_date,
          address,
          facial_encoding,
          schedule_id,
          student(department, program),
          guardian(first_name,middle_name,last_name,sex,address,contact_number),
          employee(type, division, title, contact_number)
        `
      )
      .eq("id", user_id)
      .single();

    if (error) throw new Error(error.message);

    return {
      user: {
        id: data.id,
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        sex: data.sex,
        birth_date: data.birth_date,
        picture_id: data.picture_id,
        address: data.address ?? undefined,
        schedule_id: data.schedule_id ?? undefined,
        student: Array.isArray(data.student)
          ? data.student[0] ?? null
          : data.student,
        guardian: Array.isArray(data.guardian)
          ? data.guardian[0] ?? null
          : data.guardian,
        employee: Array.isArray(data.employee)
          ? data.employee[0] ?? null
          : data.employee,
        facial_encoding: data.facial_encoding ?? undefined,
      },
    };
  } catch (error) {
    return { user: null, error: `FAILED TO GET USER INFORMATION: ${error}` };
  }
};
