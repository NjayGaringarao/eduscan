"use client";

import { ActiveSession, User } from "@/models";
import { cn } from "@/utils/style";
import { MapPinPlusInside, MapPinX } from "lucide-react";
import React, { useEffect, useState } from "react";
import * as sessionDB from "@/database/activeSession";
import { getElapsedTime } from "@/utils/time";
import Loading from "../Loading";

interface IStatus {
  user: User | null;
}

const Status = ({ user }: IStatus) => {
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
    <div className="flex-1 flex flex-row gap-2 items-center">
      <p className={cn("text-primary/80")}>
        {user?.student ? "LOCATION" : "STATUS"}
      </p>
      <div
        className={cn(
          "relative p-2 rounded-lg",
          "border border-textBody",
          "flex flex-row items-center justify-center gap-1",
          "text-primary/80",
          session ? "bg-uGreen/25" : "bg-background"
        )}
      >
        {session ? (
          <>
            <MapPinPlusInside className="h-6 w-6" />
            <div className="flex flex-row items-center">
              <p className="text-lg font-semibold">
                {user?.student ? "INSIDE THE CAMPUS" : "ACTIVE"}
              </p>
              <p className="text-sm text-textBody ml-2 pl-2 border-l">
                {elapsed}
              </p>
            </div>
          </>
        ) : (
          <>
            <MapPinX className="h-6 w-6" />
            <div className="flex flex-col items-start">
              <p className="text-lg font-semibold">
                {user?.student ? "OUTSIDE THE CAMPUS" : "INACTIVE"}
              </p>
            </div>
          </>
        )}
        {isLoading && (
          <div
            className={cn(
              "absolute z-30 h-full w-full rounded-lg",
              "bg-background/10 backdrop-blur-xs",
              "flex flex-col items-center justify-center"
            )}
          >
            <Loading size="small" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Status;
