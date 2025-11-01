"use client";

import React, { useEffect, useState } from "react";
import MonthPicker from "../MonthPicker";
import Loading from "../Loading";
import Button from "../Button";
import { Download } from "lucide-react";
import DTRTable from "./DTRTable";
import { DTRResult } from "@/types";
import * as attendance from "@/lib/attendance";
import { User } from "@/models";
import { downloadPdfBlob, sanitizeFilename } from "@/utils/blob";

interface IEmployeeAttendanceProps {
  user: User;
}

const EmployeeAttendance = ({ user }: IEmployeeAttendanceProps) => {
  const today = new Date();

  // Set initial month to previous month to avoid current month
  const previousMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 7);

  const [month, setMonth] = useState(previousMonth);
  const [data, setData] = useState<DTRResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const downloadHandle = async () => {
    if (!data) return;

    setIsLoading(true);
    try {
      const { buffer, error } = await attendance.download({
        user,
        dtr: data,
      });

      if (error || !buffer) {
        alert(error ?? "Failed to generate PDF");
        return;
      }

      // Nice filename: sanitize names and include month/year
      const person =
        `${sanitizeFilename(user.last_name)}-${sanitizeFilename(
          user.first_name
        )}` || user.id;
      const [year, monthNum] = month.split("-");
      const monthName = new Date(
        parseInt(year),
        parseInt(monthNum) - 1
      ).toLocaleString("default", { month: "long" });
      const filename = `DTR-${person}-${monthName}-${year}.pdf`;

      // Download PDF using utility function
      downloadPdfBlob(buffer, filename, (error) => {
        alert(`Download failed: ${error}`);
      });
    } catch (err: any) {
      console.error("Download failed", err);
      alert("An unexpected error occurred while downloading.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const fetchData = async () => {
        setIsLoading(true);
        const { dtr, error } = await attendance.getDTR(user.id, month);
        if (error) {
          alert(error);
        } else {
          setData(dtr);
        }
        setIsLoading(false);
      };
      fetchData();
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [user, month]);

  return (
    <div className="relative flex flex-col gap-4">
      {/* Header and filter */}
      <div className="flex flex-col gap-2">
        <div className="flex-1 flex flex-row gap-2 justify-between items-center">
          <MonthPicker
            value={month}
            onChange={setMonth}
            containerClassName="w-full md:w-auto"
            inputClassName="w-full md:w-auto"
            excludeCurrentMonth={true}
          />
          <Button
            className="min-w-48 flex flex-row gap-0 px-2 py-2 md:gap-2 items-center justify-center"
            onClick={downloadHandle}
            disabled={isLoading || !data}
            secondary
          >
            <Download />
            Download DTR
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : data && data.rows.length > 0 ? (
        <DTRTable data={data} />
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-center text-primary/50 italic">
            No attendance found for this month.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
