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
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import DraggableHeader from "./DraggableHeader";
import Loading from "../Loading";
import {
  HEADER_TH_BASE,
  ROW_BASE,
  ROW_SELECTED,
  TABLE_BASE,
  TABLE_WRAPPER,
  TH_SELECT,
  TD_BASE,
} from "./class";

/* Styling constants */

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
  enableColumnReordering?: boolean;
  getRowId?: (row: TData) => string;
  customFilter?: (row: TData, query: string) => boolean;
  isSelectionOnly?: boolean;
  isSingleSelection?: boolean;
  headerVariant?: "default" | "light";
}

const resolveColumnId = <TData,>(
  column: ColumnDef<TData, any>,
  index: number
) => {
  if (column.id) return column.id;

  if ("accessorKey" in column) {
    const key = column.accessorKey;
    if (typeof key === "string" && key.length) {
      return key;
    }
  }

  if (
    "header" in column &&
    typeof column.header === "string" &&
    column.header.length
  ) {
    return column.header;
  }

  return `col-${index}`;
};

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
  enableColumnReordering = true,
  getRowId,
  customFilter,
  isSelectionOnly = false,
  isSingleSelection = false,
  headerVariant = "default",
}: TableProps<TData>) => {
  const [filteredList, setFilteredList] = useState<TData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 🧩 FIX: Initialize column order once (avoid reinit loop)
  const defaultColumnOrder = useMemo(
    () => columns.map((col, idx) => resolveColumnId(col, idx)),
    [columns]
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);

  useEffect(() => {
    setColumnOrder(defaultColumnOrder);
  }, [defaultColumnOrder]);

  const sensors = useSensors(useSensor(PointerSensor));
  const headerVariantClass = useMemo(() => {
    if (headerVariant === "light") {
      return "bg-background text-primary";
    }
    return "bg-textBody text-background";
  }, [headerVariant]);
  const draggableHeaderClass = headerVariantClass;

  // mounted guard
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
      const filtered = data.filter((row) =>
        Object.values(row as any).some((value) =>
          typeof value === "string" ? value.toLowerCase().includes(q) : false
        )
      );
      setFilteredList(filtered);
    }
  }, [query, data, customFilter]);

  // 🧩 FIX: Only clear selection when data size changes (avoid re-render loop)
  const prevCount = useRef(filteredList.length);
  useEffect(() => {
    if (filteredList.length !== prevCount.current) {
      setRowSelection({});
      prevCount.current = filteredList.length;
    }
  }, [filteredList.length]);

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

  // 🧩 FIX: Memoize onSelectionChange call
  const notifySelectionChange = useCallback(() => {
    if (!onSelectionChange) return;
    const selected = table.getSelectedRowModel().rows.map((r) => r.original);
    onSelectionChange(selected);
  }, [onSelectionChange, table]);

  useEffect(() => {
    notifySelectionChange();
  }, [rowSelection, notifySelectionChange]);

  // Table rendering
  const renderTable = () => (
    <div className={cn(TABLE_WRAPPER, height)}>
      <table className={TABLE_BASE}>
        <thead className="sticky top-0">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) =>
                header.column.id === "select" ? (
                  <th
                    key={header.id}
                    className={cn(TH_SELECT, headerVariantClass)}
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ) : enableColumnReordering ? (
                  <DraggableHeader
                    key={header.id}
                    header={header}
                    headerClassName={draggableHeaderClass}
                  />
                ) : (
                  <th
                    key={header.id}
                    className={cn(HEADER_TH_BASE, headerVariantClass)}
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
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
                    table.resetRowSelection();
                    row.toggleSelected(true);
                  } else if (isSelectionOnly) {
                    row.toggleSelected(!row.getIsSelected());
                  } else {
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
                        isSelectCell ? (e) => e.stopPropagation() : undefined
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
  );

  return (
    <div className={cn("flex flex-col gap-4", containerClassName)}>
      {mounted ? (
        enableColumnReordering ? (
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
              {renderTable()}
            </SortableContext>
          </DndContext>
        ) : (
          renderTable()
        )
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
