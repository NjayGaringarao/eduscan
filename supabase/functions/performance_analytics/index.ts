import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS headers (needed for browser requests)
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

  // Only accept GET/POST requests
  if (req.method !== "GET" && req.method !== "POST") {
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

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user_id from request body
    const body = await req.json();
    const userId = body?.user_id;

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "MISSING PARAMETER: user_id is required.",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Query database for the most recent performance record for this user
    const { data: performanceRecord, error: queryError } = await supabase
      .from("daily_user_performance")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (queryError) {
      // If no record found, return default metrics structure
      if (queryError.code === "PGRST116") {
        const defaultMetrics = {
          averagePunctuality: {
            value: null,
            label: "No Data",
            trend: "stable",
          },
          averageTimeBalance: {
            value: null,
            label: "No Data",
            trend: "stable",
          },
          dropoutRisk: {
            level: "No Data",
            percentage: null,
            confidence: null,
            factors: ["No performance data available"],
          },
          attendanceRate: {
            rate: null,
            label: "No Data",
            present: null,
            absent: null,
            total: null,
          },
          lastUpdated: new Date().toISOString(),
          dataPoints: null,
        };

        return new Response(JSON.stringify(defaultMetrics), {
          status: 200,
          headers: corsHeaders,
        });
      }

      console.error("Database query error:", queryError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          details: queryError.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Transform database record to PerformanceMetrics format
    const analyticsData = {
      averagePunctuality: {
        value: performanceRecord.average_punctuality_value,
        label: performanceRecord.average_punctuality_label || "No Data",
        trend: performanceRecord.average_punctuality_trend || "stable",
      },
      averageTimeBalance: {
        value: performanceRecord.average_time_balance_value,
        label: performanceRecord.average_time_balance_label || "No Data",
        trend: performanceRecord.average_time_balance_trend || "stable",
      },
      dropoutRisk: {
        level: performanceRecord.dropout_risk_level || "No Data",
        percentage: performanceRecord.dropout_risk_percentage,
        confidence: performanceRecord.dropout_risk_confidence,
        factors: (() => {
          const factors = performanceRecord.dropout_risk_factors;
          if (Array.isArray(factors)) {
            return factors;
          }
          if (factors && typeof factors === 'string') {
            try {
              return JSON.parse(factors);
            } catch {
              return ["No data available"];
            }
          }
          return factors || ["No data available"];
        })(),
      },
      attendanceRate: {
        rate: performanceRecord.attendance_rate_value,
        label: performanceRecord.attendance_rate_label || "No Data",
        present: performanceRecord.attendance_rate_present,
        absent: performanceRecord.attendance_rate_absent,
        total: performanceRecord.attendance_rate_total,
      },
      lastUpdated: performanceRecord.created_at || new Date().toISOString(),
      dataPoints: performanceRecord.data_points,
    };

    // Return success with explicit status 200
    return new Response(JSON.stringify(analyticsData), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Performance analytics error:", error);
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
