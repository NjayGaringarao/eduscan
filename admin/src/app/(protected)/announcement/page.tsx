import ManageAnnouncement from "@/components/announcement/ManageAnnouncement";
import Backdrop from "@/components/container/Backdrop";
import PageBox from "@/components/container/PageBox";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import React from "react";

const announcementPage = () => {
  return (
    <PageBox className={cn("flex flex-col gap-4")}>
      <PageHeader title="Announcement" />
      <Backdrop containerClassName={cn("h-full flex-col gap-4")}>
        <ManageAnnouncement />
      </Backdrop>
    </PageBox>
  );
};

export default announcementPage;
