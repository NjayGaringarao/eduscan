"use client";

import { getUserStatus } from "@/lib/dashboard";
import { cn } from "@/utils/style";
import { createClient } from "@/utils/supabase/client";
import { SquareUserRound, User2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { RealtimeCard } from "./RealtimeCard";
import { RealtimeUserStatus } from "@/lib/dashboard/types";

const RealtimeStatus = () => {
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

    const realtimeSession = supabase
      .channel("realtime:session")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session" },
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
      realtimeSession.unsubscribe();
      realtimeUser.unsubscribe();
    };
  }, []);

  return (
    <div
      className={cn("flex flex-col gap-6")}
      style={{
        scrollbarColor: "var(--color-primary) var(--color-background) ",
      }}
    >
      <RealtimeCard
        title="Present User"
        Icon={SquareUserRound}
        value={status?.presentUser ?? 0}
        total={status?.totalUser ?? 0}
        containerClassName="w-full md:w-72"
        isLoading={isLoading || !status}
      />
      <RealtimeCard
        title="Present Employee"
        Icon={User2}
        value={status?.presentEmployee ?? 0}
        total={status?.totalEmployee ?? 0}
        containerClassName="w-full md:w-72"
        isLoading={isLoading || !status}
      />
      <RealtimeCard
        title="Present Student"
        Icon={User2}
        value={status?.presentStudent ?? 0}
        total={status?.totalStudent ?? 0}
        containerClassName="w-full md:w-72"
        isLoading={isLoading || !status}
      />
    </div>
  );
};

export default RealtimeStatus;
