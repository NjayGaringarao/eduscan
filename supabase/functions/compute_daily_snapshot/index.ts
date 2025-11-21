import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FACEID_URL = Deno.env.get("FACEID_URL");
const FACEID_PASSWORD = Deno.env.get("FACEID_PASSWORD");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
};

Deno.serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
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

  // Verify environment variables
  if (!FACEID_PASSWORD || !FACEID_URL) {
    console.error(
      "Error processing daily snapshot request:",
      "Missing environment variables."
    );
    return new Response(
      JSON.stringify({
        error: "SERVER ERROR: Missing environment variables.",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract snapshot_date from request body (defaults to yesterday)
    const body = await req.json().catch(() => ({}));
    const snapshotDate = body?.snapshot_date || 
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Computing daily snapshot for date: ${snapshotDate}`);

    // Get all user IDs from database
    const { data: allUsers, error: usersError } = await supabase
      .from("user")
      .select("id");

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!allUsers || allUsers.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No users found",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const allUserIds = allUsers.map((u) => u.id);

    // Get student user IDs
    const { data: students } = await supabase
      .from("student")
      .select("user_id");
    const studentIds = students?.map((s) => s.user_id) || [];

    // Get employee user IDs
    const { data: employees } = await supabase
      .from("employee")
      .select("user_id");
    const employeeIds = employees?.map((e) => e.user_id) || [];

    const results = [];

    // Compute aggregate for STUDENT
    if (studentIds.length > 0) {
      console.log(`Computing metrics for ${studentIds.length} students`);
      const studentResult = await computeAndStoreMetrics(
        supabase,
        studentIds,
        "STUDENT",
        snapshotDate
      );
      results.push(studentResult);
    }

    // Compute aggregate for EMPLOYEE
    if (employeeIds.length > 0) {
      console.log(`Computing metrics for ${employeeIds.length} employees`);
      const employeeResult = await computeAndStoreMetrics(
        supabase,
        employeeIds,
        "EMPLOYEE",
        snapshotDate
      );
      results.push(employeeResult);
    }

    // Compute aggregate for ALL
    console.log(`Computing metrics for all ${allUserIds.length} users`);
    const allResult = await computeAndStoreMetrics(
      supabase,
      allUserIds,
      "ALL",
      snapshotDate
    );
    results.push(allResult);

    return new Response(
      JSON.stringify({
        success: true,
        snapshot_date: snapshotDate,
        results: results,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error("Daily snapshot computation error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

async function computeAndStoreMetrics(
  supabase: any,
  userIds: string[],
  userType: string,
  snapshotDate: string
) {
  // Call Python ML server aggregate endpoint
  const response = await fetch(
    `${FACEID_URL}/api/performance-analytics/aggregate`,
    {
      method: "POST",
      headers: {
        "x-service-password": FACEID_PASSWORD,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_ids: userIds,
        user_type: userType,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ML server error for ${userType}: ${errorText}`);
  }

  const aggregateData = await response.json();

  // Delete existing snapshot for this date and user type (upsert behavior)
  await supabase
    .from("daily_performance_snapshot")
    .delete()
    .eq("snapshot_date", snapshotDate)
    .eq("user_type", userType);

  // Delete existing user performance records for this date and user type
  // Note: daily_user_performance only has STUDENT/EMPLOYEE, not ALL
  if (userType === "ALL") {
    // Delete all records for this date (both STUDENT and EMPLOYEE)
    await supabase
      .from("daily_user_performance")
      .delete()
      .eq("snapshot_date", snapshotDate);
  } else {
    await supabase
      .from("daily_user_performance")
      .delete()
      .eq("snapshot_date", snapshotDate)
      .eq("user_type", userType);
  }

  // Insert snapshot
  const { error: snapshotError } = await supabase
    .from("daily_performance_snapshot")
    .insert({
      snapshot_date: snapshotDate,
      user_type: userType,
      average_punctuality: aggregateData.average_punctuality,
      average_punctuality_label: aggregateData.average_punctuality_label,
      average_punctuality_trend: aggregateData.average_punctuality_trend,
      average_time_balance: aggregateData.average_time_balance,
      average_time_balance_label: aggregateData.average_time_balance_label,
      average_time_balance_trend: aggregateData.average_time_balance_trend,
      attendance_rate: aggregateData.attendance_rate,
      attendance_rate_label: aggregateData.attendance_rate_label,
      total_users: aggregateData.total_users,
      at_risk_count: aggregateData.at_risk_count,
      not_at_risk_count: aggregateData.not_at_risk_count,
    });

  if (snapshotError) {
    throw new Error(`Failed to insert snapshot: ${snapshotError.message}`);
  }

  // Insert user performance records (only for STUDENT and EMPLOYEE types)
  if (userType !== "ALL" && aggregateData.user_records) {
    const userRecords = aggregateData.user_records.map((record: any) => ({
      snapshot_date: snapshotDate,
      user_id: record.user_id,
      user_type: record.user_type,
      average_punctuality_value: record.average_punctuality_value,
      average_punctuality_label: record.average_punctuality_label,
      average_punctuality_trend: record.average_punctuality_trend,
      average_time_balance_value: record.average_time_balance_value,
      average_time_balance_label: record.average_time_balance_label,
      average_time_balance_trend: record.average_time_balance_trend,
      attendance_rate_value: record.attendance_rate_value,
      attendance_rate_label: record.attendance_rate_label,
      dropout_risk_level: record.dropout_risk_level,
      dropout_risk_percentage: record.dropout_risk_percentage,
      dropout_risk_confidence: record.dropout_risk_confidence,
    }));

    // Insert in batches to avoid payload size limits
    const batchSize = 100;
    for (let i = 0; i < userRecords.length; i += batchSize) {
      const batch = userRecords.slice(i, i + batchSize);
      const { error: userRecordsError } = await supabase
        .from("daily_user_performance")
        .insert(batch);

      if (userRecordsError) {
        throw new Error(
          `Failed to insert user records batch ${i}: ${userRecordsError.message}`
        );
      }
    }
  }

  return {
    user_type: userType,
    total_users: aggregateData.total_users,
    success: true,
  };
}

