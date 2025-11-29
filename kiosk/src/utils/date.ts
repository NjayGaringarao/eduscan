export function formatDate(date: Date | string): string {
  // Convert string to Date if needed
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Validate the date
  if (!dateObj || isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short", // e.g., "May"
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const parts = dateObj.toLocaleString("en-US", options).split(", ");
  const [monthDay, year, time] = parts;

  // Add safety check for undefined time
  if (!time) {
    console.error("Unexpected date format:", parts);
    return "Invalid Date Format";
  }

  const today = new Date();
  const isToday =
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();

  if (isToday) {
    return time.replace(" ", "");
  }

  return `${monthDay}, ${year} at ${time.replace(" ", "")}`;
}
