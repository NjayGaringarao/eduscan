import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST"
};
const sendMessage = async (user, action)=>{
  const now = new Date();
  // Format time in Asia/Manila timezone
  const time = now.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  // Format date in Asia/Manila timezone
  const date = now.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  // Build Message
  const message = `Good day ${user.guardian.sex == "MALE" ? "MR." : "MS/MRS."} ${user.guardian.first_name} ${user.guardian.last_name}. ${user.sex == "MALE" ? "MR." : "MS/MRS."} ${user.first_name} ${user.last_name} went ${action === "TIME_IN" ? "INSIDE" : "OUTSIDE"} the premises of PRMSU - Castillejos campus as of ${time} today (${date}). This is Eduscan. Thank you.`;
  // Build form data payload
  const payload = new URLSearchParams({
    apikey: Deno.env.get("SEMAPHORE_KEY"),
    number: user.guardian.contact_number,
    message: message
  });
  await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload.toString()
  });
};
Deno.serve(async (req)=>{
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    // Step 1: Parse form-data
    const formData = await req.formData();
    const user_id = formData.get("user_id");
    const action = formData.get("action");
    if (!user_id || !action || typeof user_id !== "string" || typeof action !== "string" || ![
      "TIME_IN",
      "TIME_OUT"
    ].includes(action)) {
      return new Response(JSON.stringify({
        error: "Incomplete form",
        debug: {
          hasSchedule: false,
          scheduleId: null,
          dayOfWeek: null,
          slotFound: false,
          slotError: "Incomplete form validation failed",
          timeCalculation: null
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // Step 2: Initialize Supabase
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? ""
        }
      }
    });
    // Step 3: Insert Log
    const { error: logError } = await supabase.from("attendance_log").insert({
      user_id,
      action
    });
    if (logError) {
      return new Response(JSON.stringify({
        error: `Log insert failed: ${logError.message}`,
        debug: {
          hasSchedule: false,
          scheduleId: null,
          dayOfWeek: null,
          slotFound: false,
          slotError: `Log insert failed: ${logError.message}`,
          timeCalculation: null
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Initialize debug info for all responses
    let debugInfo = {
      hasSchedule: false,
      scheduleId: null,
      dayOfWeek: null,
      slotFound: false,
      slotError: null,
      timeCalculation: null
    };
    
    // Step 4: Handle session creation/update based on new schema
    if (action === "TIME_IN") {
      // Get user's schedule_id
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("schedule_id")
        .eq("user_id", user_id)
        .single();
      
      if (userError) {
        return new Response(JSON.stringify({
          error: `User fetch failed: ${userError.message}`,
          debug: {
            hasSchedule: false,
            scheduleId: null,
            dayOfWeek: null,
            slotFound: false,
            slotError: `User fetch failed: ${userError.message}`,
            timeCalculation: null
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Create new session
      const { error: sessionError } = await supabase.from("session").insert({
        user_id,
        schedule_id: userData.schedule_id || null,
        arrival: new Date().toISOString(),
        departure: null,
        undertime: null,
        is_active: true,
        arrival_offset_minute: null,
        remarks: null
      });
      if (sessionError) {
        return new Response(JSON.stringify({
          error: `Session insert failed: ${sessionError.message}`,
          debug: {
            hasSchedule: false,
            scheduleId: null,
            dayOfWeek: null,
            slotFound: false,
            slotError: `Session insert failed: ${sessionError.message}`,
            timeCalculation: null
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
    } else if (action === "TIME_OUT") {
      // Get current active session
      const { data: currentSession, error: sessionFetchError } = await supabase
        .from("session")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", true)
        .single();
      
      if (sessionFetchError) {
        return new Response(JSON.stringify({
          error: `Session fetch failed: ${sessionFetchError.message}`,
          debug: {
            hasSchedule: false,
            scheduleId: null,
            dayOfWeek: null,
            slotFound: false,
            slotError: `Session fetch failed: ${sessionFetchError.message}`,
            timeCalculation: null
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      const now = new Date();
      const arrival = new Date(currentSession.arrival);
      const departure = now;
      
      // Calculate undertime (duration between arrival and departure)
      const durationMs = departure.getTime() - arrival.getTime();
      const undertimeInterval = `${Math.floor(durationMs / 60000)} minutes`;
      
      // Calculate arrival offset and remarks if schedule exists
      let arrivalOffsetMinute = null;
      let remarks = "UNSCHEDULED"; // Default value
      
      // Update debug info for this session
      debugInfo.hasSchedule = !!currentSession.schedule_id;
      debugInfo.scheduleId = currentSession.schedule_id;
      
      if (currentSession.schedule_id) {
        // Get the schedule slot for today
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        debugInfo.dayOfWeek = dayOfWeek;
        
        // Step 1: Get ALL slots for this schedule and day
        const { data: allSlots, error: slotError } = await supabase
          .from("slot")
          .select("start_time, end_time, label")
          .eq("schedule_id", currentSession.schedule_id)
          .eq("day_of_week", dayOfWeek)
          .order("start_time");
        
        debugInfo.slotError = slotError?.message;
        
        // Step 2: Check which slot the session overlaps with
        let matchingSlot = null;
        if (!slotError && allSlots && allSlots.length > 0) {
          debugInfo.slotFound = true;
          
          for (const slot of allSlots) {
            // Parse slot times
            const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
            const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
            
            // Create time objects for comparison (using same date)
            const slotStart = new Date();
            slotStart.setHours(startHours, startMinutes, 0, 0);
            
            const slotEnd = new Date();
            slotEnd.setHours(endHours, endMinutes, 0, 0);
            
            // Add 30-minute grace period before end_time
            const gracePeriod = 30 * 60 * 1000; // 30 minutes in milliseconds
            const effectiveSlotEnd = new Date(slotEnd.getTime() - gracePeriod);
            
            // Check if session overlaps with this slot (with grace period)
            // Session overlaps if: arrival < effectiveSlotEnd && departure > slotStart
            if (arrival.getTime() < effectiveSlotEnd.getTime() && departure.getTime() > slotStart.getTime()) {
              matchingSlot = slot;
              break; // Use the first overlapping slot
            }
          }
        }
        
        // Step 3: Calculate based on overlap
        if (matchingSlot) {
          debugInfo.slotFound = true;
          
          // Parse the start_time and calculate offset
          const [hours, minutes] = matchingSlot.start_time.split(':').map(Number);
          const scheduledTime = new Date();
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          // Calculate offset in minutes (negative = late, positive = early)
          arrivalOffsetMinute = Math.round((arrival.getTime() - scheduledTime.getTime()) / 60000);
          
          debugInfo.timeCalculation = {
            arrival: arrival.toISOString(),
            scheduledTime: scheduledTime.toISOString(),
            arrivalOffsetMinute,
            matchedSlot: matchingSlot
          };
          
          // Set remarks based on offset
          if (arrivalOffsetMinute <= -15) {
            remarks = "LATE";
          } else if (arrivalOffsetMinute >= 15) {
            remarks = "EARLY";
          } else {
            remarks = "ON_TIME";
          }
        } else {
          // No overlapping slot found (or session ended too close to slot end)
          debugInfo.slotFound = false;
          remarks = "UNSCHEDULED";
        }
      }

      // Update session
      const { error: sessionError } = await supabase
        .from("session")
        .update({
          departure: departure.toISOString(),
          undertime: undertimeInterval,
          is_active: false,
          arrival_offset_minute: arrivalOffsetMinute,
          remarks: remarks
        })
        .eq("user_id", user_id)
        .eq("is_active", true);
      if (sessionError) {
        return new Response(JSON.stringify({
          error: `Session update failed: ${sessionError.message}`,
          debug: {
            hasSchedule: !!currentSession?.schedule_id,
            scheduleId: currentSession?.schedule_id,
            dayOfWeek: null,
            slotFound: false,
            slotError: `Session update failed: ${sessionError.message}`,
            timeCalculation: null
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }
    // Step 5: Get User
    const { data, error } = await supabase.from("user").select("user_id, first_name, middle_name, last_name, sex, employee(type, division, title), student(department, program), guardian(first_name, middle_name, last_name, sex, contact_number)").eq("user_id", user_id).single();
    if (error) {
      return new Response(JSON.stringify({
        error: `User data fetch failed: ${error.message}`,
        debug: {
          hasSchedule: false,
          scheduleId: null,
          dayOfWeek: null,
          slotFound: false,
          slotError: `User data fetch failed: ${error.message}`,
          timeCalculation: null
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    // Step 6: Insert System Log
    const {} = await supabase.from("system_log").insert({
      type: "ATTENDANCE",
      title: `User ${data.user_id}: ${action === "TIME_IN" ? "Time In" : "Time Out"}`,
      description: `${data.first_name} ${data.last_name} succesfully ${action === "TIME_IN" ? "Time In" : "Time Out"} via kiosk.`
    }).select("log_id, type, title, description").single();
    // Step 6: Return appropriate values
    if (data?.employee) {
      return new Response(JSON.stringify({
        employee: data.employee,
        action,
        time: new Date(),
        debug: action === "TIME_OUT" ? debugInfo : undefined
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else if (data.student && data.guardian && data.guardian.contact_number && Deno.env.get("ENABLE_MESSAGING") === "TRUE") {
      // TODO: Implement sending SMS to guardian
      await sendMessage(data, action);
      return new Response(JSON.stringify({
        debug: action === "TIME_OUT" ? debugInfo : undefined
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      return new Response(JSON.stringify({
        debug: action === "TIME_OUT" ? debugInfo : undefined
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      error: err?.message ?? String(err),
      debug: {
        hasSchedule: false,
        scheduleId: null,
        dayOfWeek: null,
        slotFound: false,
        slotError: err?.message ?? String(err),
        timeCalculation: null
      }
    }), {
      headers: corsHeaders,
      status: 200
    });
  }
});