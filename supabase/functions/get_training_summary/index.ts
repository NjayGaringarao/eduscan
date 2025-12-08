import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FACEID_URL = Deno.env.get("FACEID_URL");
const FACEID_PASSWORD = Deno.env.get("FACEID_PASSWORD");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-password",
  "Access-Control-Allow-Methods": "OPTIONS, GET, POST",
};

Deno.serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

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

  if (!FACEID_URL || !FACEID_PASSWORD) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }

  try {
    const body = req.method === "POST" ? await req.json() : {};
    const url = new URL(req.url);
    const userType = body.user_type || url.searchParams.get("user_type");

    if (!userType || !["STUDENT", "EMPLOYEE"].includes(userType)) {
      return new Response(
        JSON.stringify({
          error: "user_type parameter is required and must be STUDENT or EMPLOYEE",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const summaryResponse = await fetch(
      `${FACEID_URL}/api/model/training-summary?user_type=${userType}`,
      {
        method: "GET",
        headers: {
          "x-service-password": FACEID_PASSWORD,
        },
      }
    );

    if (!summaryResponse.ok) {
      const error = await summaryResponse.text();
      return new Response(
        JSON.stringify({
          error: "Failed to get training summary",
          details: error,
        }),
        {
          status: summaryResponse.status,
          headers: corsHeaders,
        }
      );
    }

    const result = await summaryResponse.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Get training summary error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err.message,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

