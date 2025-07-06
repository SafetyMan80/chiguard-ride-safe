import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SEPTA Schedule function called');
    const { action, station, route } = await req.json().catch(() => ({}));
    
    // Handle different action types
    switch (action) {
      case 'arrivals':
        return await getArrivals(station);
      case 'routes':
        return await getRoutes();
      case 'stations':
        return await getStations(route);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: arrivals, routes, or stations' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in SEPTA schedule function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch SEPTA data',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getArrivals(station: string) {
  if (!station) {
    return new Response(
      JSON.stringify({ error: 'Station parameter is required' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log(`Fetching SEPTA arrivals for station: ${station}`);

    // SEPTA Real-time arrival API
    const url = `https://www3.septa.org/api/Arrivals/index.php?station=${encodeURIComponent(station)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RAILSAVIOR App'
      }
    });

    if (!response.ok) {
      console.error(`SEPTA API error: ${response.status} ${response.statusText}`);
      throw new Error(`SEPTA API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log('SEPTA API response received');

    // Transform the data to a consistent format
    const arrivals = Object.entries(data).flatMap(([lineKey, lineData]: [string, any]) => {
      if (!Array.isArray(lineData)) return [];
      
      return lineData.map((arrival: any) => ({
        line: lineKey,
        destination: arrival.destination || 'Unknown',
        arrival: arrival.depart_time || arrival.sched_time || 'Unknown',
        direction: arrival.direction || 'Unknown',
        track: arrival.track || null,
        status: arrival.status || 'On Time',
        delay: arrival.delay || '0'
      }));
    });

    return new Response(
      JSON.stringify({
        arrivals,
        station,
        lastUpdated: new Date().toISOString(),
        source: 'SEPTA Real-time API'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching SEPTA arrivals:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch SEPTA arrivals',
        details: error.message,
        arrivals: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function getRoutes() {
  try {
    console.log('Fetching SEPTA routes');

    // Static route data for SEPTA major lines
    const routes = [
      {
        id: 'BSL',
        name: 'Broad Street Line',
        type: 'Subway',
        color: '#F47920',
        description: 'North-South subway line'
      },
      {
        id: 'MFL',
        name: 'Market-Frankford Line',
        type: 'Subway/Elevated',
        color: '#0F4D98',
        description: 'East-West subway and elevated line'
      },
      {
        id: 'NHSL',
        name: 'Norristown High Speed Line',
        type: 'Light Rail',
        color: '#9E1A6A',
        description: 'Light rail to Norristown'
      },
      {
        id: 'RRD',
        name: 'Regional Rail',
        type: 'Commuter Rail',
        color: '#68217A',
        description: 'Suburban commuter rail network'
      }
    ];

    return new Response(
      JSON.stringify({
        routes,
        lastUpdated: new Date().toISOString(),
        source: 'SEPTA Static Data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching SEPTA routes:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch SEPTA routes',
        details: error.message,
        routes: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function getStations(route?: string) {
  try {
    console.log('Fetching SEPTA stations');

    // Static station data for major SEPTA stations
    const stations = [
      // Market-Frankford Line major stations
      { id: '15th-Market', name: '15th Street', line: 'MFL', zone: 'Center City' },
      { id: '30th-Market', name: '30th Street', line: 'MFL', zone: 'University City' },
      { id: '69th-Market', name: '69th Street Terminal', line: 'MFL', zone: 'Upper Darby' },
      { id: 'Frankford', name: 'Frankford Terminal', line: 'MFL', zone: 'Northeast' },
      
      // Broad Street Line major stations
      { id: 'City-Hall', name: 'City Hall', line: 'BSL', zone: 'Center City' },
      { id: 'Walnut-Locust', name: 'Walnut-Locust', line: 'BSL', zone: 'Center City' },
      { id: 'North-Philadelphia', name: 'North Philadelphia', line: 'BSL', zone: 'North' },
      { id: 'Fern-Rock', name: 'Fern Rock Transportation Center', line: 'BSL', zone: 'North' },
      
      // Regional Rail major stations
      { id: '30th-Street', name: '30th Street Station', line: 'RRD', zone: 'Center City' },
      { id: 'Jefferson', name: 'Jefferson Station', line: 'RRD', zone: 'Center City' },
      { id: 'Temple-U', name: 'Temple University', line: 'RRD', zone: 'North' },
      { id: 'Airport', name: 'Philadelphia International Airport', line: 'RRD', zone: 'Southwest' }
    ];

    // Filter by route if specified
    const filteredStations = route ? 
      stations.filter(station => station.line === route) : 
      stations;

    return new Response(
      JSON.stringify({
        stations: filteredStations,
        lastUpdated: new Date().toISOString(),
        source: 'SEPTA Static Data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching SEPTA stations:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch SEPTA stations',
        details: error.message,
        stations: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}