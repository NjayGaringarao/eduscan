"use client";

import React, { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { getAllSchedules } from "@/lib/schedule";
import Box from "../container/Box";
import ScheduleModal from "./ScheduleModal";

const ScheduleList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const res = await getAllSchedules();
    if (!res.error) setItems(res.schedules);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-primary/70">
                    No schedules found.
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr
                    key={s.schedule_id}
                    className="hover:bg-secondary cursor-pointer"
                    onClick={() => setOpenId(s.schedule_id)}
                  >
                    <td className="p-3 border border-textBody/40">{s.name}</td>
                    <td className="p-3 border border-textBody/40">
                      {s.user_type}
                    </td>
                    <td className="p-3 border border-textBody/40">
                      {s.is_active
                        ? new Date(s.created_at).toLocaleString()
                        : "INACTIVE"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Box>
      <ScheduleModal scheduleId={openId} onClose={() => setOpenId(null)} />
    </>
  );
};

export default ScheduleList;
