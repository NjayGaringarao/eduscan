"use client";

import React from "react";
import { DTRResult } from "@/types";

interface DTRTableProps {
  data: DTRResult;
}

const DTRTable: React.FC<DTRTableProps> = ({ data }) => {
  const { rows, summary } = data;

  return (
    <div className="flex flex-col gap-4">
      {/* Main DTR Table */}
      <div className="overflow-auto max-h-[30vh] border border-primary/20 rounded-md">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-primary/80 sticky top-0 z-10">
            <tr className="text-background">
              <th
                className="border border-primary/20 px-3 py-2 text-center font-semibold"
                rowSpan={2}
              >
                Day
              </th>
              <th
                className="border border-primary/20 px-3 py-2 text-center font-semibold"
                colSpan={2}
              >
                A.M.
              </th>
              <th
                className="border border-primary/20 px-3 py-2 text-center font-semibold"
                colSpan={2}
              >
                P.M.
              </th>
              <th
                className="border border-primary/20 px-3 py-2 text-center font-semibold"
                colSpan={2}
              >
                Undertime
              </th>
            </tr>
            <tr className="text-background">
              <th className="border border-primary/20 px-3 py-2 text-center text-xs font-medium">
                Arrival
              </th>
              <th className="border border-primary/20 px-3 py-2 text-center text-xs font-medium">
                Departure
              </th>
              <th className="border border-primary/20 px-3 py-2 text-center text-xs font-medium">
                Arrival
              </th>
              <th className="border border-primary/20 px-3 py-2 text-center text-xs font-medium">
                Departure
              </th>
              <th className="border border-primary/20 px-3 py-1 text-center font-normal">
                Hours
              </th>
              <th className="border border-primary/20 px-3 py-1 text-center font-normal">
                Minutes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              // Determine if this is a weekend for styling
              const date = new Date(
                data.year,
                parseInt(data.month.split("-")[1]) - 1,
                row.dayNumber
              );
              const dayOfWeek = date.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <tr
                  key={row.dayNumber}
                  className={`text-primary text-xs hover:bg-primary/5 ${
                    isWeekend ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.dayNumber}
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.amArrival ?? "—"}
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.amDeparture ?? "—"}
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.pmArrival ?? "—"}
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.pmDeparture ?? "—"}
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.undertimeHours !== undefined ? row.undertimeHours : ""}
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    {row.undertimeMinutes !== undefined
                      ? row.undertimeMinutes
                      : ""}
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className="bg-primary/20 font-semibold text-xs">
              <td
                className="border border-primary/20 px-3 py-2 text-right"
                colSpan={5}
              >
                TOTAL
              </td>
              <td className="border border-primary/20 px-3 py-2 text-center">
                {summary.totalUndertimeHours}
              </td>
              <td className="border border-primary/20 px-3 py-2 text-center">
                {summary.totalUndertimeMinutes}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DTRTable;
