import { DTRRow, UserAttendanceShift } from "@/types";
import { formatInTimeZone } from "date-fns-tz";
import { isSameDay } from "date-fns";

const TIMEZONE = "Asia/Manila";

export interface DTRResult {
  rows: DTRRow[];
  grandTotal: string; // formatted "Xh Ym"
}

function formatTime(date: Date | null): string | undefined {
  if (!date) return undefined;
  return formatInTimeZone(date, TIMEZONE, "hh:mm a");
}

/** Convert decimal hours into "Xh Ym" */
function formatHours(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function convertToDTRRows(data: UserAttendanceShift[]): DTRResult {
  const dayMap: Record<string, { row: DTRRow; totalHours: number }> = {};
  let grandTotal = 0;

  data.forEach((shift) => {
    if (!shift.time_in && !shift.time_out) return;

    const timeIn = shift.time_in ? new Date(shift.time_in) : null;
    const timeOut = shift.time_out ? new Date(shift.time_out) : null;

    if (timeIn && timeOut && !isSameDay(timeIn, timeOut)) {
      // Overnight shift split
      const firstDay = formatInTimeZone(timeIn, TIMEZONE, "yyyy-MM-dd");
      const secondDay = formatInTimeZone(timeOut, TIMEZONE, "yyyy-MM-dd");

      // Day 1: PM arrival
      if (!dayMap[firstDay])
        dayMap[firstDay] = { row: { date: firstDay }, totalHours: 0 };
      dayMap[firstDay].row.pmArrival =
        dayMap[firstDay].row.pmArrival ?? formatTime(timeIn);

      // Day 2: AM departure + hours
      if (!dayMap[secondDay])
        dayMap[secondDay] = { row: { date: secondDay }, totalHours: 0 };
      dayMap[secondDay].row.amDeparture =
        dayMap[secondDay].row.amDeparture ?? formatTime(timeOut);
      dayMap[secondDay].totalHours += shift.total_hours ?? 0;

      grandTotal += shift.total_hours ?? 0;
    } else {
      // Normal same-day shift
      const workDate = shift.date[0];
      if (!dayMap[workDate])
        dayMap[workDate] = { row: { date: workDate }, totalHours: 0 };

      if (timeIn) {
        const hour = timeIn.getHours();
        if (hour < 12) {
          dayMap[workDate].row.amArrival =
            dayMap[workDate].row.amArrival ?? formatTime(timeIn);
        } else {
          dayMap[workDate].row.pmArrival =
            dayMap[workDate].row.pmArrival ?? formatTime(timeIn);
        }
      }

      if (timeOut) {
        const hour = timeOut.getHours();
        if (hour < 12) {
          dayMap[workDate].row.amDeparture =
            dayMap[workDate].row.amDeparture ?? formatTime(timeOut);
        } else {
          dayMap[workDate].row.pmDeparture =
            dayMap[workDate].row.pmDeparture ?? formatTime(timeOut);
        }
      }

      dayMap[workDate].totalHours += shift.total_hours ?? 0;
      grandTotal += shift.total_hours ?? 0;
    }
  });

  // Finalize rows: convert totals to "Xh Ym"
  const rows = Object.values(dayMap)
    .map(({ row, totalHours }) => ({
      ...row,
      hoursWorked: totalHours > 0 ? formatHours(totalHours) : undefined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { rows, grandTotal: formatHours(grandTotal) };
}
