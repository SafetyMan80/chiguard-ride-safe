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
      // Get Swiftly API key from environment
      const swiftlyApiKey = Deno.env.get('SWIFTLY_API_KEY');
      if (!swiftlyApiKey) {
        console.error('SWIFTLY_API_KEY is not configured');
        throw new Error('SWIFTLY_API_KEY is not configured');
      }

      console.log('Swiftly API key found, length:', swiftlyApiKey.length);

      // Swiftly API seems to be returning 403 for LA Metro, use Metro's official feeds
      const useSwiftly = false; // Switch to Metro official API due to 403 errors
      
      let vehiclePositionsUrl, tripUpdatesUrl;
      
      if (useSwiftly) {
        const baseUrl = 'https://api.goswift.ly/real-time/lametro-rail';
        vehiclePositionsUrl = `${baseUrl}/gtfs-rt-vehicle-positions`;
        tripUpdatesUrl = `${baseUrl}/gtfs-rt-trip-updates`;
      } else {
        // Fallback to Metro's official GTFS-RT feeds
        vehiclePositionsUrl = 'https://api.metro.net/gtfs_rt/vehicles/json';
        tripUpdatesUrl = 'https://api.metro.net/gtfs_rt/trip_updates/json';
      }
      
      console.log(`Fetching LA Metro real-time data from ${useSwiftly ? 'Swiftly API' : 'Metro Official API'}`);
      console.log('Vehicle URL:', vehiclePositionsUrl);
      console.log('Trip URL:', tripUpdatesUrl);

      const headers = useSwiftly ? {
        'Authorization': `Bearer ${swiftlyApiKey}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };

      if (useSwiftly) {
        console.log('Request headers prepared (Authorization header length):', headers.Authorization?.length);
      } else {
        console.log('Using Metro official API (no auth required)');
      }

      // Fetch both vehicle positions and trip updates
      const [vehicleResponse, tripResponse] = await Promise.all([
        fetch(vehiclePositionsUrl, { headers }),
        fetch(tripUpdatesUrl, { headers })
      ]);

      if (!vehicleResponse.ok) {
        const errorText = await vehicleResponse.text();
        console.error('Vehicle positions API error:', {
          status: vehicleResponse.status,
          statusText: vehicleResponse.statusText,
          response: errorText,
          headers: Object.fromEntries(vehicleResponse.headers.entries())
        });
        throw new Error(`Vehicle positions API returned ${vehicleResponse.status}: ${vehicleResponse.statusText} - ${errorText}`);
      }

      if (!tripResponse.ok) {
        const errorText = await tripResponse.text();
        console.error('Trip updates API error:', {
          status: tripResponse.status,
          statusText: tripResponse.statusText,
          response: errorText,
          headers: Object.fromEntries(tripResponse.headers.entries())
        });
        throw new Error(`Trip updates API returned ${tripResponse.status}: ${tripResponse.statusText} - ${errorText}`);
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