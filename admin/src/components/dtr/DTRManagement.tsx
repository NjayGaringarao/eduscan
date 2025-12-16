"use client";

import React, { useEffect, useState } from "react";
import Box from "../container/Box";
import TextBox from "../TextBox";
import Button from "../Button";
import { Calendar, Download, RefreshCcw } from "lucide-react";
import { User } from "@/models";
import { EmployeeFilter } from "../user/EmployeeTable";
import { roleOptions } from "@/constants/role";
import { cn } from "@/utils/style";
import Select from "../Select";
import { handlePdfDownloadResult } from "@/utils/downloadClient";
import { sanitizeFilename } from "@/utils/blob";
import { getAll as getAllUsers } from "@/lib/user";
import TableHolder from "../container/TableHolder";
import { Loading } from "../Loading";
import ScheduleProvider from "@/contexts/schedule/ScheduleProvider";
import ModalScheduleManagement from "../schedule/ModalScheduleManagement";
import MonthPicker from "../MonthPicker";
import EmployeeTable from "./EmployeeTable";

interface DTRManagementProps {
  exportDtr?: (
    userIds: string[],
    month: string
  ) => Promise<{
    url?: string;
    base64?: string;
    path?: string;
    error?: string;
  }>;
  // server action to request deletion of tmp files
  deleteTmpFile?: (path: string) => Promise<{ ok?: boolean; error?: string }>;
}

const DTRManagement = ({ exportDtr, deleteTmpFile }: DTRManagementProps) => {
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const today = new Date();
  const defaultMonth = today.toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [employeeFilter, setEmployeeFilter] = useState<EmployeeFilter>({
    type: "ALL",
    division: "ALL",
    title: "ALL",
  });
  const [isExporting, setIsExporting] = useState(false);

  const fetchUserList = async () => {
    setIsLoading(true);
    const { users, error } = await getAllUsers("EMPLOYEE");
    if (error) alert(error);

    setUserList(users || []);
    setSelected([]);
    setIsLoading(false);
  };

  const handleExportDTR = async () => {
    if (!selected || selected.length === 0) return;

    if (!confirm(`Download DTR for ${selected.length} selected user(s)?`))
      return;

    try {
      if (!exportDtr) {
        alert("Export function not available.");
        return;
      }

      setIsExporting(true);

      const res = await exportDtr(
        selected.map((s) => s.id),
        selectedMonth
      );

      if (res.error) {
        alert(res.error ?? "Failed to generate DTR PDF");
        return;
      }

      // Build a sensible filename and download via client util (supports base64/buffer/url)
      const monthStr = selectedMonth;
      const filename = `DTR-Multiple-${sanitizeFilename(monthStr)}-${
        selected.length
      }.pdf`;

      try {
        await handlePdfDownloadResult(res, filename, (err) => {
          alert(`Download failed: ${err}`);
          // fallback to open URL if present
          if (res.url) window.open(res.url, "_blank");
        });

        // After a successful download attempt, request server to delete tmp file (if provided)
        if (res.path && deleteTmpFile) {
          try {
            const del = await deleteTmpFile(res.path);
            if (del?.error) {
              console.warn("Failed to delete tmp file:", del.error);
            }
          } catch (err) {
            console.warn("deleteTmpFile call failed", err);
          }
        }
      } catch (err: any) {
        console.error("download error", err);
        if (res.url) window.open(res.url, "_blank");
      }
    } catch (err: any) {
      console.error("Export failed", err);
      alert(err?.message ?? "An unexpected error occurred while downloading.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    // when userType changes, refresh list and reset filters + selection
    fetchUserList();
    setSelected([]);

    // reset filters when switching type
    setEmployeeFilter({ type: "ALL", division: "ALL", title: "ALL" });
  }, []);

  // helpers to get dynamic options from roleOptions

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
    <>
      {/** DATA CONTROLLER */}
      <Box containerClassName="flex flex-row gap-4 w-full justify-between items-center">
        <div className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center w-fit">
            {/** SEARCH BAR AND REFRESH */}
            <div className="col-span-2 md:col-span-4 w-full flex flex-row items-center gap-4">
              <TextBox
                value={searchQuery}
                setValue={setSearchQuery}
                placeHolder={"Search employee..."}
                containerClassName="w-full"
              />

              <Button
                className="py-2"
                secondary
                onClick={() => fetchUserList()}
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

            {/* EMPLOYEE progressive filters */}

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
              <option value="ALL">ALL EMPLOYEE</option>
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
                {employeeDivisionsForType(employeeFilter.type).map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
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
          </div>
        </div>

        <Button
          className="h-full w-72"
          secondary
          onClick={() => setIsScheduleModalOpen(true)}
        >
          <Calendar className="text-primary w-6 h-6" /> Manage Schedule
        </Button>
      </Box>

      {/** TABLE VIEW */}
      <Box
        containerClassName={cn(
          "relative overflow-hidden overflow-y-auto  w-full h-full min-h-20",
          "flex flex-col justify-between gap-4"
        )}
      >
        <TableHolder className="h-full">
          <EmployeeTable
            userList={userList}
            query={searchQuery}
            onSelectionChange={setSelected}
            filter={employeeFilter}
            isSelectionOnly
          />
        </TableHolder>

        {selected.length > 0 && (
          <Box containerClassName="place-self-end bg-background p-4 w-full flex justify-between items-center">
            <p className="text-base text-uGrayLight">
              {selected.length} selected
            </p>
            <div className="flex flex-row gap-2 items-center">
              <MonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                disabled={isExporting}
              />
              <Button
                className="py-2 px-6"
                title={isExporting ? "Exporting..." : "Export DTR"}
                onClick={handleExportDTR}
                disabled={isExporting || selected.length === 0}
              >
                <Download
                  className={cn(
                    "w-5 h-5 text-background",
                    isExporting && "animate-bounce"
                  )}
                  strokeWidth={3}
                />
              </Button>
            </div>
          </Box>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <Loading prompt="Please wait..." />
          </div>
        )}
      </Box>

      <ScheduleProvider>
        <ModalScheduleManagement
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      </ScheduleProvider>
    </>
  );
};
export default DTRManagement;
