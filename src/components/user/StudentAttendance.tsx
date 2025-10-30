"use client";

import React, { useEffect, useState } from "react";
import DateRangePicker from "../DateRangePicker";
import Loading from "../Loading";
import AttendanceTable from "./AttendanceTable";
import { UserAttendanceShift } from "@/types";
import { formatTime } from "@/utils/time";
import * as attendance from "@/lib/attendance";
import { User } from "@/models";

interface IStudentAttendanceProps {
  user: User;
}

const StudentAttendance = ({ user }: IStudentAttendanceProps) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [fromDate, setFromDate] = useState(firstDay.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(lastDay.toISOString().slice(0, 10));

  const [data, setData] = useState<UserAttendanceShift[]>([]);

  const [isLoading, setIsLoading] = useState(false);

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

export default StudentAttendance;
