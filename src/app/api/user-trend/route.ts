import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AttendanceLog } from "@/models";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // yyyy-mm-dd
  const supabase = await createClient();

  // Total registered users
  const { count: totalUsers } = await supabase
    .from("user")
    .select("user_id", { count: "exact", head: true });

  // Fetch attendance logs for that date
  const { data: logs } = await supabase
    .from("attendance_log")
    .select("log_id, user_id, action, timestamp")
    .gte("timestamp", `${date}T00:00:00`)
    .lt("timestamp", `${date}T23:59:59`)
    .order("timestamp", { ascending: true });

  // Bucket into hours and calculate percentages
  const buckets: Record<number, Set<string>> = {};
  logs?.forEach((log: AttendanceLog) => {
    const hour = new Date(log.timestamp).getHours();
    if (!buckets[hour]) buckets[hour] = new Set();
    if (log.action === "TIME_IN") buckets[hour].add(log.user_id!);
    if (log.action === "TIME_OUT") buckets[hour].delete(log.user_id!);
  });

  const trend = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    percentage: totalUsers ? ((buckets[h]?.size ?? 0) / totalUsers) * 100 : 0,
  }));

  return NextResponse.json(trend);
}
