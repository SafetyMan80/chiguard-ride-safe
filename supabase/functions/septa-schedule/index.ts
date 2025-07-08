import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

serve(async (req) => {
  console.log('=== SEPTA API Function Called ===');
  console.log('Request Method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // CRITICAL FIX: Handle both query parameters and request body parsing
  let station, results, action;
  
  try {
    // Try parsing request body first (for POST requests from our app)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Request body:', body);
      station = body.station;
      results = body.results || '10';
      action = body.action;
    }
    
    // If no station in body, try URL search params (for GET requests)
    if (!station) {
      const url = new URL(req.url);
      station = url.searchParams.get('station');
      results = url.searchParams.get('results') || '10';
      action = url.searchParams.get('action');
    }
  } catch (parseError) {
    console.error('Parameter parsing error:', parseError);
  }

  console.log('Parsed Parameters:', { station, results, action });

  // Handle different actions
  if (action === 'routes') {
    return getRoutes();
  }
  
  if (action === 'stations') {
    return getStations();
  }

  // Default to arrivals action
  if (!station) {
    const errorResponse = {
      success: false,
      error: 'Station parameter is required',
      example: 'Add ?station=30th Street Station to your URL',
      validStations: [
        '30th Street Station',
        'Jefferson Station', 
        'Temple University',
        'Suburban Station',
        'North Philadelphia'
      ]
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: corsHeaders
    });
  }

  // MULTIPLE API ENDPOINTS - SEPTA has several different ones
  const apiEndpoints = [
    `https://www3.septa.org/api/Arrivals/index.php?station=${encodeURIComponent(station)}&results=${results}`,
    `https://www3.septa.org/api/NextToArrive/index.php?req1=${encodeURIComponent(station)}&req2=&req3=&req6=${results}&_=${Date.now()}`,
    `https://www3.septa.org/api/RRSchedules/index.php?req1=${encodeURIComponent(station)}&_=${Date.now()}`
  ];

  console.log('Trying API endpoints:', apiEndpoints);

  let lastError;
  let workingData = null;

  // Try each endpoint until one works
  for (let i = 0; i < apiEndpoints.length; i++) {
    const endpoint = apiEndpoints[i];
    console.log(`\n=== Trying endpoint ${i + 1}/${apiEndpoints.length} ===`);
    console.log('URL:', endpoint);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www3.septa.org/',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      console.log('Content-Type:', contentType);

      let responseText = await response.text();
      console.log('Raw Response (first 500 chars):', responseText.substring(0, 500));

      // Handle different response types
      let data;
      if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Invalid JSON response from SEPTA API');
        }
      } else if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
        throw new Error('SEPTA API returned HTML page - service may be down');
      } else {
        // Sometimes SEPTA returns plain text errors
        throw new Error(`Unexpected response: ${responseText.substring(0, 200)}`);
      }

      console.log('Parsed Data Type:', typeof data, Array.isArray(data) ? `Array[${data.length}]` : 'Object');

      // Check for SEPTA API error responses
      if (data && typeof data === 'object') {
        if (data.error) {
          throw new Error(`SEPTA API Error: ${data.error}`);
        }
        if (data.message && data.message.includes('Error')) {
          throw new Error(`SEPTA API Error: ${data.message}`);
        }
        if (typeof data === 'object' && Object.keys(data).length === 0) {
          throw new Error('Empty response from SEPTA API');
        }
      }

      // Transform the data to our standard format
      const arrivals = transformSeptaData(data, station);

      // Success! We got valid data
      workingData = {
        success: true,
        station: station,
        endpoint: `endpoint_${i + 1}`,
        timestamp: new Date().toISOString(),
        data: arrivals,
        source: 'SEPTA',
        dataType: Array.isArray(data) ? 'array' : 'object',
        count: arrivals.length
      };

      console.log('SUCCESS! Got valid data from endpoint', i + 1);
      break;

    } catch (error) {
      console.error(`Endpoint ${i + 1} failed:`, error.message);
      lastError = error;
      
      // Continue to next endpoint
      continue;
    }
  }

  // Check if we got any working data
  if (workingData) {
    console.log('=== RETURNING SUCCESS RESPONSE ===');
    return new Response(JSON.stringify(workingData, null, 2), {
      status: 200,
      headers: corsHeaders
    });
  }

  // All endpoints failed
  console.log('=== ALL ENDPOINTS FAILED ===');
  const errorResponse = {
    success: false,
    error: 'All SEPTA API endpoints failed',
    station: station,
    timestamp: new Date().toISOString(),
    lastError: lastError ? lastError.message : 'Unknown error',
    source: 'SEPTA',
    data: [],
    troubleshooting: {
      possibleCauses: [
        'SEPTA API is temporarily down (common)',
        'Invalid station name - check spelling and capitalization',
        'Network connectivity issues',
        'SEPTA servers are overloaded'
      ],
      suggestions: [
        'Try again in a few minutes',
        'Verify station name matches SEPTA\'s official names',
        'Check SEPTA\'s official app or website for service status'
      ]
    },
    endpoints_tried: apiEndpoints.length
  };

  return new Response(JSON.stringify(errorResponse, null, 2), {
    status: 503, // Service Unavailable
    headers: corsHeaders
  });
});

// Transform SEPTA data to our standard format
function transformSeptaData(data: any, station: string) {
  const arrivals: any[] = [];
  
  if (Array.isArray(data)) {
    // Handle array responses
    data.forEach((arrival: any) => {
      arrivals.push({
        line: arrival.line || 'Unknown',
        station: station,
        destination: arrival.destination || arrival.trip_destination || 'Unknown Destination',
        direction: arrival.direction || arrival.Direction || 'Unknown',
        arrivalTime: formatTime(arrival.depart_time || arrival.sched_time || arrival.orig_departure_time),
        trainId: arrival.track || arrival.Track || null,
        status: arrival.status || arrival.train_status || 'On Time'
      });
    });
  } else if (data && typeof data === 'object') {
    // Handle object responses (line-based data)
    Object.entries(data).forEach(([lineKey, lineData]: [string, any]) => {
      if (Array.isArray(lineData)) {
        lineData.forEach((arrival: any) => {
          arrivals.push({
            line: lineKey,
            station: station,
            destination: arrival.destination || arrival.trip_destination || 'Unknown Destination',
            direction: arrival.direction || arrival.Direction || 'Unknown',
            arrivalTime: formatTime(arrival.depart_time || arrival.sched_time || arrival.orig_departure_time),
            trainId: arrival.track || arrival.Track || null,
            status: arrival.status || arrival.train_status || 'On Time'
          });
        });
      }
    });
  }
  
  return arrivals;
}

// Helper function to format time strings
function formatTime(timeStr: string): string {
  if (!timeStr) return 'Unknown';
  
  try {
    // Handle different time formats that SEPTA might return
    if (timeStr.includes('T')) {
      // ISO format
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeStr.includes(':')) {
      // Already in time format
      return timeStr;
    } else if (timeStr.match(/^\d+$/)) {
      // Unix timestamp
      const date = new Date(parseInt(timeStr) * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Try parsing as date
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  } catch (error) {
    console.error('Error formatting time:', timeStr, error);
  }
  
  return timeStr || 'Unknown';
}

function getRoutes() {
  const routes = [
    {
      id: 'BSL',
      name: 'Broad Street Line',
      type: 'Subway',
      color: '#F47920',
      description: 'North-South subway line'
    },
    {
      id: 'MFL',
      name: 'Market-Frankford Line',
      type: 'Subway/Elevated',
      color: '#0F4D98',
      description: 'East-West subway and elevated line'
    },
    {
      id: 'NHSL',
      name: 'Norristown High Speed Line',
      type: 'Light Rail',
      color: '#9E1A6A',
      description: 'Light rail to Norristown'
    },
    {
      id: 'RRD',
      name: 'Regional Rail',
      type: 'Commuter Rail',
      color: '#68217A',
      description: 'Suburban commuter rail network'
    }
  ];

  return new Response(
    JSON.stringify({
      success: true,
      data: routes,
      timestamp: new Date().toISOString(),
      source: 'SEPTA'
    }),
    { headers: corsHeaders }
  );
}

function getStations() {
  const stations = [
    // Market-Frankford Line major stations
    { id: '15th-Market', name: '15th Street', line: 'MFL', zone: 'Center City' },
    { id: '30th-Market', name: '30th Street', line: 'MFL', zone: 'University City' },
    { id: '69th-Market', name: '69th Street Terminal', line: 'MFL', zone: 'Upper Darby' },
    { id: 'Frankford', name: 'Frankford Terminal', line: 'MFL', zone: 'Northeast' },
    
    // Broad Street Line major stations
    { id: 'City-Hall', name: 'City Hall', line: 'BSL', zone: 'Center City' },
    { id: 'Walnut-Locust', name: 'Walnut-Locust', line: 'BSL', zone: 'Center City' },
    { id: 'North-Philadelphia', name: 'North Philadelphia', line: 'BSL', zone: 'North' },
    { id: 'Fern-Rock', name: 'Fern Rock Transportation Center', line: 'BSL', zone: 'North' },
    
    // Regional Rail major stations
    { id: '30th-Street', name: '30th Street Station', line: 'RRD', zone: 'Center City' },
    { id: 'Jefferson', name: 'Jefferson Station', line: 'RRD', zone: 'Center City' },
    { id: 'Temple-U', name: 'Temple University', line: 'RRD', zone: 'North' },
    { id: 'Airport', name: 'Philadelphia International Airport', line: 'RRD', zone: 'Southwest' }
  ];

  return new Response(
    JSON.stringify({
      success: true,
      data: stations,
      timestamp: new Date().toISOString(),
      source: 'SEPTA'
    }),
    { headers: corsHeaders }
  );
}