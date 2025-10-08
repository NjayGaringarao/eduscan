"use server";

import { User } from "@/models";
import { createClient } from "@/utils/supabase/server";

export const getFacialEncoding = async (
  blob: Blob
): Promise<{
  encoding: number[] | null;
  error: string | null;
  matchedUser: User | null;
}> => {
  const supabase = await createClient();
  try {
    const formData = new FormData();
    formData.append("image", blob);

    const { data, error } = await supabase.functions.invoke("encode_face", {
      body: formData,
      method: "POST",
    });

    if (error) {
      console.error("Supabase function error: ", error);
      return {
        encoding: null,
        error: "Recognition Failed: " + error.message,
        matchedUser: null,
      };
    }
    return {
      encoding: data.encoding,
      matchedUser: data.user ?? null,
      error: data.error ? "Recognition Failed: " + data.error : null,
    };
  } catch (err: any) {
    console.error("getFaceMatch failed:", err);
    return {
      encoding: null,
      matchedUser: null,
      error: "Recognition Failed: " + (err.message ?? "Unknown error"),
    };
  }
};

/**

// DO NOT REMOVE THIS COMMENT FOR FUTURE REFERENCES
// The implementation of the encode_face function in supabase:

const FACEID_URL = Deno.env.get('FACEID_URL');
const FACEID_PASSWORD = Deno.env.get('FACEID_PASSWORD');
Deno.serve(async (req)=>{
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  // Verify environment
  if (!FACEID_PASSWORD || !FACEID_URL) {
    console.error("Error processing face match request:", "Missing environment variables.");
    return new Response(JSON.stringify({
      error: "SERVER ERROR: Missing environment variables."
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // Get form data from the request
    const formData = await req.formData();
    const imageFile = formData.get('image');
    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({
        error: "MISSING PARAMETER: image is required."
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Send request to the Python server
    const response = await fetch(`${FACEID_URL}/api/face-encoding`, {
      method: 'POST',
      headers: {
        'x-service-password': FACEID_PASSWORD
      },
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({
        error: 'Python server error',
        details: errorText
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Get the response from the Python server
    const faceEncodingData = await response.json();
    return new Response(JSON.stringify(faceEncodingData), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

 */
