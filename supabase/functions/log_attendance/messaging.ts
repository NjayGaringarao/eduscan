import type { UserData, Action } from "./types.ts";

export const sendMessage = async (user: UserData, action: Action) => {
  const now = new Date();

  // Format time in Asia/Manila timezone
  const time = now.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Format date in Asia/Manila timezone
  const date = now.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Build Message
  const message = `Good day ${
    user.guardian?.sex == "MALE" ? "MR." : "MS/MRS."
  } ${user.guardian?.first_name} ${user.guardian?.last_name}. ${
    user.sex == "MALE" ? "MR." : "MS/MRS."
  } ${user.first_name} ${user.last_name} went ${
    action === "TIME_IN" ? "INSIDE" : "OUTSIDE"
  } the premises of PRMSU - Castillejos campus as of ${time} today (${date}). This is Eduscan. Thank you.`;

  // Build form data payload
  const payload = new URLSearchParams({
    apikey: Deno.env.get("SEMAPHORE_KEY") ?? "",
    number: user.guardian?.contact_number ?? "",
    message: message,
  });

  await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });
};
