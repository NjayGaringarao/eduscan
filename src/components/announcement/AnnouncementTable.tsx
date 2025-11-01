"use client";

import { Announcement } from "@/models";
import { ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import Table from "../table/Table";
import { TD_BASE } from "../table/class";

interface IAnnouncementTableProps {
  announcementList: Announcement[];
  query?: string;
  containerClassName?: string;
  onRowClick?: (announcement: Announcement) => void;
  footerActions?: React.ReactNode;
  height?: string;
  role?: string;
  fromDate?: string;
  toDate?: string;
}

const createAnnouncementColumns = (): ColumnDef<Announcement, any>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: (props) => (
      <p className={TD_BASE + " truncate font-medium"}>{props.getValue()}</p>
    ),
    size: 50,
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: (props) => (
      <p className={TD_BASE + " truncate font-medium"}>{props.getValue()}</p>
    ),
  },
  {
    accessorKey: "recipient",
    header: "Recipient",
    cell: (props) => (
      <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
    ),
    size: 40,
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
    size: 80,
  },
];

// Announcement-specific utility functions
const createAnnouncementFilter = (
  announcement: Announcement,
  query: string
) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const title = (announcement.title ?? "").toLowerCase();
  const message = (announcement.message ?? "").toLowerCase();
  const recipient = (announcement.recipient ?? "").toLowerCase();

  return title.includes(q) || message.includes(q) || recipient.includes(q);
};

const AnnouncementTable = ({
  announcementList = [],
  role = "ALL",
  fromDate = "",
  toDate = "",
  query = "",
  containerClassName,
  onRowClick,
  footerActions,
  height,
}: IAnnouncementTableProps) => {
  // Filter announcements by date range and role
  const filteredData = useMemo(() => {
    return announcementList.filter((ann) => {
      // Filter by role
      const roleMatch = role === "ALL" || ann.recipient === role;

      // Filter by date range (skip if dates are empty, meaning "all dates")
      let dateMatch = true;
      if (fromDate && toDate) {
        const announcementDate = new Date(ann.created_at);
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        
        // Set time to start of day for fromDate and end of day for toDate for proper comparison
        fromDateObj.setHours(0, 0, 0, 0);
        toDateObj.setHours(23, 59, 59, 999);
        announcementDate.setHours(0, 0, 0, 0);

        dateMatch =
          announcementDate >= fromDateObj && announcementDate <= toDateObj;
      }

      return roleMatch && dateMatch;
    });
  }, [announcementList, role, fromDate, toDate]);

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
      getRowId={(row) => row.id}
      enableRowSelection={false}
      enableMultiRowSelection={false}
    />
  );
};

export default AnnouncementTable;
