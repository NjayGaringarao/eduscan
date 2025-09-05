"use client";

import { useEffect, useState } from "react";
import { User } from "@/models";
import * as userDB from "@/database/user";
import UserTable from "./UserTable";
import StudentTable from "./StudentTable";
import EmployeeTable from "./EmployeeTable";
import { cn } from "@/utils/style";
import TextBox from "../TextBox";
import Button from "../Button";
import Select from "../Select";
import Loading from "../Loading";
import { RefreshCcw } from "lucide-react";
import { roleOptions } from "@/constants/role"; // adjust path if needed
import ModalUser from "./ModalUser";

type StudentFilter = {
  department: string;
  program: string;
};

type EmployeeFilter = {
  type: string;
  division: string;
  title: string;
};

const TableController = () => {
  const [userType, setUserType] = useState("ALL");
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<User[]>([]);
  const [onViewingUser, setOnViewingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [studentFilter, setStudentFilter] = useState<StudentFilter>({
    department: "ALL",
    program: "ALL",
  });

  const [employeeFilter, setEmployeeFilter] = useState<EmployeeFilter>({
    type: "ALL",
    division: "ALL",
    title: "ALL",
  });

  const fetchUserList = async (userType?: string) => {
    setIsLoading(true);
    const { users, error } = await userDB.getAll(userType);
    if (error) alert(error);

    setUserList(users || []);
    setSelected([]);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Confirm Delete: Are you sure you want to delete this user?"))
      return;

    const { error } = await userDB.deleteUsers(selected);
    if (error) {
      alert(error);
    }
    await fetchUserList();
  };

  useEffect(() => {
    // when userType changes, refresh list and reset filters + selection
    fetchUserList(userType);
    setSelected([]);
    setOnViewingUser(null);

    // reset filters when switching type
    setStudentFilter({ department: "ALL", program: "ALL" });
    setEmployeeFilter({ type: "ALL", division: "ALL", title: "ALL" });
  }, [userType]);

  // helpers to get dynamic options from roleOptions
  const studentDepartments = Object.keys(
    roleOptions.STUDENT.departments
  ) as (keyof typeof roleOptions.STUDENT.departments)[];
  const studentProgramsForDept = (dept: string) => {
    if (dept === "ALL") return [] as string[];
    const key = dept as keyof typeof roleOptions.STUDENT.departments;
    return roleOptions.STUDENT.departments[key] ?? [];
  };

  const employeeTypes = Object.keys(
    roleOptions.EMPLOYEE.types
  ) as (keyof typeof roleOptions.EMPLOYEE.types)[];
  const employeeDivisionsForType = (type: string) => {
    if (type === "ALL") return [] as string[];
    const key = type as keyof typeof roleOptions.EMPLOYEE.types;
    const typeEntry = roleOptions.EMPLOYEE.types[key] as any;
    // typeEntry.division is object
    return typeEntry?.division ? Object.keys(typeEntry.division) : [];
  };
  const employeeTitlesForDivision = (type: string, division: string) => {
    if (type === "ALL" || division === "ALL") return [] as string[];
    const typeKey = type as keyof typeof roleOptions.EMPLOYEE.types;
    const typeEntry = roleOptions.EMPLOYEE.types[typeKey] as any;
    const titles: string[] =
      (typeEntry?.division?.[division] as string[]) ?? [];
    return titles;
  };

  return (
    <div className="relative h-full w-full">
      <div
        className={cn(
          "relative max-w-full h-full rounded-xl p-6",
          "bg-background/70 backdrop-blur-lg border border-primary/20",
          "flex flex-col items-start gap-4"
        )}
      >
        <div className="flex flex-row gap-4 w-full justify-between">
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-5 gap-1 items-center w-fit">
              {/** SEARCH BAR AND REFRESH */}
              <div className="col-span-5 w-full flex flex-row items-center gap-4">
                <TextBox
                  value={searchQuery}
                  setValue={setSearchQuery}
                  placeHolder={"Search user..."}
                  containerClassName="w-full"
                />

                <Button
                  secondary
                  onClick={() => fetchUserList(userType)}
                  disabled={isLoading}
                >
                  <RefreshCcw
                    className={cn(
                      "w-5 h-5 text-primary",
                      isLoading && "animate-spin"
                    )}
                  />
                </Button>
              </div>

              {/** FILTER */}
              <p className="text-sm text-primary/80 w-full  ">
                Filter By Affiliation
              </p>
              <Select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className={cn(
                  "min-w-30 w-30 p-1 rounded-sm",
                  "text-xs text-primary",
                  "bg-background shadow-textBody/60 shadow-sm"
                )}
                title="Filter by type"
              >
                <option value="ALL">ALL USER</option>
                <option value="STUDENT">STUDENT</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
              </Select>

              {/* STUDENT filters */}
              {userType === "STUDENT" && (
                <>
                  <Select
                    value={studentFilter.department}
                    onChange={(e) =>
                      setStudentFilter({
                        ...studentFilter,
                        department: e.target.value,
                        program: "ALL", // reset program when dept changes
                      })
                    }
                    className={cn(
                      "min-w-30 w-30 p-1 rounded-sm",
                      "text-xs text-primary",
                      "bg-background shadow-textBody/60 shadow-sm"
                    )}
                    title="Filter by department"
                  >
                    <option value="ALL">ALL DEPT</option>
                    {studentDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={studentFilter.program}
                    onChange={(e) =>
                      setStudentFilter({
                        ...studentFilter,
                        program: e.target.value,
                      })
                    }
                    className={cn(
                      "min-w-30 w-30 p-1 rounded-sm",
                      "text-xs text-primary",
                      "bg-background shadow-textBody/60 shadow-sm"
                    )}
                    title="Filter by program"
                  >
                    <option value="ALL">ALL PROG</option>
                    {studentProgramsForDept(studentFilter.department).map(
                      (prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      )
                    )}
                  </Select>
                </>
              )}
              {/* EMPLOYEE progressive filters */}
              {userType === "EMPLOYEE" && (
                <>
                  <Select
                    value={employeeFilter.type}
                    onChange={(e) =>
                      setEmployeeFilter({
                        type: e.target.value,
                        division: "ALL",
                        title: "ALL",
                      })
                    }
                    className={cn(
                      "min-w-30 w-30 p-1 rounded-sm",
                      "text-xs text-primary",
                      "bg-background shadow-textBody/60 shadow-sm"
                    )}
                    title="Filter by type"
                  >
                    <option value="ALL">ALL TYPES</option>
                    {employeeTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>

                  {/* show division only when a type is selected */}
                  {employeeFilter.type !== "ALL" && (
                    <Select
                      value={employeeFilter.division}
                      onChange={(e) =>
                        setEmployeeFilter({
                          ...employeeFilter,
                          division: e.target.value,
                          title: "ALL",
                        })
                      }
                      className={cn(
                        "min-w-30 w-30 p-1 rounded-sm",
                        "text-xs text-primary",
                        "bg-background shadow-textBody/60 shadow-sm"
                      )}
                      title="Filter by division"
                    >
                      <option value="ALL">ALL DIVISION</option>
                      {employeeDivisionsForType(employeeFilter.type).map(
                        (div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        )
                      )}
                    </Select>
                  )}

                  {/* show title only when division selected */}
                  {employeeFilter.division !== "ALL" && (
                    <Select
                      value={employeeFilter.title}
                      onChange={(e) =>
                        setEmployeeFilter({
                          ...employeeFilter,
                          title: e.target.value,
                        })
                      }
                      className={cn(
                        "min-w-30 w-30 p-1 rounded-sm",
                        "text-xs text-primary",
                        "bg-background shadow-textBody/60 shadow-sm"
                      )}
                      title="Filter by title"
                    >
                      <option value="ALL">ALL TITLE</option>
                      {employeeTitlesForDivision(
                        employeeFilter.type,
                        employeeFilter.division
                      ).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative overflow-x-auto h-full w-full",
            "flex flex-col items-start gap-4"
          )}
        >
          {userType === "STUDENT" ? (
            <StudentTable
              userList={userList}
              query={searchQuery}
              onRowClick={(u) => setOnViewingUser(u)}
              onSelectionChange={setSelected}
              filter={studentFilter}
            />
          ) : userType === "EMPLOYEE" ? (
            <EmployeeTable
              userList={userList}
              query={searchQuery}
              onRowClick={(u) => setOnViewingUser(u)}
              onSelectionChange={setSelected}
              filter={employeeFilter}
            />
          ) : (
            <UserTable
              userList={userList}
              query={searchQuery}
              onRowClick={(u) => setOnViewingUser(u)}
              onSelectionChange={setSelected}
            />
          )}

          {selected.length > 0 && (
            <div className="place-self-end bg-background p-4 w-full flex justify-between items-center shadow-md z-50 rounded-md border border-primary">
              <p className="text-base text-uGrayLight">
                {selected.length} selected
              </p>
              <Button
                title="Delete Selected"
                className="bg-error"
                onClick={handleDelete}
              />
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
              <Loading prompt="Please wait..." />
            </div>
          )}

          <ModalUser
            onViewUser={onViewingUser}
            onClose={() => setOnViewingUser(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default TableController;
