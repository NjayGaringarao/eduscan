"use client";

import { ColumnDef } from "@tanstack/react-table";
import Table from "../table/Table";
import { UserAttendanceShift } from "@/types";
import { formatAttendanceDate, formatHoursToHHMM } from "@/utils/time";
import { nanoid } from "nanoid";

const TD_BASE = "p-1 align-middle text-sm text-primary";

interface AttendanceTableProps {
  data: UserAttendanceShift[];
  formatTime: (time: string | null) => string;
}

const AttendanceTable = ({ data, formatTime }: AttendanceTableProps) => {
  // table columns
  const columns: ColumnDef<UserAttendanceShift, any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <p className={TD_BASE}>{formatAttendanceDate(row.original.date)}</p>
      ),
    },
    {
      accessorKey: "time_in",
      header: "Time In",
      cell: (props) => (
        <p className={TD_BASE}>{formatTime(props.getValue())}</p>
      ),
    },
    {
      accessorKey: "time_out",
      header: "Time Out",
      cell: (props) => (
        <p className={TD_BASE}>{formatTime(props.getValue())}</p>
      ),
    },
    {
      accessorKey: "total_hours",
      header: "Total Hours",
      cell: (props) => (
        <p className={TD_BASE}>{formatHoursToHHMM(props.getValue())}</p>
      ),
    },
  ];

  return (
    <Table
      data={data}
      columns={columns}
      getRowId={() => nanoid()}
      enableRowSelection={false}
      enableSorting={true}
      enableColumnResizing={true}
      enableColumnReordering={true}
      height="h-[32rem]"
      emptyMessage="No attendance found."
    />
  );
};

export default AttendanceTable;
