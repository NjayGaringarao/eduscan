"use client";

import React, { useEffect, useState } from "react";
import { User } from "@/models";
import Loading from "../Loading";
import Button from "../Button";
import { Download } from "lucide-react";
import AttendanceTable from "./AttendanceTable";
import DTRTable from "./DTRTable";
import { UserAttendanceShift, DTRResult } from "@/types";
import { formatTime } from "@/utils/time";
import * as attendance from "@/lib/attendance";
import { downloadPdfBlob, sanitizeFilename } from "@/utils/blob";
import TableHolder from "../container/TableHolder";
import MonthPicker from "../MonthPicker";
import { cn } from "@/utils/style";

interface IUserAttendanceProps {
  user: User;
}

const UserAttendance = ({ user }: IUserAttendanceProps) => {
  const today = new Date();
  const defaultMonth = today.toISOString().slice(0, 7);

  const [month, setMonth] = useState(defaultMonth);

  const [data, setData] = useState<UserAttendanceShift[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // DTR related state
  const [view, setView] = useState<"attendance" | "dtr">("attendance");
  const [dtr, setDtr] = useState<DTRResult | null>(null);
  const [isDtrLoading, setIsDtrLoading] = useState(false);
  const [isDtrDownloading, setIsDtrDownloading] = useState(false);

  const getMonthRange = (value: string) => {
    const [year, monthStr] = value.split("-");
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(monthStr, 10);

    const startDay = 1;
    const endDay = new Date(yearNum, monthNum, 0).getDate();

    const format = (day: number) =>
      `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;

    return {
      from: format(startDay),
      to: format(endDay),
    };
  };

  const downloadHandle = async () => {
    if (!data || data.length === 0) return;

    setIsLoading(true);
    try {
      const { from, to } = getMonthRange(month);
      const { buffer, error } = await attendance.downloadAttendance({
        user,
        attendance: data,
        fromDate: from,
        toDate: to,
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
      const [year, monthStr] = month.split("-");
      const monthName = new Date(
        parseInt(year),
        parseInt(monthStr) - 1
      ).toLocaleString("default", { month: "long" });
      const filename = `Attendance-${person}-${monthName}-${year}.pdf`;

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

  // Download DTR (Daily Time Record) PDF
  const downloadDtrHandle = async () => {
    setIsDtrDownloading(true);
    try {
      let currentDtr = dtr;
      if (!currentDtr) {
        setIsDtrLoading(true);
        const { dtr: fetched, error } = await attendance.getDTR(user.id, month);
        setIsDtrLoading(false);
        if (error || !fetched) {
          alert(error ?? "Failed to fetch DTR");
          return;
        }
        currentDtr = fetched;
        setDtr(currentDtr);
      }

      const { buffer, error } = await attendance.download({
        user,
        dtr: currentDtr!,
      });

      if (error || !buffer) {
        alert(error ?? "Failed to generate DTR PDF");
        return;
      }

      // Nice filename: sanitize names and include month
      const person =
        `${sanitizeFilename(user.last_name)}-${sanitizeFilename(
          user.first_name
        )}` || user.id;
      const [year, monthStr] = month.split("-");
      const monthName = new Date(
        parseInt(year),
        parseInt(monthStr) - 1
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
      setIsDtrDownloading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const fetchData = async () => {
        setIsLoading(true);
        const { from, to } = getMonthRange(month);
        const { dtr, error } = await attendance.get(user.id, from, to);
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

  // Fetch DTR when user switches to DTR view or month changes
  useEffect(() => {
    if (view !== "dtr") return;

    let mounted = true;
    const handler = setTimeout(() => {
      const fetchDtr = async () => {
        setIsDtrLoading(true);
        const { dtr: fetched, error } = await attendance.getDTR(user.id, month);
        if (mounted) {
          if (error) {
            alert(error);
          } else if (fetched) {
            setDtr(fetched);
          }
        }
        setIsDtrLoading(false);
      };
      fetchDtr();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(handler);
    };
  }, [user, month, view]);

  return (
    <div className="relative flex flex-col gap-2">
      <p className="text-xl text-primary">Attendance Record</p>
      {/* Header and filter */}
      <div className="flex flex-col gap-2">
        <div className="flex-1 flex flex-row gap-2 justify-between items-center">
          <div
            className={cn("flex-row gap-2", user.employee ? "flex" : "hidden")}
          >
            <Button
              className={`min-w-24 px-2 py-1 ${
                view === "attendance"
                  ? "bg-primary text-background"
                  : "bg-background text-primary"
              }`}
              onClick={() => setView("attendance")}
              secondary
            >
              Sessions
            </Button>
            <Button
              className={cn(
                "min-w-24 px-2 py-1",
                view === "dtr"
                  ? "bg-primary text-background"
                  : "bg-background text-primary"
              )}
              onClick={() => setView("dtr")}
              secondary
            >
              DTR
            </Button>
          </div>
          <MonthPicker
            value={month}
            onChange={setMonth}
            containerClassName="w-full md:w-auto"
            inputClassName="w-full md:w-auto"
          />
          <div className="flex gap-2">
            {view === "attendance" ? (
              <Button
                className="min-w-48 flex flex-row gap-0 px-2 py-2 md:gap-2 items-center justify-center"
                onClick={downloadHandle}
                disabled={isLoading || !data || data.length === 0}
                secondary
              >
                <Download />
                Download PDF
              </Button>
            ) : (
              <Button
                className="min-w-48 flex flex-row gap-0 px-2 py-2 md:gap-2 items-center justify-center"
                onClick={downloadDtrHandle}
                disabled={
                  isDtrLoading ||
                  isDtrDownloading ||
                  !dtr ||
                  dtr.rows.length === 0
                }
                secondary
              >
                <Download />
                Download DTR
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {view === "attendance" ? (
        isLoading ? (
          <div className="h-96 flex items-center justify-center border border-primary/40 rounded-md">
            <Loading />
          </div>
        ) : data.length > 0 ? (
          <TableHolder className="h-96">
            <AttendanceTable data={data} formatTime={formatTime} />
          </TableHolder>
        ) : (
          <div className="flex items-center justify-center py-8 h-96 border border-primary/30 rounded-lg bg-background">
            <p className="text-center text-primary/50 italic">
              No attendance found for this period.
            </p>
          </div>
        )
      ) : // DTR View
      isDtrLoading ? (
        <div className="h-96 flex items-center justify-center border border-primary/40 rounded-md">
          <Loading />
        </div>
      ) : dtr && dtr.rows && dtr.rows.length > 0 ? (
        <TableHolder className="h-96">
          <DTRTable data={dtr} />
        </TableHolder>
      ) : (
        <div className="flex items-center justify-center py-8">
          <p className="text-center text-primary/50 italic">
            No DTR found for this period.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserAttendance;
