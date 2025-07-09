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

    // Handle SEPTA's nested structure with dynamic station key
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // 1. Grab the one dynamic key (station name + timestamp)
      const stationKeys = Object.keys(data);
      console.log('Station keys found:', stationKeys);
      
      if (stationKeys.length === 0) {
        console.log('No station keys found in response');
        arrivals = [];
      } else {
        const stationKey = stationKeys[0];
        const stationArr = data[stationKey];
        console.log('Processing station key:', stationKey);
        
        if (!Array.isArray(stationArr) || stationArr.length === 0) {
          console.log("No departures at", stationKey);
          arrivals = [];
        } else {
          // 2. Unwrap the single object
          const scheduleObj = stationArr[0];
          console.log('Schedule object keys:', Object.keys(scheduleObj));
          
          // 3. Flatten Northbound & Southbound into one array
          arrivals = ['Northbound', 'Southbound'].flatMap(dir => {
            const trains = scheduleObj[dir] || [];
            console.log(`${dir} trains:`, trains.length);
            
            return trains.map((t: any) => {
              // Parse the API's timestamp field
              const arrivalTimeStr = t.arrival_time || t.scheduled_time || t.time;
              
              if (!arrivalTimeStr) {
                console.log('No arrival time found for train:', JSON.stringify(t));
                return null;
              }
              
              const arrMs = new Date(arrivalTimeStr).getTime();
              const deltaMin = Math.max(0, Math.round((arrMs - now) / 60000));
              
              return {
                line: t.path || t.route || t.line || 'Unknown',
                trainId: t.train_id || t.id,
                direction: dir,
                destination: t.destination || t.dest || `${dir} Service`,
                arrivalTime: arrivalTimeStr,
                minutes: deltaMin,
                label: deltaMin === 0 ? 'Due' : `${deltaMin} min`,
                platform: t.platform || t.track || null,
                status: t.status || 'On Time'
              };
            }).filter(Boolean); // Remove null entries
          });
        }
      }
    } else if (Array.isArray(data)) {
      // Fallback for direct array format
      arrivals = data.map((e: any) => processArrival(e, now)).filter(Boolean);
    } else {
      console.log('Unexpected data structure:', JSON.stringify(data, null, 2));
      arrivals = [];
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