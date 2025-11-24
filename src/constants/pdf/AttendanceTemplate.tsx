import { User } from "@/models";
import { UserAttendanceShift } from "@/types";
import { formatInTimeZone } from "date-fns-tz";
import { generateHeader } from "./Header";

interface TemplateProps {
  user: User;
  attendance: UserAttendanceShift[];
  fromDate: string;
  toDate: string;
  universityLogoDataUrl?: string;
  eduscanLogoDataUrl?: string;
}

export function AttendanceTemplate({
  user,
  attendance,
  fromDate,
  toDate,
  universityLogoDataUrl = "",
  eduscanLogoDataUrl = "",
}: TemplateProps): string {
  const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAttendanceDate = (dates: [string, string?]): string => {
    const [start, end] = dates;
    if (!start) return "";

    const startDate = new Date(start);
    const mm = String(startDate.getMonth() + 1).padStart(2, "0");
    const dd = String(startDate.getDate()).padStart(2, "0");
    const yy = String(startDate.getFullYear()).slice(-2);
    const startFormatted = `${mm}/${dd}/${yy}`;

    if (end) {
      const endDate = new Date(end);
      const endMm = String(endDate.getMonth() + 1).padStart(2, "0");
      const endDd = String(endDate.getDate()).padStart(2, "0");
      const endYy = String(endDate.getFullYear()).slice(-2);
      const endFormatted = `${endMm}/${endDd}/${endYy}`;
      return `${startFormatted} - ${endFormatted}`;
    }

    return startFormatted;
  };

  const formatTime = (time: string | null): string => {
    if (!time) return "—";
    return formatInTimeZone(time, "Asia/Manila", "hh:mm a");
  };

  const formatHoursToHHMM = (hours: number | null): string => {
    if (hours === null || hours === undefined) return "—";

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    return `${h}:${String(m).padStart(2, "0")}`;
  };

  const tableRows = attendance
    .map((record) => {
      const dateDisplay = formatAttendanceDate(record.date);
      const timeIn = formatTime(record.time_in);
      const timeOut = formatTime(record.time_out);
      const totalHours = formatHoursToHHMM(record.total_hours);

      return `
        <tr class="text-[11px] border-b border-black">
          <td class="py-1 text-center border-r border-black text-black text-[11px]">${dateDisplay}</td>
          <td class="py-1 text-center border-r border-black text-black text-[11px]">${timeIn}</td>
          <td class="py-1 text-center border-r border-black text-black text-[11px]">${timeOut}</td>
          <td class="py-1 text-center text-black text-[11px]">${totalHours}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif;">
      ${
        universityLogoDataUrl && eduscanLogoDataUrl
          ? generateHeader(universityLogoDataUrl, eduscanLogoDataUrl)
          : ""
      }
      
      <div class="mb-6">
        <h1 class="text-[16px] font-bold text-center my-6">EDUSCAN ATTENDANCE RECORD</h1>
        <div class="text-center text-[11px] text-black w-full flex flex-col items-start">
          <p class="text-black"><strong>Name:</strong> ${user.last_name}, ${
    user.first_name
  } ${user.middle_name ?? ""}</p>
          <p class="text-black"><strong>Period:</strong> ${formatDateForDisplay(
            fromDate
          )} - ${formatDateForDisplay(toDate)}</p>
        </div>
      </div>

      <table class="w-full border-collapse border border-black">
        <thead>
          <tr class="bg-gray-100 text-black text-[11px]">
            <th class="px-3 py-2 text-center font-semibold border border-black text-black text-[11px]">Date</th>
            <th class="px-3 py-2 text-center font-semibold border border-black text-black text-[11px]">Time In</th>
            <th class="px-3 py-2 text-center font-semibold border border-black text-black text-[11px]">Time Out</th>
            <th class="px-3 py-2 text-center font-semibold border border-black text-black text-[11px]">Duration (HH:MM)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="mt-6 text-[11px] text-black">
        <p><strong>Total Records:</strong> ${attendance.length}</p>
        <p class="italic">Generated on ${new Date().toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        )}</p>
      </div>
    </div>
  `;
}
