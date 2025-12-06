"use server";

import { SessionLog } from "@/models";
import { createClient } from "@/utils/supabase/server";

export interface SessionLogFilter {
  date: string; // ISO date string (YYYY-MM-DD)
  userType?: string; // 'ALL', 'STUDENT', 'EMPLOYEE'
  studentDepartment?: string;
  studentProgram?: string;
  employeeType?: string;
  employeeDivision?: string;
  employeeTitle?: string;
}

export const getSessionLog = async (
  filter: SessionLogFilter
): Promise<{ sessions: SessionLog[]; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_session_log", {
      p_date: filter.date,
      p_user_type: filter.userType || "ALL",
      p_student_department: filter.studentDepartment || "ALL",
      p_student_program: filter.studentProgram || "ALL",
      p_employee_type: filter.employeeType || "ALL",
      p_employee_division: filter.employeeDivision || "ALL",
      p_employee_title: filter.employeeTitle || "ALL",
    });

    if (error) throw new Error(error.message);

    const sessions: SessionLog[] = (data ?? []).map((session: any) => ({
      session_id: session.session_id,
      user_id: session.user_id,
      full_name: session.full_name,
      time_in: session.time_in,
      time_out: session.time_out,
      is_active: session.is_active,
    }));

    return { sessions };
  } catch (error: any) {
    return {
      sessions: [],
      error: `FAILED TO GET SESSION LOG: ${error?.message || error}`,
    };
  }
};

