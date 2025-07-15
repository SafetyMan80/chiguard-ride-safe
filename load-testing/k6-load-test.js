import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration for 5000 Chicago users
export const options = {
  stages: [
    // Ramp up
    { duration: '5m', target: 100 },   // Start with 100 users
    { duration: '10m', target: 500 },  // Ramp to 500 users
    { duration: '10m', target: 1000 }, // Ramp to 1000 users
    { duration: '15m', target: 2000 }, // Peak rush hour simulation
    { duration: '20m', target: 5000 }, // Full load test
    
    // Sustain peak load
    { duration: '30m', target: 5000 }, // Sustain 5000 users for 30 minutes
    
    // Ramp down
    { duration: '10m', target: 1000 }, // Back to normal
    { duration: '5m', target: 0 },     // Complete ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    errors: ['rate<0.01'],             // Custom error rate under 1%
  },
};

// Base URLs and configuration
const BASE_URL = 'https://adb12d6e-2ce6-4ba8-bed5-ca9f7fdf994b.lovableproject.com';
const SUPABASE_URL = 'https://jhvdfihloyjdfrvbegqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY';

// Chicago-specific test data
const CHICAGO_LINES = ['red', 'blue', 'brown', 'green', 'orange', 'purple', 'pink', 'yellow'];
const CHICAGO_STATIONS = [
  'clark-lake', 'fullerton', 'belmont', 'howard', '95th-dan-ryan',
  'roosevelt', 'ohare', 'forest-park', 'jefferson-park', 'logan-square',
  'midway', 'harlem-lake', 'garfield', 'kimball', '54th-cermak'
];

const INCIDENT_TYPES = ['harassment', 'theft', 'medical', 'suspicious', 'delay', 'emergency'];
const CHICAGO_LOCATIONS = [
  'Union Station', 'Downtown', 'Loop', 'North Side', 'South Side',
  'West Side', 'Lincoln Park', 'Wicker Park', 'Millennium Park'
];

// User behavior profiles
function getUserProfile() {
  const rand = Math.random();
  if (rand < 0.6) {
    return 'commuter'; // 60% commuters
  } else if (rand < 0.85) {
    return 'safety_reporter'; // 25% safety reporters
  } else {
    return 'heavy_user'; // 15% heavy users
  }
}

export default function () {
  const userProfile = getUserProfile();
  const sessionId = `user_${__VU}_${__ITER}`;
  
  // Simulate different user behaviors based on profile
  switch (userProfile) {
    case 'commuter':
      simulateCommuter();
      break;
    case 'safety_reporter':
      simulateSafetyReporter();
      break;
    case 'heavy_user':
      simulateHeavyUser();
      break;
  }
}

function simulateCommuter() {
  // Typical commuter: checks schedules, occasionally joins group rides
  
  // 1. Check CTA schedule (high frequency)
  const line = randomItem(CHICAGO_LINES);
  const station = randomItem(CHICAGO_STATIONS);
  
  const scheduleResponse = http.post(`${SUPABASE_URL}/functions/v1/cta-schedule`, 
    JSON.stringify({
      line: line,
      station: station
    }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  
  check(scheduleResponse, {
    'CTA schedule status is 200': (r) => r.status === 200,
    'CTA schedule has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(1, 3));
  
  // 2. Check group rides (medium frequency)
  const groupRidesResponse = http.get(`${SUPABASE_URL}/rest/v1/group_rides?select=*&status=eq.active&order=departure_time.asc&limit=20`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(groupRidesResponse, {
    'Group rides status is 200': (r) => r.status === 200,
    'Group rides response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(2, 5));
  
  // 3. Check incident reports (medium frequency)
  const incidentsResponse = http.get(`${SUPABASE_URL}/rest/v1/incident_reports?select=*&status=eq.active&transit_line=eq.chicago&order=created_at.desc&limit=25`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(incidentsResponse, {
    'Incidents status is 200': (r) => r.status === 200,
    'Incidents response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(5, 10));
}

function simulateSafetyReporter() {
  // Safety-focused user: actively reports incidents, uses SOS features
  
  // 1. Create incident report (write operation)
  const incidentType = randomItem(INCIDENT_TYPES);
  const location = randomItem(CHICAGO_LOCATIONS);
  
  const newIncident = {
    incident_type: incidentType,
    transit_line: 'chicago',
    location_name: location,
    description: `${incidentType} incident reported at ${location} via load test`,
    reporter_id: '00000000-0000-0000-0000-000000000000', // Anonymous test user
    latitude: 41.8781 + (Math.random() - 0.5) * 0.2, // Chicago area
    longitude: -87.6298 + (Math.random() - 0.5) * 0.2,
    accuracy: randomIntBetween(5, 50),
    status: 'active'
  };
  
  const createIncidentResponse = http.post(`${SUPABASE_URL}/rest/v1/incident_reports`, 
    JSON.stringify(newIncident), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
  
  check(createIncidentResponse, {
    'Create incident status is 201': (r) => r.status === 201,
    'Create incident response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(2, 4));
  
  // 2. Check recent incidents (read operation)
  const recentIncidentsResponse = http.get(`${SUPABASE_URL}/rest/v1/incident_reports?select=*&status=eq.active&order=created_at.desc&limit=10`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(recentIncidentsResponse, {
    'Recent incidents status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(3, 6));
  
  // 3. Test emergency backup function (low frequency, critical feature)
  if (Math.random() < 0.1) { // 10% chance to test SOS
    const sosData = {
      id: `sos-test-${Date.now()}`,
      type: 'sos',
      location: {
        latitude: 41.8781 + (Math.random() - 0.5) * 0.2,
        longitude: -87.6298 + (Math.random() - 0.5) * 0.2,
        accuracy: randomIntBetween(5, 20)
      },
      timestamp: new Date().toISOString(),
      details: 'Load test SOS activation',
      status: 'pending'
    };
    
    const sosResponse = http.post(`${SUPABASE_URL}/functions/v1/emergency-backup`,
      JSON.stringify(sosData), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    check(sosResponse, {
      'SOS backup status is 200': (r) => r.status === 200,
      'SOS response time < 3s': (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);
    
    sleep(randomIntBetween(1, 2));
  }
}

function simulateHeavyUser() {
  // Heavy user: uses all features frequently
  
  // 1. Multiple schedule checks
  for (let i = 0; i < 3; i++) {
    const line = randomItem(CHICAGO_LINES);
    const station = randomItem(CHICAGO_STATIONS);
    
    const scheduleResponse = http.post(`${SUPABASE_URL}/functions/v1/cta-schedule`, 
      JSON.stringify({ line, station }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    check(scheduleResponse, {
      'Heavy user CTA schedule OK': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    sleep(randomIntBetween(1, 2));
  }
  
  // 2. Create group ride (write operation)
  const newGroupRide = {
    creator_id: '00000000-0000-0000-0000-000000000000', // Anonymous test user
    cta_line: randomItem(CHICAGO_LINES),
    station_name: randomItem(CHICAGO_STATIONS),
    university_name: 'University of Chicago',
    departure_time: new Date(Date.now() + randomIntBetween(3600000, 86400000)).toISOString(),
    max_spots: randomIntBetween(2, 6),
    description: 'Load test group ride',
    status: 'active'
  };
  
  const createRideResponse = http.post(`${SUPABASE_URL}/rest/v1/group_rides`, 
    JSON.stringify(newGroupRide), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
  
  check(createRideResponse, {
    'Create group ride status is 201': (r) => r.status === 201,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(2, 4));
  
  // 3. Check all active group rides
  const allRidesResponse = http.get(`${SUPABASE_URL}/rest/v1/group_rides?select=*,general_ride_members(count)&status=eq.active&order=departure_time.asc`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(allRidesResponse, {
    'All rides query status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(3, 5));
  
  // 4. Create general group ride
  const newGeneralRide = {
    creator_id: '00000000-0000-0000-0000-000000000000',
    title: 'Load Test Ride',
    departure_location: randomItem(CHICAGO_LOCATIONS),
    destination_location: randomItem(CHICAGO_LOCATIONS),
    departure_time: new Date(Date.now() + randomIntBetween(3600000, 86400000)).toISOString(),
    max_spots: randomIntBetween(3, 8),
    description: 'General load test ride',
    status: 'active'
  };
  
  const createGeneralRideResponse = http.post(`${SUPABASE_URL}/rest/v1/general_group_rides`, 
    JSON.stringify(newGeneralRide), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
  
  check(createGeneralRideResponse, {
    'Create general ride status is 201': (r) => r.status === 201,
  }) || errorRate.add(1);
  
  sleep(randomIntBetween(5, 8));
}