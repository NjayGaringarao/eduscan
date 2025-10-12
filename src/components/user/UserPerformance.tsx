"use client";

import { ActiveSession, User } from "@/models";

import {
  ChartBar,
  ChartScatter,
  LucideProps,
  MapPinPlusInside,
  MapPinX,
  Timer,
  TimerOff,
  TriangleAlert,
} from "lucide-react";
import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useEffect,
  useState,
} from "react";
import * as sessionDB from "@/database/activeSession";
import { getElapsedTime } from "@/utils/time";
import { PerformanceCard } from "./PerformanceCard";
import DropDown from "../container/DropDown";

interface IUserPerformance {
  user: User | null;
}

const UserPerformance = ({ user }: IUserPerformance) => {
  const status: [string, string] = user?.student
    ? ["INSIDE THE CAMPUS", "OUTSIDE THE CAMPUS"]
    : ["TIMED IN", "TIMED OUT"];
  const statusIcon: [
    ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >,
    ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >
  ] = user?.student ? [MapPinPlusInside, MapPinX] : [Timer, TimerOff];
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState<string>("");

  // Fetch session from DB
  const fetchSessionHandle = async () => {
    if (!user) return;
    setIsLoading(true);
    const { session, error } = await sessionDB.get(user.user_id);
    if (error) {
      alert(error);
      setIsLoading(false);
      return;
    }
    setSession(session);
    setIsLoading(false);
  };

  // Timer effect if session exists
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.login_time) {
      interval = setInterval(() => {
        setElapsed(getElapsedTime(new Date(session.login_time), new Date()));
      }, 1000);
    } else {
      setElapsed("");
    }
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    fetchSessionHandle();
  }, [user]);

  return (
    <DropDown
      headerElement={
        <p className="text-lg text-primary/80">Performance Turnover</p>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
        <PerformanceCard
          Icon={session ? statusIcon[0] : statusIcon[1]}
          title="Current Status"
          value={session ? status[0] : status[1]}
          isLoading={isLoading}
        />
        <PerformanceCard
          Icon={ChartScatter}
          title="Average Arrival"
          value={"5 Minutes Early"} // or can be 5 Minutes Late... Depends on the output of the model
          isLoading={isLoading}
        />
        <PerformanceCard
          Icon={ChartBar}
          title="Average Undertime"
          value={"5 Minutes"}
          isLoading={isLoading}
        />
        <PerformanceCard
          Icon={TriangleAlert}
          title="Drop-out Risk"
          value={"5% [Low]"}
          isLoading={isLoading}
        />
      </div>
    </DropDown>
  );
};

export default UserPerformance;
