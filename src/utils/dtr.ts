import { DTRRow, DTRSummary, DTRResult } from "@/types";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Manila";

interface RawDTRRow {
  day_number: number;
  am_arrival: string | null;
  am_departure: string | null;
  pm_arrival: string | null;
  pm_departure: string | null;
  am_undertime: string | null;
  pm_undertime: string | null;
  regular_days_schedule: string;
  saturdays_schedule: string;
}

function formatTime(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return formatInTimeZone(date, TIMEZONE, "hh:mm a");
}

/**
 * Parse PostgreSQL interval string to minutes
 * Examples: "00:30:00", "01:15:00", "120 minutes", "2 hours"
 */
function parseIntervalToMinutes(interval: string | null): number {
  if (!interval) return 0;

  // Handle "X minutes" format
  const minutesMatch = interval.match(/^(\d+)\s*minutes?$/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10);
  }

  // Handle "X hours" format
  const hoursMatch = interval.match(/^(\d+)\s*hours?$/);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 60;
  }

  // Handle "HH:MM:SS" format
  const timeMatch = interval.match(/^(\d+):(\d+):(\d+)$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    return hours * 60 + minutes;
  }

  // Handle "X days HH:MM:SS" format
  const daysMatch = interval.match(/^(\d+)\s*days?\s+(\d+):(\d+):(\d+)$/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const hours = parseInt(daysMatch[2], 10);
    const minutes = parseInt(daysMatch[3], 10);
    return days * 24 * 60 + hours * 60 + minutes;
  }

  return 0;
}

/**
 * Get day of week for a given day number and month
 * Returns 0-6 (Sunday=0, Monday=1, ..., Saturday=6)
 */
function getDayOfWeek(year: number, month: number, dayNumber: number): number {
  const date = new Date(year, month - 1, dayNumber);
  return date.getDay();
}

/**
 * Get number of days in a given month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Convert raw RPC data to DTR format with summary
 */
export function convertToDTRResult(
  data: RawDTRRow[],
  month: string
): DTRResult {
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const daysInMonth = getDaysInMonth(year, monthNum);

  // Create a map of day_number to row data
  const dataMap = new Map<number, RawDTRRow>();
  data.forEach((row) => {
    dataMap.set(row.day_number, row);
  });

  // Extract schedule information from the first row (they'll be the same for all rows)
  const firstRow = data.length > 0 ? data[0] : null;
  const regularDaysSchedule = firstRow?.regular_days_schedule || "";
  const saturdaysSchedule = firstRow?.saturdays_schedule || "";

  // Generate all days in the month
  const rows: DTRRow[] = [];
  let totalUndertimeMinutes = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const rawRow = dataMap.get(day);

    // Calculate undertime for this day
    let dayUndertimeMinutes = 0;
    if (rawRow) {
      dayUndertimeMinutes +=
        parseIntervalToMinutes(rawRow.am_undertime) +
        parseIntervalToMinutes(rawRow.pm_undertime);
      totalUndertimeMinutes += dayUndertimeMinutes;
    }

    const undertimeHours = Math.floor(dayUndertimeMinutes / 60);
    const undertimeMinutes = dayUndertimeMinutes % 60;

    rows.push({
      dayNumber: day,
      amArrival: formatTime(rawRow?.am_arrival ?? null),
      amDeparture: formatTime(rawRow?.am_departure ?? null),
      pmArrival: formatTime(rawRow?.pm_arrival ?? null),
      pmDeparture: formatTime(rawRow?.pm_departure ?? null),
      undertimeHours:
        undertimeHours > 0 || undertimeMinutes > 0 ? undertimeHours : undefined,
      undertimeMinutes:
        undertimeHours > 0 || undertimeMinutes > 0
          ? undertimeMinutes
          : undefined,
    });
  }

  const totalUndertimeHours = Math.floor(totalUndertimeMinutes / 60);
  const totalUndertimeMinutesRemainder = totalUndertimeMinutes % 60;

  const summary: DTRSummary = {
    regularDaysSchedule,
    saturdaysSchedule,
    totalUndertimeHours,
    totalUndertimeMinutes: totalUndertimeMinutesRemainder,
  };

  return {
    rows,
    summary,
    month,
    year,
  };
}
