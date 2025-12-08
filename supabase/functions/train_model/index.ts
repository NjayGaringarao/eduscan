import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FACEID_URL = Deno.env.get("FACEID_URL");
const FACEID_PASSWORD = Deno.env.get("FACEID_PASSWORD");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-password",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

Deno.serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

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
    const contentType = req.headers.get("content-type") || "";
    let user_type: string;
    let formData: FormData | null = null;

    // Check if request contains multipart/form-data (file upload)
    if (contentType.includes("multipart/form-data")) {
      const formDataReq = await req.formData();
      user_type = formDataReq.get("user_type") as string;
      const datasetFile = formDataReq.get("dataset_file") as File | null;

      if (!user_type || !["STUDENT", "EMPLOYEE"].includes(user_type)) {
        return new Response(
          JSON.stringify({
            error: "user_type is required and must be STUDENT or EMPLOYEE",
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // Create new FormData for forwarding to ML service
      formData = new FormData();
      formData.append("user_type", user_type);
      
      if (datasetFile) {
        formData.append("dataset_file", datasetFile);
      }

      // Forward as multipart/form-data
      const trainResponse = await fetch(`${FACEID_URL}/api/model/train`, {
        method: "POST",
        headers: {
          "x-service-password": FACEID_PASSWORD,
          // Don't set content-type, let fetch set it with boundary
        },
        body: formData,
      });

      if (!trainResponse.ok) {
        const error = await trainResponse.text();
        return new Response(
          JSON.stringify({
            error: "Failed to train model",
            details: error,
          }),
          {
            status: trainResponse.status,
            headers: corsHeaders,
          }
        );
      }

      const result = await trainResponse.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    } else {
      // Handle JSON request (backward compatibility)
      const body = await req.json();
      user_type = body.user_type;

      if (!user_type || !["STUDENT", "EMPLOYEE"].includes(user_type)) {
        return new Response(
          JSON.stringify({
            error: "user_type is required and must be STUDENT or EMPLOYEE",
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      const trainResponse = await fetch(`${FACEID_URL}/api/model/train`, {
        method: "POST",
        headers: {
          "x-service-password": FACEID_PASSWORD,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          user_type,
        }),
      });

      if (!trainResponse.ok) {
        const error = await trainResponse.text();
        return new Response(
          JSON.stringify({
            error: "Failed to train model",
            details: error,
          }),
          {
            status: trainResponse.status,
            headers: corsHeaders,
          }
        );
      }

      const result = await trainResponse.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    }
  } catch (err) {
    console.error("Train model error:", err);
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

