import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MBTAVehicle {
  id: string;
  attributes: {
    current_status: string;
    current_stop_sequence: number;
    direction_id: number;
    label: string;
    latitude: number;
    longitude: number;
    speed: number;
    updated_at: string;
  };
  relationships: {
    route: {
      data: {
        id: string;
        type: string;
      };
    };
    stop: {
      data: {
        id: string;
        type: string;
      } | null;
    };
    trip: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface MBTAPrediction {
  id: string;
  attributes: {
    arrival_time: string | null;
    departure_time: string | null;
    direction_id: number;
    schedule_relationship: string | null;
    status: string | null;
    stop_sequence: number;
  };
  relationships: {
    route: {
      data: {
        id: string;
        type: string;
      };
    };
    stop: {
      data: {
        id: string;
        type: string;
      };
    };
    trip: {
      data: {
        id: string;
        type: string;
      };
    };
    vehicle: {
      data: {
        id: string;
        type: string;
      } | null;
    };
  };
}

interface MBTARoute {
  id: string;
  attributes: {
    color: string;
    description: string;
    direction_destinations: string[];
    direction_names: string[];
    fare_class: string;
    long_name: string;
    short_name: string;
    sort_order: number;
    text_color: string;
    type: number;
  };
}

interface MBTAStop {
  id: string;
  attributes: {
    address: string;
    at_street: string | null;
    description: string | null;
    latitude: number;
    longitude: number;
    location_type: number;
    municipality: string;
    name: string;
    on_street: string | null;
    platform_code: string | null;
    platform_name: string | null;
    vehicle_type: number | null;
    wheelchair_boarding: number;
    zone_id: string | null;
  };
}

const MBTA_API_KEY = Deno.env.get('MBTA_API_KEY') || '44eeb6c002da454cac31843b19a9ad65';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { line, station } = await req.json();
    console.log('🚇 MBTA API Request:', { line, station });

    // Build route filter for MBTA API
    let routeFilter = '';
    if (line && line !== 'all') {
      const routeMap: Record<string, string> = {
        'red': 'Red',
        'blue': 'Blue', 
        'orange': 'Orange',
        'green': 'Green-B,Green-C,Green-D,Green-E',
        'silver': 'SL1,SL2,SL3,SL4,SL5'
      };
      routeFilter = `&filter[route]=${routeMap[line] || line}`;
    } else {
      // Default to subway routes if no line specified
      routeFilter = '&filter[route]=Red,Blue,Orange,Green-B,Green-C,Green-D,Green-E';
    }

    // Build stop filter
    let stopFilter = '';
    if (station && station !== 'all') {
      stopFilter = `&filter[stop]=${station}`;
    }

    // Fetch predictions from MBTA API
    const predictionsUrl = `https://api-v3.mbta.com/predictions?api_key=${MBTA_API_KEY}${routeFilter}${stopFilter}&include=stop,route,trip&sort=arrival_time`;
    console.log('🚇 MBTA Predictions URL:', predictionsUrl);

    const predictionsResponse = await fetch(predictionsUrl);
    
    if (!predictionsResponse.ok) {
      throw new Error(`MBTA API error: ${predictionsResponse.status} ${predictionsResponse.statusText}`);
    }

    const predictionsData = await predictionsResponse.json();
    console.log('🚇 MBTA Predictions Data:', JSON.stringify(predictionsData, null, 2));

    // Process the predictions data
    const arrivals = predictionsData.data?.map((prediction: MBTAPrediction) => {
      const route = predictionsData.included?.find((item: any) => 
        item.type === 'route' && item.id === prediction.relationships.route.data.id
      );
      
      const stop = predictionsData.included?.find((item: any) => 
        item.type === 'stop' && item.id === prediction.relationships.stop.data.id
      );

      const arrivalTime = prediction.attributes.arrival_time || prediction.attributes.departure_time;
      
      let minutesAway = 'Arriving';
      if (arrivalTime) {
        const arrivalDate = new Date(arrivalTime);
        const now = new Date();
        
        console.log('🚇 Time calculation debug:', {
          arrivalTime,
          arrivalDate: arrivalDate.toISOString(),
          now: now.toISOString(),
          rawDiff: arrivalDate.getTime() - now.getTime()
        });
        
        const diffMinutes = Math.round((arrivalDate.getTime() - now.getTime()) / (1000 * 60));
        
        console.log('🚇 Minutes calculation:', { diffMinutes });
        
        if (diffMinutes <= 0) {
          minutesAway = 'Arriving';
        } else if (diffMinutes === 1) {
          minutesAway = '1 min';
        } else {
          minutesAway = `${diffMinutes} min`;
        }
      }

      return {
        id: prediction.id,
        line: route?.attributes?.short_name || route?.id || 'Unknown',
        station: stop?.attributes?.name || 'Unknown Station',
        destination: route?.attributes?.direction_destinations?.[prediction.attributes.direction_id] || 'Unknown',
        direction: prediction.attributes.direction_id === 0 ? 'Inbound' : 'Outbound',
        arrivalTime: minutesAway, // Map minutes_away to arrivalTime for StandardArrival interface
        eventTime: arrivalTime,
        delay: null,
        trainId: prediction.relationships.vehicle?.data?.id || null,
        status: prediction.attributes.status || 'On Time',
        // Keep additional MBTA-specific fields for backward compatibility
        route_id: route?.attributes?.short_name || route?.id || 'Unknown',
        route_name: route?.attributes?.long_name || route?.attributes?.short_name || 'Unknown Line',
        stop_name: stop?.attributes?.name || 'Unknown Station',
        stop_id: stop?.id || '',
        predicted_arrival: arrivalTime,
        minutes_away: minutesAway,
        vehicle_id: prediction.relationships.vehicle?.data?.id || null,
        track: stop?.attributes?.platform_name || stop?.attributes?.platform_code || null,
        timestamp: new Date().toISOString()
      };
    }) || [];

    // Sort by arrival time
    arrivals.sort((a: any, b: any) => {
      if (!a.predicted_arrival) return 1;
      if (!b.predicted_arrival) return -1;
      return new Date(a.predicted_arrival).getTime() - new Date(b.predicted_arrival).getTime();
    });

    console.log('🚇 Processed MBTA arrivals:', arrivals.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: arrivals,
        timestamp: new Date().toISOString(),
        source: 'MBTA_API_V3'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('🚇 MBTA API Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        data: [],
        timestamp: new Date().toISOString(),
        source: 'MBTA_API_V3'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});