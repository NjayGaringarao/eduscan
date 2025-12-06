"use client";

import { SessionLog } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import { TD_BASE, TD_ID } from "../table/class";
import { cn } from "@/utils/style";

interface ISessionLogTableProps {
  sessionList: SessionLog[];
  query: string;
  containerClassName?: string;
}

const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return "---";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createSessionLogFilter = (session: SessionLog, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullName = (session.full_name ?? "").toLowerCase();
  const userId = (session.user_id ?? "").toLowerCase();

  return fullName.includes(q) || userId.includes(q);
};

const createSessionLogColumns = (): ColumnDef<SessionLog, any>[] => [
  {
    accessorKey: "user_id",
    header: "User ID",
    cell: (props) => <p className={TD_ID}>{props.getValue()}</p>,
    size: 120,
  },
  {
    accessorKey: "full_name",
    header: "Name",
    cell: (props) => (
      <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
    ),
  },
  {
    accessorKey: "time_in",
    header: "Time In",
    cell: (props) => {
      const value = props.getValue() as string;
      return <p className={TD_BASE + " truncate"}>{formatTimestamp(value)}</p>;
    },
    size: 180,
  },
  {
    accessorKey: "time_out",
    header: "Time Out",
    cell: (props) => {
      const value = props.getValue() as string | null;
      return (
        <p className={TD_BASE + " truncate"}>
          {value ? formatTimestamp(value) : "---"}
        </p>
      );
    },
    size: 180,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: (props) => {
      const isActive = props.getValue() as boolean;
      return (
        <p
          className={cn(
            TD_BASE,
            "truncate font-semibold",
            isActive ? "text-uGreen" : "text-primary"
          )}
        >
          {isActive ? "ACTIVE" : "INACTIVE"}
        </p>
      );
    },
    size: 100,
  },
];

const SessionLogTable = ({
  sessionList = [],
  query,
  containerClassName,
}: ISessionLogTableProps) => {
  const columns: ColumnDef<SessionLog, any>[] = useMemo(
    createSessionLogColumns,
    []
  );

  return (
    <Table
      data={sessionList}
      columns={columns}
      query={query}
      containerClassName={containerClassName}
      emptyMessage="No sessions found."
      getRowId={(row) => String(row.session_id)}
      enableRowSelection={false}
      enableMultiRowSelection={false}
      customFilter={createSessionLogFilter}
      enableSorting={true}
      enableColumnResizing={true}
      enableColumnReordering={true}
    />
  );
};

export default SessionLogTable;

