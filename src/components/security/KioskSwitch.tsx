"use client";

import { cn } from "@/utils/style";
import React, { useEffect, useState } from "react";
import { Switch } from "../Switch";
import * as configDB from "@/database/config";
import { updateKioskState } from "@/lib/security/updateKioskState";

const KioskSwitch = () => {
  const [initialState, setInitialState] = useState<"ENABLED" | "DISABLED">(
    "DISABLED"
  );
  const [isOn, setIsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load kiosk state on mount
  useEffect(() => {
    const loadConfig = async () => {
      const res = await configDB.get(["kiosk.state"]);
      const state = res.configs.find((c) => c.key === "kiosk.state")?.value as
        | "ENABLED"
        | "DISABLED"
        | undefined;

      const effectiveState = state ?? "DISABLED"; // default
      setInitialState(effectiveState);
      setIsOn(effectiveState === "ENABLED");
    };

    loadConfig();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newState = isOn ? "DISABLED" : "ENABLED";
      const { error } = await updateKioskState(newState);
      if (error) throw new Error(error);

      setIsOn(newState === "ENABLED");
      setInitialState(newState);
    } catch (err) {
      console.error("Failed to update kiosk state", err);
      // rollback UI state
      setIsOn(initialState === "ENABLED");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-xl p-6",
        "bg-background/70 backdrop-blur-lg border border-primary/20",
        "flex flex-col md:flex-row items-center gap-6"
      )}
    >
      <div className="flex-1 flex flex-col">
        <p className="text-primary font-semibold text-xl">Enable Access</p>
        <p className="text-textBody text-base mt-2">
          Control access to the Kiosk Application located at the campus entry
          point. Enabling this option allows the kiosk to be used for
          authentication and log tracking.
        </p>
        <p className="text-textBody text-base">
          {isOn
            ? "Kiosk is currently enabled. Facial recognition authentication for log tracking is active and available."
            : "Kiosk is currently disabled. Facial recognition authentication for log tracking is inactive and unavailable."}
        </p>
      </div>

      <div className="w-full md:w-36 h-full flex items-center justify-end md:justify-center">
        <Switch isOn={isOn} setIsOn={handleToggle} disabled={isLoading} />
      </div>
    </div>
  );
};

export default KioskSwitch;
