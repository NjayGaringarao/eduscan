import { useState, useEffect } from "react";

interface UseSessionTimerReturn {
  sessionTime: string;
  isRunning: boolean;
}

export const useSessionTimer = (
  loginTime: Date | null
): UseSessionTimerReturn => {
  const [sessionTime, setSessionTime] = useState<string>("00:00:00");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!loginTime) {
      setSessionTime("00:00:00");
      setIsRunning(false);
      return;
    }

    setIsRunning(true);

    const updateTimer = () => {
      const now = new Date();
      const elapsed = now.getTime() - loginTime.getTime();

      if (elapsed < 0) {
        setSessionTime("00:00:00");
        return;
      }

      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      const formattedTime = [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
      ].join(":");

      setSessionTime(formattedTime);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(interval);
      setIsRunning(false);
    };
  }, [loginTime]);

  return { sessionTime, isRunning };
};
