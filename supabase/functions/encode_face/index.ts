// Face Encoding Edge Function for EduScan
// Extracted from src/lib/user/getFacialEncoding.ts

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'OPTIONS, POST'
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    })
  }

  // Verify environment
  const FACEID_URL = Deno.env.get('FACEID_URL')
  const FACEID_PASSWORD = Deno.env.get('FACEID_PASSWORD')
  
  if (!FACEID_PASSWORD || !FACEID_URL) {
    console.error("Error processing face encoding request:", "Missing environment variables.")
    return new Response(JSON.stringify({
      error: "SERVER ERROR: Missing environment variables."
    }), {
      status: 500,
      headers: corsHeaders
    })
  }

  try {
    // Get form data from the request
    const formData = await req.formData()
    const imageFile = formData.get('image')
    
    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({
        error: "MISSING PARAMETER: image is required."
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Send request to the Python server
    const response = await fetch(`${FACEID_URL}/api/face-encoding`, {
      method: 'POST',
      headers: {
        'x-service-password': FACEID_PASSWORD
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({
        error: 'Python server error',
        details: errorText
      }), {
        status: response.status,
        headers: corsHeaders
      })
    }

    // Get the response from the Python server
    const faceEncodingData = await response.json()
    return new Response(JSON.stringify(faceEncodingData), {
      headers: corsHeaders
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
