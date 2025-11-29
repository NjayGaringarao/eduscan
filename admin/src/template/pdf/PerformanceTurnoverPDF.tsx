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

const getPunctualityClassification = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "No Data";
  if (value > 1) return "Early";
  if (value < -1) return "Late";
  return "On Time";
};

const getTimeBalanceClassification = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "No Data";
  if (value > 1) return "Overtime";
  if (value < -1) return "Undertime";
  return "On Target";
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
  const punctualityLabel = snapshot?.average_punctuality_label ?? "No Data";
  const punctualityClassification =
    getPunctualityClassification(punctualityValue);

  const timeBalanceValue = snapshot?.average_time_balance ?? null;
  const timeBalanceLabel = snapshot?.average_time_balance_label ?? "No Data";
  const timeBalanceClassification =
    getTimeBalanceClassification(timeBalanceValue);

  const roleLabel = getRoleLabel(role);
  const totalUsers = snapshot?.total_users ?? 0;
  const atRiskCount = snapshot?.at_risk_count ?? atRiskUsers.length;

  const columnHeaders =
    role === "ALL"
      ? `
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">User ID</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Name</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Role</th>
    `
      : `
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">User ID</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Name</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Division/Department</th>
      <th class="px-3 py-2 text-start font-semibold border border-black text-black text-[11px]">Title/Program</th>
    `;

  const atRiskRows =
    atRiskUsers.length > 0
      ? atRiskUsers
          .map((user) => {
            const extraColumns =
              role === "ALL"
                ? `<td class="px-3 py-1 text-start border border-black text-black text-[11px]">${user.userRole}</td>`
                : `
                    <td class="px-3 py-1 text-start border border-black text-black text-[11px]">
                      ${
                        role === "EMPLOYEE"
                          ? user.division || "—"
                          : user.department || "—"
                      }
                    </td>
                    <td class="px-3 py-1 text-start border border-black text-black text-[11px]">
                      ${
                        role === "EMPLOYEE"
                          ? user.title || "—"
                          : user.program || "—"
                      }
                    </td>
                  `;
            return `
              <tr class="text-[11px] border-b border-black">
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]">${user.userId}</td>
                <td class="px-3 py-1 text-start border border-black text-black text-[11px]">${user.fullName}</td>
                ${extraColumns}
              </tr>
            `;
          })
          .join("")
      : `
          <tr class="text-[11px] border-b border-black">
            <td colspan="${
              role === "ALL" ? 3 : 4
            }" class="px-3 py-2 text-center text-black text-[11px]">
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
        <div class="border border-black rounded-md p-4">
          <p class="text-[12px] font-semibold text-black mb-2">Average Punctuality</p>
          <p class="text-[20px] font-bold text-black">${punctualityLabel}</p>
          <p class="text-[11px] text-black">Classification: ${punctualityClassification}</p>
        </div>
        <div class="border border-black rounded-md p-4">
          <p class="text-[12px] font-semibold text-black mb-2">Average Time Balance</p>
          <p class="text-[20px] font-bold text-black">${timeBalanceLabel}</p>
          <p class="text-[11px] text-black">Classification: ${timeBalanceClassification}</p>
        </div>
      </div>

      <div class="mb-2">
        <p class="text-[12px] font-semibold text-black">At-Risk Users</p>
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
