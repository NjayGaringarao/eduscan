"use client";

import { Schedule } from "@/models";
import React, { useMemo } from "react";
import Table from "../table/Table";
import { createScheduleFilter, createSelectColumn } from "../table/tableUtils";
import { TD_BASE } from "../table/class";

interface IScheduleTableProps {
  scheduleList: Schedule[];
  query: string;
  containerClassname?: string;
  onRowClick?: (schedule: Schedule) => void;
  onSelectionChange?: (selected: Schedule[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
  isSingleSelection?: boolean;
}

const ScheduleTable = ({
  scheduleList = [],
  query,
  containerClassname,
  onRowClick,
  onSelectionChange,
  footerActions,
  height,
  isSingleSelection = false,
}: IScheduleTableProps) => {
  // Use the schedule columns from tableUtils
  const columns = useMemo(
    () => [
      createSelectColumn<Schedule>(),

      {
        accessorKey: "name",
        header: "Name",
        cell: (props) => (
          <p className={TD_BASE + " truncate font-medium"}>
            {props.getValue()}
          </p>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (props) => (
          <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: (props) => {
          const date = new Date(props.getValue() as string);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return <p className={TD_BASE + " truncate"}>{formattedDate}</p>;
        },
      },
      {
        id: "users",
        accessorKey: "users",
        header: "Users",
        cell: (props) => {
          const userCount = props.getValue() as number;
          return (
            <p className={TD_BASE + " truncate"}>
              {userCount > 0
                ? `${userCount} user${userCount === 1 ? "" : "s"}`
                : "No users"}
            </p>
          );
        },
      },
    ],
    []
  );

  return (
    <Table
      data={scheduleList}
      columns={columns}
      query={query}
      containerClassName={containerClassname}
      onRowClick={onRowClick}
      onSelectionChange={onSelectionChange}
      footerActions={footerActions}
      height={height}
      emptyMessage="No Schedules Found."
      customFilter={createScheduleFilter}
      getRowId={(row) => row.id}
      isSingleSelection={isSingleSelection}
    />
  );
};

export default ScheduleTable;
