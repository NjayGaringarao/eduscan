import PageHeader from "@/components/PageHeader";
import { cn } from "@/utils/style";
import React from "react";

const announcementPage = () => {
  return (
    <div className={cn("flex flex-col gap-4", "w-full max-w-7xl p-2 md:p-6")}>
      <PageHeader title="Announcement" />
    </div>
  );
};

export default announcementPage;
