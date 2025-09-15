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

        const userId = isAttendanceLog(log) ? log.user_id : "N/A";
        const timestamp = formatDate(log.timestamp);
        const rowClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";

        return `
          <tr class="${rowClass}">
            <td class="border border-gray-300 px-3 py-2 text-sm">${type}</td>
            <td class="border border-gray-300 px-3 py-2 text-sm">${description}</td>
            <td class="border border-gray-300 px-3 py-2 text-sm">${userId}</td>
            <td class="border border-gray-300 px-3 py-2 text-sm">${timestamp}</td>
          </tr>
        `;
      })
      .join("");
  };

  return `
    <div class="w-full max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          System Logs Report
        </h1>
        <div class="text-sm text-gray-600 space-y-1">
          <p>
            <span class="font-semibold">Period:</span> ${fromDate} to ${toDate}
          </p>
          <p>
            <span class="font-semibold">Filter:</span> ${logType}
          </p>
          <p>
            <span class="font-semibold">Total Logs:</span> ${logs.length}
          </p>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                Type
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                Description/Action
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                User ID
              </th>
              <th class="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
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
      <div class="mt-8 text-center text-xs text-gray-500">
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
