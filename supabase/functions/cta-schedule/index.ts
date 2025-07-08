import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
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
    console.log('🔑 CTA_API_KEY length:', CTA_API_KEY?.length || 0);
    console.log('📥 Request params:', { stopId, routeId, method: req.method });
    console.log('📥 Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Enhanced API key validation
    if (CTA_API_KEY) {
      const trimmedKey = CTA_API_KEY.trim();
      const hasHiddenChars = CTA_API_KEY !== trimmedKey;
      const keyPattern = /^[a-zA-Z0-9]+$/; // Basic pattern for CTA keys
      
      console.log('🔑 API Key validation:', {
        originalLength: CTA_API_KEY.length,
        trimmedLength: trimmedKey.length,
        hasHiddenChars,
        matchesPattern: keyPattern.test(trimmedKey)
      });
      
      if (hasHiddenChars) {
        console.warn('⚠️  API key contains hidden characters (spaces/line breaks)');
      }
    }
    
    // ISSUE CHECK 3: Missing API Key
    if (!CTA_API_KEY) {
      console.error('❌ ERROR 3: CTA API key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: 'CTA API key not configured in Supabase secrets',
          timestamp: new Date().toISOString(),
          source: 'CTA',
          debug: { hasKey: false }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ISSUE CHECK 4: Invalid API Key format
    if (CTA_API_KEY.length < 10) {
      console.error('❌ ERROR 4: CTA API key appears invalid (too short)');
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: 'CTA API key appears invalid',
          timestamp: new Date().toISOString(),
          source: 'CTA',
          debug: { keyLength: CTA_API_KEY.length }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Stop ID validation function
    const validateStopId = (id: string): boolean => {
      if (!id) return false;
      // CTA stop IDs are typically 5-digit numbers
      const stopIdPattern = /^\d{5}$/;
      const isValid = stopIdPattern.test(id);
      console.log(`🚏 Stop ID validation for "${id}":`, isValid);
      return isValid;
    };

    // Validate stop ID if provided
    if (stopId && !validateStopId(stopId)) {
      console.warn(`⚠️  Invalid stop ID format: "${stopId}". Expected 5-digit number.`);
      // Don't fail, but log the issue
    }

    // If no specific parameters, try the busiest downtown stations first
    if (!stopId && !routeId) {
      console.log('🚆 No specific parameters, trying busiest downtown stations');
      // Try Clark/Lake (downtown hub) first - this should always have trains
      stopId = '30131'; // Clark/Lake - busiest downtown interchange
    }

    let apiUrl: string;

    // ALWAYS use the arrivals API - this is the correct one for real-time arrival predictions
    if (stopId && routeId) {
      // Both stop and route specified
      apiUrl = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&stpid=${stopId}&rt=${routeId}&outputType=JSON`;
    } else if (stopId) {
      // Only stop specified
      apiUrl = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&stpid=${stopId}&outputType=JSON`;
    } else if (routeId) {
      // Only route specified - use a major station for that route
      const majorStationForRoute = {
        'Red': '30173', // Howard
        'Blue': '30171', // O'Hare  
        'Brown': '30057', // Fullerton
        'Green': '30131', // Clark/Lake
        'Orange': '30063', // Midway
        'Pink': '30131', // Clark/Lake
        'Purple': '30173', // Howard
        'Yellow': '30173' // Howard
      };
      const stationId = majorStationForRoute[routeId] || '30173'; // Default to Howard
      apiUrl = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&stpid=${stationId}&rt=${routeId}&outputType=JSON`;
    } else {
      // No specific parameters - get arrivals from Howard station (major hub)
      apiUrl = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&stpid=30173&outputType=JSON`;
    }

    console.log(`🚆 Fetching CTA data from: ${apiUrl}`);
    console.log('🚆 About to make HTTP request to CTA API...');
    
    // Add request headers for better debugging
    const requestHeaders = {
      'User-Agent': 'ChiGuard-Transit-App/1.0',
      'Accept': 'application/json, text/xml',
      'Cache-Control': 'no-cache'
    };
    
    console.log('🚆 Request headers:', requestHeaders);
    console.log('🚆 Request timestamp:', new Date().toISOString());

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: requestHeaders
    });
    
    console.log(`🚆 CTA API HTTP Status: ${response.status} ${response.statusText}`);
    console.log('🚆 CTA API Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('🚆 Response timestamp:', new Date().toISOString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ CTA API HTTP Error: ${response.status} ${response.statusText}`);
      console.error(`❌ Response body: ${errorText}`);
      
      // Return specific error message based on status code
      let errorMessage = `CTA API error: ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'CTA API key authentication failed';
      } else if (response.status === 404) {
        errorMessage = 'CTA station/route not found';
      } else if (response.status >= 500) {
        errorMessage = 'CTA API server error';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: errorMessage,
          timestamp: new Date().toISOString(),
          source: 'CTA',
          debug: {
            url: apiUrl,
            status: response.status,
            statusText: response.statusText,
            body: errorText
          }
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
    
    if (data.ctatt?.eta && data.ctatt.eta.length > 0) {
      console.log('🚆 ===== RAW API DATA ANALYSIS =====');
      console.log('🚆 Total arrivals in API response:', data.ctatt.eta.length);
      
      // Check if ALL data is stale
      let hasAnyCurrentData = false;
      const now = new Date();
      
      data.ctatt.eta.forEach((arrival: any, index: number) => {
        if (arrival.arrT) {
          try {
            const year = parseInt(arrival.arrT.substring(0, 4));
            const month = parseInt(arrival.arrT.substring(4, 6));
            const day = parseInt(arrival.arrT.substring(6, 8));
            const hour = parseInt(arrival.arrT.substring(9, 11));
            const minute = parseInt(arrival.arrT.substring(12, 14));
            const second = parseInt(arrival.arrT.substring(15, 17));
            
            const arrivalDate = new Date(year, month - 1, day, hour, minute, second);
            const diffMinutes = Math.round((arrivalDate.getTime() - now.getTime()) / (1000 * 60));
            
            console.log(`🚆 RAW ARRIVAL #${index + 1}: ${arrival.arrT} = ${diffMinutes} minutes from now`);
            
            // Consider data current if it's within reasonable bounds
            if (Math.abs(diffMinutes) < 1440) { // Within 1 day
              hasAnyCurrentData = true;
            }
          } catch (e) {
            console.log(`🚆 RAW ARRIVAL #${index + 1}: ${arrival.arrT} = PARSE ERROR`);
          }
        }
      });
      
      console.log('🚆 Has any current data:', hasAnyCurrentData);
      
      if (!hasAnyCurrentData) {
        console.log('🚆 ⚠️  ALL DATA IS STALE - CTA API returning old data');
        console.log('🚆 Returning fallback message for stale data');
        
        transformedData = [{
          line: 'CTA',
          station: 'All Stations', 
          destination: 'Service Information',
          direction: '',
          arrivalTime: 'Unavailable',
          trainId: '',
          status: 'Real-time data temporarily unavailable'
        }];
      } else {
        // Process normally with filtering
        transformedData = data.ctatt.eta
          .map((arrival: any, index: number) => {
            let arrivalTime = 'Due';
            
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
            
            if (arrival.isApp === '1' || arrival.isApp === 1) {
              arrivalTime = 'Approaching';
            } else if (arrival.arrT && arrival.arrT !== '') {
              const arrivalDate = parseCTADateTime(arrival.arrT);
              const currentTime = new Date();
              
              if (arrivalDate) {
                const timeDiffMs = arrivalDate.getTime() - currentTime.getTime();
                const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
                
                // Filter out stale data
                if (Math.abs(timeDiffMinutes) > 180) { // More than 3 hours
                  return null;
                }
                
                if (timeDiffMinutes <= 0) {
                  arrivalTime = 'Arriving';
                } else if (timeDiffMinutes === 1) {
                  arrivalTime = '1 min';
                } else if (timeDiffMinutes > 60) {
                  arrivalTime = 'Scheduled';
                } else {
                  arrivalTime = `${timeDiffMinutes} min`;
                }
              } else {
                return null;
              }
            } else if (arrival.isSch === '1') {
              arrivalTime = 'Scheduled';
            } else {
              return null;
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
          })
          .filter(result => result !== null);
      }
    } else {
      // No ETA data found - try alternative busy stations automatically
      console.log('🚆 ⚠️  NO ETA DATA - trying alternative stations...');
      
      const alternativeStations = ['30171', '30089', '30077', '30057']; // O'Hare, 95th, Logan Sq, Fullerton
      
      for (const altStopId of alternativeStations) {
        console.log(`🚆 Trying alternative station: ${altStopId}`);
        
        const altApiUrl = `http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${CTA_API_KEY}&stpid=${altStopId}&outputType=JSON`;
        
        try {
          const altResponse = await fetch(altApiUrl);
          if (altResponse.ok) {
            const altData = JSON.parse(await altResponse.text());
            if (altData.ctatt?.eta && altData.ctatt.eta.length > 0) {
              console.log(`🚆 ✅ Found data at station ${altStopId}!`);
              
              // Process this data instead
              transformedData = altData.ctatt.eta
                .map((arrival: any) => {
                  let arrivalTime = 'Due';
                  
                  if (arrival.isApp === '1' || arrival.isApp === 1) {
                    arrivalTime = 'Approaching';
                  } else if (arrival.arrT && arrival.arrT !== '') {
                    // Parse arrival time
                    try {
                      const year = parseInt(arrival.arrT.substring(0, 4));
                      const month = parseInt(arrival.arrT.substring(4, 6));
                      const day = parseInt(arrival.arrT.substring(6, 8));
                      const hour = parseInt(arrival.arrT.substring(9, 11));
                      const minute = parseInt(arrival.arrT.substring(12, 14));
                      const second = parseInt(arrival.arrT.substring(15, 17));
                      
                      const arrivalDate = new Date(year, month - 1, day, hour, minute, second);
                      const currentTime = new Date();
                      const timeDiffMs = arrivalDate.getTime() - currentTime.getTime();
                      const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
                      
                      if (timeDiffMinutes <= 0) {
                        arrivalTime = 'Arriving';
                      } else if (timeDiffMinutes === 1) {
                        arrivalTime = '1 min';
                      } else if (timeDiffMinutes > 60) {
                        arrivalTime = 'Scheduled';
                      } else {
                        arrivalTime = `${timeDiffMinutes} min`;
                      }
                    } catch (e) {
                      arrivalTime = 'Due';
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
                })
                .filter(result => result !== null);
              
              break; // Found data, stop trying
            }
          }
        } catch (e) {
          console.log(`🚆 Failed to fetch from station ${altStopId}:`, e.message);
        }
      }
      
      // If still no data after trying alternatives
      if (transformedData.length === 0) {
        console.log('🚆 ⚠️  NO DATA from any station - providing service notice');
        transformedData = [{
          line: 'CTA',
          station: 'Service Notice',
          destination: 'No current arrivals',
          direction: '',
          arrivalTime: 'Trains may be running',
          trainId: '',
          status: 'Check official CTA app for live updates'
        }];
      }
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