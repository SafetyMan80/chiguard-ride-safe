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
      console.log('🚆 Processing CTA ETA data. Total arrivals:', data.ctatt.eta.length);
      
      transformedData = data.ctatt.eta
        .map((arrival: any, index: number) => {
          console.log(`🚆 Processing arrival #${index + 1}:`, JSON.stringify(arrival, null, 2));
          
          let arrivalTime = 'Due';
          
          // 1. VERIFY API RESPONSE DATE FIELDS
          console.log('🚆 Available time fields:', {
            arrT: arrival.arrT,
            prdt: arrival.prdt,
            isApp: arrival.isApp,
            isSch: arrival.isSch
          });
          
          // Helper function with improved CTA datetime parsing
          function parseCTADateTime(dateTimeStr: string): Date | null {
            if (!dateTimeStr || dateTimeStr === '') {
              console.log('🚆 Empty datetime string');
              return null;
            }
            
            try {
              console.log('🚆 Parsing CTA datetime:', dateTimeStr);
              
              // CTA format: "20250107 17:45:30"
              if (dateTimeStr.length < 17) {
                console.error('❌ Invalid CTA datetime format (too short):', dateTimeStr);
                return null;
              }
              
              const year = parseInt(dateTimeStr.substring(0, 4));
              const month = parseInt(dateTimeStr.substring(4, 6));
              const day = parseInt(dateTimeStr.substring(6, 8));
              const hour = parseInt(dateTimeStr.substring(9, 11));
              const minute = parseInt(dateTimeStr.substring(12, 14));
              const second = parseInt(dateTimeStr.substring(15, 17));
              
              console.log('🚆 Parsed components:', { year, month, day, hour, minute, second });
              
              // Validate components
              if (year < 2020 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31 ||
                  hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                console.error('❌ Invalid date components:', { year, month, day, hour, minute, second });
                return null;
              }
              
              // Create date object (month is 0-indexed in JavaScript)
              const date = new Date(year, month - 1, day, hour, minute, second);
              
              console.log('🚆 Created date object:', date.toISOString());
              console.log('🚆 Date is valid:', !isNaN(date.getTime()));
              
              return isNaN(date.getTime()) ? null : date;
            } catch (error) {
              console.error('❌ Error parsing CTA datetime:', dateTimeStr, error);
              return null;
            }
          }
          
          // Check if train is explicitly marked as approaching
          if (arrival.isApp === '1' || arrival.isApp === 1) {
            console.log('🚆 Train marked as approaching');
            arrivalTime = 'Approaching';
          } else if (arrival.arrT && arrival.arrT !== '') {
            console.log('🚆 Processing arrT field:', arrival.arrT);
            const arrivalDate = parseCTADateTime(arrival.arrT);
            const currentTime = new Date();
            
            console.log('🚆 Parsed arrival date:', arrivalDate?.toISOString());
            console.log('🚆 Current time:', currentTime.toISOString());
            
            if (arrivalDate && !isNaN(arrivalDate.getTime())) {
              const timeDiffMs = arrivalDate.getTime() - currentTime.getTime();
              const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
              
              console.log('🚆 Time difference (ms):', timeDiffMs);
              console.log('🚆 Time difference (minutes):', timeDiffMinutes);
              
              // 2. ADD SANITY CHECKS
              const isInFuture = timeDiffMs > 0;
              const isReasonableTime = Math.abs(timeDiffMinutes) < 180; // Within 3 hours
              const isNotStale = Math.abs(timeDiffMinutes) < 1440; // Not more than 1 day
              
              console.log('🚆 Sanity checks:', {
                isInFuture,
                isReasonableTime,
                isNotStale,
                isValidNumber: !isNaN(timeDiffMinutes)
              });
              
              // 3. HANDLE INCORRECT DATES GRACEFULLY
              if (isNaN(timeDiffMinutes)) {
                console.log('🚆 Invalid time calculation (NaN)');
                return null; // Filter out this entry
              } else if (!isNotStale) {
                console.log('🚆 Stale data detected (>1 day old)');
                return null; // Filter out this entry
              } else if (!isReasonableTime) {
                console.log('🚆 Unreasonable time difference (>3 hours)');
                return null; // Filter out this entry
              } else if (!isInFuture) {
                console.log('🚆 Arrival time is in the past');
                arrivalTime = 'Arriving';
              } else if (timeDiffMinutes === 1) {
                arrivalTime = '1 min';
              } else if (timeDiffMinutes > 60) {
                arrivalTime = 'Scheduled';
              } else {
                arrivalTime = `${timeDiffMinutes} min`;
              }
            } else {
              console.log('🚆 Failed to parse arrival time');
              return null; // Filter out this entry
            }
          } else {
            console.log('🚆 No valid time fields found');
            // Only include if it's scheduled or has other valid indicators
            if (arrival.isSch === '1') {
              arrivalTime = 'Scheduled';
            } else {
              return null; // Filter out this entry
            }
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
        })
        .filter(result => result !== null); // Remove filtered out entries
      
      console.log(`🚆 Final results after filtering: ${transformedData.length} valid arrivals`);
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