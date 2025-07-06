import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const line = url.searchParams.get('line')
    const station = url.searchParams.get('station')
    
    // Get MARTA API key from Supabase secrets
    const martaApiKey = Deno.env.get('MARTA_API_KEY')
    if (!martaApiKey) {
      throw new Error('MARTA API key not configured')
    }

    let apiUrl: string
    
    if (line && station) {
      // Get arrivals for specific line and station
      apiUrl = `https://developer.itsmarta.com/RealtimeTrain/RestServiceNextTrain/GetRealtimeArrivals?apikey=${martaApiKey}`
    } else {
      // Get all train arrivals
      apiUrl = `https://developer.itsmarta.com/RealtimeTrain/RestServiceNextTrain/GetRealtimeArrivals?apikey=${martaApiKey}`
    }

    console.log('Fetching MARTA data from:', apiUrl)

    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`MARTA API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log('MARTA API response:', data)

    // Transform MARTA data to our standard format
    const transformedData = data.map((arrival: any) => ({
      line: arrival.LINE,
      station: arrival.STATION,
      destination: arrival.DESTINATION,
      direction: arrival.DIRECTION,
      arrivalTime: arrival.WAITING_TIME,
      eventTime: arrival.EVENT_TIME,
      delay: arrival.DELAY || "0",
      trainId: arrival.TRAIN_ID || arrival.VEHICLE_ID,
      status: arrival.WAITING_TIME === "Boarding" ? "Boarding" : 
              arrival.WAITING_TIME === "Arrived" ? "Arrived" : "On Time"
    }))

    // Filter by line and station if specified
    let filteredData = transformedData
    if (line) {
      filteredData = filteredData.filter((item: any) => 
        item.line.toLowerCase().includes(line.toLowerCase())
      )
    }
    if (station) {
      filteredData = filteredData.filter((item: any) => 
        item.station.toLowerCase().includes(station.toLowerCase())
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: filteredData,
        timestamp: new Date().toISOString(),
        source: 'MARTA'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('MARTA API Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        source: 'MARTA'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})