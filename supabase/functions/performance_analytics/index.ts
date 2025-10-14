import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FACEID_URL = Deno.env.get("FACEID_URL");
const FACEID_PASSWORD = Deno.env.get("FACEID_PASSWORD");

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

  // Verify environment variables
  if (!FACEID_PASSWORD || !FACEID_URL) {
    console.error(
      "Error processing performance analytics request:",
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

    // Send request to the Python ML server
    const response = await fetch(
      `${FACEID_URL}/api/performance-analytics/${userId}`,
      {
        method: "GET",
        headers: {
          "x-service-password": FACEID_PASSWORD,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ML server error:", errorText);
      return new Response(
        JSON.stringify({
          error: "ML server error",
          details: errorText,
        }),
        {
          status: response.status,
          headers: corsHeaders,
        }
      );
    }

    // Get the response from the Python server
    const analyticsData = await response.json();

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
