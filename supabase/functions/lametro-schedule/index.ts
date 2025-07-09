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
      // For now, let's use a simpler approach - mock some data until we can get protobuf working
      // LA Metro's GTFS-rt feeds require protobuf decoding which is complex in Deno
      console.log('LA Metro predictions requested, returning mock data for now');
      
      const mockPredictions = [
        {
          route_name: 'Red Line',
          headsign: 'North Hollywood',
          arrival_time: '3',
          delay_seconds: 0,
          vehicle_id: 'RD001',
          stop_name: 'Union Station'
        },
        {
          route_name: 'Purple Line',
          headsign: 'Wilshire/Western',
          arrival_time: '7',
          delay_seconds: 30,
          vehicle_id: 'PU002',
          stop_name: 'Pershing Square'
        },
        {
          route_name: 'Blue Line',
          headsign: 'Downtown Long Beach',
          arrival_time: '12',
          delay_seconds: 0,
          vehicle_id: 'BL003',
          stop_name: '7th St/Metro Center'
        }
      ];

      console.log('Returning mock predictions:', mockPredictions.length);

      return new Response(JSON.stringify({ 
        predictions: mockPredictions,
        timestamp: new Date().toISOString(),
        location: { latitude, longitude, radius },
        source: 'LA Metro Mock Data (protobuf decoding needed for real data)',
        note: 'This is mock data. Real LA Metro GTFS-rt feeds require protobuf decoding.'
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