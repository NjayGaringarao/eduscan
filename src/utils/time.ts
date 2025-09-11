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

export function formatDateToMMDDYY(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2); // last 2 digits of year

  return `${mm}/${dd}/${yy}`;
}

// format time for Manila timezone
export const formatTime = (time: string | null) => {
  if (!time) return "—";
  return formatInTimeZone(time, "Asia/Manila", "hh:mm a");
};
