import { formatInTimeZone } from "date-fns-tz";
import { SessionLog } from "@/models";
import { generateHeader } from "./Header";

interface TemplateProps {
  sessions: SessionLog[];
  date: string;
  userType: string;
  studentDepartment?: string;
  studentProgram?: string;
  employeeType?: string;
  employeeDivision?: string;
  employeeTitle?: string;
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

const getUserTypeLabel = (userType: string) => {
  switch (userType) {
    case "STUDENT":
      return "Students";
    case "EMPLOYEE":
      return "Employees";
    default:
      return "All Users";
  }
};

const buildFilterInfo = (
  userType: string,
  studentDepartment?: string,
  studentProgram?: string,
  employeeType?: string,
  employeeDivision?: string,
  employeeTitle?: string
): string[] => {
  const filters: string[] = [];
  filters.push(`User Type: ${getUserTypeLabel(userType)}`);

  if (userType === "STUDENT") {
    if (studentDepartment && studentDepartment !== "ALL") {
      filters.push(`Department: ${studentDepartment}`);
    }
    if (studentProgram && studentProgram !== "ALL") {
      filters.push(`Program: ${studentProgram}`);
    }
  } else if (userType === "EMPLOYEE") {
    if (employeeType && employeeType !== "ALL") {
      filters.push(`Type: ${employeeType}`);
    }
    if (employeeDivision && employeeDivision !== "ALL") {
      filters.push(`Division: ${employeeDivision}`);
    }
    if (employeeTitle && employeeTitle !== "ALL") {
      filters.push(`Title: ${employeeTitle}`);
    }
  }

  return filters;
};

export const SessionLogPDF = ({
  sessions,
  date,
  userType,
  studentDepartment,
  studentProgram,
  employeeType,
  employeeDivision,
  employeeTitle,
  universityLogoDataUrl = "",
  eduscanLogoDataUrl = "",
}: TemplateProps): string => {
  const filterInfo = buildFilterInfo(
    userType,
    studentDepartment,
    studentProgram,
    employeeType,
    employeeDivision,
    employeeTitle
  );

  const tableRows =
    sessions.length > 0
      ? sessions
          .map((session) => {
            return `
            <tr class="text-[11px] border-b border-black">
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${
                session.user_id
              }</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${
                session.full_name
              }</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${formatTime(
                session.time_in
              )}</td>
              <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${formatTime(
                session.time_out
              )}</td>
              <td class="px-3 py-1 text-start text-black text-[11px] font-semibold">${
                session.is_active ? "ACTIVE" : "INACTIVE"
              }</td>
            </tr>
          `;
          })
          .join("")
      : `
        <tr class="text-[11px] border-b border-black">
          <td colspan="5" class="px-3 py-2 text-center text-black text-[11px]">
            No sessions recorded for the selected filters.
          </td>
        </tr>
      `;

  return `
    <div style="font-family: Arial, sans-serif;">
      ${
        universityLogoDataUrl && eduscanLogoDataUrl
          ? generateHeader(universityLogoDataUrl, eduscanLogoDataUrl)
          : ""
      }

      <div class="mb-6">
        <h1 class="text-[16px] font-bold text-center my-6">EDUSCAN SESSION LOG REPORT</h1>
        <div class="text-start text-[11px] text-black w-full flex flex-col items-start gap-1">
          <p class="text-black"><strong>Date:</strong> ${formatDateForDisplay(
            date
          )}</p>
          ${filterInfo
            .map((filter) => {
              const [key, ...valueParts] = filter.split(":");
              const value = valueParts.join(":").trim();
              return `<p class="text-black"><strong>${key}:</strong> ${value}</p>`;
            })
            .join("")}
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
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Status</th>
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

