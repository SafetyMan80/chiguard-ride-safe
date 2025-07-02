import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let stopId: string | null = null;
    let routeId: string | null = null;

    // Handle both GET (query params) and POST (body) requests
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      stopId = searchParams.get('stopId');
      routeId = searchParams.get('routeId');
    } else if (req.method === 'POST') {
      const body = await req.json();
      stopId = body.stopId;
      routeId = body.routeId;
    }
    
    const CTA_API_KEY = Deno.env.get('CTA_API_KEY');
    if (!CTA_API_KEY) {
      throw new Error('CTA API key not configured');
    }

    let apiUrl: string;
    let responseData: any;

    if (stopId) {
      // Get arrivals for a specific stop
      apiUrl = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&stpid=${stopId}&outputType=JSON`;
    } else if (routeId) {
      // Get vehicles for a specific route
      apiUrl = `http://lapi.transitchicago.com/api/1.0/ttpositions.aspx?key=${CTA_API_KEY}&rt=${routeId}&outputType=JSON`;
    } else {
      // Get all routes
      apiUrl = `http://lapi.transitchicago.com/api/1.0/getroutes.aspx?key=${CTA_API_KEY}&outputType=JSON`;
    }

    console.log(`Fetching CTA data from: ${apiUrl.replace(CTA_API_KEY, '[REDACTED]')}`);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CTA API HTTP Error: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${errorText}`);
      throw new Error(`CTA API request failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`CTA API Response (first 200 chars): ${responseText.substring(0, 200)}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse CTA API response as JSON');
      console.error(`Response text: ${responseText}`);
      throw new Error(`CTA API returned invalid JSON: ${parseError.message}`);
    }
    
    // Handle CTA API error responses
    if (data.ctatt?.errCd && data.ctatt.errCd !== '0') {
      throw new Error(`CTA API Error: ${data.ctatt.errNm}`);
    }

    // Parse and clean the response based on request type
    if (stopId) {
      responseData = {
        type: 'arrivals',
        data: data.ctatt?.eta || [],
        timestamp: data.ctatt?.tmst,
      };
    } else if (routeId) {
      responseData = {
        type: 'vehicles',
        data: data.ctatt?.vehicle || [],
        timestamp: data.ctatt?.tmst,
      };
    } else {
      responseData = {
        type: 'routes',
        data: data.ctatt?.routes || [],
        timestamp: data.ctatt?.tmst,
      };
    }

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('CTA Schedule API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to fetch CTA schedule data',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});