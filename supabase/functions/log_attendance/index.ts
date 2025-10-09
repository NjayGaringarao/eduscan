import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "./constants.ts";
import { validateFormData } from "./validation.ts";
import {
  buildErrorResponse,
  buildSuccessResponse,
  buildOptionsResponse,
  buildMethodNotAllowedResponse,
} from "./response-builder.ts";
import { handleSession } from "./session-handler.ts";
import { sendMessage } from "./messaging.ts";
import type { UserData } from "./types.ts";

Deno.serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return buildOptionsResponse();
  }

  if (req.method !== "POST") {
    return buildMethodNotAllowedResponse();
  }

  try {
    // Step 1: Parse and validate form-data
    const formData = await req.formData();
    const validation = validateFormData(formData);

    if (!validation.isValid) {
      return buildErrorResponse(validation.error ?? "Validation failed");
    }

    const { user_id, action } = validation;

    // Step 2: Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      }
    );

    // Step 3: Insert attendance log
    const { error: logError } = await supabase.from("attendance_log").insert({
      user_id,
      action,
    });

    if (logError) {
      return buildErrorResponse(`Log insert failed: ${logError.message}`);
    }

    // Step 4: Handle session creation/update
    const sessionResult = await handleSession(supabase, user_id!, action!);

    if (!sessionResult.success) {
      return buildErrorResponse(
        sessionResult.error ?? "Session handling failed"
      );
    }

    // Step 5: Get user data
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select(
        "user_id, first_name, middle_name, last_name, sex, employee(type, division, title), student(department, program), guardian(first_name, middle_name, last_name, sex, contact_number)"
      )
      .eq("user_id", user_id)
      .single();

    if (userError) {
      return buildErrorResponse(`User data fetch failed: ${userError.message}`);
    }

    // Step 6: Insert system log
    await supabase
      .from("system_log")
      .insert({
        type: "ATTENDANCE",
        title: `User ${userData.user_id}: ${
          action === "TIME_IN" ? "Time In" : "Time Out"
        }`,
        description: `${userData.first_name} ${
          userData.last_name
        } succesfully ${
          action === "TIME_IN" ? "Time In" : "Time Out"
        } via kiosk.`,
      })
      .select("log_id, type, title, description")
      .single();

    // Step 7: Send SMS if applicable
    if (
      userData.student &&
      userData.guardian &&
      userData.guardian.contact_number &&
      Deno.env.get("ENABLE_MESSAGING") === "TRUE"
    ) {
      await sendMessage(userData as UserData, action!);
    }

    // Step 8: Return success response
    return buildSuccessResponse(
      userData as UserData,
      action!,
      sessionResult.debugInfo
    );
  } catch (err) {
    return buildErrorResponse(err?.message ?? String(err));
  }
});
