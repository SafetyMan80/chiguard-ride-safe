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

    // For now, RTD requires GTFS-RT feeds which need special handling
    // This is a placeholder that returns sample data until RTD API is properly configured
    switch (action) {
      case 'arrivals':
      default: {
        // Use default station if none provided
        const targetStation = station || 'Union Station';

        console.log(`Fetching RTD arrivals for station: ${targetStation}`);
        
        // RTD uses GTFS-RT feeds which require different handling than simple REST APIs
        // For now, return sample data structure
        const sampleArrivals = [
          {
            line: 'A',
            destination: 'Denver International Airport',
            arrival: '5 min',
            direction: 'Eastbound'
          },
          {
            line: 'B',
            destination: 'Westminster',
            arrival: '12 min',
            direction: 'Northbound'
          },
          {
            line: 'C',
            destination: 'Littleton-Mineral',
            arrival: '8 min',
            direction: 'Southbound'
          }
        ];

        return new Response(
          JSON.stringify({ 
            success: true,
            data: sampleArrivals,
            timestamp: new Date().toISOString(),
            source: 'RTD',
            note: 'Sample data - RTD API integration needed for real-time data'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
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