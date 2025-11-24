import { User } from "@/models";
import { DTRResult } from "@/types";

interface TemplateProps {
  user: User;
  dtr: DTRResult;
  imageDataUrl?: string;
}
/**
 *
 * Note: This template is currently not used in the project.
 */
export function EmployeeDTRTemplate({
  user,
  dtr,
  imageDataUrl,
}: TemplateProps): string {
  const { rows, summary, year } = dtr;
  const [, monthNum] = dtr.month.split("-");
  const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleString(
    "default",
    { month: "long" }
  );

  const tableRows = rows
    .map((row) => {
      return `
        <tr class="text-[9px]">
            <td class="w-12 font-bold border-r-2 border-b border-black px-2 text-center">${
              row.dayNumber
            }</td>
            <td class="w-[15%] border-r border-b border-black text-center">${
              row.amArrival?.replace(/\s*(AM|PM)/gi, "") ?? ""
            }</td>
            <td class="w-[15%] border-r-2 border-b border-black px-2 text-center">${
              row.amDeparture?.replace(/\s*(AM|PM)/gi, "") ?? ""
            }</td>
            <td class="w-[15%] border-r border-b border-black px-2 text-center">${
              row.pmArrival?.replace(/\s*(AM|PM)/gi, "") ?? ""
            }</td>
            <td class="w-[15%] border-r-2 border-b border-black px-2 text-center">${
              row.pmDeparture?.replace(/\s*(AM|PM)/gi, "") ?? ""
            }</td>
            <td class="w-[10%] border-r border-b border-black px-2 text-center">${
              row.undertimeHours !== undefined ? row.undertimeHours : ""
            }</td>
            <td class="w-[10%] border-b border-black px-2 text-center">${
              row.undertimeMinutes !== undefined ? row.undertimeMinutes : ""
            }</td>
        </tr>
      `;
    })
    .join("");

  return `
  <div class="flex flex-row justify-between gap-24" style="font-family: Arial, sans-serif;">
    <div class="flex-1">
      <p class="text-[8px] italic">Civil Service Form No. 48</p>
      <p class="text-[12px] font-bold text-center">DAILY TIME RECORD</p>
      <p class="text-center text-[8px] -mt-2">-----o0o-----</p>
     
       <p class="text-[10px] w-full text-center border-b border-black mt-2 h-4"> ${
         user.last_name
       }, ${user.first_name} ${user.middle_name ?? ""}</p>
      <p class="text-[8px] w-full text-center -mt-1">(Name)</p>
      
      <div class="mb-4 text-[8px] flex flex-col">
        <div class="flex flex-row">
          <i>For the month of:</i>
          <p class="flex-1 flex flex-col text-center border-b border-black h-4">${monthName} ${year}</p>
        </div>

        <div class="grid grid-cols-3 grid-rows-2 text-end items-center ">

          <i class="leading-relaxed row-span-2 text-center">Official Hours for arrival and departure</i>
          
          <i class="self-end h-4">Regular Days:</i>
          <p class="flex-1 flex flex-col text-center border-b border-black h-4">${
            summary.regularDaysSchedule
          }</p>

         
          <i class="self-end h-4">Saturdays:</i>
          <p class="flex-1 flex flex-col text-center border-b border-black h-4">${
            summary.saturdaysSchedule
          }</p>

        </div>
      </div>

      <table class="table-fixed border-collapse w-full text-[7px] border border-black" style="table-layout: fixed; font-family: Arial, sans-serif;">
        <thead>
          <tr class="font-bold">
            <th class="w-12 border-r-2 border-b-2 border-black px-2 text-center text-[9px]" rowspan="2">Day</th>
            <th class="border-r-2 border-b-2 border-black px-2 text-center text-[9px]" colspan="2">A.M.</th>
            <th class="border-r-2 border-b-2 border-black px-2 text-center text-[9px]" colspan="2">P.M.</th>
            <th class="border-b-2 border-black px-2 text-center text-[9px]" colspan="2">Undertime</th>
          </tr>
          <tr class="font-semibold">
            <th class="w-[15%] border-r border-b-2 border-black text-center">Arrival</th>
            <th class="w-[15%] border-r-2 border-b-2 border-black text-center">Departure</th>
            <th class="w-[15%] border-r border-b-2 border-black text-center">Arrival</th>
            <th class="w-[15%] border-r-2 border-b-2 border-black text-center">Departure</th>
            <th class="w-[10%] border-r border-b-2 border-black text-center">Hours</th>
            <th class="w-[10%] border-b-2 border-black text-center">Minutes</th>
          </tr>
         
        </thead>
        <tbody>
          ${tableRows}
          <tr class="font-bold text-[9px]">
            <td colspan="5" class="border-r-2 border-b-2 border-black text-right">TOTAL</td>
            <td class="w-[10%] border-r border-b-2 border-black text-center">${
              summary.totalUndertimeHours
            }</td>
            <td class="w-[10%] border-b-2 border-black text-center">${
              summary.totalUndertimeMinutes
            }</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 text-[8px] text-center italic">
        <p class="text-start px-2 leading-tight">
          I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.
        </p>

        <div class="border border-black w-full mt-4"></div>
        <p class="text-start py-1 px-2">VERIFIED as to the prescribed hours:</p>
        <div class="border border-black w-full mt-6"></div>
        <p>In Charge</p>
      </div>

      <p class="mt-4 text-[8px] text-center">(SEE INSTRUCTIONS ON THE BACK)</p>
      
    </div>
    
    <div class="flex-1">
      <p class="text-[8px] italic">Civil Service Form No. 48</p>
      <p class="text-[12px] font-bold text-center">DAILY TIME RECORD</p>
      <p class="text-center text-[8px] -mt-2">-----o0o-----</p>
     
       <p class="text-[10px] w-full text-center border-b border-black mt-2 h-4"> ${
         user.last_name
       }, ${user.first_name} ${user.middle_name ?? ""}</p>
      <p class="text-[8px] w-full text-center -mt-1">(Name)</p>
      
      <div class="mb-4 text-[8px] flex flex-col">
        <div class="flex flex-row">
          <i>For the month of:</i>
          <p class="flex-1 flex flex-col text-center border-b border-black h-4">${monthName} ${year}</p>
        </div>

        <div class="grid grid-cols-3 grid-rows-2 text-end items-center ">

          <i class="leading-relaxed row-span-2 text-center">Official Hours for arrival and departure</i>
          
          <i class="self-end h-4">Regular Days:</i>
          <p class="flex-1 flex flex-col text-center border-b border-black h-4">${
            summary.regularDaysSchedule
          }</p>

         
          <i class="self-end h-4">Saturdays:</i>
          <p class="flex-1 flex flex-col text-center border-b border-black h-4">${
            summary.saturdaysSchedule
          }</p>

        </div>
      </div>

      <table class="table-fixed border-collapse w-full text-[7px] border border-black" style="table-layout: fixed; font-family: Arial, sans-serif;">
        <thead>
          <tr class="font-bold">
            <th class="w-12 border-r-2 border-b-2 border-black px-2 text-center text-[9px]" rowspan="2">Day</th>
            <th class="border-r-2 border-b-2 border-black px-2 text-center text-[9px]" colspan="2">A.M.</th>
            <th class="border-r-2 border-b-2 border-black px-2 text-center text-[9px]" colspan="2">P.M.</th>
            <th class="border-b-2 border-black px-2 text-center text-[9px]" colspan="2">Undertime</th>
          </tr>
          <tr class="font-semibold">
            <th class="w-[15%] border-r border-b-2 border-black text-center">Arrival</th>
            <th class="w-[15%] border-r-2 border-b-2 border-black text-center">Departure</th>
            <th class="w-[15%] border-r border-b-2 border-black text-center">Arrival</th>
            <th class="w-[15%] border-r-2 border-b-2 border-black text-center">Departure</th>
            <th class="w-[10%] border-r border-b-2 border-black text-center">Hours</th>
            <th class="w-[10%] border-b-2 border-black text-center">Minutes</th>
          </tr>
         
        </thead>
        <tbody>
          ${tableRows}
          <tr class="font-bold text-[9px]">
            <td colspan="5" class="border-r-2 border-b-2 border-black text-right">TOTAL</td>
            <td class="w-[10%] border-r border-b-2 border-black text-center">${
              summary.totalUndertimeHours
            }</td>
            <td class="w-[10%] border-b-2 border-black text-center">${
              summary.totalUndertimeMinutes
            }</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 text-[8px] text-center italic">
        <p class="text-start px-2 leading-tight">
          I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.
        </p>

        <div class="border border-black w-full mt-4"></div>
        <p class="text-start py-1 px-2">VERIFIED as to the prescribed hours:</p>
        <div class="border border-black w-full mt-6"></div>
        <p>In Charge</p>
      </div>

      <p class="mt-4 text-[8px] text-center">(SEE INSTRUCTIONS ON THE BACK)</p>
    </div>
 </div>
 
 <div style="page-break-before: always;"></div>
 
 <div class="flex flex-row justify-between gap-24" style="font-family: Arial, sans-serif;">
   <div class="flex-1">
     <img src="${
       imageDataUrl || ""
     }" alt="CSC DTR Instruction" class="w-full h-auto" />
   </div>
   <div class="flex-1">
     <img src="${
       imageDataUrl || ""
     }" alt="CSC DTR Instruction" class="w-full h-auto" />
   </div>
 </div>
  `;
}
