import Compose from "@/components/announcement/Compose";
import History from "@/components/announcement/History";
import DropDown from "@/components/container/DropDown";
import PageBox from "@/components/container/PageBox";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import React from "react";

const announcementPage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Announcement" />
      <div className={cn("relative flex-1", "flex flex-col gap-4")}>
        <DropDown
          headerElement={<p className="text-primary text-xl">Compose</p>}
          childClassName="flex flex-col gap-2"
          useBackDrop
        >
          <Compose />
        </DropDown>

        <DropDown
          headerElement={<p className="text-primary text-xl">History</p>}
          childClassName="flex flex-col gap-2"
          useBackDrop
          isDefaultOpen
        >
          <History />
        </DropDown>
      </div>
    </PageBox>
  );
};

export default announcementPage;
