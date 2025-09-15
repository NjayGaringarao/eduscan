import Backdrop from "@/components/container/Backdrop";
import LogContainer from "@/components/log/LogContainer";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import React from "react";

const logPage = () => {
  return (
    <div className={cn("flex flex-col gap-4", "w-full max-w-7xl p-2 md:p-6")}>
      <PageHeader title="System Logs" />
      <Backdrop containerClassName="flex flex-col gap-4">
        <LogContainer />
      </Backdrop>
    </div>
  );
};

export default logPage;
