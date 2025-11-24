import { SystemLog, AttendanceLog } from "@/models";
import { generateHeader } from "./Header";

interface SystemLogsTemplateProps {
  logs: (SystemLog | AttendanceLog)[];
  fromDate: string;
  toDate: string;
  logType: string;
  universityLogoDataUrl?: string;
  eduscanLogoDataUrl?: string;
}

const SystemLogsTemplate = ({
  logs,
  fromDate,
  toDate,
  logType,
  universityLogoDataUrl = "",
  eduscanLogoDataUrl = "",
}: SystemLogsTemplateProps): string => {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d
      .toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  };

  const isSystemLog = (log: SystemLog | AttendanceLog): log is SystemLog => {
    return "type" in log && "description" in log;
  };

  const isAttendanceLog = (
    log: SystemLog | AttendanceLog
  ): log is AttendanceLog => {
    return "action" in log && "user_id" in log;
  };

  const generateLogRows = () => {
    return logs
      .map((log) => {
        const type = isSystemLog(log)
          ? log.type
          : isAttendanceLog(log)
          ? log.action
          : "Unknown";

        const description = isSystemLog(log)
          ? log.description
          : isAttendanceLog(log)
          ? log.action
          : "N/A";

        const timestamp = formatDate(log.timestamp);

        return `
          <tr class="text-[11px] border-b border-black">
            <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${timestamp}</td>
            <td class="px-3 py-1 text-start border-r border-black text-black text-[11px]">${type}</td>
            <td class="px-3 py-1 text-start text-black text-[11px]">${description}</td>
          </tr>
        `;
      })
      .join("");
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "All Dates";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return `
    <div style="font-family: Arial, sans-serif;">
      ${
        universityLogoDataUrl && eduscanLogoDataUrl
          ? generateHeader(universityLogoDataUrl, eduscanLogoDataUrl)
          : ""
      }
      
      <div class="mb-6">
        <h1 class="text-[16px] font-bold text-center my-6">EDUSCAN SYSTEM LOGS REPORT</h1>
        <div class="text-start text-[11px] text-black w-full flex flex-col items-start">
          <p class="text-black"><strong>Period:</strong> ${
            fromDate && toDate
              ? `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(
                  toDate
                )}`
              : "All Dates"
          }</p>
          <p class="text-black"><strong>Filter:</strong> ${logType}</p>
          <p class="text-black"><strong>Total Logs:</strong> ${logs.length}</p>
        </div>
      </div>

      <table class="w-full border-collapse border border-black">
        <thead>
          <tr class="bg-gray-100 text-black text-[11px]">
          <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Timestamp</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Type</th>
            <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Description/Action</th>
          </tr>
        </thead>
        <tbody>
          ${generateLogRows()}
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

export default SystemLogsTemplate;
