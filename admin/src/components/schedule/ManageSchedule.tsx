"use client";

import React, { useState, useMemo } from "react";
import { Schedule } from "@/models";
import { cn } from "@/utils/style";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { Calendar, RefreshCcw } from "lucide-react";
import ModalSchedule from "./modal/ModalSchedule";
import ModalCreateSchedule from "./modal/ModalCreateSchedule";
import ModalEditSchedule from "./modal/ModalEditSchedule";
import Box from "@/components/container/Box";
import TableHolder from "@/components/container/TableHolder";
import ScheduleTable from "@/components/schedule/ScheduleTable";
import TextBox from "@/components/TextBox";
import {
  useScheduleList,
  useScheduleModal,
} from "@/contexts/schedule/useSchedule";

const ManageSchedule = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userType, setUserType] = useState("ALL");
  const [selected, setSelected] = useState<Schedule[]>([]);

  // Use the context for schedule management
  const { schedules, isLoading, refreshSchedules, openViewModal } =
    useScheduleList();
  const { openCreateModal } = useScheduleModal();

  // Filter schedules based on user type
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      // Filter by user type
      const userTypeMatch =
        userType === "ALL" || schedule.user_type === userType;

      return userTypeMatch;
    });
  }, [schedules, userType]);

  const handleRowClick = (schedule: Schedule) => {
    openViewModal(schedule);
  };

  const handleRefresh = () => {
    refreshSchedules();
  };

  const handleCreateClick = () => {
    openCreateModal();
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Confirm Delete: Are you sure you want to delete ${selected.length} selected schedule(s)? This action cannot be undone.`
      )
    )
      return;

    try {
      // Import the delete function dynamically to avoid server/client issues
      const { deleteSchedule } = await import("@/lib/schedule/delete");

      // Delete each selected schedule
      for (const schedule of selected) {
        const { error } = await deleteSchedule(schedule.id);
        if (error) {
          alert(`Error deleting schedule ${schedule.name}: ${error}`);
          return;
        }
      }

      alert(`✅ Successfully deleted ${selected.length} schedule(s)!`);
      setSelected([]);
      refreshSchedules();
    } catch (err) {
      alert("Failed to delete schedules");
      console.error("Error deleting schedules:", err);
    }
  };

  return (
    <>
      {/* Data Controller */}
      <Box containerClassName="flex flex-row gap-4 w-full justify-between items-center">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center w-full">
            {/** SEARCH BAR AND REFRESH */}
            <div className="w-full flex flex-row items-center gap-4">
              <TextBox
                value={searchQuery}
                setValue={setSearchQuery}
                placeHolder={"Search Schedule..."}
                containerClassName="w-full md:max-w-[32rem]"
              />

              <Button secondary onClick={handleRefresh} disabled={isLoading}>
                <RefreshCcw
                  className={cn(
                    "w-5 h-5 text-primary",
                    isLoading && "animate-spin"
                  )}
                />
              </Button>
            </div>
          </div>

          {/** FILTERS */}
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center w-full">
            <Select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="flex-1 min-w-24 md:max-w-32"
              title="Filter by user type"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="STUDENT">STUDENT</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </Select>
          </div>
        </div>

        <Button
          className="p-4 h-full md:h-auto"
          secondary
          onClick={handleCreateClick}
        >
          <Calendar className="w-6 h-6 text-primary" /> Create
        </Button>
      </Box>

      <Box
        containerClassName={cn(
          "relative overflow-hidden overflow-y-auto  w-full h-full min-h-20",
          "flex flex-col justify-between gap-4"
        )}
      >
        <TableHolder className="h-full">
          <ScheduleTable
            scheduleList={filteredSchedules}
            query={searchQuery}
            onRowClick={handleRowClick}
            onSelectionChange={setSelected}
          />
        </TableHolder>

        {selected.length > 0 && (
          <Box containerClassName="place-self-end bg-background p-4 w-full flex justify-between items-center">
            <p className="text-base text-uGrayLight">
              {selected.length} selected
            </p>
            <Button
              title="Delete Selected"
              className="bg-error"
              onClick={handleDelete}
            />
          </Box>
        )}
      </Box>

      {/* All modals using separate states */}
      <ModalSchedule onRefresh={handleRefresh} />
      <ModalEditSchedule />
      <ModalCreateSchedule onRefresh={handleRefresh} />
    </>
  );
};

export default ManageSchedule;
