"use client";

import React, { useState, useMemo } from "react";
import { Schedule } from "@/models";
import { cn } from "@/utils/style";
import Select from "../Select";
import Button from "../Button";
import { Calendar, RefreshCcw } from "lucide-react";
import ModalSchedule from "./ModalSchedule";
import ModalScheduleCreate from "./ModalScheduleCreate";
import ModalScheduleEdit from "./ModalScheduleEdit";
import Box from "../container/Box";
import TableHolder from "../container/TableHolder";
import ScheduleTable from "./ScheduleTable";
import TextBox from "../TextBox";
import { useScheduleList } from "@/contexts/schedule/useSchedule";

const ManageSchedule = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingSchedule, setViewingSchedule] = useState<Schedule | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userType, setUserType] = useState("ALL");

  // Use the context for schedule management
  const { schedules, isLoading, refreshSchedules } = useScheduleList();

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
    setViewingSchedule(schedule);
  };

  const handleCloseView = () => {
    setViewingSchedule(null);
  };

  const handleRefresh = () => {
    refreshSchedules();
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateModalOpen(false);
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
          />
        </TableHolder>
      </Box>

      <ModalSchedule
        isOpen={!!viewingSchedule}
        onClose={handleCloseView}
        schedule={viewingSchedule}
        onRefresh={handleRefresh}
      />

      <ModalScheduleCreate
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreate}
        onRefresh={handleRefresh}
      />

      <ModalScheduleEdit />
    </>
  );
};

export default ManageSchedule;
