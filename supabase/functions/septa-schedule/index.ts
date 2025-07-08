import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log('=== SEPTA DIRECT TEST ===');
  console.log('Request Method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Simple CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // Get parameters
    const url = new URL(req.url);
    const station = url.searchParams.get('station') || '30th Street Station';
    const results = url.searchParams.get('results') || '5';
    
    // Get API key from environment
    const apiKey = Deno.env.get('SEPTA_API_KEY');
    
    console.log('Station:', station);
    console.log('Results:', results);
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key first 4 chars:', apiKey ? apiKey.substring(0, 4) + '...' : 'none');

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'SEPTA_API_KEY environment variable not found',
        debug: {
          env_vars: Object.keys(Deno.env.toObject()).filter(k => k.includes('SEPTA')),
          all_env_count: Object.keys(Deno.env.toObject()).length
        }
      }), { status: 500, headers });
    }

    // Test the exact SEPTA API endpoint with your key
    const septaUrl = `https://www3.septa.org/api/Arrivals/index.php?station=${encodeURIComponent(station)}&results=${results}&key=${apiKey}`;
    
    console.log('Full SEPTA URL (with key masked):', septaUrl.replace(apiKey, 'API_KEY_MASKED'));

    // Make the request with detailed logging
    console.log('Making fetch request...');
    
    const fetchStart = Date.now();
    const response = await fetch(septaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RailScheduleApp/1.0',
        'Referer': 'https://www3.septa.org/'
      }
    });
    
    const fetchDuration = Date.now() - fetchStart;
    console.log('Fetch completed in:', fetchDuration, 'ms');
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    // Get the raw response text first
    const responseText = await response.text();
    console.log('Response text length:', responseText.length);
    console.log('Response text (first 500 chars):', responseText.substring(0, 500));
    console.log('Response text (last 100 chars):', responseText.slice(-100));

    // Check if response is OK
    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `SEPTA API returned ${response.status}: ${response.statusText}`,
        raw_response: responseText.substring(0, 1000),
        debug: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url_masked: septaUrl.replace(apiKey, 'API_KEY_MASKED')
        }
      }), { status: response.status, headers });
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('JSON parse successful');
      console.log('Data type:', typeof data);
      console.log('Data is array:', Array.isArray(data));
      console.log('Data length/keys:', Array.isArray(data) ? data.length : Object.keys(data).length);
    } catch (jsonError) {
      console.error('JSON parse failed:', jsonError.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'SEPTA API returned invalid JSON',
        raw_response: responseText.substring(0, 1000),
        json_error: jsonError.message,
        debug: {
          response_starts_with: responseText.substring(0, 50),
          response_content_type: response.headers.get('content-type')
        }
      }), { status: 500, headers });
    }

    // Check for SEPTA API errors in the data
    if (data && typeof data === 'object') {
      if (data.error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'SEPTA API Error: ' + data.error,
          septa_response: data,
          debug: {
            api_key_used: !!apiKey,
            station: station
          }
        }), { status: 400, headers });
      }
    }

    // Success! Return the data
    console.log('SUCCESS - returning data');
    return new Response(JSON.stringify({
      success: true,
      message: 'SEPTA API call successful',
      station: station,
      timestamp: new Date().toISOString(),
      api_key_used: true,
      data: data,
      debug: {
        response_time_ms: fetchDuration,
        data_type: typeof data,
        data_length: Array.isArray(data) ? data.length : Object.keys(data).length
      }
    }, null, 2), { status: 200, headers });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Function execution error: ' + error.message,
      stack: error.stack,
      debug: {
        error_name: error.name,
        error_message: error.message
      }
    }), { status: 500, headers });
  }
});