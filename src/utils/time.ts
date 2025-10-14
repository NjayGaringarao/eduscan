import { formatInTimeZone } from "date-fns-tz";

export const getElapsedTime = (initialDate: Date, lastDate: Date) => {
  const start = new Date(initialDate).getTime();
  const end = new Date(lastDate).getTime();
  const diff = Math.floor((end - start) / 1000);

  const hours = String(Math.floor(diff / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
  const seconds = String(diff % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export const formatDateToMMDDYY = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2); // last 2 digits of year

  return `${mm}/${dd}/${yy}`;
};

// format time for Manila timezone
export const formatTime = (time: string | null) => {
  if (!time) return "—";
  return formatInTimeZone(time, "Asia/Manila", "hh:mm a");
};

/**
 * Formats a date range into a human-readable string.
 * - Same month/year: "Aug 25–26, 2025"
 * - Different month/year: "Aug 31, 2025 - Sep 1, 2025"
 * - Single date: "Aug 25, 2025"
 */
export const formatDateRangeToMMDDYY = (
  dates: [Date, Date | undefined] | [string, string?]
): string => {
  const [start, end] = dates;

  if (!start) return "";

  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end ? (end instanceof Date ? end : new Date(end)) : null;

  if (endDate) {
    // same month & year → "Aug 25–26, 2025"
    if (
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {
      return `${startDate.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })}-${endDate.getDate()}, ${endDate.getFullYear()}`;
    }

    // different month/year → "Aug 31, 2025 - Sep 1, 2025"
    return `${startDate.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} - ${endDate.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  // single date → "Aug 25, 2025"
  return startDate.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const convertTo12Hour = (time: string) => {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${m} ${ampm}`;
};
