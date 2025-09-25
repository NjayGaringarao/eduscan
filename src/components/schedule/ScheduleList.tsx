"use client";

import React from "react";
import Loading from "@/components/Loading";
import Box from "../container/Box";
import ScheduleModal from "./ScheduleModal";
import { useScheduleList } from "@/contexts/schedule/useSchedule";

const ScheduleList = () => {
  const { schedules, isLoading, openScheduleModal } = useScheduleList();

  return (
    <>
      <Box containerClassName="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-primary text-xl">Schedules</p>
        </div>

        <div className="overflow-y-auto rounded-md border border-primary/40">
          <table className="table-fixed w-full select-none bg-transparent">
            <thead>
              <tr>
                <th className="p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30">
                  Name
                </th>
                <th className="p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30">
                  User Type
                </th>
                <th className="p-3 text-left font-semibold text-xs text-primary bg-panel border-b border-primary/30">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-4">
                    <Loading prompt="Loading..." />
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-primary/70">
                    No schedules found.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr
                    key={schedule.schedule_id}
                    className="hover:bg-secondary cursor-pointer"
                    onClick={() => openScheduleModal(schedule)}
                  >
                    <td className="p-3 border border-textBody/40">
                      {schedule.name}
                    </td>
                    <td className="p-3 border border-textBody/40">
                      {schedule.user_type}
                    </td>
                    <td className="p-3 border border-textBody/40">
                      {schedule.is_active
                        ? new Date(schedule.created_at).toLocaleString()
                        : "INACTIVE"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Box>
      <ScheduleModal />
    </>
  );
};

export default ScheduleList;
