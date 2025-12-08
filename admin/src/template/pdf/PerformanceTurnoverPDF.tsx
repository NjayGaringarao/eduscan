import { PerformanceTurnoverSnapshot } from "@/types";
import { generateHeader } from "./Header";
import { AtRiskUserDetail } from "@/lib/performance/getAtRiskUserDetails";

interface TemplateProps {
  snapshot: PerformanceTurnoverSnapshot | null;
  atRiskUsers: AtRiskUserDetail[];
  date: string;
  role: "ALL" | "STUDENT" | "EMPLOYEE";
  universityLogoDataUrl?: string;
  eduscanLogoDataUrl?: string;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getRoleLabel = (role: string) => {
  if (role === "EMPLOYEE") return "Employees";
  if (role === "STUDENT") return "Students";
  return "All Users";
};

const formatPunctuality = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "No Data";
  const absValue = Math.abs(value);
  if (value < -15) return `${Math.round(absValue)} Minutes Late`;
  if (value > 15) return `${Math.round(absValue)} Minutes Early`;
  return "On Time";
};

const formatTimeBalance = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "No Data";
  const absValue = Math.abs(value);
  const hours = Math.floor(absValue / 60);
  const minutes = Math.round(absValue % 60);
  if (value < 0) {
    return hours > 0
      ? `${hours}h ${minutes}m Undertime`
      : `${minutes}m Undertime`;
  }
  if (value > 0) {
    return hours > 0
      ? `${hours}h ${minutes}m Overtime`
      : `${minutes}m Overtime`;
  }
  return "Balanced";
};

const formatAttendanceRate = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "No Data";
  return `${value.toFixed(1)}%`;
};

const getPunctualityClassification = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "No Data";
  if (value < -15) return "Late";
  if (value > 15) return "Early";
  return "Normal";
};

const getTimeBalanceClassification = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "No Data";
  if (value < 0) return "Undertime";
  if (value > 0) return "Overtime";
  return "Balanced";
};

// Status interpretation helpers (matching UI logic)
const getPunctualityStatus = (
  value: number | null
): "late" | "normal" | "early" | null => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value < -15) return "late";
  if (value > 15) return "early";
  return "normal";
};

const getAttendanceRateStatus = (
  value: number | null
): "at_risk" | "normal" | "stable" | null => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value < 70) return "at_risk";
  if (value > 90) return "stable";
  return "normal";
};

const getTimeBalanceStatus = (
  value: number | null
): "undertime" | "overtime" | "balanced" | null => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value < 0) return "undertime";
  if (value > 0) return "overtime";
  return "balanced";
};

// Format percentage helper
const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value))
    return "N/A";
  return `${value.toFixed(1)}%`;
};

// Get status label for display
const getStatusLabel = (
  status:
    | "late"
    | "normal"
    | "early"
    | "at_risk"
    | "stable"
    | "undertime"
    | "overtime"
    | "balanced"
    | null
): string => {
  if (status === null) return "No Data";
  const labels: Record<string, string> = {
    late: "Late",
    early: "Early",
    normal: "Normal",
    at_risk: "At Risk",
    stable: "Stable",
    undertime: "Undertime",
    overtime: "Overtime",
    balanced: "Balanced",
  };
  return labels[status] || "Normal";
};

// Get status background color with opacity for PDF cards
const getStatusBackgroundColor = (
  status:
    | "late"
    | "normal"
    | "early"
    | "at_risk"
    | "stable"
    | "undertime"
    | "overtime"
    | "balanced"
    | null
): string => {
  if (status === null) return "background-color: rgba(107, 114, 128, 0.1);"; // gray with opacity
  if (status === "late" || status === "at_risk" || status === "undertime")
    return "background-color: rgba(239, 68, 68, 0.1);"; // red with opacity
  if (status === "early" || status === "stable" || status === "overtime")
    return "background-color: rgba(34, 197, 94, 0.1);"; // green with opacity
  return "background-color: rgba(59, 130, 246, 0.1);"; // blue with opacity
};

export const PerformanceTurnoverPDF = ({
  snapshot,
  atRiskUsers,
  date,
  role,
  universityLogoDataUrl = "",
  eduscanLogoDataUrl = "",
}: TemplateProps): string => {
  const punctualityValue = snapshot?.average_punctuality ?? null;
  const punctualityLabel = formatPunctuality(punctualityValue);
  const punctualityClassification =
    getPunctualityClassification(punctualityValue);

  const timeBalanceValue = snapshot?.average_time_balance ?? null;
  const timeBalanceLabel = formatTimeBalance(timeBalanceValue);
  const timeBalanceClassification =
    getTimeBalanceClassification(timeBalanceValue);

  const roleLabel = getRoleLabel(role);
  const totalUsers = snapshot?.total_users ?? 0;
  const atRiskCount = snapshot?.at_risk_count ?? atRiskUsers.length;

  // Table columns matching UI: Forecast, User ID, Full Name, Attendance Rate, Confidence
  const columnHeaders = `
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Probability of Presence</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Forecaster Confidence</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">User ID</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Full Name</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Attendance Rate</th>
    `;

  const atRiskRows =
    atRiskUsers.length > 0
      ? atRiskUsers
          .map((user) => {
            const forecastProb = user.attendanceForecastProbability;
            const forecastPercentage =
              forecastProb !== null && forecastProb !== undefined
                ? (forecastProb * 100).toFixed(1)
                : "N/A";
            const forecastColor =
              forecastProb !== null &&
              forecastProb !== undefined &&
              forecastProb < 0.5
                ? "color: #ef4444;" // red
                : "color: #22c55e;"; // green

            const attendanceRate = formatPercentage(user.attendanceRateValue);
            const confidence = formatPercentage(
              user.attendanceForecastConfidence
            );

            return `
              <tr class="text-[11px] border-b border-black">
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]" style="${forecastColor}">${forecastPercentage}%</td>
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]">${confidence}</td>
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]">${user.userId}</td>
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]">${user.fullName}</td>
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]">${attendanceRate}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr class="text-[11px] border-b border-black">
            <td colspan="5" class="px-3 py-2 text-center text-black text-[11px]">
              No at-risk users for the selected filters.
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
        <h1 class="text-[16px] font-bold text-center my-6">EDUSCAN PERFORMANCE TURNOVER REPORT</h1>
        <div class="text-start text-[11px] text-black w-full flex flex-col items-start gap-1">
          <p><strong>Date:</strong> ${formatDate(date)}</p>
          <p><strong>Role:</strong> ${roleLabel}</p>
          <p><strong>Total Users:</strong> ${totalUsers}</p>
          <p><strong>At-Risk Users:</strong> ${atRiskCount}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- Average Attendance Rate Card -->
        <div class="border border-black rounded-md p-4" style="${
          snapshot?.attendance_rate !== null &&
          snapshot?.attendance_rate !== undefined
            ? getStatusBackgroundColor(
                getAttendanceRateStatus(snapshot.attendance_rate)
              )
            : "background-color: rgba(107, 114, 128, 0.1);"
        }">
          <p class="text-[12px] font-semibold text-black mb-2">Average Attendance Rate</p>
          <p class="text-[20px] font-bold text-black">${
            snapshot?.attendance_rate !== null &&
            snapshot?.attendance_rate !== undefined
              ? `${formatAttendanceRate(
                  snapshot.attendance_rate
                )} (${getStatusLabel(
                  getAttendanceRateStatus(snapshot.attendance_rate)
                )})`
              : "No Data"
          }</p>
        </div>

        <!-- Average Punctuality Card -->
        <div class="border border-black rounded-md p-4" style="${
          punctualityValue !== null && punctualityValue !== undefined
            ? getStatusBackgroundColor(getPunctualityStatus(punctualityValue))
            : "background-color: rgba(107, 114, 128, 0.1);"
        }">
          <p class="text-[12px] font-semibold text-black mb-2">Average Punctuality</p>
          <p class="text-[20px] font-bold text-black">${
            punctualityValue !== null && punctualityValue !== undefined
              ? `${
                  Math.abs(punctualityValue) < 1
                    ? punctualityValue.toFixed(1)
                    : Math.round(punctualityValue)
                }m (${formatPunctuality(punctualityValue).replace(
                  /\s+/g,
                  "-"
                )})`
              : "No Data"
          }</p>
        </div>

        <!-- Average Time Balance Card -->
        <div class="border border-black rounded-md p-4" style="${
          timeBalanceValue !== null && timeBalanceValue !== undefined
            ? getStatusBackgroundColor(getTimeBalanceStatus(timeBalanceValue))
            : "background-color: rgba(107, 114, 128, 0.1);"
        }">
          <p class="text-[12px] font-semibold text-black mb-2">Average Time Balance</p>
          <p class="text-[20px] font-bold text-black">${
            timeBalanceValue !== null && timeBalanceValue !== undefined
              ? `${
                  timeBalanceValue < 0 ? "- " : timeBalanceValue > 0 ? "+" : ""
                }${Math.abs(Math.round(timeBalanceValue))}m (${getStatusLabel(
                  getTimeBalanceStatus(timeBalanceValue)
                )})`
              : "No Data"
          }</p>
        </div>

        <!-- Percentage At-Risk Users Card -->
        <div class="border border-black rounded-md p-4">
          <p class="text-[12px] font-semibold text-black mb-2">Percentage At-Risk</p>
          <p class="text-[20px] font-bold text-black">${
            snapshot && snapshot.total_users > 0
              ? `${formatPercentage(
                  (snapshot.at_risk_count / snapshot.total_users) * 100
                )} (${snapshot.at_risk_count}/${snapshot.total_users} users)`
              : "No Data"
          }</p>
        </div>
      </div>

      <div class="mb-2">
        <p class="text-[12px] font-semibold text-black">Users At-risk of Being Absent</p>
      </div>

      <table class="w-full border-collapse border border-black">
        <thead>
          <tr class="bg-gray-100 text-black text-[11px]">
            ${columnHeaders}
          </tr>
        </thead>
        <tbody>
          ${atRiskRows}
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
