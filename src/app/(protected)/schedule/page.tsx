import React from "react";
import PageHeader from "@/components/PageHeader";
import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import { cn } from "@/utils/style";
import ManageSchedule from "@/components/schedule/ManageSchedule";
import ScheduleProvider from "@/contexts/schedule/ScheduleProvider";

const SchedulePage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Manage Schedule" />
      <Backdrop containerClassName={cn("flex flex-col gap-4 h-full")}>
        <ScheduleProvider>
          <ManageSchedule />
        </ScheduleProvider>
      </Backdrop>
    </PageBox>
  );
};

export default SchedulePage;
