# Load Testing for ChiGuard RailSafe
**Target: 5000 Chicago Users Daily**

## Quick Start

1. **Install testing tools:**
   ```bash
   # Install K6
   curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Install Artillery
   npm install -g artillery
   ```

2. **Run complete test suite:**
   ```bash
   chmod +x run-tests.sh
   ./run-tests.sh
   ```

## Test Scenarios

### 1. K6 Comprehensive Load Test (`k6-load-test.js`)
- **Duration:** 90 minutes
- **Peak Load:** 5000 concurrent users
- **User Profiles:**
  - Commuters (60%): Schedule checking, group rides
  - Safety Reporters (25%): Incident reports, SOS features  
  - Heavy Users (15%): All features, multiple sessions

### 2. Artillery Rush Hour Test (`artillery-config.yml`)
- **Duration:** 75 minutes
- **Peak Load:** 150 requests/second
- **Simulates:** Realistic Chicago commute patterns
- **Focus:** Morning (7-9 AM) and evening (5-7 PM) rush hours

### 3. SOS Emergency Stress Test
- **Duration:** 10 minutes
- **Peak Load:** 500 concurrent SOS requests
- **Requirement:** 99.9% success rate, <3s response time
- **Critical:** Emergency system reliability

## Key Metrics Monitored

### Performance Thresholds
- **Response Time:** 95% of requests < 2 seconds
- **Error Rate:** < 0.1% for critical features
- **SOS Response:** < 3 seconds, 99.9% success
- **Database:** No connection pool exhaustion

### Tested Features
- ✅ CTA schedule API performance
- ✅ Incident report creation/retrieval
- ✅ Group ride operations
- ✅ Real-time subscriptions
- ✅ SOS emergency system
- ✅ File upload capabilities
- ✅ Authentication flows

## Infrastructure Monitored
- Supabase database connection pool
- Edge function cold starts and execution
- WebSocket connection stability
- File storage bandwidth
- Real-time subscription limits

## Expected Load Distribution

### Daily Usage (5000 Chicago Users)
- **Peak Hours (7-9 AM, 5-7 PM):** 2000 concurrent users
- **Regular Hours:** 500-800 concurrent users
- **Off-Peak:** 100-300 concurrent users

### API Call Volume
- **CTA Schedule:** 3000 calls/minute (peak)
- **Incident Reports:** 200 reads + 50 writes/minute (peak)
- **Group Rides:** 100 reads + 20 writes/minute (peak)
- **SOS Activations:** 1-5 calls/minute (emergency)

## Running Individual Tests

### K6 Only
```bash
k6 run k6-load-test.js
```

### Artillery Only  
```bash
artillery run artillery-config.yml
```

### SOS Stress Test Only
```bash
k6 run --summary-trend-stats="min,med,avg,p(95),p(99),max" sos-stress-test.js
```

## Results Analysis

After running tests, check:

1. **Performance Metrics:**
   - Response times stay under thresholds
   - Error rates remain minimal
   - Resource utilization reasonable

2. **Database Performance:**
   - No connection pool saturation
   - Query execution times acceptable
   - No deadlocks or timeouts

3. **SOS System Reliability:**
   - 100% of SOS requests processed
   - Emergency backup systems functional
   - Offline queue mechanisms working

4. **Real-time Features:**
   - WebSocket connections stable
   - Subscription updates delivered
   - No memory leaks in long-running tests

## Optimization Recommendations

If tests fail, consider:

1. **Database Optimization:**
   - Add indexes for frequently queried columns
   - Implement connection pooling
   - Cache frequently accessed data

2. **API Performance:**
   - Implement rate limiting
   - Add CDN for static assets
   - Optimize edge function execution

3. **Real-time Scaling:**
   - Increase WebSocket connection limits
   - Implement horizontal scaling
   - Add load balancing for subscriptions

4. **Emergency System:**
   - Multiple redundant endpoints
   - Offline-first architecture
   - Circuit breaker patterns

## Production Monitoring

Set up alerts for:
- Response times > 2 seconds
- Error rates > 0.1%
- SOS system failures
- Database connection pool > 80%
- Real-time subscription errors

This ensures 5000 Chicago users have a reliable, performant experience.