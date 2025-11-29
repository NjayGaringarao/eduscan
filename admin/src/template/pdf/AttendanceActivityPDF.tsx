import { formatInTimeZone } from "date-fns-tz";
import { AttendanceActivitySession } from "@/lib/dashboard/getAttendanceActivitySessions";
import { UserRole } from "@/lib/dashboard/types";
import { generateHeader } from "./Header";

interface TemplateProps {
  sessions: AttendanceActivitySession[];
  date: string;
  role: UserRole;
  universityLogoDataUrl?: string;
  eduscanLogoDataUrl?: string;
}

const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value: string | null) => {
  if (!value) return "—";
  return formatInTimeZone(value, "Asia/Manila", "hh:mm a");
};

const formatDuration = (minutes: number | null) => {
  if (minutes === null || Number.isNaN(minutes)) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.max(minutes % 60, 0);
  return `${h}:${String(m).padStart(2, "0")}`;
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case "EMPLOYEE":
      return "Employees";
    case "STUDENT":
      return "Students";
    default:
      return "All Users";
  }
};

export const AttendanceActivityPDF = ({
  sessions,
  date,
  role,
  universityLogoDataUrl = "",
  eduscanLogoDataUrl = "",
}: TemplateProps): string => {
  const isAllRole = role === "ALL";
  const roleLabel = getRoleLabel(role);

  const tableRows =
    sessions.length > 0
      ? sessions
          .map((session) => {
            const extra = isAllRole
              ? session.role
              : session.titleProgram || "—";

            return `
            <tr class="text-[11px] border-b border-black">
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${
                session.userId
              }</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${
                session.fullName
              }</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${formatTime(
                session.timeIn
              )}</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${formatTime(
                session.timeOut
              )}</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${formatDuration(
                session.durationMinutes
              )}</td>
              <td class="px-3 py-1 text-start text-black text-[11px]">${extra}</td>
            </tr>
          `;
          })
          .join("")
      : `
        <tr class="text-[11px] border-b border-black">
          <td colspan="6" class="px-3 py-2 text-center text-black text-[11px]">
            No sessions recorded for the selected filters.
          </td>
        </tr>
      `;

  const columnLabel = isAllRole ? "Role" : "Title / Program";

  return `
    <div style="font-family: Arial, sans-serif;">
      ${
        universityLogoDataUrl && eduscanLogoDataUrl
          ? generateHeader(universityLogoDataUrl, eduscanLogoDataUrl)
          : ""
      }

      <div class="mb-6">
        <h1 class="text-[16px] font-bold text-center my-6">EDUSCAN ATTENDANCE ACTIVITY REPORT</h1>
        <div class="text-start text-[11px] text-black w-full flex flex-col items-start gap-1">
          <p class="text-black"><strong>Date:</strong> ${formatDateForDisplay(
            date
          )}</p>
          <p class="text-black"><strong>Role:</strong> ${roleLabel}</p>
          <p class="text-black"><strong>Total Sessions:</strong> ${
            sessions.length
          }</p>
        </div>
      </div>

      <table class="w-full border-collapse border border-black">
        <thead>
          <tr class="bg-gray-100 text-black text-[11px]">
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">User ID</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Name</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Time In</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Time Out</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Duration (HH:MM)</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">${columnLabel}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="mt-6 text-[11px] text-black">
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
};
