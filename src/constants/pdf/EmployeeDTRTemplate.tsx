import { User } from "@/models";
import { UserAttendanceShift } from "@/types";
import { convertToDTRRows } from "@/utils/dtr";

interface TemplateProps {
  user: User;
  data: UserAttendanceShift[];
  fromDate: string;
  toDate: string;
}

export function EmployeeDTRTemplate({
  user,
  data,
  fromDate,
  toDate,
}: TemplateProps): string {
  const { rows, grandTotal } = convertToDTRRows(data);

  const tableRows = rows
    .map(
      (r) => `
        <tr class="text-xs">
          <td class="border px-2 py-1">${r.date}</td>
          <td class="border px-2 py-1">${r.amArrival ?? "—"}</td>
          <td class="border px-2 py-1">${r.amDeparture ?? "—"}</td>
          <td class="border px-2 py-1">${r.pmArrival ?? "—"}</td>
          <td class="border px-2 py-1">${r.pmDeparture ?? "—"}</td>
          <td class="border px-2 py-1">${r.hoursWorked ?? "—"}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="p-6">
      <h1 class="text-lg font-bold text-center mb-2">DAILY TIME RECORD</h1>
      <p class="text-center text-sm italic mb-4">(Civil Service Form No. 48)</p>

      <div class="mb-4 text-sm">
        <p><strong>Name:</strong> ${user.last_name}, ${user.first_name} ${
    user.middle_name ?? ""
  }</p>
        <p><strong>Employee ID:</strong> ${user.user_id}</p>
        <p><strong>Period:</strong> ${fromDate} – ${toDate}</p>
      </div>

      <table class="table-auto border-collapse border border-gray-400 w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="border px-2 py-1" rowspan="2">DATE</th>
            <th class="border px-2 py-1" colspan="2">AM</th>
            <th class="border px-2 py-1" colspan="2">PM</th>
            <th class="border px-2 py-1" rowspan="2">Hours Worked</th>
          </tr>
          <tr>
            <th class="border px-2 py-1">Arrival</th>
            <th class="border px-2 py-1">Departure</th>
            <th class="border px-2 py-1">Arrival</th>
            <th class="border px-2 py-1">Departure</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="bg-gray-200 font-bold">
            <td colspan="5" class="border px-2 py-1 text-right">Grand Total</td>
            <td class="border px-2 py-1">${grandTotal}</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-8 text-xs leading-relaxed">
        <p>
          I certify on my honor that the above is a true and correct report
          of the hours of work performed, record of which was made daily at
          the time of arrival and departure from office.
        </p>

        <div class="flex justify-between mt-6">
          <div class="text-center">
            <p>__________________________</p>
            <p>Employee's Signature</p>
          </div>
          <div class="text-center">
            <p>__________________________</p>
            <p>Authorized Official</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
