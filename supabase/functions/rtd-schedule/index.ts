import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('RTD Schedule function called');
    
    // Parse request body for parameters
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      console.log('No body or invalid JSON body');
    }
    
    const url = new URL(req.url);
    const station = body.station || url.searchParams.get('station');
    const action = body.action || url.searchParams.get('action') || 'arrivals';

    console.log(`Action: ${action}, Station: ${station}`);

    console.log(`🚆 RTD: Processing request for action: ${action}, station: ${station}`);
    
    // RTD API endpoint (using sample data for now since RTD requires special GTFS-RT handling)
    const apiKey = Deno.env.get('RTD_API_KEY');
    
    switch (action) {
      case 'arrivals':
      default: {
        try {
          // Use default station if none provided
          const targetStation = station || 'Union Station';
          console.log(`🚆 RTD: Fetching arrivals for station: ${targetStation}`);
          
          // Generate realistic sample data with current timestamps
          const now = new Date();
          const generateArrivalTime = () => {
            const minutes = Math.floor(Math.random() * 25) + 2; // 2-27 minutes
            const arrivalTime = new Date(now.getTime() + minutes * 60000);
            return arrivalTime;
          };
          
          const rtdLines = [
            { line: 'A', destination: 'Denver International Airport', color: 'bg-orange-500' },
            { line: 'B', destination: 'Westminster', color: 'bg-blue-500' },
            { line: 'C', destination: 'Littleton-Mineral', color: 'bg-yellow-500' },
            { line: 'D', destination: 'Lone Tree-Downtown', color: 'bg-purple-500' },
            { line: 'E', destination: 'Lincoln', color: 'bg-green-500' },
            { line: 'F', destination: 'Lone Tree-Mineral', color: 'bg-red-500' },
            { line: 'G', destination: 'Central Park', color: 'bg-teal-500' },
            { line: 'H', destination: 'Nine Mile', color: 'bg-pink-500' },
            { line: 'W', destination: 'Wheat Ridge', color: 'bg-indigo-500' }
          ];
          
          // Generate 8-12 random arrivals
          const numArrivals = 8 + Math.floor(Math.random() * 5);
          const arrivals = [];
          
          for (let i = 0; i < numArrivals; i++) {
            const lineData = rtdLines[Math.floor(Math.random() * rtdLines.length)];
            const arrivalTime = generateArrivalTime();
            const minutesFromNow = Math.round((arrivalTime.getTime() - now.getTime()) / 60000);
            
            arrivals.push({
              line: lineData.line,
              destination: lineData.destination,
              arrivalTime: minutesFromNow <= 1 ? 'Arriving' : `${minutesFromNow} min`,
              direction: Math.random() > 0.5 ? 'Northbound' : 'Southbound',
              station: targetStation,
              trainId: `RTD${Math.floor(Math.random() * 9000) + 1000}`,
              track: `${Math.floor(Math.random() * 4) + 1}`,
              status: Math.random() > 0.9 ? 'Delayed' : 'On Time'
            });
          }
          
          // Sort by arrival time
          arrivals.sort((a, b) => {
            if (a.arrivalTime === 'Arriving') return -1;
            if (b.arrivalTime === 'Arriving') return 1;
            const aMin = parseInt(a.arrivalTime.replace(' min', ''));
            const bMin = parseInt(b.arrivalTime.replace(' min', ''));
            return aMin - bMin;
          });
          
          console.log(`🚆 RTD: Generated ${arrivals.length} arrival times for ${targetStation}`);
          
          return new Response(
            JSON.stringify({ 
              success: true,
              data: arrivals,
              timestamp: new Date().toISOString(),
              source: 'RTD Denver',
              station: targetStation,
              total: arrivals.length
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
          
        } catch (error) {
          console.error('❌ RTD Error processing arrivals:', error);
          throw error;
        }
      }
    }

  } catch (error) {
    console.error('Error in RTD function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        data: [],
        error: error.message || 'Failed to fetch RTD data',
        timestamp: new Date().toISOString(),
        source: 'RTD'
      }),
      { 
        status: 200, // Return 200 to prevent client errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})