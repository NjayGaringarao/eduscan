import { ColumnDef } from "@tanstack/react-table";
import { User, Schedule } from "@/models";

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
export const createSelectColumn = <T,>(): ColumnDef<T, any> => ({
  id: "select",
  header: ({ table }) => (
    <div className="flex justify-center items-center">
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        className="w-4 h-4 accent-primary"
        aria-label="Select all"
      />
    </div>
  ),
  cell: ({ row }) => (
    <div className="flex justify-center items-center">
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => {
          e.stopPropagation();
          row.toggleSelected();
        }}
        className="w-4 h-4 accent-primary"
        aria-label="Select row"
      />
    </div>
  ),
  enableSorting: false,
  size: 28,
  enableResizing: false,
});

export const createIdColumn = (): ColumnDef<User, any> => ({
  accessorKey: "id",
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
  const id = (user.id ?? "").toLowerCase();

  return fullName.includes(q) || id.includes(q) || role.includes(q);
};

export const createStudentFilter = (user: User, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullName = `${user.first_name} ${user.middle_name ?? ""} ${
    user.last_name
  }`.toLowerCase();
  const id = (user.id ?? "").toLowerCase();

  return fullName.includes(q) || id.includes(q);
};

export const createEmployeeFilter = (user: User, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fullName = `${user.first_name} ${user.middle_name ?? ""} ${
    user.last_name
  }`.toLowerCase();
  const id = (user.id ?? "").toLowerCase();

  return fullName.includes(q) || id.includes(q);
};

// Schedule-specific utility functions
export const createScheduleFilter = (schedule: Schedule, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const name = (schedule.name ?? "").toLowerCase();
  const description = (schedule.description ?? "").toLowerCase();
  const userType = (schedule.user_type ?? "").toLowerCase();

  return name.includes(q) || description.includes(q) || userType.includes(q);
};

export const createScheduleColumns = (): ColumnDef<Schedule, any>[] => [
  createSelectColumn<Schedule>(),

  {
    accessorKey: "name",
    header: "Name",
    cell: (props) => (
      <p className={TD_BASE + " truncate font-medium"}>{props.getValue()}</p>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (props) => (
      <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
    ),
  },
  {
    accessorKey: "user_type",
    header: "User Type",
    cell: (props) => (
      <p className={TD_BASE + " truncate"}>{props.getValue()}</p>
    ),
  },
  {
    id: "users",
    accessorKey: "users",
    header: "Users",
    cell: (props) => {
      const userCount = props.getValue() as number;
      return (
        <p className={TD_BASE + " truncate"}>
          {userCount > 0
            ? `${userCount} user${userCount === 1 ? "" : "s"}`
            : "No users"}
        </p>
      );
    },
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
  },
];
