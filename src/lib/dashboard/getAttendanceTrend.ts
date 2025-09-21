"use server";

import { AttendanceLog } from "@/models";
import { TrendPoint } from "@/types";
import { createClient } from "@/utils/supabase/server";

export const getAttendanceTrend = async (
  date: Date,
  startTime: string,
  endTime: string
): Promise<{ trend: TrendPoint[]; error?: string }> => {
  const supabase = await createClient();
  const _date = date.toISOString().split("T")[0];

  // Total registered users
  const { count: totalUsers, error: totalUserError } = await supabase
    .from("user")
    .select("user_id", { count: "exact", head: true });

  if (totalUserError) return { trend: [], error: totalUserError.message };

  // Fetch attendance logs for that date and time range
  const { data: logs, error: logError } = await supabase
    .from("attendance_log")
    .select("log_id, user_id, action, timestamp")
    .gte("timestamp", `${_date}T${startTime}`)
    .lt("timestamp", `${_date}T${endTime}`)
    .order("timestamp", { ascending: true });

  if (logError) return { trend: [], error: logError.message };

  // Bucket into hours and calculate percentages
  const buckets: Record<number, Set<string>> = {};
  logs?.forEach((log: AttendanceLog) => {
    const hour = new Date(log.timestamp).getHours();
    if (!buckets[hour]) buckets[hour] = new Set();
    if (log.action === "TIME_IN") buckets[hour].add(log.user_id!);
    if (log.action === "TIME_OUT") buckets[hour].delete(log.user_id!);
  });

  // Helper to convert 24h -> 12h format
  const formatHour = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:00 ${suffix}`;
  };

  // Build trend only for hours within range
  const startHour = parseInt(startTime.split(":")[0], 10);
  const endHour = parseInt(endTime.split(":")[0], 10);

  const trend = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const h = startHour + i;
    return {
      hour: formatHour(h),
      percentage: totalUsers ? ((buckets[h]?.size ?? 0) / totalUsers) * 100 : 0,
    };
  });

  return { trend };
};
