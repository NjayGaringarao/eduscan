import { User } from "@/models";
import { DTRResult } from "@/types";

interface TemplateProps {
  user: User;
  dtr: DTRResult;
}

export function EmployeeDTRTemplate({ user, dtr }: TemplateProps): string {
  const { rows, summary, year } = dtr;
  const [, monthNum] = dtr.month.split("-");
  const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleString(
    "default",
    { month: "long" }
  );

  const tableRows = rows
    .map((row) => {
      // Determine day of week for styling
      const date = new Date(year, parseInt(monthNum) - 1, row.dayNumber);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const bgClass = isWeekend ? "bg-gray-100" : "";

      return `
        <tr class="text-[11px] ${bgClass}">
          <td class="border border-gray-400 px-2 text-center">${
            row.dayNumber
          }</td>
          <td class="border border-gray-400 px-2 text-center">${
            row.amArrival ?? ""
          }</td>
          <td class="border border-gray-400 px-2 text-center">${
            row.amDeparture ?? ""
          }</td>
          <td class="border border-gray-400 px-2 text-center">${
            row.pmArrival ?? ""
          }</td>
          <td class="border border-gray-400 px-2 text-center">${
            row.pmDeparture ?? ""
          }</td>
          <td class="border border-gray-400 px-2 text-center">${
            row.undertimeHours !== undefined ? row.undertimeHours : ""
          }</td>
          <td class="border border-gray-400 px-2 text-center">${
            row.undertimeMinutes !== undefined ? row.undertimeMinutes : ""
          }</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div>
      <p class="text-[8px] italic mb-4">Civil Service Form No. 48</p>
      <p class="text-[18px] font-bold text-center mb-1">DAILY TIME RECORD</p>
      <p class="text-center text-[14px] mb-8">-----o0o-----</p>
     
      <p class="text-[14px] w-full text-center border-b border-black"> ${
        user.last_name
      }, ${user.first_name} ${user.middle_name ?? ""}</p>
      <p class="text-[11px] w-full text-center">(Name)</p>
      
      <div class="my-4 text-[12px] flex flex-row justify-between">
        <p><strong>For the month of:</strong> ${monthName} ${year}</p>
        <p><strong>Regular Days:</strong> ${summary.regularDaysCount}</p>
        <p><strong>Saturdays:</strong> ${summary.saturdaysCount}</p>
      </div>

      <table class="table-auto border-collapse border border-gray-400 w-full text-[11px]">
        <thead class="bg-gray-200">
          <tr>
            <th class="border border-gray-400 px-2 text-center font-bold" rowspan="3">Day</th>
            <th class="border border-gray-400 px-2 text-center font-bold" colspan="2">A.M.</th>
            <th class="border border-gray-400 px-2 text-center font-bold" colspan="2">P.M.</th>
            <th class="border border-gray-400 px-2 text-center font-bold" colspan="2">Undertime</th>
          </tr>
          <tr>
            <th class="border border-gray-400 px-2 text-center text-xs font-semibold">Arrival</th>
            <th class="border border-gray-400 px-2 text-center text-xs font-semibold">Departure</th>
            <th class="border border-gray-400 px-2 text-center text-xs font-semibold">Arrival</th>
            <th class="border border-gray-400 px-2 text-center text-xs font-semibold">Departure</th>
            <th class="border border-gray-400 px-1 text-center text-xs font-normal">Hours</th>
            <th class="border border-gray-400 px-1 text-center text-xs font-normal">Minutes</th>
          </tr>
         
        </thead>
        <tbody>
          ${tableRows}
          <tr class="bg-gray-300 font-bold text-xs">
            <td colspan="5" class="border border-gray-400 px-2 py-2 text-right">TOTAL</td>
            <td class="border border-gray-400 px-2 py-2 text-center">${
              summary.totalUndertimeHours
            }</td>
            <td class="border border-gray-400 px-2 py-2 text-center">${
              summary.totalUndertimeMinutes
            }</td>
          </tr>
        </tbody>
      </table>

     

      <div class="mt-6 text-[11px] leading-relaxed">
        <p class="mb-4">
          I certify on my honor that the above is a true and correct report
          of the hours of work performed, record of which was made daily at
          the time of arrival and departure from office.
        </p>

        <div class="text-[11px] grid grid-cols-2 gap-8 mt-14">
          <p class="w-full text-center border-t border-black">Employee's Signature</p>
          <p class="w-full text-center border-t border-black">In Charge</p>  
        </div>
      </div>
    </div>
  `;
}
