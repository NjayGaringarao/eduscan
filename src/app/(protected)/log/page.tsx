import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import LogContainer from "@/components/log/LogContainer";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import React from "react";

const logPage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="System Logs" />
      <Backdrop containerClassName="flex flex-col gap-4">
        <LogContainer />
      </Backdrop>
    </PageBox>
  );
};

export default logPage;
