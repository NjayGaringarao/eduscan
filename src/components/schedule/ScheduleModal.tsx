"use client";

import React, { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X } from "lucide-react";
import { Schedule, ScheduleSlot, User } from "@/models";
import {
  getScheduleById,
  toggleScheduleActive,
  updateSchedule,
  deleteSchedule,
  getUsersBySchedule,
} from "@/lib/schedule";
import { Switch } from "@/components/Switch";

import EditSchedule from "./EditSchedule";

interface ScheduleModalProps {
  scheduleId: string | null;
  onClose: (refresh?: boolean) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  scheduleId,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [active, setActive] = useState<boolean>(false);

  const load = async (id: string) => {
    setIsLoading(true);
    const res = await getScheduleById(id);
    if (!res.error) {
      setSchedule(res.schedule);
      setSlots(res.slots);
      setActive(Boolean(res.schedule?.is_active));
      const ur = await getUsersBySchedule(id);
      if (!ur.error) setUsers(ur.users);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (scheduleId) {
      setIsOpen(true);
      load(scheduleId);
    }
  }, [scheduleId]);

  const handleToggle = async () => {
    if (!schedule) return;
    const newState = !active;
    setActive(newState);
    const res = await toggleScheduleActive(schedule.schedule_id, newState);
    if (res.error) setActive(!newState);
  };

  const handleSave = async (payload: any) => {
    if (!schedule) return;
    setIsLoading(true);
    const res = await updateSchedule({
      schedule_id: schedule.schedule_id,
      ...payload,
    });
    setIsLoading(false);
    if (!res.error) onClose(true);
  };

  const handleDelete = async () => {
    if (!schedule) return;
    if (!confirm("This will delete the schedule.")) return;
    setIsLoading(true);
    const res = await deleteSchedule(schedule.schedule_id);
    setIsLoading(false);
    if (!res.error) onClose(true);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={() => onClose()} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-6xl rounded-xl bg-secondary py-6 shadow-xl flex flex-col gap-6">
              <div className="flex justify-between items-center px-6">
                <DialogTitle className="text-xl font-semibold text-primary">
                  Schedule Details
                </DialogTitle>
                <button
                  onClick={() => onClose()}
                  className="p-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-primary/80 hover:text-primary" />
                </button>
              </div>

              <div className="flex flex-col gap-4 px-6">
                <div className="flex items-center gap-4">
                  <p className="text-primary/80">Active</p>
                  <Switch
                    isOn={active}
                    setIsOn={handleToggle}
                    disabled={isLoading}
                  />
                </div>

                {schedule && <EditSchedule scheduleId={schedule.schedule_id} />}

                <div>
                  <p className="text-primary text-lg">
                    Users with this schedule
                  </p>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-primary/30 rounded-md">
                    {users.length === 0 ? (
                      <p className="p-3 text-primary/70">None</p>
                    ) : (
                      <ul className="divide-y divide-primary/20">
                        {users.map((u) => (
                          <li key={u.user_id} className="p-2 text-primary/90">
                            {u.last_name}, {u.first_name} {u.middle_name ?? ""}{" "}
                            — {u.user_id}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ScheduleModal;
