"use client";

import React from "react";
import { DTRResult } from "@/types";

interface DTRTableProps {
  data: DTRResult;
}

const DTRTable: React.FC<DTRTableProps> = ({ data }) => {
  const { rows, summary } = data;

  // Add weekend styling to rows
  const rowsWithWeekendInfo = rows.map((row) => {
    const date = new Date(
      data.year,
      parseInt(data.month.split("-")[1]) - 1,
      row.dayNumber
    );
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      ...row,
      isWeekend,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Main DTR Table with Nested Headers */}
      <div className="border border-primary/20 rounded-md overflow-hidden">
        <div>
          <table className="w-full text-sm border-collapse">
            {/* Nested Header Structure */}
            <thead className="bg-primary/70">
              {/* Top Level Headers */}
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
              {/* Sub Headers */}
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
              {rowsWithWeekendInfo.map((row) => (
                <tr
                  key={row.dayNumber}
                  className={`text-primary text-xs hover:bg-primary/5 ${
                    row.isWeekend ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div
                      className={`font-medium ${
                        row.isWeekend ? "text-primary/70" : ""
                      }`}
                    >
                      {row.dayNumber}
                    </div>
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div className={row.isWeekend ? "text-primary/70" : ""}>
                      {row.amArrival
                        ? row.amArrival.replace(/\s*(AM|PM)/gi, "")
                        : "—"}
                    </div>
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div className={row.isWeekend ? "text-primary/70" : ""}>
                      {row.amDeparture
                        ? row.amDeparture.replace(/\s*(AM|PM)/gi, "")
                        : "—"}
                    </div>
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div className={row.isWeekend ? "text-primary/70" : ""}>
                      {row.pmArrival
                        ? row.pmArrival.replace(/\s*(AM|PM)/gi, "")
                        : "—"}
                    </div>
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div className={row.isWeekend ? "text-primary/70" : ""}>
                      {row.pmDeparture
                        ? row.pmDeparture.replace(/\s*(AM|PM)/gi, "")
                        : "—"}
                    </div>
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div className={row.isWeekend ? "text-primary/70" : ""}>
                      {row.undertimeHours !== undefined
                        ? row.undertimeHours
                        : ""}
                    </div>
                  </td>
                  <td className="border border-primary/20 px-3 py-2 text-center">
                    <div className={row.isWeekend ? "text-primary/70" : ""}>
                      {row.undertimeMinutes !== undefined
                        ? row.undertimeMinutes
                        : ""}
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Summary Row */}
      <div className="bg-primary/20 border border-primary/20 rounded-md p-3">
        <div className="flex justify-between items-center text-sm font-semibold">
          <span className="text-primary">TOTAL UNDERTIME</span>
          <div className="flex gap-8">
            <span className="text-primary">
              Hours: {summary.totalUndertimeHours}
            </span>
            <span className="text-primary">
              Minutes: {summary.totalUndertimeMinutes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DTRTable;
