import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testType = 'light', duration = 5 } = await req.json();
    
    console.log(`🚆 Starting ${testType} load test for ${duration} minutes`);
    
    const results = {
      testType,
      duration,
      startTime: new Date().toISOString(),
      results: []
    };

    // Define test scenarios based on Chicago users
    const scenarios = {
      light: { users: 50, rpm: 10 },
      medium: { users: 200, rpm: 30 },
      heavy: { users: 1000, rpm: 100 },
      peak: { users: 2000, rpm: 200 }
    };

    const config = scenarios[testType] || scenarios.light;
    const testDurationMs = duration * 60 * 1000;
    const requestInterval = (60 * 1000) / config.rpm; // ms between requests
    
    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // Chicago-specific test data
    const chicagoLines = ['red', 'blue', 'brown', 'green', 'orange', 'purple'];
    const chicagoStations = ['clark-lake', 'fullerton', 'howard', 'roosevelt', 'ohare'];
    const incidentTypes = ['harassment', 'theft', 'medical', 'delay', 'emergency'];
    
    console.log(`🎯 Target: ${config.users} users, ${config.rpm} requests/min`);
    
    // Run test for specified duration
    while (Date.now() - startTime < testDurationMs) {
      const batchPromises = [];
      
      // Create batch of concurrent requests
      for (let i = 0; i < Math.min(10, config.users); i++) {
        batchPromises.push(performTestRequest(chicagoLines, chicagoStations, incidentTypes));
      }
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        requestCount++;
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      // Wait before next batch
      await new Promise(resolve => setTimeout(resolve, requestInterval));
      
      // Log progress every 30 seconds
      if (requestCount % 50 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`📊 Progress: ${requestCount} requests, ${successCount} success, ${errorCount} errors (${elapsed.toFixed(0)}s)`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgResponseTime = totalTime / requestCount;
    const successRate = (successCount / requestCount) * 100;
    
    results.summary = {
      totalRequests: requestCount,
      successfulRequests: successCount,
      failedRequests: errorCount,
      successRate: successRate.toFixed(2) + '%',
      avgResponseTime: avgResponseTime.toFixed(0) + 'ms',
      duration: (totalTime / 1000).toFixed(0) + 's',
      requestsPerSecond: (requestCount / (totalTime / 1000)).toFixed(1)
    };
    
    results.endTime = new Date().toISOString();
    
    console.log('🎉 Load test completed:', results.summary);
    
    // Performance analysis
    const analysis = analyzeResults(results.summary, testType);
    results.analysis = analysis;
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Load test error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function performTestRequest(lines, stations, incidentTypes) {
  const requestType = Math.random();
  
  try {
    if (requestType < 0.4) {
      // 40% - CTA Schedule requests
      return await testCTASchedule(lines, stations);
    } else if (requestType < 0.7) {
      // 30% - Incident reports queries
      return await testIncidentReports();
    } else if (requestType < 0.9) {
      // 20% - Group rides queries
      return await testGroupRides();
    } else {
      // 10% - Create incident report
      return await testCreateIncident(incidentTypes);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testCTASchedule(lines, stations) {
  const line = lines[Math.floor(Math.random() * lines.length)];
  const station = stations[Math.floor(Math.random() * stations.length)];
  
  const startTime = Date.now();
  
  const response = await fetch('https://jhvdfihloyjdfrvbegqh.supabase.co/functions/v1/cta-schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY'
    },
    body: JSON.stringify({ line, station })
  });
  
  const responseTime = Date.now() - startTime;
  const success = response.ok;
  
  return { success, responseTime, endpoint: 'cta-schedule' };
}

async function testIncidentReports() {
  const startTime = Date.now();
  
  const response = await fetch('https://jhvdfihloyjdfrvbegqh.supabase.co/rest/v1/incident_reports?select=*&status=eq.active&order=created_at.desc&limit=25', {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY'
    }
  });
  
  const responseTime = Date.now() - startTime;
  const success = response.ok;
  
  return { success, responseTime, endpoint: 'incident-reports' };
}

async function testGroupRides() {
  const startTime = Date.now();
  
  const response = await fetch('https://jhvdfihloyjdfrvbegqh.supabase.co/rest/v1/group_rides?select=*&status=eq.active&order=departure_time.asc&limit=20', {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY'
    }
  });
  
  const responseTime = Date.now() - startTime;
  const success = response.ok;
  
  return { success, responseTime, endpoint: 'group-rides' };
}

async function testCreateIncident(incidentTypes) {
  const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
  const startTime = Date.now();
  
  const newIncident = {
    incident_type: incidentType,
    transit_line: 'chicago',
    location_name: 'Load Test Location',
    description: `Load test ${incidentType} incident`,
    reporter_id: '00000000-0000-0000-0000-000000000000',
    latitude: 41.8781 + (Math.random() - 0.5) * 0.1,
    longitude: -87.6298 + (Math.random() - 0.5) * 0.1,
    accuracy: Math.floor(Math.random() * 30) + 5,
    status: 'active'
  };
  
  const response = await fetch('https://jhvdfihloyjdfrvbegqh.supabase.co/rest/v1/incident_reports', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY',
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(newIncident)
  });
  
  const responseTime = Date.now() - startTime;
  const success = response.ok;
  
  return { success, responseTime, endpoint: 'create-incident' };
}

function analyzeResults(summary, testType) {
  const successRate = parseFloat(summary.successRate.replace('%', ''));
  const avgResponseTime = parseInt(summary.avgResponseTime.replace('ms', ''));
  const rps = parseFloat(summary.requestsPerSecond);
  
  const analysis = {
    performance: 'unknown',
    recommendations: [],
    readyFor5000Users: false
  };
  
  // Performance analysis
  if (successRate >= 99 && avgResponseTime <= 2000) {
    analysis.performance = 'excellent';
    analysis.readyFor5000Users = true;
  } else if (successRate >= 95 && avgResponseTime <= 5000) {
    analysis.performance = 'good';
    analysis.readyFor5000Users = testType === 'light' || testType === 'medium';
  } else if (successRate >= 90) {
    analysis.performance = 'fair';
    analysis.readyFor5000Users = false;
  } else {
    analysis.performance = 'poor';
    analysis.readyFor5000Users = false;
  }
  
  // Recommendations
  if (avgResponseTime > 3000) {
    analysis.recommendations.push('Optimize database queries - response times too high');
  }
  
  if (successRate < 95) {
    analysis.recommendations.push('Investigate error causes - success rate below 95%');
  }
  
  if (rps < 10 && testType !== 'light') {
    analysis.recommendations.push('Scale infrastructure - request throughput too low');
  }
  
  if (analysis.readyFor5000Users) {
    analysis.recommendations.push('✅ App performance looks good for 5000 Chicago users');
  } else {
    analysis.recommendations.push('⚠️ Optimize before deploying to 5000 users');
  }
  
  return analysis;
}