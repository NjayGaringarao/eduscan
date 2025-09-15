"use server";

import { SystemLog, AttendanceLog } from "@/models";
import { getSystemLogs } from "./getSystemLogs";
import { getAttendanceLogs } from "./getAttendanceLogs";

interface GetAllLogsParams {
  fromDate: string;
  toDate: string;
  logType: string;
}

export const getAllLogs = async ({
  fromDate,
  toDate,
  logType,
}: GetAllLogsParams): Promise<{
  logs: (SystemLog | AttendanceLog)[];
  error?: string;
}> => {
  try {
    if (logType === "ATTENDANCE") {
      const { logs, error } = await getAttendanceLogs({ fromDate, toDate });
      return { logs, error };
    } else if (logType === "SYSTEM.AUTH" || logType === "SYSTEM.ADMIN") {
      const { logs, error } = await getSystemLogs({
        fromDate,
        toDate,
        type: logType,
      });
      return { logs, error };
    } else {
      // ALL - fetch both system and attendance logs
      const [systemLogsResult, attendanceLogsResult] = await Promise.all([
        getSystemLogs({ fromDate, toDate }),
        getAttendanceLogs({ fromDate, toDate }),
      ]);

      if (systemLogsResult.error) {
        return { logs: [], error: systemLogsResult.error };
      }

      if (attendanceLogsResult.error) {
        return { logs: [], error: attendanceLogsResult.error };
      }

      // Combine and sort by timestamp
      const allLogs = [
        ...systemLogsResult.logs,
        ...attendanceLogsResult.logs,
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return { logs: allLogs };
    }
  } catch (err: any) {
    return { logs: [], error: err.message };
  }
};
