import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FACEID_URL = Deno.env.get("FACEID_URL");
const FACEID_PASSWORD = Deno.env.get("FACEID_PASSWORD");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

Deno.serve(async (req) => {
  // Handle preflight CORS - ADD EXPLICIT STATUS 200
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200, // ← ADD THIS EXPLICIT STATUS
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
    // Step 1: Parse form-data
    const formData = await req.formData();
    const image = formData.get("image");
    if (!image || !(image instanceof File)) {
      return new Response(
        JSON.stringify({
          error: "Image file is required",
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }
    // Step 2: Forward to FaceID service
    let matchResponse;
    try {
      matchResponse = await fetch(`${FACEID_URL}/api/face-match`, {
        method: "POST",
        headers: {
          "x-service-password": FACEID_PASSWORD,
        },
        body: formData,
      });
    } catch (e) {
      console.error("FaceID connection failed:", e);
      return new Response(
        JSON.stringify({
          error:
            "Failed to connect to Face ID Service. Please coordinate to system administrator.",
        }),
        {
          status: 502,
          headers: corsHeaders,
        }
      );
    }
    let matchResult;
    try {
      matchResult = await matchResponse.json();
    } catch {
      return new Response(
        JSON.stringify({
          error:
            "There was an error connecting to FaceID service. Please try again.",
        }),
        {
          status: 502,
          headers: corsHeaders,
        }
      );
    }
    const { user_id, error: matchError, is_spoof } = matchResult || {};
    if (!user_id) {
      return new Response(
        JSON.stringify({
          user: null,
          session: null,
          previous_log: null,
          error: matchError || null,
          is_spoof: is_spoof ?? false,
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }
    // Step 3: Init supabase client
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
    // Step 3.5: Get full user data
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("id, first_name, middle_name, last_name, sex, student(department, program), employee(type, division, title)")
      .eq("id", user_id)
      .single();
    
    if (userError) {
      console.error("Supabase user query error:", userError);
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve user information. Please coordinate to system administrator.",
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    // Step 4: Get the latest session (active or completed)
    const { data: latestSession, error: sessionError } = await supabase
      .from("session")
      .select("*")
      .eq("user_id", user_id)
      .order("arrival", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();
    if (sessionError) {
      console.error("Supabase session error:", sessionError);
      return new Response(
        JSON.stringify({
          error:
            "Failed to retrieve session. Please coordinate to system administrator.",
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Step 5: Return structured response
    return new Response(
      JSON.stringify({
        user: userData,
        session: latestSession ?? null,
        error: null,
        is_spoof: is_spoof ?? false,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error("Unhandled face-match error:", err);
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
});
