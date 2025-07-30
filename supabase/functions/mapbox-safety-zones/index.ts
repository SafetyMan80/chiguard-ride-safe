import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAPBOX_TOKEN = Deno.env.get('MAPBOX_TOKEN');
console.log('MAPBOX_TOKEN configured:', !!MAPBOX_TOKEN);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json().catch(() => ({}));
    
    // Handle token request
    if (action === 'get_token') {
      if (!MAPBOX_TOKEN) {
        console.error('MAPBOX_TOKEN not configured');
        return new Response(
          JSON.stringify({ error: 'Mapbox token not configured' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ token: MAPBOX_TOKEN }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('incident_reports')
      .select(`
        id,
        incident_type,
        location_name,
        transit_line,
        latitude,
        longitude,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform incidents into GeoJSON with safety zones
    const features = data.map((incident: any) => {
      // Determine zone radius and color based on incident type
      let zoneRadius = 300; // Default 300m
      let zoneColor = '#fbbf24'; // Default yellow

      switch (incident.incident_type?.toLowerCase()) {
        case 'assault':
        case 'weapon':
        case 'violence':
          zoneRadius = 500;
          zoneColor = '#ef4444'; // Red
          break;
        case 'theft':
        case 'robbery':
        case 'harassment':
          zoneRadius = 400;
          zoneColor = '#f97316'; // Orange
          break;
        case 'medical emergency':
        case 'accident':
          zoneRadius = 200;
          zoneColor = '#3b82f6'; // Blue
          break;
        default:
          zoneRadius = 300;
          zoneColor = '#fbbf24'; // Yellow
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [incident.longitude, incident.latitude]
        },
        properties: {
          id: incident.id,
          incident_type: incident.incident_type,
          location_name: incident.location_name,
          transit_line: incident.transit_line,
          created_at: incident.created_at,
          zone_radius: zoneRadius,
          zone_color: zoneColor
        }
      };
    });

    const geoJson = {
      type: 'FeatureCollection',
      features
    };

    return new Response(
      JSON.stringify(geoJson),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});