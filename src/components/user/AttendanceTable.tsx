"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import DraggableHeader from "../table/DraggableHeader";
import { cn } from "@/utils/style";
import { UserAttendanceShift } from "@/types";

/* Styling constants (reused from UserTable) */
const TABLE_WRAPPER =
  "overflow-y-auto overflow-x-hidden rounded-md border border-primary/40";
const TABLE_BASE = "table-fixed w-full select-none bg-transparent";
const TD_BASE = "p-1 align-middle text-sm text-primary";
const ROW_BASE = "hover:bg-secondary transition-colors";

interface AttendanceTableProps {
  data: UserAttendanceShift[];
  formatTime: (time: string | null) => string;
}

const AttendanceTable = ({ data, formatTime }: AttendanceTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  // table columns
  const columns: ColumnDef<UserAttendanceShift, any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const [start, end] = row.original.date;

        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;

        let text: string;

        if (endDate) {
          // same month & year → "Aug 25–26, 2025"
          if (
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getFullYear() === endDate.getFullYear()
          ) {
            text = `${startDate.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
            })}-${endDate.getDate()}, ${endDate.getFullYear()}`;
          } else {
            // fallback → "Aug 31, 2025 – Sep 1, 2025"
            text = `${startDate.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })} - ${endDate.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`;
          }
        } else {
          // only one date → "Aug 25, 2025"
          text = startDate.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }

        return <p className={TD_BASE}>{text}</p>;
      },
    },
    {
      accessorKey: "time_in",
      header: "Time In",
      cell: (props) => (
        <p className={TD_BASE}>{formatTime(props.getValue())}</p>
      ),
    },
    {
      accessorKey: "time_out",
      header: "Time Out",
      cell: (props) => (
        <p className={TD_BASE}>{formatTime(props.getValue())}</p>
      ),
    },
    {
      accessorKey: "total_hours",
      header: "Total Hours",
      cell: (props) => (
        <p className={TD_BASE}>
          {props.getValue() !== null ? props.getValue().toFixed(2) : "—"}
        </p>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnOrder },
    enableSorting: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    getRowId: (row) => row.date.join("_"),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  // init column order
  useEffect(() => {
    if (columnOrder.length === 0 && table.getAllLeafColumns().length > 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (active.id !== over?.id) {
          setColumnOrder((prev) => {
            const oldIndex = prev.indexOf(active.id as string);
            const newIndex = prev.indexOf(over?.id as string);
            return arrayMove(prev, oldIndex, newIndex);
          });
        }
      }}
    >
      <SortableContext
        items={table.getAllLeafColumns().map((col) => col.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className={cn(TABLE_WRAPPER, "h-[32rem]")}>
          <table className={TABLE_BASE}>
            <thead className="sticky top-0">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <DraggableHeader key={header.id} header={header} />
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={ROW_BASE}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn("border border-textBody/40", TD_BASE)}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default AttendanceTable;
