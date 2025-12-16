"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { SessionLog } from "@/models";
import { getSessionLog, downloadSessionLog } from "@/lib/session_log";
import { downloadBufferAsPdf } from "@/utils/downloadClient";
import SessionLogTable from "./SessionLogTable";
import { cn } from "@/utils/style";
import TextBox from "../TextBox";
import Button from "../Button";
import Select from "../Select";
import Loading from "../Loading";
import { RefreshCcw, Download } from "lucide-react";
import { roleOptions } from "@/constants/role";
import Box from "../container/Box";
import TableHolder from "../container/TableHolder";
import DatePicker from "../DatePicker";

type StudentFilter = {
  department: string;
  program: string;
};

type EmployeeFilter = {
  type: string;
  division: string;
  title: string;
};

const SessionLogManagement = () => {
  // Get today's date in ISO format (YYYY-MM-DD)
  const today = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [userType, setUserType] = useState("ALL");
  const [sessionList, setSessionList] = useState<SessionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const fetchSessionList = useCallback(async () => {
    setIsLoading(true);
    const { sessions, error } = await getSessionLog({
      date: selectedDate,
      userType: userType !== "ALL" ? userType : undefined,
      studentDepartment:
        userType === "STUDENT" && studentFilter.department !== "ALL"
          ? studentFilter.department
          : undefined,
      studentProgram:
        userType === "STUDENT" &&
        studentFilter.department !== "ALL" &&
        studentFilter.program !== "ALL"
          ? studentFilter.program
          : undefined,
      employeeType:
        userType === "EMPLOYEE" && employeeFilter.type !== "ALL"
          ? employeeFilter.type
          : undefined,
      employeeDivision:
        userType === "EMPLOYEE" &&
        employeeFilter.type !== "ALL" &&
        employeeFilter.division !== "ALL"
          ? employeeFilter.division
          : undefined,
      employeeTitle:
        userType === "EMPLOYEE" &&
        employeeFilter.type !== "ALL" &&
        employeeFilter.division !== "ALL" &&
        employeeFilter.title !== "ALL"
          ? employeeFilter.title
          : undefined,
    });

    if (error) {
      alert(error);
    }

    setSessionList(sessions || []);
    setIsLoading(false);
  }, [selectedDate, userType, studentFilter, employeeFilter]);

  useEffect(() => {
    // Reset filters when switching user type
    setStudentFilter({ department: "ALL", program: "ALL" });
    setEmployeeFilter({ type: "ALL", division: "ALL", title: "ALL" });
  }, [userType]);

  useEffect(() => {
    // Fetch sessions when date or filters change
    fetchSessionList();
  }, [fetchSessionList]);

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

  const generateFilename = (): string => {
    const parts = [`Session-Log-${selectedDate}`, userType];

    if (userType === "STUDENT") {
      if (studentFilter.department !== "ALL") {
        parts.push(studentFilter.department);
      }
      if (
        studentFilter.department !== "ALL" &&
        studentFilter.program !== "ALL"
      ) {
        parts.push(studentFilter.program);
      }
    } else if (userType === "EMPLOYEE") {
      if (employeeFilter.type !== "ALL") {
        parts.push(employeeFilter.type);
      }
      if (employeeFilter.type !== "ALL" && employeeFilter.division !== "ALL") {
        parts.push(employeeFilter.division);
      }
      if (
        employeeFilter.type !== "ALL" &&
        employeeFilter.division !== "ALL" &&
        employeeFilter.title !== "ALL"
      ) {
        parts.push(employeeFilter.title);
      }
    }

    return `${parts.join("-")}.pdf`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { buffer, error } = await downloadSessionLog({
        date: selectedDate,
        userType: userType !== "ALL" ? userType : undefined,
        studentDepartment:
          userType === "STUDENT" && studentFilter.department !== "ALL"
            ? studentFilter.department
            : undefined,
        studentProgram:
          userType === "STUDENT" &&
          studentFilter.department !== "ALL" &&
          studentFilter.program !== "ALL"
            ? studentFilter.program
            : undefined,
        employeeType:
          userType === "EMPLOYEE" && employeeFilter.type !== "ALL"
            ? employeeFilter.type
            : undefined,
        employeeDivision:
          userType === "EMPLOYEE" &&
          employeeFilter.type !== "ALL" &&
          employeeFilter.division !== "ALL"
            ? employeeFilter.division
            : undefined,
        employeeTitle:
          userType === "EMPLOYEE" &&
          employeeFilter.type !== "ALL" &&
          employeeFilter.division !== "ALL" &&
          employeeFilter.title !== "ALL"
            ? employeeFilter.title
            : undefined,
      });

      if (error || !buffer) {
        alert(error ?? "Failed to generate PDF");
        return;
      }

      const filename = generateFilename();
      downloadBufferAsPdf(buffer, filename, (downloadError) => {
        alert(`Download failed: ${downloadError}`);
      });
    } catch (err: any) {
      console.error("Session log download failed", err);
      alert("An unexpected error occurred while downloading.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/** DATA CONTROLLER */}
      <Box containerClassName="flex flex-row gap-4 w-full justify-between items-center">
        <div className="flex flex-row justify-between gap-4 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center w-fit">
            {/** SEARCH BAR AND REFRESH */}
            <div className="col-span-2 md:col-span-4 w-full flex flex-row items-center gap-4">
              <TextBox
                value={searchQuery}
                setValue={setSearchQuery}
                placeHolder={"Search sessions..."}
                containerClassName="w-full"
              />

              <Button
                className="py-2"
                secondary
                onClick={fetchSessionList}
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

            {/** USER FILTERS ROW */}
            <div className="col-span-2 md:col-span-4 w-full flex flex-row items-center gap-4">
              {/** FILTER */}
              <Select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                title="Filter by type"
                className="md:text-sm min-w-24"
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
                    title="Filter by department"
                    className="md:text-sm min-w-24"
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
                    title="Filter by program"
                    className="md:text-sm min-w-24"
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
                    title="Filter by type"
                    className="md:text-sm min-w-24"
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
                      title="Filter by division"
                      className="md:text-sm min-w-24"
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
                      title="Filter by title"
                      className="md:text-sm min-w-24"
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

          {/** EXPORT BUTTON AND DATE PICKER */}
          <div className="flex flex-col items-center gap-3 w-34">
            <DatePicker
              date={selectedDate}
              setDate={setSelectedDate}
              containerClassName="w-full"
              disabled={isLoading}
            />

            <Button
              secondary
              onClick={handleDownload}
              disabled={isDownloading || isLoading}
              className="w-full"
              title="Export"
            >
              <Download
                className={cn(
                  "w-5 h-5 text-primary",
                  isDownloading && "animate-bounce"
                )}
              />
            </Button>
          </div>
        </div>
      </Box>

      {/** TABLE VIEW */}
      <Box
        containerClassName={cn(
          "relative overflow-hidden overflow-y-auto w-full h-full min-h-20",
          "flex flex-col justify-between gap-4"
        )}
      >
        <TableHolder className="h-full">
          <SessionLogTable sessionList={sessionList} query={searchQuery} />
        </TableHolder>

        {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <Loading prompt="Please wait..." />
          </div>
        )}
      </Box>
    </>
  );
};

export default SessionLogManagement;
