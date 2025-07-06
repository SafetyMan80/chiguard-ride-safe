import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MTA Subway lines mapping
const MTA_LINES = {
  '1': { name: '1', color: '#EE352E' },
  '2': { name: '2', color: '#EE352E' },
  '3': { name: '3', color: '#EE352E' },
  '4': { name: '4', color: '#00933C' },
  '5': { name: '5', color: '#00933C' },
  '6': { name: '6', color: '#00933C' },
  '7': { name: '7', color: '#B933AD' },
  'A': { name: 'A', color: '#0039A6' },
  'B': { name: 'B', color: '#FF6319' },
  'C': { name: 'C', color: '#0039A6' },
  'D': { name: 'D', color: '#FF6319' },
  'E': { name: 'E', color: '#0039A6' },
  'F': { name: 'F', color: '#FF6319' },
  'G': { name: 'G', color: '#6CBE45' },
  'J': { name: 'J', color: '#996633' },
  'L': { name: 'L', color: '#A7A9AC' },
  'M': { name: 'M', color: '#FF6319' },
  'N': { name: 'N', color: '#FCCC0A' },
  'Q': { name: 'Q', color: '#FCCC0A' },
  'R': { name: 'R', color: '#FCCC0A' },
  'W': { name: 'W', color: '#FCCC0A' },
  'Z': { name: 'Z', color: '#996633' },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let stationId: string | null = null;
    let lineId: string | null = null;

    // Handle both GET (query params) and POST (body) requests
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      stationId = searchParams.get('stationId');
      lineId = searchParams.get('lineId');
    } else if (req.method === 'POST') {
      const body = await req.json();
      stationId = body.stationId;
      lineId = body.lineId;
    }
    
    console.log('📥 MTA Request params:', { stationId, lineId, method: req.method });
    
    let responseData: any;

    if (stationId) {
      // Get arrivals for a specific station
// MTA GTFS-RT feed endpoints by line group
      const MTA_FEEDS = {
        'ace': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
        'bdfm': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm', 
        'g': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
        'jz': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
        'nqrw': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
        'l': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
        'main': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
        'si': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si'
      };

      // Determine which feed to use based on station/line
      const feedUrl = MTA_FEEDS.main; // Default to main feed for now
      
      console.log(`Fetching MTA data from: ${feedUrl}`);
      
      // TODO: Parse GTFS-RT protobuf data - requires MTA API key
      responseData = {
        type: 'arrivals',
        data: [
          {
            station_id: stationId,
            station_name: 'Times Square-42nd St',
            route_id: '4',
            route_name: '4',
            direction: 'Uptown',
            arrival_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            departure_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            delay: 0,
            headsign: 'Woodlawn'
          },
          {
            station_id: stationId,
            station_name: 'Times Square-42nd St',
            route_id: '6',
            route_name: '6',
            direction: 'Downtown',
            arrival_time: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
            departure_time: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
            delay: 120,
            headsign: 'Brooklyn Bridge'
          }
        ],
        timestamp: new Date().toISOString(),
        notice: 'MTA integration is in development. This is sample data.'
      };

    } else if (lineId) {
      // Get line information
      const line = MTA_LINES[lineId as keyof typeof MTA_LINES];
      responseData = {
        type: 'line',
        data: line || null,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Get all lines/routes
      responseData = {
        type: 'lines',
        data: Object.values(MTA_LINES),
        timestamp: new Date().toISOString(),
      };
    }

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('MTA Schedule API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to fetch MTA schedule data',
        timestamp: new Date().toISOString(),
        notice: 'MTA integration is currently in development'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});