import { DTRRow, DTRSummary, DTRResult } from "@/types";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Manila";

interface RawDTRRow {
  day_number: number;
  am_arrival: string | null;
  am_departure: string | null;
  pm_arrival: string | null;
  pm_departure: string | null;
  am_undertime: number | null;
  pm_undertime: number | null;
  regular_days_schedule: string;
  saturdays_schedule: string;
}

function formatTime(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return formatInTimeZone(date, TIMEZONE, "hh:mm a");
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

    // Calculate undertime for this day (already computed in SQL)
    let dayUndertimeMinutes = 0;
    if (rawRow) {
      dayUndertimeMinutes +=
        (rawRow.am_undertime || 0) +
        (rawRow.pm_undertime || 0);
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
