"use client";

import { User } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import {
  createSelectColumn,
  createIdColumn,
  createNameColumns,
  createStudentFilter,
  TD_BASE,
  createFacialRegistrationColumn,
} from "../table/tableUtils";

export type StudentFilter = {
  department: string;
  program: string;
};

interface IStudentTableProps {
  userList: User[];
  query: string;
  filter?: StudentFilter;
  containerClassname?: string;
  onRowClick?: (user: User) => void;
  onSelectionChange?: (selected: User[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
  isSelectionOnly?: boolean;
  isSingleSelection?: boolean;
}

const StudentTable = ({
  userList = [],
  query,
  filter = { department: "ALL", program: "ALL" },
  containerClassname,
  onRowClick,
  onSelectionChange,
  footerActions,
  height,
  isSelectionOnly = false,
  isSingleSelection = false,
}: IStudentTableProps) => {
  // Filter data to only include students and apply filters
  const filteredData = useMemo(() => {
    return userList.filter((u) => {
      // Only students
      if (!u.student) return false;

      // student filters
      const deptFilter = filter?.department ?? "ALL";
      const progFilter = filter?.program ?? "ALL";

      const matchesDept =
        deptFilter === "ALL" || (u.student?.department ?? "") === deptFilter;
      const matchesProg =
        progFilter === "ALL" || (u.student?.program ?? "") === progFilter;

      return matchesDept && matchesProg;
    });
  }, [userList, filter]);

  // columns definition using utility functions
  const columns: ColumnDef<User, any>[] = [
    createSelectColumn(),
    createIdColumn(),
    ...createNameColumns(),
    {
      id: "department",
      header: "Department",
      accessorFn: (row: User) => row.student?.department ?? "",
      enableSorting: true,
      cell: ({ getValue }) => {
        const department = getValue() as string;
        return <p className={TD_BASE + " truncate"}>{department || "—"}</p>;
      },
    },
    {
      id: "program",
      header: "Program",
      accessorFn: (row: User) => row.student?.program ?? "",
      enableSorting: true,
      cell: ({ getValue }) => {
        const program = getValue() as string;
        return <p className={TD_BASE + " truncate"}>{program || "—"}</p>;
      },
    },
    createFacialRegistrationColumn(),
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
      emptyMessage="No students found."
      customFilter={createStudentFilter}
      getRowId={(row) => row.id}
      isSelectionOnly={isSelectionOnly}
      isSingleSelection={isSingleSelection}
    />
  );
};

export default StudentTable;
