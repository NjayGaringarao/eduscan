"use client";

import { useEffect, useState } from "react";
import { Schedule, User } from "@/models";
import * as scheduleLib from "@/lib/schedule";
import Loading from "../Loading";
import Box from "../container/Box";
import Button from "../Button";
import TextBox from "../TextBox";
import { cn } from "@/utils/style";
import BaseModal from "../container/BaseModal";
import ScheduleTable from "../schedule/ScheduleTable";
import TableHolder from "../container/TableHolder";

interface ModalSetScheduleProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onRefresh: () => void;
}

const ModalSetSchedule = ({
  isOpen,
  onClose,
  user,
  onRefresh,
}: ModalSetScheduleProps) => {
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Schedule[]>([]);

  const fetchActiveSchedules = async () => {
    setIsLoading(true);
    try {
      const { schedules, error } = await scheduleLib.getAll();

      if (error) {
        alert(`Error fetching schedules: ${error}`);
        setIsLoading(false);
        return;
      }

      setScheduleList(schedules);
      setSelected([]);
    } catch (err) {
      console.error("Error fetching active schedules:", err);
      alert("Failed to fetch active schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSchedule = async () => {
    if (selected.length === 0) {
      alert("Please select a schedule.");
      return;
    }

    const selectedSchedule = selected[0];

    // Show confirmation
    const confirmed = window.confirm(
      `Do you want to set "${selectedSchedule.name}" schedule to this user?`
    );

    if (!confirmed) return;

    setIsLinking(true);
    try {
      const { error } = await scheduleLib.linkUserToSchedule(
        user.id,
        selectedSchedule.id
      );

      if (error) {
        alert(`Failed to set schedule: ${error}`);
        return;
      }

      // Refresh the parent component and close modal
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Error setting schedule:", err);
      alert("Failed to set schedule");
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSelected([]);
    setSearchQuery("");
    onClose();
  };

  // Fetch schedules when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchActiveSchedules();
    }
  }, [isOpen]);

  const footer = (
    <div className="flex justify-between items-center py-4 px-6">
      <p className="text-sm text-primary/70">
        {selected.length > 0
          ? `Selected: ${selected[0].name}`
          : "No schedule selected"}
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleSetSchedule}
          disabled={selected.length !== 1 || isLinking}
          className="w-40"
        >
          Set Schedule
        </Button>
        <Button onClick={handleClose} secondary className="w-40">
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set User Schedule"
      panelClassName="w-full max-w-6xl h-full max-h-[80vh]"
      contentClassName="flex flex-col gap-4 p-6 h-full"
      footer={footer}
    >
      {/* Search Bar */}
      <div className="flex flex-row gap-4 w-full justify-between items-center">
        <TextBox
          value={searchQuery}
          setValue={setSearchQuery}
          placeHolder="Search schedules..."
          containerClassName="w-full"
        />
      </div>

      {/* Table View */}
      <Box
        containerClassName={cn("relative w-full", "flex-1 flex flex-col gap-4")}
      >
        <TableHolder className="h-full">
          <ScheduleTable
            scheduleList={scheduleList}
            query={searchQuery}
            onSelectionChange={setSelected}
            isSingleSelection={true}
          />
        </TableHolder>

        {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <Loading prompt="Loading schedules..." />
          </div>
        )}
      </Box>
    </BaseModal>
  );
};

export default ModalSetSchedule;
