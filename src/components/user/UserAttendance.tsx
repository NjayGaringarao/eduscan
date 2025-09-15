"use client";

import React, { useEffect, useState } from "react";
import DateRangePicker from "../DateRangePicker";
import Loading from "../Loading";
import Button from "../Button";
import { Download } from "lucide-react";
import AttendanceTable from "./AttendanceTable";
import { UserAttendanceShift } from "@/types";
import { formatTime } from "@/utils/time";
import * as attendance from "@/lib/attendance";
import { User } from "@/models";
import { downloadPdfBlob, sanitizeFilename } from "@/utils/blob";

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
    setIsLoading(true);
    try {
      const { buffer, error } = await attendance.download({
        user,
        data,
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
        )}` || user.user_id;
      const filename = `DTR-${person}-${fromDate}-${toDate}.pdf`;

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
        const { dtr, error } = await attendance.get(
          user.user_id,
          fromDate,
          toDate
        );
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
    <div className="relative flex flex-col gap-2 h-full max-h-72">
      {/* Header and filter */}
      <div className="flex flex-col gap-2">
        <div className="flex-1 flex flex-row gap-2 justify-between">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
            containerClassName="w-full md:w-auto"
          />
          {user.employee && (
            <Button
              className="flex flex-row gap-0 px-2 py-0 md:gap-2 items-center justify-center"
              onClick={downloadHandle}
              secondary
            >
              <Download />
              <p className="invisible w-0 md:visible md:w-auto">Download DTR</p>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : (
        <AttendanceTable data={data} formatTime={formatTime} />
      )}

      {data.length === 0 && !isLoading && (
        <div className="absolute h-full w-full flex items-center justify-center">
          <p className="text-center text-primary/50 italic">
            No attendance found.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserAttendance;
