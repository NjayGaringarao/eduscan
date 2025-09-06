"use client";

import { User } from "@/models";
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
import DraggableHeader from "../table/DraggableHeader";
import Loading from "../Loading";

/* Styling constants — keep consistent with your other tables */
const TABLE_WRAPPER =
  "overflow-y-auto overflow-x-hidden rounded-md border border-primary/40";
const TABLE_BASE = "table-fixed w-full select-none bg-transparent";
const TH_SELECT =
  "p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30 sticky top-0 z-10";
const TD_BASE = "p-1 align-middle text-sm text-primary";
const TD_ID = `${TD_BASE} font-mono text-sm truncate max-w-[14rem]`;
const ROW_BASE = "hover:bg-secondary transition-colors";
const ROW_SELECTED = "bg-secondary";

export type EmployeeFilter = {
  type: string;
  division: string;
  title: string;
};

interface IEmployeeTableProps {
  userList: User[];
  query: string;
  filter?: EmployeeFilter;
  containerClassname?: string;
  onRowClick?: (user: User) => void;
  onSelectionChange?: (selected: User[]) => void;
  footerActions?: React.ReactNode;
  height?: string;
}

const EmployeeTable = ({
  userList = [],
  query,
  filter = { type: "ALL", division: "ALL", title: "ALL" },
  containerClassname,
  onRowClick,
  onSelectionChange,
  footerActions,
  height,
}: IEmployeeTableProps) => {
  const [filteredList, setFilteredList] = useState<User[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  // mounted guard so dnd only renders client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filtering — apply query + employee-specific filter
  useEffect(() => {
    const q = (query ?? "").trim().toLowerCase();

    const result = userList.filter((u) => {
      // Only employees
      if (!u.employee) return false;

      // query match (id or full name)
      const fullName = `${u.first_name} ${u.middle_name ?? ""} ${
        u.last_name
      }`.toLowerCase();
      const id = (u.user_id ?? "").toLowerCase();
      const matchesQuery = !q || fullName.includes(q) || id.includes(q);

      // employee filters
      const typeFilter = filter?.type ?? "ALL";
      const divisionFilter = filter?.division ?? "ALL";
      const titleFilter = filter?.title ?? "ALL";

      const matchesType =
        typeFilter === "ALL" || (u.employee?.type ?? "") === typeFilter;
      const matchesDivision =
        divisionFilter === "ALL" ||
        (u.employee?.division ?? "") === divisionFilter;
      const matchesTitle =
        titleFilter === "ALL" || (u.employee?.title ?? "") === titleFilter;

      return matchesQuery && matchesType && matchesDivision && matchesTitle;
    });

    setFilteredList(result);
  }, [userList, query, filter]);

  // clear selection when filtered list changes
  useEffect(() => setRowSelection({}), [filteredList]);

  // columns
  const columns: ColumnDef<User, any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="min-w-4 h-4 accent-primary"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            e.stopPropagation();
            row.toggleSelected();
          }}
          className="min-w-4 h-4 accent-primary"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      size: 28,
    },
    {
      accessorKey: "user_id",
      header: "ID",
      cell: (props) => <p className={TD_ID}>{props.getValue()}</p>,
    },
    {
      accessorKey: "first_name",
      header: "First Name",
      cell: (props) => (
        <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
      ),
    },
    {
      accessorKey: "middle_name",
      header: "Middle Name",
      cell: (props) => (
        <p className={TD_BASE + " truncate"}>{props.getValue() ?? "—"}</p>
      ),
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
      cell: (props) => (
        <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
      ),
    },
    // fixed: department should be employee.division
    {
      id: "division",
      header: "Division",
      accessorFn: (row: User) => row.employee?.division ?? "",
      enableSorting: true,
      cell: ({ getValue }) => {
        const division = getValue() as string;
        return <p className={TD_BASE + " truncate"}>{division || "—"}</p>;
      },
    },
    {
      id: "title",
      header: "Title",
      accessorFn: (row: User) => row.employee?.title ?? "",
      enableSorting: true,
      cell: ({ getValue }) => {
        const title = getValue() as string;
        return <p className={TD_BASE + " truncate"}>{title || "—"}</p>;
      },
    },
  ];

  // table instance
  const table = useReactTable({
    data: filteredList,
    columns,
    state: { sorting, rowSelection, columnOrder },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: setRowSelection,
    enableSorting: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    getRowId: (row) => row.user_id,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  // initialize column order
  useEffect(() => {
    if (columnOrder.length === 0 && table.getAllLeafColumns().length > 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  // notify selection change whenever rowSelection changes
  useEffect(() => {
    onSelectionChange?.(
      table.getSelectedRowModel().rows.map((r) => r.original)
    );
  }, [rowSelection]);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 overflow-hidden h-full",
        containerClassname
      )}
    >
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
                        onClick={() => onRowClick?.(row.original)}
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
          <p className="text-center text-primary/50 italic">
            No employees found.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
