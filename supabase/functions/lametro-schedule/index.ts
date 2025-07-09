import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FeedMessage } from "https://esm.sh/gtfs-realtime-bindings@1.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwiftlyPrediction {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  trip_headsign: string;
  arrival_time: string;
  departure_time: string;
  delay: number;
  vehicle_id: string;
  stop_id: string;
  stop_name: string;
}

interface SwiftlyAlert {
  id: string;
  cause: string;
  effect: string;
  header_text: string;
  description_text: string;
  active_period: {
    start: number;
    end: number;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: jsonError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, latitude, longitude, radius } = requestData;
    console.log(`LA Metro API request: ${action}`, { latitude, longitude, radius });

    if (action === 'alerts') {
      // Fetch service alerts from LA Metro's official API
      const alertsUrl = 'https://api.metro.net/gtfs_rt/alerts/json';
      console.log('Fetching alerts from:', alertsUrl);

      const response = await fetch(alertsUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Alerts API error:', response.status, response.statusText);
        throw new Error(`LA Metro Alerts API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('LA Metro Alerts API response:', data);

      // Parse LA Metro alerts format
      const alerts: any[] = [];
      if (data.entity) {
        data.entity.forEach((entity: any) => {
          if (entity.alert) {
            const alert = entity.alert;
            alerts.push({
              id: entity.id,
              cause: alert.cause || 'UNKNOWN_CAUSE',
              effect: alert.effect || 'UNKNOWN_EFFECT',
              header_text: alert.header_text?.translation?.[0]?.text || 'Service Alert',
              description_text: alert.description_text?.translation?.[0]?.text || '',
              active_period: alert.active_period || []
            });
          }
        });
      }

      return new Response(JSON.stringify({ 
        alerts,
        timestamp: new Date().toISOString() 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'predictions') {
      // Use LA Metro's public GTFS-rt feeds (no API key required)
      const AGENCY = 'lametro';
      const tripUpdatesUrl = `https://api.metro.net/gtfs-rt/trip-updates?agency_id=${AGENCY}`;
      const vehiclePositionsUrl = `https://api.metro.net/gtfs-rt/vehicle-positions?agency_id=${AGENCY}`;
      
      console.log('Fetching LA Metro real-time data from Metro Official API (no auth required)');
      console.log('Trip updates URL:', tripUpdatesUrl);
      console.log('Vehicle positions URL:', vehiclePositionsUrl);

      // Fetch both trip updates and vehicle positions
      const [tripResponse, vehicleResponse] = await Promise.all([
        fetch(tripUpdatesUrl),
        fetch(vehiclePositionsUrl)
      ]);

      if (!tripResponse.ok) {
        console.error('Trip updates API error:', tripResponse.status, tripResponse.statusText);
        throw new Error(`Trip updates API returned ${tripResponse.status}: ${tripResponse.statusText}`);
      }

      if (!vehicleResponse.ok) {
        console.error('Vehicle positions API error:', vehicleResponse.status, vehicleResponse.statusText);
        throw new Error(`Vehicle positions API returned ${vehicleResponse.status}: ${vehicleResponse.statusText}`);
      }

      // Decode protobuf responses
      const tripBuffer = await tripResponse.arrayBuffer();
      const vehicleBuffer = await vehicleResponse.arrayBuffer();
      
      const tripData = FeedMessage.decode(new Uint8Array(tripBuffer));
      const vehicleData = FeedMessage.decode(new Uint8Array(vehicleBuffer));

      console.log('Trip data entities:', tripData.entity?.length || 0);
      console.log('Vehicle data entities:', vehicleData.entity?.length || 0);

      // Transform the data to our format
      const predictions: any[] = [];
      const now = Date.now();
      
      // Process trip updates for predictions
      if (tripData.entity && Array.isArray(tripData.entity)) {
        tripData.entity.forEach((entity: any) => {
          if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
            entity.tripUpdate.stopTimeUpdate.forEach((stopUpdate: any) => {
              if (stopUpdate.arrival || stopUpdate.departure) {
                const timeUpdate = stopUpdate.arrival || stopUpdate.departure;
                const arrivalTime = timeUpdate.time;
                
                if (arrivalTime) {
                  const minutesUntilArrival = Math.max(0, Math.round((arrivalTime * 1000 - now) / 60000));
                  predictions.push({
                    route_name: entity.tripUpdate.trip?.routeId || 'Unknown Route',
                    headsign: entity.tripUpdate.trip?.tripHeadsign || 'Unknown Destination',
                    arrival_time: minutesUntilArrival.toString(),
                    delay_seconds: timeUpdate.delay || 0,
                    vehicle_id: entity.tripUpdate.vehicle?.id || '',
                    stop_name: stopUpdate.stopId || 'Unknown Stop'
                  });
                }
              }
            });
          }
        });
      }

      // Sort by arrival time
      predictions.sort((a, b) => {
        const timeA = parseInt(a.arrival_time) || 999;
        const timeB = parseInt(b.arrival_time) || 999;
        return timeA - timeB;
      });

      return new Response(JSON.stringify({ 
        predictions: predictions.slice(0, 20), // Limit to 20 predictions
        timestamp: new Date().toISOString(),
        location: { latitude, longitude, radius },
        source: 'LA Metro Official API'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('LA Metro API error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return detailed error information
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      errorType: error.name || 'Error',
      timestamp: new Date().toISOString(),
      source: 'LA Metro API',
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});