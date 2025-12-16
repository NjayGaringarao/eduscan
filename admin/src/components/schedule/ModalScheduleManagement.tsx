import React, { useState } from "react";
import BaseModal from "../container/BaseModal";
import Box from "../container/Box";
import TextBox from "../TextBox";
import Button from "../Button";
import { CalendarPlus, RefreshCcw } from "lucide-react";
import ScheduleTable from "./ScheduleTable";
import TableHolder from "../container/TableHolder";
import { cn } from "@/utils/style";
import ModalSchedule from "./modal/ModalSchedule";
import ModalEditSchedule from "./modal/ModalEditSchedule";
import ModalCreateSchedule from "./modal/ModalCreateSchedule";
import { Schedule } from "@/models";
import {
  useScheduleList,
  useScheduleModal,
} from "@/contexts/schedule/useSchedule";

interface IModalScheduleManagement {
  isOpen: boolean;
  onClose: () => void;
}

const ModalScheduleManagement = ({
  isOpen,
  onClose,
}: IModalScheduleManagement) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Schedule[]>([]);

  // Use the context for schedule management
  const { schedules, isLoading, refreshSchedules, openViewModal } =
    useScheduleList();
  const { openCreateModal } = useScheduleModal();

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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Schedule"
      contentClassName="p-4"
      panelClassName="w-full max-w-4xl"
    >
      <>
        {/* Data Controller */}
        <div className="flex flex-row gap-4 w-full justify-between items-center">
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

                <Button
                  className="p-2"
                  secondary
                  onClick={handleRefresh}
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
            </div>
          </div>

          <Button className="py-2 w-72" secondary onClick={handleCreateClick}>
            <CalendarPlus className="w-6 h-6 text-primary" /> New Schedule
          </Button>
        </div>

        <TableHolder className="h-full h-94">
          <ScheduleTable
            scheduleList={schedules}
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

        {/* All modals using separate states */}
        <ModalSchedule onRefresh={handleRefresh} />
        <ModalEditSchedule />
        <ModalCreateSchedule onRefresh={handleRefresh} />
      </>
    </BaseModal>
  );
};

export default ModalScheduleManagement;
