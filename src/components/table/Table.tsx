"use client";

import { cn } from "@/utils/style";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useState } from "react";
import DraggableHeader from "./DraggableHeader";
import Loading from "../Loading";

/* Styling constants — consistent across all tables */
const TABLE_WRAPPER = "rounded-md";
const TABLE_BASE = "table-fixed w-full select-none bg-transparent";
const TH_SELECT =
  "p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30 sticky top-0 z-10";
const TD_BASE = "p-1 align-middle text-sm text-primary";
// const TD_ID = `${TD_BASE} font-mono text-sm truncate max-w-[14rem]`; // Moved to tableUtils.tsx
const ROW_BASE = "hover:bg-secondary transition-colors";
const ROW_SELECTED = "bg-primary/10";

export interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  query?: string;
  containerClassName?: string;
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selected: TData[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
  emptyMessage?: string;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableSorting?: boolean;
  enableColumnResizing?: boolean;
  getRowId?: (row: TData) => string;
  customFilter?: (row: TData, query: string) => boolean;
  isSelectionOnly?: boolean;
  isSingleSelection?: boolean;
}

const Table = <TData,>({
  data = [],
  columns,
  query = "",
  containerClassName,
  onRowClick,
  onSelectionChange,
  footerActions,
  height,
  emptyMessage = "No data found.",
  enableRowSelection = true,
  enableMultiRowSelection = true,
  enableSorting = true,
  enableColumnResizing = true,
  getRowId,
  customFilter,
  isSelectionOnly = false,
  isSingleSelection = false,
}: TableProps<TData>) => {
  const [filteredList, setFilteredList] = useState<TData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  // mounted guard so dnd only renders client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filtering logic
  useEffect(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) {
      setFilteredList(data);
      return;
    }

    if (customFilter) {
      const filtered = data.filter((row) => customFilter(row, q));
      setFilteredList(filtered);
    } else {
      // Default filtering - search in string values
      const filtered = data.filter((row) => {
        return Object.values(row as any).some((value) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(q);
          }
          return false;
        });
      });
      setFilteredList(filtered);
    }
  }, [query, data, customFilter]);

  // clear selection when filtered list changes
  useEffect(() => setRowSelection({}), [filteredList]);

  // table instance
  const table = useReactTable({
    data: filteredList,
    columns,
    state: { sorting, rowSelection, columnOrder },
    enableRowSelection,
    enableMultiRowSelection,
    onRowSelectionChange: setRowSelection,
    enableSorting,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    getRowId,
    columnResizeMode: "onChange",
    enableColumnResizing,
  });

  // initialize column order
  useEffect(() => {
    if (columnOrder.length === 0 && table.getAllLeafColumns().length > 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  // notify selection change
  useEffect(() => {
    onSelectionChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original)
    );
  }, [rowSelection, onSelectionChange]);

  return (
    <div className={cn("flex flex-col gap-4", containerClassName)}>
      {mounted ? (
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
            items={table
              .getAllLeafColumns()
              .filter((col) => col.id !== "select")
              .map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className={cn(TABLE_WRAPPER, height)}>
              <table className={TABLE_BASE}>
                <thead className="sticky top-0">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) =>
                        header.column.id === "select" ? (
                          <th
                            key={header.id}
                            className={TH_SELECT}
                            style={{ width: header.getSize() }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ) : (
                          <DraggableHeader key={header.id} header={header} />
                        )
                      )}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {table.getRowModel().rows.map((row) => {
                    const rowClass = cn(
                      ROW_BASE,
                      row.getIsSelected() ? ROW_SELECTED : ""
                    );
                    return (
                      <tr
                        key={row.id}
                        className={rowClass}
                        onClick={() => {
                          if (isSingleSelection) {
                            // Single selection: clear all and select only this row
                            table.resetRowSelection();
                            row.toggleSelected(true);
                          } else if (isSelectionOnly) {
                            // Toggle row selection when isSelectionOnly is true
                            const isSelected = row.getIsSelected();
                            if (isSelected) {
                              row.toggleSelected(false);
                            } else {
                              row.toggleSelected(true);
                            }
                          } else {
                            // Call onRowClick when isSelectionOnly is false
                            onRowClick?.(row.original);
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isSelectCell = cell.column.id === "select";
                          const tdClass = cn(
                            "border border-textBody/40",
                            isSelectCell ? "p-3" : TD_BASE
                          );
                          return (
                            <td
                              key={cell.id}
                              className={tdClass}
                              style={{ width: cell.column.getSize() }}
                              onClick={
                                isSelectCell
                                  ? (e) => e.stopPropagation()
                                  : undefined
                              }
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Loading />
      )}

      {footerActions && (
        <div className="flex justify-end gap-2 pt-2">{footerActions}</div>
      )}

      {filteredList.length === 0 && (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-center text-primary/50 italic py-24">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default Table;
