import React from "react";
import PageHeader from "@/components/PageHeader";
import DropDown from "@/components/container/DropDown";
import { cn } from "@/utils/style";
import Backdrop from "@/components/container/Backdrop";
import CreateSchedule from "@/components/schedule/CreateSchedule";
import ScheduleList from "@/components/schedule/ScheduleList";
import ScheduleProvider from "@/contexts/schedule/ScheduleProvider";
import PageBox from "@/components/container/PageBox";

const SchedulePage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Manage Schedule" />
      <DropDown
        headerElement={<p className="text-primary text-xl">Create</p>}
        containerClassName="z-20"
        useBackDrop
      >
        <CreateSchedule />
      </DropDown>

      <Backdrop containerClassName="flex flex-col gap-6 p-6">
        <ScheduleProvider>
          <ScheduleList />
        </ScheduleProvider>
      </Backdrop>
    </PageBox>
  );
};

export default SchedulePage;
