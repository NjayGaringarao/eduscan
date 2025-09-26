import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/models";

// Common styling constants
export const TABLE_WRAPPER = "rounded-md";
export const TABLE_BASE = "table-fixed w-full select-none bg-transparent";
export const TH_SELECT =
  "p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30 sticky top-0 z-10";
export const TD_BASE = "p-1 align-middle text-sm text-primary";
export const TD_ID = `${TD_BASE} font-mono text-sm truncate max-w-[14rem]`;
export const ROW_BASE = "hover:bg-secondary transition-colors";
export const ROW_SELECTED = "bg-secondary";

// Common column definitions
export const createSelectColumn = (): ColumnDef<User, any> => ({
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
});

export const createIdColumn = (): ColumnDef<User, any> => ({
  accessorKey: "user_id",
  header: "ID",
  cell: (props) => <p className={TD_ID}>{props.getValue()}</p>,
});

export const createNameColumns = (): ColumnDef<User, any>[] => [
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
];

export const createRoleColumn = (): ColumnDef<User, any> => ({
  id: "role",
  accessorFn: (row: User) => row.student ?? row.employee ?? "",
  header: "Role",
  cell: ({ row }) => {
    const user = row.original;
    let role = "UNKNOWN";
    if (user.student) role = "STUDENT";
    else if (user.employee) role = "EMPLOYEE";
    else if (user.guardian) role = "GUARDIAN";

    return <p className={TD_BASE + " truncate"}>{role}</p>;
  },
});

// Common filtering functions
export const createUserFilter = (user: User, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const role = user.student
    ? "student"
    : user.employee
    ? "employee"
    : user.guardian
    ? "guardian"
    : "unknown";
  const fullName = `${user.first_name} ${user.middle_name ?? ""} ${
    user.last_name
  }`.toLowerCase();
  const id = (user.user_id ?? "").toLowerCase();

  return fullName.includes(q) || id.includes(q) || role.includes(q);
};

export const createStudentFilter = (user: User, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullName = `${user.first_name} ${user.middle_name ?? ""} ${
    user.last_name
  }`.toLowerCase();
  const id = (user.user_id ?? "").toLowerCase();

  return fullName.includes(q) || id.includes(q);
};

export const createEmployeeFilter = (user: User, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullName = `${user.first_name} ${user.middle_name ?? ""} ${
    user.last_name
  }`.toLowerCase();
  const id = (user.user_id ?? "").toLowerCase();

  return fullName.includes(q) || id.includes(q);
};
