import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WMATAStationTime {
  Car: string;
  Destination: string;
  DestinationCode: string;
  DestinationName: string;
  Group: string;
  Line: string;
  LocationCode: string;
  LocationName: string;
  Min: string;
}

interface WMATAStation {
  Code: string;
  Name: string;
  StationTogether1: string;
  StationTogether2: string;
  LineCode1: string;
  LineCode2: string;
  LineCode3: string;
  LineCode4: string;
  Lat: number;
  Lon: number;
  Address: {
    Street: string;
    City: string;
    State: string;
    Zip: string;
  };
}

interface WMATALine {
  LineCode: string;
  DisplayName: string;
  StartStationCode: string;
  EndStationCode: string;
  InternalDestination1: string;
  InternalDestination2: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WMATA Schedule function called');
    
    // Get API key from Supabase secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const wmataApiKey = Deno.env.get('WMATA_API_KEY');
    
    if (!wmataApiKey) {
      console.error('WMATA_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'WMATA API key not configured',
          message: 'Please configure WMATA_API_KEY in Supabase secrets'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body for parameters
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      console.log('No body or invalid JSON body');
    }
    
    const url = new URL(req.url);
    const stationCode = body.station || url.searchParams.get('station');
    const action = body.action || url.searchParams.get('action') || 'arrivals';

    console.log(`Action: ${action}, Station: ${stationCode}`);

    switch (action) {
      case 'lines': {
        console.log('Fetching WMATA lines...');
        const response = await fetch(`https://api.wmata.com/Rail.svc/json/jLines?api_key=${wmataApiKey}`);
        
        if (!response.ok) {
          console.error(`WMATA Lines API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`WMATA API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const lines: WMATALine[] = data.Lines || [];
        
        console.log(`Found ${lines.length} WMATA lines`);
        
        return new Response(
          JSON.stringify({
            lines: lines.map(line => ({
              code: line.LineCode,
              name: line.DisplayName,
              startStation: line.StartStationCode,
              endStation: line.EndStationCode,
              destinations: [line.InternalDestination1, line.InternalDestination2].filter(Boolean)
            }))
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'stations': {
        console.log('Fetching WMATA stations...');
        const response = await fetch(`https://api.wmata.com/Rail.svc/json/jStations?api_key=${wmataApiKey}`);
        
        if (!response.ok) {
          console.error(`WMATA Stations API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`WMATA API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const stations: WMATAStation[] = data.Stations || [];
        
        console.log(`Found ${stations.length} WMATA stations`);
        
        return new Response(
          JSON.stringify({
            stations: stations.map(station => ({
              code: station.Code,
              name: station.Name,
              lines: [station.LineCode1, station.LineCode2, station.LineCode3, station.LineCode4].filter(Boolean),
              lat: station.Lat,
              lon: station.Lon,
              address: station.Address
            }))
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'station-info': {
        if (!stationCode) {
          return new Response(
            JSON.stringify({ error: 'Station code is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log(`Fetching station info for: ${stationCode}`);
        const response = await fetch(`https://api.wmata.com/Rail.svc/json/jStationInfo?StationCode=${stationCode}&api_key=${wmataApiKey}`);
        
        if (!response.ok) {
          console.error(`WMATA Station Info API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`WMATA API error: ${response.status} ${response.statusText}`);
        }
        
        const stationInfo = await response.json();
        
        return new Response(
          JSON.stringify({ stationInfo }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'arrivals':
      default: {
        if (!stationCode) {
          return new Response(
            JSON.stringify({ error: 'Station code is required for arrivals' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        console.log(`Fetching arrivals for station: ${stationCode}`);
        const response = await fetch(`https://api.wmata.com/Rail.svc/json/jStationTimes?StationCode=${stationCode}&api_key=${wmataApiKey}`);
        
        if (!response.ok) {
          console.error(`WMATA Station Times API error: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`WMATA API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const trains: WMATAStationTime[] = data.Trains || [];
        
        console.log(`Found ${trains.length} incoming trains for station ${stationCode}`);
        
        // Transform WMATA data to match our expected format
        const arrivals = trains.map(train => ({
          line: train.Line,
          destination: train.DestinationName || train.Destination,
          destinationCode: train.DestinationCode,
          arrival: train.Min === 'ARR' ? 'Arriving' : train.Min === 'BRD' ? 'Boarding' : `${train.Min} min`,
          cars: train.Car ? `${train.Car} cars` : '',
          group: train.Group || '1'
        }));

        return new Response(
          JSON.stringify({ 
            arrivals,
            station: stationCode,
            lastUpdated: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

  } catch (error) {
    console.error('Error in WMATA function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch WMATA data',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})