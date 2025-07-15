# Load Testing Strategy for 5000 Chicago Users

## Test Scenarios Overview

### Target Load: 5000 users in Chicago area over 24 hours
- **Peak hours (7-9 AM, 5-7 PM)**: 2000 concurrent users
- **Regular hours**: 500-800 concurrent users  
- **Off-peak hours**: 100-300 concurrent users

### User Behavior Patterns
1. **Commuter (60%)**: Schedule checking, group rides, occasional incident reports
2. **Safety Reporter (25%)**: Active incident reporting, SOS usage
3. **Heavy User (15%)**: Multiple features, messaging, frequent app usage

## Critical Endpoints to Test

### High Frequency (Every 30-60 seconds)
- CTA Schedule API: `/functions/v1/cta-schedule`
- Incident Reports Query: Supabase `incident_reports` table
- Group Rides Query: Supabase `group_rides` table

### Medium Frequency (Every 5-10 minutes)
- User Profile Updates: Supabase `profiles` table
- Real-time Subscriptions: WebSocket connections
- File Uploads: Profile photos, incident images

### Low Frequency (Emergency/Occasional)
- SOS Activation: Emergency failsafe system
- Incident Report Creation: Database inserts
- Group Ride Creation: Database inserts

## Database Load Expectations

### Read Operations (90% of traffic)
- **incident_reports**: 3000 reads/minute during peak
- **group_rides**: 2000 reads/minute during peak
- **profiles**: 1000 reads/minute during peak

### Write Operations (10% of traffic)
- **incident_reports**: 50 inserts/minute during peak
- **group_rides**: 20 inserts/minute during peak
- **group_messages**: 200 inserts/minute during peak

## Infrastructure Bottlenecks to Monitor

1. **Supabase Connection Pool**: Max concurrent connections
2. **Edge Function Cold Starts**: CTA API response times
3. **Real-time Subscriptions**: WebSocket connection limits
4. **File Storage**: Upload bandwidth and storage limits
5. **Database Performance**: Query execution times and locks

## Test Implementation Plan

1. **Baseline Testing**: Single user flows
2. **Ramp-up Testing**: Gradual increase to 5000 users
3. **Peak Load Testing**: Simulate rush hour traffic
4. **Stress Testing**: Push beyond 5000 users
5. **Endurance Testing**: 24-hour sustained load
6. **Disaster Recovery**: SOS system under load

## Success Criteria

- **Response Time**: < 2 seconds for 95% of requests
- **Availability**: 99.9% uptime during test period
- **Error Rate**: < 0.1% for critical features
- **SOS System**: 100% reliability even under peak load
- **Database**: No connection pool exhaustion
- **Real-time**: WebSocket connections stable