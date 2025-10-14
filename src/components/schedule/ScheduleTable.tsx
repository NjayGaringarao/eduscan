"use client";

import { Schedule } from "@/models";
import React, { useMemo } from "react";
import Table from "../table/Table";
import {
  createScheduleFilter,
  createScheduleColumns,
} from "../table/tableUtils";

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
  const columns = useMemo(() => createScheduleColumns(), []);

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
      emptyMessage="No schedules found."
      customFilter={createScheduleFilter}
      getRowId={(row) => row.schedule_id}
      isSingleSelection={isSingleSelection}
    />
  );
};

export default ScheduleTable;
