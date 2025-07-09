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
    let requestBody: any = {};

    // Handle both GET (query params) and POST (body) requests
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      stopId = searchParams.get('stpid') || searchParams.get('stopId');
      routeId = searchParams.get('routeId') || searchParams.get('rt');
    } else if (req.method === 'POST') {
      try {
        requestBody = await req.json();
        console.log('🚆 CTA Raw request body:', JSON.stringify(requestBody, null, 2));
        
        // Handle simplified parameters from frontend (like working cities)
        if (requestBody.line) {
          const lineMapping: { [key: string]: string } = {
            'red': 'Red',
            'blue': 'Blue',
            'brown': 'Brn', 
            'green': 'G',
            'orange': 'Org',
            'purple': 'P',
            'pink': 'Pink',
            'yellow': 'Y'
          };
          routeId = lineMapping[requestBody.line.toLowerCase()] || requestBody.line;
          console.log('🚆 CTA Mapped line:', requestBody.line, '->', routeId);
        }
        
        if (requestBody.station) {
          const stationMapping: { [key: string]: string } = {
            "clark-lake": "30131",
            "fullerton": "30057", 
            "belmont": "30254",
            "howard": "30173",
            "95th-dan-ryan": "30089",
            "roosevelt": "30001",
            "ohare": "30171",
            "forest-park": "30044",
            "jefferson-park": "30081",
            "logan-square": "30077",
            "midway": "30063",
            "roosevelt-orange": "30001",
            "harlem-lake": "30047",
            "garfield": "30099",
            "kimball": "30297",
            "merchandise-mart": "30768",
            "54th-cermak": "30098",
            "linden": "30307",
            "dempster-skokie": "30308"
          };
          stopId = stationMapping[requestBody.station] || requestBody.station;
          console.log('🚆 CTA Mapped station:', requestBody.station, '->', stopId);
        }
        
        // Legacy support for direct API parameters
        stopId = stopId || requestBody.stpid || requestBody.stopId;
        routeId = routeId || requestBody.routeId || requestBody.rt;
        
      } catch (e) {
        console.log('🚆 CTA No valid JSON body provided, using defaults');
      }
    }
    
    const CTA_API_KEY = Deno.env.get('CTA_API_KEY');
    console.log('🔑 CTA_API_KEY exists:', !!CTA_API_KEY);
    console.log('📥 CTA Final request params:', { stopId, routeId, method: req.method });
    console.log('📥 CTA Original request body:', requestBody);
    
    if (!CTA_API_KEY) {
      console.error('❌ ERROR: CTA API key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          error: 'CTA API key not configured in Supabase secrets',
          timestamp: new Date().toISOString(),
          source: 'CTA'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For comprehensive system overview, we'll call multiple major stations and all route endpoints
    let apiUrls: string[] = [];
    const baseUrl = 'https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx';
    
    if (stopId && routeId) {
      // Both stop and route specified
      apiUrls.push(`${baseUrl}?key=${CTA_API_KEY}&stpid=${stopId}&rt=${routeId}&outputType=JSON`);
    } else if (stopId) {
      // Only stop specified
      apiUrls.push(`${baseUrl}?key=${CTA_API_KEY}&stpid=${stopId}&outputType=JSON`);
    } else if (routeId) {
      // Only route specified - get ALL stations for this route
      apiUrls.push(`${baseUrl}?key=${CTA_API_KEY}&rt=${routeId}&outputType=JSON`);
      console.log('🚆 CTA Fetching ALL stations for route:', routeId);
    } else {
      // Default: Get ALL trains system-wide by fetching each route
      const allRoutes = ['Red', 'Blue', 'Brn', 'G', 'Org', 'Pink', 'P', 'Y'];
      
      apiUrls = allRoutes.map(route => 
        `${baseUrl}?key=${CTA_API_KEY}&rt=${route}&outputType=JSON`
      );
      
      console.log('🚆 CTA Fetching ALL routes for system overview:', allRoutes);
    }

    console.log(`🚆 Fetching CTA data from ${apiUrls.length} endpoint(s)`);
    
    // Fetch from all URLs
    const allTransformedData: any[] = [];
    
    for (const apiUrl of apiUrls) {
      try {
        console.log(`🚆 Calling: ${apiUrl.replace(CTA_API_KEY, 'API_KEY_HIDDEN')}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'ChiGuard-Transit-App/1.0',
            'Accept': 'application/json'
          }
        });
        
        console.log(`🚆 CTA API HTTP Status: ${response.status} for ${apiUrl.includes('rt=') ? apiUrl.split('rt=')[1].split('&')[0] : 'endpoint'}`);
        
        if (!response.ok) {
          console.error(`❌ CTA API HTTP Error: ${response.status} for endpoint`);
          continue; // Skip this endpoint and try the next one
        }

        const responseText = await response.text();
        console.log(`✅ CTA API Response received (${responseText.length} chars)`);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('🚆 CTA API Response parsed successfully');
        } catch (parseError) {
          console.error('❌ Failed to parse CTA API response as JSON:', parseError);
          continue; // Skip this endpoint
        }
        
        // Handle CTA API error responses
        if (data.ctatt?.errCd && data.ctatt.errCd !== '0') {
          console.error('❌ CTA API Error:', data.ctatt.errNm);
          continue; // Skip this endpoint
        }

        // Transform CTA data to our standard format
        if (data.ctatt?.eta && data.ctatt.eta.length > 0) {
          console.log('🚆 Processing', data.ctatt.eta.length, 'arrivals from this endpoint');
          
          const transformedData = data.ctatt.eta
            .map((arrival: any) => {
              let arrivalTime = 'Due';
              
              // Parse CTA datetime format: YYYYMMDD HH:MM:SS
              function parseCTADateTime(dateTimeStr: string): Date | null {
                if (!dateTimeStr) return null;
                
                try {
                  const year = parseInt(dateTimeStr.substring(0, 4));
                  const month = parseInt(dateTimeStr.substring(4, 6));
                  const day = parseInt(dateTimeStr.substring(6, 8));
                  const hour = parseInt(dateTimeStr.substring(9, 11));
                  const minute = parseInt(dateTimeStr.substring(12, 14));
                  const second = parseInt(dateTimeStr.substring(15, 17));
                  
                  return new Date(year, month - 1, day, hour, minute, second);
                } catch (error) {
                  return null;
                }
              }
              
              if (arrival.isApp === '1' || arrival.isApp === 1) {
                arrivalTime = 'Approaching';
              } else if (arrival.arrT) {
                const arrivalDate = parseCTADateTime(arrival.arrT);
                const currentTime = new Date();
                
                if (arrivalDate) {
                  const timeDiffMs = arrivalDate.getTime() - currentTime.getTime();
                  const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
                  
                  // Filter out stale data (more than 3 hours old/future)
                  if (Math.abs(timeDiffMinutes) > 180) {
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
            
          allTransformedData.push(...transformedData);
          console.log(`🚆 Added ${transformedData.length} arrivals from this endpoint`);
        } else {
          console.log('🚆 No arrivals found for this endpoint');
        }
        
      } catch (error) {
        console.error('❌ Error processing endpoint:', error);
        continue; // Continue with next endpoint
      }
    }
    
    // Remove duplicates based on train ID, station, and arrival time
    const uniqueArrivals = allTransformedData.filter((arrival, index, self) => 
      index === self.findIndex(a => 
        a.trainId === arrival.trainId && 
        a.station === arrival.station &&
        a.arrivalTime === arrival.arrivalTime
      )
    );
    
    // Sort by arrival time and limit results
    const sortedArrivals = uniqueArrivals
      .sort((a, b) => {
        if (a.arrivalTime === 'Approaching' || a.arrivalTime === 'Arriving') return -1;
        if (b.arrivalTime === 'Approaching' || b.arrivalTime === 'Arriving') return 1;
        const aMinutes = parseInt(a.arrivalTime.replace(' min', '')) || 999;
        const bMinutes = parseInt(b.arrivalTime.replace(' min', '')) || 999;
        return aMinutes - bMinutes;
      })
      .slice(0, 100); // Increase limit to 100 for comprehensive view

    console.log(`✅ Total unique arrivals found: ${uniqueArrivals.length}`);
    console.log(`✅ Returning ${sortedArrivals.length} CTA arrivals after sorting and limiting`);

    return new Response(
      JSON.stringify({
        success: true,
        data: sortedArrivals,
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});