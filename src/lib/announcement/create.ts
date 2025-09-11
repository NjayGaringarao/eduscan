"use server";

import { createClient } from "@/utils/supabase/server";
import { Announcement } from "@/models";

export const create = async (
  announcement: Omit<Announcement, "created_at" | "announcement_id">
): Promise<{ error?: string }> => {
  const supabase = await createClient();

  // 1. Insert announcement record
  const { error: insertError } = await supabase.from("announcement").insert({
    title: announcement.title,
    message: announcement.message,
    recipient: announcement.recipient,
    created_at: new Date().toISOString(),
  });

  if (insertError) throw new Error(insertError.message);

  // 2. Fetch recipients’ phone numbers
  let numbers: string[] = [];
  if (
    announcement.recipient === "ALL" ||
    announcement.recipient === "GUARDIAN"
  ) {
    const { data: guardians, error: guardianError } = await supabase
      .from("guardian")
      .select("contact_number");

    if (guardianError) throw new Error(guardianError.message);
    if (guardians) {
      numbers.push(
        ...guardians
          .map((g) => g.contact_number)
          .filter((num): num is string => !!num)
      );
    }
  }

  if (
    announcement.recipient === "ALL" ||
    announcement.recipient === "EMPLOYEE"
  ) {
    const { data: employees, error: employeeError } = await supabase
      .from("employee")
      .select("contact_number");

    if (employeeError) throw new Error(employeeError.message);
    if (employees) {
      numbers.push(
        ...employees
          .map((e) => e.contact_number)
          .filter((num): num is string => !!num)
      );
    }
  }

  if (numbers.length === 0) {
    return { error: "No recipients found for this announcement." };
  }

  //   3. Send SMS via Semaphore
  const SEMAPHORE_APIKEY = process.env.SEMAPHORE_APIKEY;
  if (!SEMAPHORE_APIKEY) {
    return {
      error:
        "There was an error sending messages: Missing SEMAPHORE_API_KEY in environment",
    };
  }

  //   Semaphore allows multiple numbers separated by commas
  const params = new URLSearchParams();
  params.append("apikey", SEMAPHORE_APIKEY);
  params.append("message", announcement.message);
  params.append("number", numbers.join(","));

  const res = await fetch("https://semaphore.co/api/v4/messages", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    return { error: `There was an error sending messages: ${err}` };
  }

  return {};
};
