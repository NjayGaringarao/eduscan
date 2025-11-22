"use client";

import { SystemLog } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import { TD_BASE } from "../table/class";

interface ILogTableProps {
  logs: SystemLog[];
  containerClassName?: string;
  footerActions?: React.ReactNode;
  height?: string;
}

const createLogColumns = (): ColumnDef<SystemLog, any>[] => [
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    cell: (props) => {
      const value = props.getValue() as string | Date;
      const date = new Date(value);
      const formatted = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return <p className={TD_BASE + " truncate"}>{formatted}</p>;
    },
    size: 80,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: (props) => (
      <p className={TD_BASE + " truncate font-medium"}>{props.getValue()}</p>
    ),
    size: 40,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: (props) => (
      <p className={TD_BASE + " truncate font-medium"}>{props.getValue()}</p>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (props) => (
      <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
    ),
  },
];

const LogTable = ({ logs = [], containerClassName, footerActions, height }: ILogTableProps) => {
  const columns: ColumnDef<SystemLog, any>[] = useMemo(createLogColumns, []);

  return (
    <Table
      data={logs}
      columns={columns}
      containerClassName={containerClassName}
      footerActions={footerActions}
      height={height}
      emptyMessage="No logs found."
      getRowId={(row) => String(row.id)}
      enableRowSelection={false}
      enableMultiRowSelection={false}
    />
  );
};

export default LogTable;


