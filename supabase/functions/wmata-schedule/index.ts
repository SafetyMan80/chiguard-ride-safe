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
    // Try multiple possible secret names
    const wmataApiKey = Deno.env.get('WMATA_API_KEY') || 
                       Deno.env.get('WMATA_KEY') || 
                       Deno.env.get('wmata_api_key') ||
                       Deno.env.get('WMATA_API_TOKEN');
    
    console.log('🔑 WMATA_API_KEY exists:', !!wmataApiKey);
    console.log('🔑 All available env vars:', Object.keys(Deno.env.toObject()).sort());
    console.log('🔑 API-related env vars:', Object.keys(Deno.env.toObject()).filter(k => k.toLowerCase().includes('api') || k.toLowerCase().includes('key') || k.toLowerCase().includes('wmata')));
    
    if (!wmataApiKey) {
      console.error('❌ WMATA API key not found with any name variant');
      return new Response(
        JSON.stringify({ 
          success: false,
          data: [],
          error: 'WMATA API key not found in environment',
          timestamp: new Date().toISOString(),
          source: 'WMATA',
          debug: {
            availableEnvVars: Object.keys(Deno.env.toObject()).sort(),
            apiRelatedVars: Object.keys(Deno.env.toObject()).filter(k => k.toLowerCase().includes('api') || k.toLowerCase().includes('key') || k.toLowerCase().includes('wmata'))
          }
        }), 
        { 
          status: 200,
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
    const lineFilter = body.line || url.searchParams.get('line');
    const action = body.action || url.searchParams.get('action') || 'arrivals';

    console.log(`Action: ${action}, Station: ${stationCode}, Line: ${lineFilter}`);
    
    // For arrivals, we need to get all stations and their trains
    // WMATA API requires station codes, not line names

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
        // If a specific station is provided, get arrivals for that station
        if (stationCode) {
          console.log(`Fetching arrivals for specific station: ${stationCode}`);
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
          
          // Filter by line if specified
          const filteredTrains = lineFilter 
            ? trains.filter(train => train.Line.toLowerCase() === lineFilter.toLowerCase())
            : trains;
          
          const arrivals = filteredTrains.map(train => ({
            line: train.Line,
            station: train.LocationName || 'Unknown Station',
            destination: train.DestinationName || train.Destination,
            direction: train.Group === '1' ? 'Platform 1' : 'Platform 2',
            arrivalTime: train.Min === 'ARR' ? 'Arriving' : train.Min === 'BRD' ? 'Boarding' : train.Min,
            trainId: train.Car ? `${train.Car} cars` : 'Unknown',
            status: 'On Time'
          }));

          return new Response(
            JSON.stringify({ 
              success: true,
              data: arrivals,
              timestamp: new Date().toISOString(),
              source: 'WMATA'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // For general arrivals or line filtering, get major stations and aggregate
        const majorStations = ['A01', 'C01', 'D01', 'E01', 'F01', 'G01']; // Union, Metro Center, Federal Triangle, Gallery Place, L'Enfant Plaza, Dupont Circle
        const allArrivals: any[] = [];

        for (const station of majorStations) {
          try {
            console.log(`Fetching arrivals for major station: ${station}`);
            const response = await fetch(`https://api.wmata.com/Rail.svc/json/jStationTimes?StationCode=${station}&api_key=${wmataApiKey}`);
            
            if (response.ok) {
              const data = await response.json();
              const trains: WMATAStationTime[] = data.Trains || [];
              
              // Filter by line if specified
              const filteredTrains = lineFilter 
                ? trains.filter(train => train.Line.toLowerCase() === lineFilter.toLowerCase())
                : trains;
              
              const arrivals = filteredTrains.map(train => ({
                line: train.Line,
                station: train.LocationName || 'Unknown Station',
                destination: train.DestinationName || train.Destination,
                direction: train.Group === '1' ? 'Platform 1' : 'Platform 2',
                arrivalTime: train.Min === 'ARR' ? 'Arriving' : train.Min === 'BRD' ? 'Boarding' : train.Min,
                trainId: train.Car ? `${train.Car} cars` : 'Unknown',
                status: 'On Time'
              }));
              
              allArrivals.push(...arrivals);
            }
          } catch (error) {
            console.warn(`Failed to fetch arrivals for station ${station}:`, error);
          }
        }

        console.log(`Found total ${allArrivals.length} arrivals across all major stations`);

        return new Response(
          JSON.stringify({ 
            success: true,
            data: allArrivals.slice(0, 50), // Limit to 50 arrivals
            timestamp: new Date().toISOString(),
            source: 'WMATA'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

  } catch (error) {
    console.error('❌ Error in WMATA function:', error);
    console.error('❌ Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        data: [],
        error: error.message || 'Failed to fetch WMATA data',
        timestamp: new Date().toISOString(),
        source: 'WMATA',
        debug: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          availableEnvVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('API') || k.includes('KEY'))
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})