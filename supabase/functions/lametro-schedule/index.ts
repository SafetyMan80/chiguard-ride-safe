import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { action, latitude, longitude, radius } = await req.json();

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
      // Fetch real-time transit data from LA Metro's API
      const vehiclePositionsUrl = 'https://api.metro.net/gtfs_rt/vehicle_positions/json';
      const tripUpdatesUrl = 'https://api.metro.net/gtfs_rt/trip_updates/json';
      
      console.log('Fetching LA Metro real-time data from official API');

      // Fetch both vehicle positions and trip updates
      const [vehicleResponse, tripResponse] = await Promise.all([
        fetch(vehiclePositionsUrl),
        fetch(tripUpdatesUrl)
      ]);

      if (!vehicleResponse.ok) {
        console.error('Vehicle positions API error:', vehicleResponse.status);
        throw new Error(`Vehicle positions API returned ${vehicleResponse.status}`);
      }

      if (!tripResponse.ok) {
        console.error('Trip updates API error:', tripResponse.status);
        throw new Error(`Trip updates API returned ${tripResponse.status}`);
      }

      const vehicleData = await vehicleResponse.json();
      const tripData = await tripResponse.json();

      console.log('Vehicle data sample:', {
        total_vehicles: vehicleData.entity?.length || 0,
        first_vehicle: vehicleData.entity?.[0]
      });

      console.log('Trip data sample:', {
        total_trips: tripData.entity?.length || 0,
        first_trip: tripData.entity?.[0]
      });

      // Transform the data to our format
      const predictions: any[] = [];
      
      // Process trip updates for predictions
      if (tripData.entity && Array.isArray(tripData.entity)) {
        tripData.entity.forEach((entity: any) => {
          if (entity.trip_update && entity.trip_update.stop_time_update) {
            entity.trip_update.stop_time_update.forEach((stopUpdate: any) => {
              if (stopUpdate.arrival) {
                const arrivalTime = stopUpdate.arrival.time || stopUpdate.arrival.delay;
                if (arrivalTime) {
                  predictions.push({
                    route_name: entity.trip_update.trip?.route_id || 'Unknown Route',
                    headsign: entity.trip_update.trip?.trip_headsign || 'Unknown Destination',
                    arrival_time: arrivalTime ? 
                      Math.max(0, Math.round((arrivalTime * 1000 - Date.now()) / 60000)).toString() : 
                      'Unknown',
                    delay_seconds: stopUpdate.arrival.delay || 0,
                    vehicle_id: entity.trip_update.vehicle?.id || '',
                    stop_name: stopUpdate.stop_id || 'Unknown Stop'
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
    console.error('LA Metro API error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      source: 'LA Metro Official API'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});