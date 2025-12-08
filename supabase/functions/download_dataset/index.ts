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
    const action = body.action || url.searchParams.get("action"); // "generate" or "download"
    const userType = body.user_type || url.searchParams.get("user_type");
    const targetDistribution =
      body.target_distribution !== undefined ? body.target_distribution : null; // null = raw mode, number = custom distribution (0-100)

    if (req.method === "POST" && action === "generate") {
      // Generate dataset
      if (!userType) {
        return new Response(
          JSON.stringify({
            error: "user_type parameter is required",
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      const generateResponse = await fetch(
        `${FACEID_URL}/api/dataset/generate`,
        {
          method: "POST",
          headers: {
            "x-service-password": FACEID_PASSWORD,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            user_type: userType,
            target_distribution: targetDistribution,
          }),
        }
      );

      if (!generateResponse.ok) {
        const error = await generateResponse.text();
        return new Response(
          JSON.stringify({
            error: "Failed to generate dataset",
            details: error,
          }),
          {
            status: generateResponse.status,
            headers: corsHeaders,
          }
        );
      }

      const result = await generateResponse.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    } else if (
      (req.method === "GET" || req.method === "POST") &&
      action === "download"
    ) {
      // Download dataset
      if (!userType) {
        return new Response(
          JSON.stringify({
            error: "user_type parameter is required",
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      const downloadResponse = await fetch(
        `${FACEID_URL}/api/dataset/download?user_type=${userType}`,
        {
          method: "GET",
          headers: {
            "x-service-password": FACEID_PASSWORD,
          },
        }
      );

      if (!downloadResponse.ok) {
        const error = await downloadResponse.text();
        return new Response(
          JSON.stringify({
            error: "Failed to download dataset",
            details: error,
          }),
          {
            status: downloadResponse.status,
            headers: corsHeaders,
          }
        );
      }

      // Get the JSON content
      const jsonContent = await downloadResponse.text();
      const userTypeSuffix = userType === "STUDENT" ? "s" : "e";
      const filename = `training_data_${userTypeSuffix}.json`;

      return new Response(jsonContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid method or action",
        }),
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }
  } catch (err) {
    console.error("Download dataset error:", err);
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
