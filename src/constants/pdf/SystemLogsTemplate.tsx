import { SystemLog, AttendanceLog } from "@/models";

interface SystemLogsTemplateProps {
  logs: (SystemLog | AttendanceLog)[];
  fromDate: string;
  toDate: string;
  logType: string;
}

const SystemLogsTemplate = ({
  logs,
  fromDate,
  toDate,
  logType,
}: SystemLogsTemplateProps): string => {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      .map((log, index) => {
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
        const rowClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";

        return `
          <tr class="${rowClass} text-[11px]">
            <td class="border border-gray-300 px-3">${type}</td>
            <td class="border border-gray-300 px-3">${description}</td>
            <td class="border border-gray-300 px-3">${timestamp}</td>
          </tr>
        `;
      })
      .join("");
  };

  return `
    <div class="w-full max-w-4xl mx-auto">
      <!-- Header -->
      
        <h1 class="text-center text-[18px] font-bold text-black mb-8">
          System Logs Report
        </h1>
       
        
        <!-- Report Metadata -->
        <div class="text-[12px] text-black mb-6">
          <p>
            <span class="font-semibold">Period:</span> ${
              fromDate && toDate
                ? `${fromDate} to ${toDate}`
                : "All Dates"
            }
          </p>
          <p>
            <span class="font-semibold">Filter:</span> ${logType}
          </p>
          <p>
            <span class="font-semibold">Total Logs:</span> ${logs.length}
          </p>
        </div>

      <!-- Logs Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100 text-[11px] font-semibold text-gray-700">
              <th class="border border-gray-300 px-3 py-2 text-left ">
                Type
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left">
                Description/Action
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            ${generateLogRows()}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-[10px] text-gray-500">
        <p>
          Generated on ${new Date().toLocaleDateString(
            "en-US"
          )} at ${new Date().toLocaleTimeString("en-US")}
        </p>
      </div>
    </div>
  `;
};

export default SystemLogsTemplate;
