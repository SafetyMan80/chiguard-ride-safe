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
    const SWIFTLY_API_KEY = Deno.env.get('SWIFTLY_API_KEY');
    if (!SWIFTLY_API_KEY) {
      throw new Error('SWIFTLY_API_KEY environment variable is required');
    }

    const { action, latitude, longitude, radius } = await req.json();
    const agencyKey = 'lametro-rail'; // Ensure this matches Swiftly's agency key for LA Metro
    const baseUrl = 'https://api.goswift.ly/real-time';

    console.log(`LA Metro API request: ${action}`, { latitude, longitude, radius });

    if (action === 'alerts') {
      // Fetch service alerts
      const alertsUrl = `${baseUrl}/${agencyKey}/gtfs-rt-alerts/v2`;
      console.log('Fetching alerts from:', alertsUrl);

      const response = await fetch(alertsUrl, {
        headers: {
          'Authorization': `Bearer ${SWIFTLY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Alerts API error:', response.status, response.statusText);
        throw new Error(`Alerts API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Alerts API response:', data);

      // Parse GTFS-RT alerts format
      const alerts: SwiftlyAlert[] = [];
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
      // Fetch predictions near location
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required for predictions');
      }

      const predictionsUrl = `${baseUrl}/${agencyKey}/predictions-near-location`;
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        radius_m: (radius || 200).toString()
      });

      const fullUrl = `${predictionsUrl}?${params}`;
      console.log('Fetching predictions from:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${SWIFTLY_API_KEY}`,
          'Content-Type': 'application/json',
          'X-API-Key': SWIFTLY_API_KEY // Try both auth methods
        }
      });

      if (!response.ok) {
        console.error('Predictions API error:', response.status, response.statusText);
        throw new Error(`Predictions API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Predictions API response sample:', {
        total_predictions: data.predictions?.length || 0,
        first_prediction: data.predictions?.[0]
      });

      // Transform predictions to our format
      const predictions: any[] = [];
      if (data.predictions && Array.isArray(data.predictions)) {
        data.predictions.forEach((pred: any) => {
          predictions.push({
            route_id: pred.route_id || pred.route?.route_id,
            route_name: pred.route_short_name || pred.route?.route_short_name || pred.route_id,
            headsign: pred.trip_headsign || pred.headsign || 'Unknown Destination',
            arrival_time: pred.arrival_time || pred.predicted_arrival_time,
            departure_time: pred.departure_time || pred.predicted_departure_time,
            delay_seconds: pred.delay || 0,
            vehicle_id: pred.vehicle_id || pred.vehicle?.id,
            stop_id: pred.stop_id,
            stop_name: pred.stop_name
          });
        });
      }

      // Sort by arrival time
      predictions.sort((a, b) => {
        const timeA = new Date(a.arrival_time).getTime();
        const timeB = new Date(b.arrival_time).getTime();
        return timeA - timeB;
      });

      return new Response(JSON.stringify({ 
        predictions: predictions.slice(0, 10), // Limit to 10 predictions
        timestamp: new Date().toISOString(),
        location: { latitude, longitude, radius }
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
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});