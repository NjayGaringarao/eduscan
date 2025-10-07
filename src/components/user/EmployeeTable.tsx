"use client";

import { User } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import {
  createSelectColumn,
  createIdColumn,
  createNameColumns,
  createEmployeeFilter,
  TD_BASE,
} from "../table/tableUtils";

export type EmployeeFilter = {
  type: string;
  division: string;
  title: string;
};

interface IEmployeeTableProps {
  userList: User[];
  query: string;
  filter?: EmployeeFilter;
  containerClassname?: string;
  onRowClick?: (user: User) => void;
  onSelectionChange?: (selected: User[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
  isSelectionOnly?: boolean;
}

const EmployeeTable = ({
  userList = [],
  query,
  filter = { type: "ALL", division: "ALL", title: "ALL" },
  containerClassname,
  onRowClick,
  onSelectionChange,
  footerActions,
  height,
  isSelectionOnly = false,
}: IEmployeeTableProps) => {
  // Filter data to only include employees and apply filters
  const filteredData = useMemo(() => {
    return userList.filter((u) => {
      // Only employees
      if (!u.employee) return false;

      // employee filters
      const typeFilter = filter?.type ?? "ALL";
      const divisionFilter = filter?.division ?? "ALL";
      const titleFilter = filter?.title ?? "ALL";

      const matchesType =
        typeFilter === "ALL" || (u.employee?.type ?? "") === typeFilter;
      const matchesDivision =
        divisionFilter === "ALL" ||
        (u.employee?.division ?? "") === divisionFilter;
      const matchesTitle =
        titleFilter === "ALL" || (u.employee?.title ?? "") === titleFilter;

      return matchesType && matchesDivision && matchesTitle;
    });
  }, [userList, filter]);

  // columns definition using utility functions
  const columns: ColumnDef<User, any>[] = [
    createSelectColumn(),
    createIdColumn(),
    ...createNameColumns(),
    {
      id: "division",
      header: "Division",
      accessorFn: (row: User) => row.employee?.division ?? "",
      enableSorting: true,
      cell: ({ getValue }) => {
        const division = getValue() as string;
        return <p className={TD_BASE + " truncate"}>{division || "—"}</p>;
      },
    },
    {
      id: "title",
      header: "Title",
      accessorFn: (row: User) => row.employee?.title ?? "",
      enableSorting: true,
      cell: ({ getValue }) => {
        const title = getValue() as string;
        return <p className={TD_BASE + " truncate"}>{title || "—"}</p>;
      },
    },
  ];

  return (
    <Table
      data={filteredData}
      columns={columns}
      query={query}
      containerClassName={containerClassname}
      onRowClick={onRowClick}
      onSelectionChange={onSelectionChange}
      footerActions={footerActions}
      height={height}
      emptyMessage="No employees found."
      customFilter={createEmployeeFilter}
      getRowId={(row) => row.user_id}
      isSelectionOnly={isSelectionOnly}
    />
  );
};

export default EmployeeTable;
