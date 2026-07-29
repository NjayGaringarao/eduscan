"use client";

import { SystemLog } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import { TD_BASE } from "../table/class";

interface IKioskLogTableProps {
  logs: SystemLog[];
  query: string;
  containerClassName?: string;
  footerActions?: React.ReactNode;
  height?: string;
}

const createKioskLogFilter = (log: SystemLog, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const referenceId = String(log.reference_id ?? "").toLowerCase();
  const description = (log.description ?? "").toLowerCase();

  return referenceId.includes(q) || description.includes(q);
};

const createKioskLogColumns = (): ColumnDef<SystemLog, any>[] => [
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
    accessorKey: "reference_id",
    header: "Reference No.",
    cell: (props) => {
      const value = props.getValue();
      return <p className={TD_BASE + " truncate"}>{value ?? "—"}</p>;
    },
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

const KioskLogTable = ({
  logs = [],
  query,
  containerClassName,
  footerActions,
  height,
}: IKioskLogTableProps) => {
  const columns: ColumnDef<SystemLog, any>[] = useMemo(
    createKioskLogColumns,
    []
  );

  return (
    <Table
      data={logs}
      columns={columns}
      query={query}
      customFilter={createKioskLogFilter}
      containerClassName={containerClassName}
      footerActions={footerActions}
      height={height}
      emptyMessage="No kiosk logs found."
      getRowId={(row) => String(row.id)}
      enableRowSelection={false}
      enableMultiRowSelection={false}
      headerVariant="light"
    />
  );
};

export default KioskLogTable;
