"use client";

import { Schedule } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import {
  createScheduleColumns,
  createScheduleFilter,
} from "../table/tableUtils";

interface IScheduleTableProps {
  scheduleList: Schedule[];
  query?: string;
  containerClassName?: string;
  onRowClick?: (schedule: Schedule) => void;
  footerActions?: React.ReactNode;
  height?: string;
}

const ScheduleTable = ({
  scheduleList = [],
  query = "",
  containerClassName,
  onRowClick,
  footerActions,
  height,
}: IScheduleTableProps) => {
  // Filter schedules by user type
  const filteredData = useMemo(() => {
    return scheduleList;
  }, [scheduleList]);

  // columns definition using utility functions
  const columns: ColumnDef<Schedule, any>[] = createScheduleColumns();

  return (
    <Table
      data={filteredData}
      columns={columns}
      query={query}
      containerClassName={containerClassName}
      onRowClick={onRowClick}
      footerActions={footerActions}
      height={height}
      emptyMessage="No schedules found."
      customFilter={createScheduleFilter}
      getRowId={(row) => row.schedule_id}
      enableRowSelection={false}
      enableMultiRowSelection={false}
    />
  );
};

export default ScheduleTable;
