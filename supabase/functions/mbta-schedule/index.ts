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
    const predictionsUrl = `https://api-v3.mbta.com/predictions?api_key=${MBTA_API_KEY}${routeFilter}${stopFilter}&include=stop,route,trip,vehicle&sort=arrival_time`;
    console.log('🚇 MBTA Predictions URL:', predictionsUrl);

    const predictionsResponse = await fetch(predictionsUrl);
    
    if (!predictionsResponse.ok) {
      throw new Error(`MBTA API error: ${predictionsResponse.status} ${predictionsResponse.statusText}`);
    }

    const predictionsData = await predictionsResponse.json();
    console.log('🚇 MBTA Predictions Data Count:', predictionsData.data?.length || 0);

    // Process the predictions using MBTA best practices
    const arrivals = predictionsData.data?.map((prediction: MBTAPrediction) => {
      const route = predictionsData.included?.find((item: any) => 
        item.type === 'route' && item.id === prediction.relationships.route.data.id
      );
      
      const stop = predictionsData.included?.find((item: any) => 
        item.type === 'stop' && item.id === prediction.relationships.stop.data.id
      );

      const vehicle = predictionsData.included?.find((item: any) => 
        item.type === 'vehicle' && 
        item.id === prediction.relationships.vehicle?.data?.id
      );

      const trip = predictionsData.included?.find((item: any) => 
        item.type === 'trip' && item.id === prediction.relationships.trip.data.id
      );

      const currentTime = new Date();
      const arrivalTime = prediction.attributes.arrival_time ? new Date(prediction.attributes.arrival_time) : null;
      const departureTime = prediction.attributes.departure_time ? new Date(prediction.attributes.departure_time) : null;
      
      let displayText = 'No Data';
      
      // Follow MBTA's official display rules
      if (prediction.attributes.status) {
        // Rule 1: If status exists, display it as-is
        displayText = prediction.attributes.status;
      } else if (!departureTime) {
        // Rule 2: If no departure_time, riders can't board
        return null; // Filter this out
      } else {
        // Rule 3: Calculate seconds until arrival/departure
        const targetTime = arrivalTime || departureTime;
        const seconds = Math.floor((targetTime.getTime() - currentTime.getTime()) / 1000);
        
        // Rule 4: If already passed, don't display
        if (seconds < 0) {
          return null; // Filter this out
        }
        
        // Rule 5: Special cases for very soon arrivals
        if (seconds <= 90) {
          // Check if vehicle is stopped at this stop
          if (vehicle?.attributes?.current_status === 'STOPPED_AT' && 
              vehicle?.relationships?.stop?.data?.id === prediction.relationships.stop.data.id) {
            displayText = 'Boarding';
          } else if (seconds <= 30) {
            displayText = 'Arriving';
          } else if (seconds <= 60) {
            displayText = 'Approaching';
          } else {
            displayText = '1 min';
          }
        } else {
          // Rule 6: Convert to minutes
          const minutes = Math.round(seconds / 60);
          if (minutes > 20) {
            displayText = '20+ min';
          } else {
            displayText = `${minutes} min`;
          }
        }
      }

      return {
        id: prediction.id,
        line: route?.attributes?.short_name || route?.id || 'Unknown',
        station: stop?.attributes?.name || 'Unknown Station',
        destination: trip?.attributes?.headsign || route?.attributes?.direction_destinations?.[prediction.attributes.direction_id] || 'Unknown',
        direction: prediction.attributes.direction_id === 0 ? 'Inbound' : 'Outbound',
        arrivalTime: displayText,
        eventTime: prediction.attributes.arrival_time || prediction.attributes.departure_time,
        delay: null,
        trainId: prediction.relationships.vehicle?.data?.id || null,
        status: prediction.attributes.status || 'On Time',
        // Keep additional MBTA-specific fields for backward compatibility
        route_id: route?.attributes?.short_name || route?.id || 'Unknown',
        route_name: route?.attributes?.long_name || route?.attributes?.short_name || 'Unknown Line',
        stop_name: stop?.attributes?.name || 'Unknown Station',
        stop_id: stop?.id || '',
        predicted_arrival: prediction.attributes.arrival_time || prediction.attributes.departure_time,
        minutes_away: displayText,
        vehicle_id: prediction.relationships.vehicle?.data?.id || null,
        track: stop?.attributes?.platform_name || stop?.attributes?.platform_code || null,
        timestamp: new Date().toISOString()
      };
    }).filter((arrival: any) => arrival !== null) || []; // Remove filtered out predictions

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
        source: 'MBTA_API_V3_IMPROVED'
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
        source: 'MBTA_API_V3_IMPROVED'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});