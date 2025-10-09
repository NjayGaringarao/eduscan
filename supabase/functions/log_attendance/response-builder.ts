import { corsHeaders } from "./constants.ts";
import type { DebugInfo, UserData, Action } from "./types.ts";

export function buildErrorResponse(error: string, debug?: Partial<DebugInfo>) {
  const defaultDebug: DebugInfo = {
    hasSchedule: false,
    scheduleId: null,
    dayOfWeek: null,
    slotFound: false,
    slotError: error,
    timeCalculation: null,
  };

  return new Response(
    JSON.stringify({
      error,
      debug: debug || defaultDebug,
    }),
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export function buildSuccessResponse(
  userData: UserData,
  action: Action,
  debugInfo?: DebugInfo
) {
  if (userData?.employee) {
    return new Response(
      JSON.stringify({
        employee: userData.employee,
        action,
        time: new Date(),
        debug: action === "TIME_OUT" ? debugInfo : undefined,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  }

  return new Response(
    JSON.stringify({
      debug: action === "TIME_OUT" ? debugInfo : undefined,
    }),
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export function buildOptionsResponse() {
  return new Response("ok", {
    headers: corsHeaders,
    status: 200,
  });
}

export function buildMethodNotAllowedResponse() {
  return new Response(
    JSON.stringify({
      error: "Method not allowed",
    }),
    {
      status: 405,
      headers: corsHeaders,
    }
  );
}
