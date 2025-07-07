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
      console.log('🚆 ===== RAW API DATA ANALYSIS =====');
      console.log('🚆 Total arrivals in API response:', data.ctatt.eta.length);
      
      // 1. CHECK RAW API DATA OUTPUT - Log ALL timestamps before filtering
      data.ctatt.eta.forEach((arrival: any, index: number) => {
        console.log(`🚆 RAW ARRIVAL #${index + 1}:`, {
          arrT: arrival.arrT,
          prdt: arrival.prdt,
          isApp: arrival.isApp,
          isSch: arrival.isSch,
          isDly: arrival.isDly,
          rt: arrival.rt,
          destNm: arrival.destNm,
          staNm: arrival.staNm
        });
      });
      
      console.log('🚆 ===== PROCESSING WITH DISABLED FILTERING =====');
      
      // 2. TEMPORARILY DISABLE FILTERING - Process ALL data to see what comes through
      const allProcessedData = data.ctatt.eta.map((arrival: any, index: number) => {
        console.log(`🚆 Processing arrival #${index + 1} (NO FILTERING):`);
        
        let arrivalTime = 'Due';
        
        // Simple datetime parser without strict validation
        function parseCTADateTime(dateTimeStr: string): Date | null {
          if (!dateTimeStr || dateTimeStr === '') return null;
          
          try {
            const year = parseInt(dateTimeStr.substring(0, 4));
            const month = parseInt(dateTimeStr.substring(4, 6));
            const day = parseInt(dateTimeStr.substring(6, 8));
            const hour = parseInt(dateTimeStr.substring(9, 11));
            const minute = parseInt(dateTimeStr.substring(12, 14));
            const second = parseInt(dateTimeStr.substring(15, 17));
            
            const date = new Date(year, month - 1, day, hour, minute, second);
            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            return null;
          }
        }
        
        // Process without any filtering
        if (arrival.isApp === '1' || arrival.isApp === 1) {
          arrivalTime = 'Approaching';
        } else if (arrival.arrT && arrival.arrT !== '') {
          const arrivalDate = parseCTADateTime(arrival.arrT);
          const currentTime = new Date();
          
          if (arrivalDate) {
            const timeDiffMs = arrivalDate.getTime() - currentTime.getTime();
            const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
            
            console.log(`🚆 Unfiltered calculation - Minutes: ${timeDiffMinutes}`);
            
            // Show ALL calculations without filtering
            if (isNaN(timeDiffMinutes)) {
              arrivalTime = 'NaN';
            } else if (timeDiffMinutes <= 0) {
              arrivalTime = `Past (${Math.abs(timeDiffMinutes)} min ago)`;
            } else if (timeDiffMinutes === 1) {
              arrivalTime = '1 min';
            } else {
              arrivalTime = `${timeDiffMinutes} min`;
            }
          }
        } else if (arrival.isSch === '1') {
          arrivalTime = 'Scheduled';
        }
        
        return {
          line: arrival.rt || 'Unknown',
          station: arrival.staNm || 'Unknown',
          destination: arrival.destNm || 'Unknown',
          direction: arrival.trDr || 'Unknown',
          arrivalTime: arrivalTime,
          trainId: arrival.rn || 'Unknown',
          status: arrival.isApp === '1' ? 'Approaching' : 
                 arrival.isDly === '1' ? 'Delayed' : 'On Time'
        };
      });
      
      console.log('🚆 ===== ALL PROCESSED DATA (NO FILTERING) =====');
      console.log(`🚆 Total processed without filtering: ${allProcessedData.length}`);
      allProcessedData.forEach((item, index) => {
        console.log(`🚆 Unfiltered result #${index + 1}:`, item);
      });
      
      // For now, return the unfiltered data to see what shows up in UI
      transformedData = allProcessedData;
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