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
  onSelectionChange?: (selected: Schedule[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
}

const ScheduleTable = ({
  scheduleList = [],
  query = "",
  containerClassName,
  onRowClick,
  onSelectionChange,
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
      onSelectionChange={onSelectionChange}
      footerActions={footerActions}
      height={height}
      emptyMessage="No schedules found."
      customFilter={createScheduleFilter}
      getRowId={(row) => row.schedule_id}
      enableRowSelection={true}
      enableMultiRowSelection={true}
    />
  );
};

export default ScheduleTable;
