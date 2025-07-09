import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let line, station;
    
    // Handle both URL parameters and body parameters
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        line = body.line;
        station = body.station;
      } catch {
        // If no body, try URL parameters
        const url = new URL(req.url);
        line = url.searchParams.get('line');
        station = url.searchParams.get('station');
      }
    } else {
      // GET request - use URL parameters
      const url = new URL(req.url);
      line = url.searchParams.get('line');
      station = url.searchParams.get('station');
    }
    
    // Get MARTA API key from Supabase secrets
    const martaApiKey = Deno.env.get('MARTA_API_KEY')
    if (!martaApiKey) {
      throw new Error('MARTA API key not configured')
    }

    console.log('MARTA API Key configured:', !!martaApiKey)
    console.log('Request parameters:', { line, station })

    // MARTA API endpoint for real-time arrivals (updated endpoint)
    const apiUrl = `https://developerservices.itsmarta.com:18096/itsmarta/railrealtimearrivals/developerservices/traindata?apiKey=${martaApiKey}`

    console.log('Fetching MARTA data from:', apiUrl.replace(martaApiKey, '[REDACTED]'))

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RAILSAVIOR-App/1.0'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`MARTA API responded with status: ${response.status}`, errorText)
      throw new Error(`MARTA API responded with status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('MARTA API response data length:', Array.isArray(data) ? data.length : 'Not an array')
    
    if (!Array.isArray(data)) {
      console.error('MARTA API returned non-array data:', data)
      throw new Error('Invalid MARTA API response format')
    }

    // Transform MARTA data to our standard format with proper time calculation
    const nowMs = Date.now();
    const transformedData = data.map((arrival: any) => {
      // MARTA returns either "X min", "Boarding", "Arrived", or actual time
      let minutes = 0;
      let label = arrival.WAITING_TIME || 'Unknown';
      
      if (arrival.WAITING_TIME) {
        if (arrival.WAITING_TIME === "Boarding" || arrival.WAITING_TIME === "Arrived") {
          minutes = 0;
          label = arrival.WAITING_TIME;
        } else if (arrival.WAITING_TIME.includes('min')) {
          // Extract number from "X min"
          const match = arrival.WAITING_TIME.match(/(\d+)/);
          minutes = match ? parseInt(match[1]) : 0;
          label = `${minutes} min`;
        } else if (arrival.NEXT_ARR) {
          // Parse actual time format if available
          try {
            const arrMs = new Date(arrival.NEXT_ARR).getTime();
            minutes = Math.max(0, Math.round((arrMs - nowMs) / 60000));
            label = minutes === 0 ? 'Due' : `${minutes} min`;
          } catch {
            minutes = 0;
            label = arrival.WAITING_TIME;
          }
        }
      }
      
      return {
        line: arrival.LINE || 'Unknown',
        station: arrival.STATION || 'Unknown', 
        destination: arrival.DESTINATION || 'Unknown',
        direction: arrival.DIRECTION || 'Unknown',
        arrivalTime: label,
        minutes: minutes,
        label: label,
        eventTime: arrival.EVENT_TIME || new Date().toISOString(),
        delay: arrival.DELAY || "0",
        trainId: arrival.TRAIN_ID || arrival.VEHICLE_ID || 'Unknown',
        status: arrival.WAITING_TIME === "Boarding" ? "Boarding" : 
                arrival.WAITING_TIME === "Arrived" ? "Arrived" : "On Time"
      };
    })

    console.log('Transformed data length:', transformedData.length)

    // Filter by line and station if specified
    let filteredData = transformedData
    if (line && line !== 'all') {
      const lineFilter = line.toLowerCase()
      filteredData = filteredData.filter((item: any) => 
        item.line.toLowerCase().includes(lineFilter) ||
        item.line.toLowerCase().replace(' line', '').includes(lineFilter)
      )
      console.log(`Filtered by line '${line}':`, filteredData.length)
    }
    
    if (station && station !== 'all') {
      const stationFilter = station.toLowerCase()
      filteredData = filteredData.filter((item: any) => 
        item.station.toLowerCase().includes(stationFilter) ||
        item.station.toLowerCase().replace(/[^a-z0-9]/g, '').includes(stationFilter.replace(/[^a-z0-9]/g, ''))
      )
      console.log(`Filtered by station '${station}':`, filteredData.length)
    }

    console.log('Final filtered data length:', filteredData.length)

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredData,
        timestamp: new Date().toISOString(),
        source: 'MARTA',
        total: filteredData.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('MARTA API Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        source: 'MARTA'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})