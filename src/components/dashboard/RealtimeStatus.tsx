"use client";

import { getUserStatus } from "@/lib/dashboard";
import { cn } from "@/utils/style";
import { createClient } from "@/utils/supabase/client";
import { SquareUserRound, User2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { RealtimeCard } from "./RealtimeCard";
import { RealtimeUserStatus } from "@/lib/dashboard/types";

export const RealtimeStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<RealtimeUserStatus>();
  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(false);
    const { realtimeStatus, error } = await getUserStatus();

    if (error) {
      alert(error);
      return;
    }

    setStatus(realtimeStatus);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();

    const realtimeActiveSession = supabase
      .channel("realtime:active_session")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "active_session" },
        async (payload) => {
          // Handle different event types
          if (["INSERT", "DELETE", "UPDATE"].includes(payload.eventType)) {
            await fetchData();
          }
        }
      )
      .subscribe();

    const realtimeUser = supabase
      .channel("realtime:user")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user" },
        async (payload) => {
          // Handle different event types
          if (["INSERT", "DELETE", "UPDATE"].includes(payload.eventType)) {
            await fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      realtimeActiveSession.unsubscribe();
      realtimeUser.unsubscribe();
    };
  }, []);

  return (
    <div className="flex-1 rounded-xl overflow-hidden">
      <div
        className={cn(
          "flex flex-col md:flex-row gap-6",
          "w-full overflow-x-auto overflow-y-hidden pb-2"
        )}
        style={{
          scrollbarColor: "var(--color-primary) var(--color-background) ",
        }}
      >
        <RealtimeCard
          title="Present User"
          Icon={SquareUserRound}
          value={`${status?.presentUser} / ${status?.totalUser}`}
          containerClassName="w-full md:w-72"
          isLoading={isLoading || !status}
        />
        <RealtimeCard
          title="Present Employee"
          Icon={User2}
          value={`${status?.presentEmployee} / ${status?.totalEmployee}`}
          containerClassName="w-full md:w-72"
          isLoading={isLoading || !status}
        />
        <RealtimeCard
          title="Present Student"
          Icon={User2}
          value={`${status?.presentStudent} / ${status?.totalStudent}`}
          containerClassName="w-full md:w-72"
          isLoading={isLoading || !status}
        />
      </div>
    </div>
  );
};
