"use server";

import { createClient } from "@/utils/supabase/server";
import { UserAttendanceShift, DTRResult } from "@/types";
import { convertToDTRResult } from "@/utils/dtr";

export const get = async (
  user_id: string,
  start: string,
  end: string
): Promise<{ dtr: UserAttendanceShift[]; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_attendance", {
      p_user_id: user_id,
      p_start: start,
      p_end: end,
    });

    if (error) {
      return { dtr: [], error: error.message };
    }

    const dtr: UserAttendanceShift[] = (data || []).map((row: any) => ({
      date: row.date_end ? [row.date_start, row.date_end] : [row.date_start],
      time_in: row.time_in ?? null,
      time_out: row.time_out ?? null,
      total_hours:
        row.total_hours !== null && row.total_hours !== undefined
          ? Number(row.total_hours)
          : null,
    }));

    return { dtr };
  } catch (err: any) {
    return { dtr: [], error: err.message ?? String(err) };
  }
};

export const getDTR = async (
  user_id: string,
  month: string // "YYYY-MM"
): Promise<{ dtr: DTRResult | null; error?: string }> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_dtr", {
      p_user_id: user_id,
      p_month: month,
    });

    if (error) {
      return { dtr: null, error: error.message };
    }

    const dtrResult = convertToDTRResult(data || [], month);
    return { dtr: dtrResult };
  } catch (err: any) {
    return { dtr: null, error: err.message ?? String(err) };
  }
};
