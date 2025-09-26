"use client";

import { Announcement } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import {
  createAnnouncementColumns,
  createAnnouncementFilter,
} from "../table/tableUtils";

interface IAnnouncementTableProps {
  announcementList: Announcement[];
  query?: string;
  containerClassName?: string;
  onRowClick?: (announcement: Announcement) => void;
  footerActions?: React.ReactNode;
  height?: string;
}

const AnnouncementTable = ({
  announcementList = [],
  query = "",
  containerClassName,
  onRowClick,
  footerActions,
  height,
}: IAnnouncementTableProps) => {
  // Filter announcements by date range and role
  const filteredData = useMemo(() => {
    return announcementList;
  }, [announcementList]);

  // columns definition using utility functions
  const columns: ColumnDef<Announcement, any>[] = createAnnouncementColumns();

  return (
    <Table
      data={filteredData}
      columns={columns}
      query={query}
      containerClassName={containerClassName}
      onRowClick={onRowClick}
      footerActions={footerActions}
      height={height}
      emptyMessage="No announcements found."
      customFilter={createAnnouncementFilter}
      getRowId={(row) => row.announcement_id}
      enableRowSelection={false}
      enableMultiRowSelection={false}
    />
  );
};

export default AnnouncementTable;
