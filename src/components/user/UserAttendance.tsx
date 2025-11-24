"use client";

import React, { useEffect, useState } from "react";
import { User } from "@/models";
import DateRangePicker from "../DateRangePicker";
import Loading from "../Loading";
import Button from "../Button";
import { Download } from "lucide-react";
import AttendanceTable from "./AttendanceTable";
import { UserAttendanceShift } from "@/types";
import { formatTime } from "@/utils/time";
import * as attendance from "@/lib/attendance";
import DropDown from "../container/DropDown";
import { downloadPdfBlob, sanitizeFilename } from "@/utils/blob";
import TableHolder from "../container/TableHolder";

interface IUserAttendanceProps {
  user: User;
}

const UserAttendance = ({ user }: IUserAttendanceProps) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [fromDate, setFromDate] = useState(firstDay.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(lastDay.toISOString().slice(0, 10));

  const [data, setData] = useState<UserAttendanceShift[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const downloadHandle = async () => {
    if (!data || data.length === 0) return;

    setIsLoading(true);
    try {
      const { buffer, error } = await attendance.downloadAttendance({
        user,
        attendance: data,
        fromDate,
        toDate,
      });

      if (error || !buffer) {
        alert(error ?? "Failed to generate PDF");
        return;
      }

      // Nice filename: sanitize names and include date range
      const person =
        `${sanitizeFilename(user.last_name)}-${sanitizeFilename(
          user.first_name
        )}` || user.id;
      const fromDateStr = fromDate.replace(/-/g, "");
      const toDateStr = toDate.replace(/-/g, "");
      const filename = `Attendance-${person}-${fromDateStr}-${toDateStr}.pdf`;

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
        const { dtr, error } = await attendance.get(user.id, fromDate, toDate);
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
  }, [user, fromDate, toDate]);

  return (
    <DropDown
      headerElement={
        <p className="text-lg text-primary/80">Attendance Record</p>
      }
      childClassName="relative"
    >
      <div className="relative flex flex-col gap-4">
        {/* Header and filter */}
        <div className="flex flex-col gap-2">
          <div className="flex-1 flex flex-row gap-2 justify-between items-center">
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              containerClassName="w-full md:w-auto"
            />
            <Button
              className="min-w-48 flex flex-row gap-0 px-2 py-2 md:gap-2 items-center justify-center"
              onClick={downloadHandle}
              disabled={isLoading || !data || data.length === 0}
              secondary
            >
              <Download />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="h-96 flex items-center justify-center border border-primary/40 rounded-md">
            <Loading />
          </div>
        ) : data.length > 0 ? (
          <TableHolder className="h-96">
            <AttendanceTable data={data} formatTime={formatTime} />
          </TableHolder>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-center text-primary/50 italic">
              No attendance found for this period.
            </p>
          </div>
        )}
      </div>
    </DropDown>
  );
};

export default UserAttendance;
