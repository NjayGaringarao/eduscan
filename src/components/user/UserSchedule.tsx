"use client";

import React, { useEffect, useState } from "react";
import DropDown from "../container/DropDown";
import { ExtendedSchedule, User } from "@/models";
import * as scheduleLib from "@/lib/schedule";
import Button from "../Button";
import Loading from "../Loading";
import { cn } from "@/utils/style";
import ModalSetSchedule from "./ModalSetSchedule";
import { convertTo12Hour, formatTime } from "@/utils/time";

interface IUserSchedule {
  user: User;
  refreshUser: () => Promise<void>;
}

const UserSchedule = ({ user, refreshUser }: IUserSchedule) => {
  const [schedule, setSchedule] = useState<ExtendedSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSchedule = async () => {
    if (!user.schedule_id) {
      setSchedule(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { schedule: fetchedSchedule, error } = await scheduleLib.getById(
        user.schedule_id
      );

      if (error) {
        alert(`Error fetching schedule: ${error}`);
        setSchedule(null);
      } else {
        setSchedule(fetchedSchedule);
      }
    } catch (err) {
      console.error("Error fetching schedule:", err);
      alert("Failed to fetch schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!schedule) return;

    const confirmed = window.confirm(
      `Do you want to unlink this user from "${schedule.name}" schedule?`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { error } = await scheduleLib.unlinkUsersFromSchedule(
        schedule.schedule_id,
        [user.user_id]
      );

      if (error) {
        alert(`Failed to unlink user: ${error}`);
        setIsLoading(false);
        return;
      }

      // Refresh user data and schedule
      await handleRefresh();
    } catch (err) {
      console.error("Error unlinking user:", err);
      alert("Failed to unlink user from schedule");
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshUser();
    // fetchSchedule() will be called automatically by useEffect when user.schedule_id changes
  };

  useEffect(() => {
    fetchSchedule();
  }, [user.schedule_id]);

  // Day of week labels
  const dayLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <>
      <DropDown
        containerClassName="mt-1"
        headerElement={<p className="text-lg text-primary/80">Schedule</p>}
        isDefaultOpen
      >
        <div className="relative flex flex-col gap-4 p-1 text-textBody">
          {isLoading ? (
            <Loading prompt="Loading schedule..." />
          ) : schedule ? (
            <>
              {/* Schedule Info */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-primary">
                      {schedule.name}
                    </h3>

                    <p className="text-sm text-primary/70">
                      {schedule.description ?? "-- No description --"}
                    </p>
                  </div>
                  <Button
                    onClick={handleUnlink}
                    secondary
                    className="px-4 py-2"
                    disabled={isLoading}
                  >
                    Unlink
                  </Button>
                </div>
              </div>

              {/* Schedule Slots in Grid */}
              <div className="flex flex-col gap-2">
                {schedule.slots && schedule.slots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {schedule.slots
                      .sort((a, b) => {
                        // Sort by day_of_week, then by start_time
                        if (a.day_of_week !== b.day_of_week) {
                          return a.day_of_week - b.day_of_week;
                        }
                        return a.start_time.localeCompare(b.start_time);
                      })
                      .map((slot) => (
                        <div
                          key={slot.slot_id}
                          className={cn(
                            "border border-primary/30 rounded-lg p-3",
                            "bg-primary/5 hover:bg-primary/10 transition-colors"
                          )}
                        >
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold text-primary">
                              {dayLabels[slot.day_of_week]}
                            </p>
                            <p className="text-sm text-primary/80">
                              {convertTo12Hour(slot.start_time)} -{" "}
                              {convertTo12Hour(slot.end_time)}
                            </p>
                            {slot.label && (
                              <p className="text-xs text-primary/60 italic">
                                {slot.label}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-primary/50 italic">
                    No slots defined for this schedule.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-primary/60 italic">
                No schedule set for this user.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2"
              >
                Set Schedule
              </Button>
            </div>
          )}
        </div>
      </DropDown>

      {/* Modal for setting schedule */}
      <ModalSetSchedule
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onRefresh={handleRefresh}
      />
    </>
  );
};

export default UserSchedule;
