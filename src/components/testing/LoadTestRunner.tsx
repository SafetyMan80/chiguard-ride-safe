import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, StopCircle, Clock, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CITIES_WITH_RAIL } from "@/data/cities";
import { INCIDENT_TYPES } from "@/types/incident";

interface LoadTestMetrics {
  city: string;
  scheduleRequests: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  incidentReports: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
}

interface TestProgress {
  phase: 'idle' | 'schedule-load' | 'incident-load' | 'completed';
  completedCities: number;
  totalCities: number;
  currentCity?: string;
  completedRequests: number;
  totalRequests: number;
}

const CONCURRENT_USERS_PER_CITY = 100;
const INCIDENTS_PER_CITY = 5;

export const LoadTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<LoadTestMetrics[]>([]);
  const [testProgress, setTestProgress] = useState<TestProgress>({
    phase: 'idle',
    completedCities: 0,
    totalCities: 0,
    completedRequests: 0,
    totalRequests: 0
  });
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const getEdgeFunctionName = (cityId: string): string => {
    const functionMap: Record<string, string> = {
      'chicago': 'cta-schedule',
      'nyc': 'mta-schedule',
      'denver': 'rtd-schedule',
      'washington_dc': 'wmata-schedule',
      'philadelphia': 'septa-schedule',
      'atlanta': 'marta-schedule',
      'boston': 'mbta-schedule',
      'san_francisco': 'sf511-schedule',
      'los_angeles': 'lametro-schedule'
    };
    return functionMap[cityId] || 'cta-schedule';
  };

  const simulateScheduleLoad = async (cityId: string, cityName: string): Promise<LoadTestMetrics['scheduleRequests']> => {
    addLog(`🚇 Starting schedule load test for ${cityName} (${CONCURRENT_USERS_PER_CITY} concurrent users)`);
    
    const startTime = Date.now();
    const promises: Promise<{ success: boolean; responseTime: number }>[] = [];
    const functionName = getEdgeFunctionName(cityId);

    // Create 100 concurrent requests
    for (let i = 0; i < CONCURRENT_USERS_PER_CITY; i++) {
      const promise = (async () => {
        const requestStart = Date.now();
        try {
          const { data, error } = await supabase.functions.invoke(functionName, {
            method: 'POST',
            body: {}
          });
          
          const responseTime = Date.now() - requestStart;
          
          if (error) {
            return { success: false, responseTime };
          }
          
          return { success: true, responseTime };
        } catch (err) {
          const responseTime = Date.now() - requestStart;
          return { success: false, responseTime };
        }
      })();
      
      promises.push(promise);
    }

    // Wait for all requests to complete
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const responseTimes = results.map(r => r.responseTime);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    const totalTime = Date.now() - startTime;
    addLog(`✅ ${cityName} schedule test completed: ${successful}/${CONCURRENT_USERS_PER_CITY} successful (${totalTime}ms total)`);
    
    return {
      total: CONCURRENT_USERS_PER_CITY,
      successful,
      failed,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime
    };
  };

  const simulateIncidentLoad = async (cityId: string, cityName: string): Promise<LoadTestMetrics['incidentReports']> => {
    addLog(`🚨 Starting incident load test for ${cityName} (${INCIDENTS_PER_CITY} concurrent reports)`);
    
    const startTime = Date.now();
    const promises: Promise<{ success: boolean; responseTime: number }>[] = [];

    // Get user for incident reporting
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      addLog(`❌ No user authenticated for incident reports in ${cityName}`);
      return {
        total: INCIDENTS_PER_CITY,
        successful: 0,
        failed: INCIDENTS_PER_CITY,
        avgResponseTime: 0
      };
    }

    // Create concurrent incident reports
    for (let i = 0; i < INCIDENTS_PER_CITY; i++) {
      const promise = (async () => {
        const requestStart = Date.now();
        try {
          const incidentType = INCIDENT_TYPES[i % INCIDENT_TYPES.length];
          const { data, error } = await supabase
            .from('incident_reports')
            .insert({
              reporter_id: user.id,
              incident_type: incidentType,
              transit_line: cityId,
              location_name: `Load Test Station ${i + 1}`,
              description: `Load test ${incidentType} incident #${i + 1} for ${cityName}`,
              latitude: 40.7589 + (Math.random() - 0.5) * 0.1,
              longitude: -73.9851 + (Math.random() - 0.5) * 0.1,
              accuracy: Math.floor(Math.random() * 50) + 10
            })
            .select();
          
          const responseTime = Date.now() - requestStart;
          
          if (error) {
            return { success: false, responseTime };
          }
          
          return { success: true, responseTime };
        } catch (err) {
          const responseTime = Date.now() - requestStart;
          return { success: false, responseTime };
        }
      })();
      
      promises.push(promise);
    }

    // Wait for all incident reports to complete
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    const totalTime = Date.now() - startTime;
    addLog(`✅ ${cityName} incident test completed: ${successful}/${INCIDENTS_PER_CITY} successful (${totalTime}ms total)`);
    
    return {
      total: INCIDENTS_PER_CITY,
      successful,
      failed,
      avgResponseTime: Math.round(avgResponseTime)
    };
  };

  const runLoadTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setLogs([]);
    
    const availableCities = CITIES_WITH_RAIL.filter(city => city.available);
    const totalCities = availableCities.length;
    const totalRequests = totalCities * (CONCURRENT_USERS_PER_CITY + INCIDENTS_PER_CITY);
    
    setTestProgress({
      phase: 'schedule-load',
      completedCities: 0,
      totalCities,
      completedRequests: 0,
      totalRequests
    });

    addLog(`🚀 Starting comprehensive load test across ${totalCities} cities`);
    addLog(`📊 Total planned requests: ${totalRequests} (${totalCities * CONCURRENT_USERS_PER_CITY} schedule + ${totalCities * INCIDENTS_PER_CITY} incidents)`);
    
    const results: LoadTestMetrics[] = [];

    try {
      // Phase 1: Schedule Load Testing
      setTestProgress(prev => ({ ...prev, phase: 'schedule-load' }));
      addLog(`\n📈 PHASE 1: Schedule Load Testing`);
      
      for (let i = 0; i < availableCities.length; i++) {
        const city = availableCities[i];
        setTestProgress(prev => ({ 
          ...prev, 
          currentCity: city.name,
          completedCities: i 
        }));
        
        const scheduleMetrics = await simulateScheduleLoad(city.id, city.name);
        
        results.push({
          city: city.name,
          scheduleRequests: scheduleMetrics,
          incidentReports: {
            total: 0,
            successful: 0,
            failed: 0,
            avgResponseTime: 0
          }
        });
        
        setTestProgress(prev => ({ 
          ...prev, 
          completedRequests: prev.completedRequests + CONCURRENT_USERS_PER_CITY 
        }));
        setTestResults([...results]);
      }

      // Phase 2: Incident Load Testing
      setTestProgress(prev => ({ ...prev, phase: 'incident-load' }));
      addLog(`\n🚨 PHASE 2: Incident Load Testing`);
      
      for (let i = 0; i < availableCities.length; i++) {
        const city = availableCities[i];
        setTestProgress(prev => ({ 
          ...prev, 
          currentCity: city.name,
          completedCities: i 
        }));
        
        const incidentMetrics = await simulateIncidentLoad(city.id, city.name);
        
        // Update the existing result
        results[i].incidentReports = incidentMetrics;
        
        setTestProgress(prev => ({ 
          ...prev, 
          completedRequests: prev.completedRequests + INCIDENTS_PER_CITY 
        }));
        setTestResults([...results]);
      }

      setTestProgress(prev => ({ 
        ...prev, 
        phase: 'completed',
        completedCities: totalCities 
      }));

      // Calculate overall statistics
      const totalScheduleRequests = results.reduce((sum, r) => sum + r.scheduleRequests.total, 0);
      const totalScheduleSuccessful = results.reduce((sum, r) => sum + r.scheduleRequests.successful, 0);
      const totalIncidentRequests = results.reduce((sum, r) => sum + r.incidentReports.total, 0);
      const totalIncidentSuccessful = results.reduce((sum, r) => sum + r.incidentReports.successful, 0);
      
      addLog(`\n🎉 LOAD TEST COMPLETED!`);
      addLog(`📊 Schedule Requests: ${totalScheduleSuccessful}/${totalScheduleRequests} successful (${((totalScheduleSuccessful/totalScheduleRequests)*100).toFixed(1)}%)`);
      addLog(`🚨 Incident Reports: ${totalIncidentSuccessful}/${totalIncidentRequests} successful (${((totalIncidentSuccessful/totalIncidentRequests)*100).toFixed(1)}%)`);
      
      toast({
        title: "Load Test Completed",
        description: `Tested ${totalRequests} requests across ${totalCities} cities`,
      });

    } catch (error) {
      console.error('Load test failed:', error);
      addLog(`❌ Load test failed: ${error.message}`);
      toast({
        title: "Load Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stopTests = () => {
    setIsRunning(false);
    addLog(`🛑 Load test stopped by user`);
    toast({
      title: "Load Test Stopped",
      description: "Test execution was interrupted",
      variant: "destructive"
    });
  };

  const calculateOverallStats = () => {
    if (testResults.length === 0) return null;
    
    const totalScheduleRequests = testResults.reduce((sum, r) => sum + r.scheduleRequests.total, 0);
    const totalScheduleSuccessful = testResults.reduce((sum, r) => sum + r.scheduleRequests.successful, 0);
    const totalIncidentRequests = testResults.reduce((sum, r) => sum + r.incidentReports.total, 0);
    const totalIncidentSuccessful = testResults.reduce((sum, r) => sum + r.incidentReports.successful, 0);
    const avgScheduleResponseTime = testResults.reduce((sum, r) => sum + r.scheduleRequests.avgResponseTime, 0) / testResults.length;
    const avgIncidentResponseTime = testResults.reduce((sum, r) => sum + r.incidentReports.avgResponseTime, 0) / testResults.length;
    
    return {
      totalScheduleRequests,
      totalScheduleSuccessful,
      totalIncidentRequests,
      totalIncidentSuccessful,
      scheduleSuccessRate: (totalScheduleSuccessful / totalScheduleRequests) * 100,
      incidentSuccessRate: (totalIncidentSuccessful / totalIncidentRequests) * 100,
      avgScheduleResponseTime: Math.round(avgScheduleResponseTime),
      avgIncidentResponseTime: Math.round(avgIncidentResponseTime)
    };
  };

  const overallStats = calculateOverallStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Transit System Load Testing
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Simulate {CONCURRENT_USERS_PER_CITY} concurrent schedule requests and {INCIDENTS_PER_CITY} incident reports per city
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runLoadTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Running Load Test...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Start Load Test
                </>
              )}
            </Button>
            
            {isRunning && (
              <Button 
                onClick={stopTests}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Stop Test
              </Button>
            )}
          </div>

          {/* Progress Section */}
          {testProgress.phase !== 'idle' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Phase: {testProgress.phase === 'schedule-load' ? 'Schedule Testing' : 
                          testProgress.phase === 'incident-load' ? 'Incident Testing' : 'Completed'}
                </span>
                <span>{testProgress.currentCity || 'Initializing...'}</span>
              </div>
              <Progress 
                value={(testProgress.completedRequests / testProgress.totalRequests) * 100} 
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cities: {testProgress.completedCities}/{testProgress.totalCities}</span>
                <span>Requests: {testProgress.completedRequests}/{testProgress.totalRequests}</span>
              </div>
            </div>
          )}

          {/* Overall Statistics */}
          {overallStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                    <Users className="w-5 h-5" />
                    {overallStats.totalScheduleRequests}
                  </div>
                  <div className="text-sm text-muted-foreground">Schedule Requests</div>
                  <div className="text-xs text-green-600">{overallStats.scheduleSuccessRate.toFixed(1)}% success</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-5 h-5" />
                    {overallStats.totalIncidentRequests}
                  </div>
                  <div className="text-sm text-muted-foreground">Incident Reports</div>
                  <div className="text-xs text-green-600">{overallStats.incidentSuccessRate.toFixed(1)}% success</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {overallStats.avgScheduleResponseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Schedule Response</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {overallStats.avgIncidentResponseTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Incident Response</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {testResults.length > 0 && (
        <Tabs defaultValue="results" className="w-full">
          <TabsList>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="logs">Execution Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>City-by-City Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">{result.city}</h3>
                          <div className="flex gap-2">
                            <Badge variant={result.scheduleRequests.successful === result.scheduleRequests.total ? "default" : "destructive"}>
                              Schedule: {result.scheduleRequests.successful}/{result.scheduleRequests.total}
                            </Badge>
                            <Badge variant={result.incidentReports.successful === result.incidentReports.total ? "default" : "destructive"}>
                              Incidents: {result.incidentReports.successful}/{result.incidentReports.total}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Schedule Success Rate</div>
                            <div className="text-muted-foreground">
                              {((result.scheduleRequests.successful / result.scheduleRequests.total) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Avg Response Time</div>
                            <div className="text-muted-foreground">{result.scheduleRequests.avgResponseTime}ms</div>
                          </div>
                          <div>
                            <div className="font-medium">Min/Max Response</div>
                            <div className="text-muted-foreground">
                              {result.scheduleRequests.minResponseTime}ms / {result.scheduleRequests.maxResponseTime}ms
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Incident Success Rate</div>
                            <div className="text-muted-foreground">
                              {result.incidentReports.total > 0 
                                ? `${((result.incidentReports.successful / result.incidentReports.total) * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Test Execution Log
                  <Badge variant="outline">{logs.length} entries</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          log.includes("❌") || log.includes("failed") 
                            ? "bg-destructive/10 text-destructive" 
                            : log.includes("✅") || log.includes("completed")
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : log.includes("🚀") || log.includes("PHASE")
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-muted"
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};