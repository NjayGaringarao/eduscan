"use client";

import React, { useEffect, useState } from "react";
import { Announcement } from "@/models";
import { cn } from "@/utils/style";
import * as announcement from "@/lib/announcement";
import Select from "../Select";
import DateRangePicker from "../DateRangePicker";
import Button from "../Button";
import { Megaphone, RefreshCcw } from "lucide-react";
import ModalCreate from "./ModalCreate";
import ModalView from "./ModalView";
import Box from "../container/Box";
import TableHolder from "../container/TableHolder";
import AnnouncementTable from "./AnnouncementTable";
import TextBox from "../TextBox";

const ManageAnnouncement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [announcementList, setAnnouncementList] = useState<Announcement[]>([]);
  const [isModalCreateVisible, setIsModalCreateVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingAnnouncement, setViewingAnnouncement] =
    useState<Announcement | null>(null);

  // --- Default: All dates (empty strings) ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [role, setRole] = useState("ALL");

  const fetchAnnouncement = async () => {
    setIsLoading(true);
    const { announcements, error } = await announcement.getAll();

    if (error) {
      console.log("Error fetching announcements:", error);
    }

    setAnnouncementList(announcements);
    setIsLoading(false);
  };

  const handleRowClick = (announcement: Announcement) => {
    setViewingAnnouncement(announcement);
  };

  const handleCloseView = () => {
    setViewingAnnouncement(null);
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  return (
    <>
      {/* Data Controller */}
      <Box containerClassName="flex flex-row gap-4 w-full justify-between items-center z-50">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center w-full">
            {/** SEARCH BAR AND REFRESH */}
            <div className="w-full flex flex-row items-center gap-4">
              <TextBox
                value={searchQuery}
                setValue={setSearchQuery}
                placeHolder={"Search Announcement..."}
                containerClassName="w-full md:max-w-[32rem]"
              />

              <Button
                className="py-2"
                secondary
                onClick={() => fetchAnnouncement()}
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

          {/** FILTERS */}
          <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center w-full">
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              inputClassName="flex-1 bg-background/50"
            />

            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex-1 min-w-24 md:max-w-32"
              title="Filter by recipient"
            >
              <option value="ALL">ALL USERS</option>
              <option value="GUARDIAN">GUARDIAN</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </Select>
          </div>
        </div>

        <Button
          className="p-4 h-full"
          secondary
          onClick={() => setIsModalCreateVisible(true)}
        >
          <Megaphone className="w-6 h-6 text-primary" /> Publish
        </Button>
      </Box>

      <Box
        containerClassName={cn(
          "relative overflow-hidden overflow-y-auto  w-full h-full min-h-20",
          "flex flex-col justify-between gap-4"
        )}
      >
        <TableHolder className="h-full">
          <AnnouncementTable
            announcementList={announcementList}
            query={searchQuery}
            onRowClick={handleRowClick}
            role={role}
            fromDate={fromDate}
            toDate={toDate}
          />
        </TableHolder>
      </Box>

      <ModalCreate
        isOpen={isModalCreateVisible}
        onClose={() => setIsModalCreateVisible(false)}
        handleRefreshList={fetchAnnouncement}
      />

      <ModalView onClose={handleCloseView} announcement={viewingAnnouncement} />
    </>
  );
};

export default ManageAnnouncement;
