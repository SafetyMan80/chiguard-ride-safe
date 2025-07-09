import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== SEPTA SCHEDULE API ===');
  console.log('Request Method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders
  };

  try {
    // Extract station from request body
    let station = '30th Street Station'; // default
    
    if (req.method === 'POST') {
      const body = await req.json();
      station = body.station || body.req1 || '30th Street Station';
      console.log('POST body station:', station);
    } else {
      // GET method - extract from URL params
      const url = new URL(req.url);
      station = url.searchParams.get('station') || url.searchParams.get('req1') || '30th Street Station';
      console.log('GET param station:', station);
    }
    
    console.log('Processing station:', station);
    
    // Build the correct SEPTA API URL (no API key needed according to Data.gov)
    const name = encodeURIComponent(station);
    const septaUrl = `https://www3.septa.org/api/Arrivals/index.php?req1=${name}&outputType=JSON`;
    
    console.log('SEPTA URL:', septaUrl);

    // Make the request with robust error handling
    const fetchStart = Date.now();
    const res = await fetch(septaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RailScheduleApp/1.0',
        'Referer': 'https://www3.septa.org/'
      }
    });
    
    const fetchDuration = Date.now() - fetchStart;
    console.log('Fetch completed in:', fetchDuration, 'ms');
    console.log('Response status:', res.status, res.statusText);

    // Get response text first for better error handling
    const text = await res.text();
    console.log('Response text length:', text.length);
    console.log('Response preview:', text.substring(0, 200));

    if (!res.ok) {
      console.error(`SEPTA fetch error (${res.status}):`, text);
      return new Response(JSON.stringify({ 
        success: false,
        error: `SEPTA API Error: ${res.status} ${res.statusText}`,
        details: text.substring(0, 500)
      }), { 
        status: 502, 
        headers 
      });
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(text);
      console.log('JSON parsed successfully');
      console.log('Data keys:', Object.keys(data));
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON response from SEPTA API',
        raw_response: text.substring(0, 500)
      }), { 
        status: 502, 
        headers 
      });
    }

    // Process arrivals with minute countdowns
    const now = Date.now();
    let arrivals = [];

    // SEPTA API structure can vary, handle different response formats
    if (data && Array.isArray(data)) {
      // Direct array of arrivals
      arrivals = data.map((e: any) => processArrival(e, now));
    } else if (data?.rail?.stationList) {
      // Nested structure with station list
      arrivals = data.rail.stationList
        .flatMap((st: any) => st.eta || st.arrivals || [])
        .map((e: any) => processArrival(e, now));
    } else if (data?.arrivals) {
      // Direct arrivals array
      arrivals = data.arrivals.map((e: any) => processArrival(e, now));
    } else {
      console.log('Unexpected data structure:', JSON.stringify(data, null, 2));
      // Try to extract any array from the response
      const possibleArrays = Object.values(data).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        arrivals = possibleArrays[0].map((e: any) => processArrival(e, now));
      }
    }

    // Filter out invalid arrivals and sort by arrival time
    arrivals = arrivals
      .filter(arrival => arrival && arrival.line && arrival.destination)
      .sort((a, b) => a.minutes - b.minutes)
      .slice(0, 10); // Limit to 10 results

    console.log(`Processed ${arrivals.length} arrivals`);

    return new Response(JSON.stringify({
      success: true,
      data: arrivals,
      timestamp: new Date().toISOString(),
      station: station,
      count: arrivals.length
    }), { headers });

  } catch (err) {
    console.error('SEPTA fetch exception:', err);
    return new Response(JSON.stringify({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }), { 
      status: 500, 
      headers 
    });
  }
});

// Helper function to process individual arrival
function processArrival(e: any, now: number) {
  try {
    // Handle different possible timestamp fields
    const arrivalTimeStr = e.arrival_time || e.arrT || e.scheduled_time || e.eta;
    
    if (!arrivalTimeStr) {
      console.log('No arrival time found in:', JSON.stringify(e));
      return null;
    }

    // Parse arrival time
    const arrMs = new Date(arrivalTimeStr).getTime();
    
    // Calculate minutes until arrival
    const mins = Math.max(0, Math.round((arrMs - now) / 60000));
    
    // Determine display label
    let label: string;
    if (mins === 0) {
      label = (e.isApp === '1' || e.approaching) ? 'Approaching' : 'Due';
    } else {
      label = `${mins} min`;
    }

    return {
      line: e.route || e.line || e.train_id || 'Unknown',
      destination: e.destination || e.destNm || e.dest || 'Unknown',
      direction: e.direction || (e.trDr === "1" ? "Inbound" : "Outbound") || 'Unknown',
      minutes: mins,
      label: label,
      scheduled_time: arrivalTimeStr,
      platform: e.platform || e.track || null,
      status: e.status || 'On Time'
    };
  } catch (error) {
    console.error('Error processing arrival:', error, 'Data:', JSON.stringify(e));
    return null;
  }
}