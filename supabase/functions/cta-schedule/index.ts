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
      try {
        const body = await req.json();
        stopId = body.stopId;
        routeId = body.routeId;
      } catch (e) {
        console.log('No valid JSON body provided, treating as general request');
      }
    }
    
    const CTA_API_KEY = Deno.env.get('CTA_API_KEY');
    console.log('🔑 CTA_API_KEY exists:', !!CTA_API_KEY);
    console.log('📥 Request params:', { stopId, routeId, method: req.method });
    
    if (!CTA_API_KEY) {
      console.error('❌ CTA API key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: 'CTA API key not configured',
          timestamp: new Date().toISOString(),
          source: 'CTA'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If no specific parameters, get general arrivals from a major hub
    if (!stopId && !routeId) {
      console.log('🚆 No specific parameters, getting general CTA arrivals');
      // Use a major CTA stop ID for general arrivals (Howard Station - Red/Yellow lines)
      stopId = '30173'; // Howard station - major hub
    }

    let apiUrl: string;

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

    console.log(`🚆 Fetching CTA data from: ${apiUrl}`);

    const response = await fetch(apiUrl);
    console.log(`🚆 CTA API HTTP Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ CTA API HTTP Error: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${errorText}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: `CTA API error: ${response.status} ${response.statusText}`,
          timestamp: new Date().toISOString(),
          source: 'CTA'
        }),
        { 
          status: 200, // Return 200 to client, but indicate API failure in response
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseText = await response.text();
    console.log(`✅ CTA API Response received (${responseText.length} chars)`);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('🚆 CTA API Response Structure:', JSON.stringify(data, null, 2));
      
      // Log the specific data we're looking for
      if (data.ctatt?.eta) {
        console.log('🚆 Found ETA data, first arrival:', JSON.stringify(data.ctatt.eta[0], null, 2));
      } else {
        console.log('🚆 No ETA data found in response. Available keys:', Object.keys(data.ctatt || {}));
      }
    } catch (parseError) {
      console.error('❌ Failed to parse CTA API response as JSON');
      console.error('❌ Parse error:', parseError.message);
      console.error('❌ Response text:', responseText.substring(0, 500));
      
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: 'Invalid response from CTA API',
          timestamp: new Date().toISOString(),
          source: 'CTA'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Handle CTA API error responses
    if (data.ctatt?.errCd && data.ctatt.errCd !== '0') {
      console.error('❌ CTA API Error:', data.ctatt.errNm);
      
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: `CTA API Error: ${data.ctatt.errNm}`,
          timestamp: new Date().toISOString(),
          source: 'CTA'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform CTA data to our standard format
    let transformedData = [];
    
    if (stopId && data.ctatt?.eta) {
      transformedData = data.ctatt.eta.map((arrival: any) => {
        console.log('🚆 Raw arrival data:', JSON.stringify(arrival, null, 2));
        
        let arrivalTime = 'Due';
        
        // Helper function to parse CTA datetime format: "yyyyMMdd HH:mm:ss"
        function parseCTADateTime(dateTimeStr: string): Date | null {
          if (!dateTimeStr || dateTimeStr === '') return null;
          
          try {
            // CTA format: "20250107 17:45:30" -> need to add dashes and T
            // Convert to ISO format: "2025-01-07T17:45:30"
            const year = dateTimeStr.substring(0, 4);
            const month = dateTimeStr.substring(4, 6);
            const day = dateTimeStr.substring(6, 8);
            const time = dateTimeStr.substring(9); // "17:45:30"
            
            const isoString = `${year}-${month}-${day}T${time}`;
            console.log('🚆 Converting CTA datetime:', dateTimeStr, '-> ISO:', isoString);
            
            const date = new Date(isoString);
            console.log('🚆 Parsed date object:', date);
            return date;
          } catch (error) {
            console.error('❌ Error parsing CTA datetime:', dateTimeStr, error);
            return null;
          }
        }
        
        // Check if train is approaching/due first
        if (arrival.isApp === '1' || arrival.isApp === 1) {
          arrivalTime = 'Approaching';
        } else if (arrival.arrT && arrival.arrT !== '') {
          console.log('🚆 Parsing arrT:', arrival.arrT);
          const arrivalDate = parseCTADateTime(arrival.arrT);
          
          // Get Chicago time (UTC-6 or UTC-5 depending on DST)
          const now = new Date();
          const chicagoTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
          
          console.log('🚆 Parsed arrival date:', arrivalDate);
          console.log('🚆 Current Chicago time:', chicagoTime);
          console.log('🚆 Current UTC time:', now);
          
          if (arrivalDate) {
            const diffMinutes = Math.round((arrivalDate.getTime() - chicagoTime.getTime()) / (1000 * 60));
            console.log('🚆 Calculated diff minutes:', diffMinutes);
            
            // Handle stale data - if more than 1 day old, it's probably stale
            if (Math.abs(diffMinutes) > 1440) { // 1440 minutes = 1 day
              console.log('🚆 Data appears stale (>1 day difference), using Due');
              arrivalTime = 'Due';
            } else if (diffMinutes <= 0) {
              arrivalTime = 'Arriving';
            } else if (diffMinutes === 1) {
              arrivalTime = '1 min';
            } else if (diffMinutes > 60) {
              // If more than 60 minutes, show as schedule
              arrivalTime = 'Scheduled';
            } else {
              arrivalTime = `${diffMinutes} min`;
            }
          } else {
            console.log('🚆 Failed to parse arrT, using Due');
            arrivalTime = 'Due';
          }
        } else {
          console.log('🚆 No arrT field, checking other fields');
          console.log('🚆 Available fields:', Object.keys(arrival));
        }
        
        const result = {
          line: arrival.rt || 'Unknown',
          station: arrival.staNm || 'Unknown',
          destination: arrival.destNm || 'Unknown',
          direction: arrival.trDr || 'Unknown',
          arrivalTime: arrivalTime,
          trainId: arrival.rn || 'Unknown',
          status: arrival.isApp === '1' ? 'Approaching' : 
                 arrival.isDly === '1' ? 'Delayed' : 'On Time'
        };
        
        console.log('🚆 Final transformed result:', JSON.stringify(result, null, 2));
        return result;
      });
    } else if (routeId && data.ctatt?.vehicle) {
      transformedData = data.ctatt.vehicle.map((vehicle: any) => ({
        line: vehicle.rt || 'Unknown',
        station: 'In Transit',
        destination: vehicle.destNm || 'Unknown',
        direction: vehicle.heading || 'Unknown',
        arrivalTime: 'In Transit',
        trainId: vehicle.vid || 'Unknown',
        status: 'Moving'
      }));
    } else if (data.ctatt?.routes) {
      transformedData = data.ctatt.routes.map((route: any) => ({
        line: route.rt || 'Unknown',
        station: 'All Stations',
        destination: route.rtnm || 'Unknown',
        direction: 'Various',
        arrivalTime: 'See Schedule',
        trainId: 'Multiple',
        status: 'Active'
      }));
    }

    console.log(`✅ Transformed ${transformedData.length} CTA records`);

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedData,
        timestamp: new Date().toISOString(),
        source: 'CTA'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ CTA Schedule API Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        error: error.message || 'Failed to fetch CTA schedule data',
        timestamp: new Date().toISOString(),
        source: 'CTA'
      }),
      {
        status: 200, // Return 200 to prevent client-side errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});