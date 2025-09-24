import React from "react";
import PageHeader from "@/components/PageHeader";
import DropDown from "@/components/container/DropDown";
import { cn } from "@/utils/style";
import Backdrop from "@/components/container/Backdrop";
import CreateSchedule from "@/components/schedule/CreateSchedule";
import ScheduleList from "@/components/schedule/ScheduleList";

const SchedulePage = () => {
  return (
    <div className={cn("flex flex-col gap-4", "w-full max-w-7xl p-2 md:p-6")}>
      <PageHeader title="Schedule" />
      <DropDown
        headerElement={<p className="text-primary text-xl">Create</p>}
        containerClassName="z-20"
        useBackDrop
      >
        <CreateSchedule />
      </DropDown>

      <Backdrop containerClassName="flex flex-col gap-6 p-6">
        <ScheduleList />
      </Backdrop>
    </div>
  );
};

export default SchedulePage;
