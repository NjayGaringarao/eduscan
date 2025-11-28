"use client";

import { User } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import Table from "../table/Table";
import {
  createSelectColumn,
  createIdColumn,
  createNameColumns,
  createRoleColumn,
  createUserFilter,
  createFacialRegistrationColumn,
} from "../table/tableUtils";

interface IUserTableProps {
  userList: User[];
  query: string;
  containerClassname?: string;
  onRowClick?: (user: User) => void;
  onSelectionChange?: (selected: User[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
  isSelectionOnly?: boolean;
}

const UserTable = ({
  userList = [],
  query,
  containerClassname,
  onRowClick,
  onSelectionChange,
  footerActions,
  height,
  isSelectionOnly = false,
}: IUserTableProps) => {
  // columns definition using utility functions
  const columns: ColumnDef<User, any>[] = [
    createSelectColumn(),
    createIdColumn(),
    ...createNameColumns(),
    createRoleColumn(),
    createFacialRegistrationColumn(),
  ];

  return (
    <Table
      data={userList}
      columns={columns}
      query={query}
      containerClassName={containerClassname}
      onRowClick={onRowClick}
      onSelectionChange={onSelectionChange}
      footerActions={footerActions}
      height={height}
      emptyMessage="No users found."
      customFilter={createUserFilter}
      getRowId={(row) => row.id}
      isSelectionOnly={isSelectionOnly}
    />
  );
};

export default UserTable;
