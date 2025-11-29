"use client";

import { AtRiskUser } from "@/lib/performance";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import { TD_BASE, TD_ID } from "../table/tableUtils";
import { cn } from "@/utils/style";
import TableHolder from "../container/TableHolder";

interface IAtRiskUsersTableProps {
  users: AtRiskUser[];
  containerClassName?: string;
  footerActions?: React.ReactNode;
  height?: string;
}

// Helper to format percentage
const formatPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
};

const createAtRiskColumns = (): ColumnDef<AtRiskUser, any>[] => [
  {
    accessorKey: "dropout_risk_level",
    header: "Dropout",
    cell: (props) => (
      <p className={cn(TD_BASE, "truncate", "text-uRed")}>{props.getValue()}</p>
    ),
  },
  {
    accessorKey: "id",
    header: "User ID",
    cell: (props) => <p className={TD_ID}>{props.getValue()}</p>,
  },
  {
    id: "full_name",
    header: "Full Name",
    cell: ({ row }) => {
      const user = row.original;
      const fullName = `${user.first_name || ""} ${user.middle_name || ""} ${
        user.last_name || ""
      }`.trim();
      return <p className={cn(TD_BASE, "truncate")}>{fullName || "N/A"}</p>;
    },
  },

  {
    accessorKey: "attendance_rate_value",
    header: "Attendance Rate",
    cell: (props) => (
      <p className={cn(TD_BASE, "truncate")}>
        {formatPercentage(props.getValue())}
      </p>
    ),
  },
  {
    accessorKey: "dropout_risk_confidence",
    header: "Confidence",
    cell: (props) => (
      <p className={cn(TD_BASE, "truncate")}>
        {formatPercentage(props.getValue())}
      </p>
    ),
  },
];

const AtRiskUsersTable = ({
  users = [],
  containerClassName,
  footerActions,
  height,
}: IAtRiskUsersTableProps) => {
  const columns: ColumnDef<AtRiskUser, any>[] = useMemo(
    createAtRiskColumns,
    []
  );

  return (
    <TableHolder className={cn("h-full", containerClassName)}>
      <Table
        data={users}
        columns={columns}
        containerClassName={containerClassName}
        footerActions={footerActions}
        height={height}
        query=""
        enableRowSelection={false}
        enableColumnReordering={true}
        enableColumnResizing={true}
        emptyMessage="No at-risk users found"
        getRowId={(row) => String(row.id)}
        headerVariant="light"
      />
    </TableHolder>
  );
};

export default AtRiskUsersTable;
