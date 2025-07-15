import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoadTestResults {
  testType: string;
  duration: number;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: string;
    avgResponseTime: string;
    duration: string;
    requestsPerSecond: string;
  };
  analysis: {
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
    readyFor5000Users: boolean;
  };
  startTime: string;
  endTime: string;
}

export const LoadTester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<LoadTestResults | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runLoadTest = async (testType: 'light' | 'medium' | 'heavy' | 'peak', duration: number) => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    try {
      toast({
        title: `🚆 Starting ${testType} load test`,
        description: `Testing for ${duration} minutes - simulating Chicago users`,
      });

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + (100 / (duration * 60)) * 2; // Update every 2 seconds
        });
      }, 2000);

      const response = await fetch('https://jhvdfihloyjdfrvbegqh.supabase.co/functions/v1/load-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmRmaWhsb3lqZGZydmJlZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTY0NzcsImV4cCI6MjA2Njk3MjQ3N30.PKHuvCrWU4GIezagMTvbAuzwEIqPrjp5ANsO0tvpJvY'
        },
        body: JSON.stringify({ testType, duration })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Load test failed: ${response.status}`);
      }

      const testResults = await response.json();
      setResults(testResults);

      toast({
        title: testResults.analysis.readyFor5000Users ? "✅ Load Test Passed!" : "⚠️ Load Test Completed",
        description: testResults.analysis.readyFor5000Users 
          ? "Your app is ready for 5000 Chicago users!" 
          : "Review recommendations for optimization",
        variant: testResults.analysis.readyFor5000Users ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Load test error:', error);
      toast({
        title: "❌ Load Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getPerformanceBadge = (performance: string) => {
    const variants = {
      excellent: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      good: { variant: 'secondary' as const, color: 'text-blue-600', icon: CheckCircle },
      fair: { variant: 'outline' as const, color: 'text-yellow-600', icon: AlertCircle },
      poor: { variant: 'destructive' as const, color: 'text-red-600', icon: AlertCircle }
    };
    
    const config = variants[performance as keyof typeof variants];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {performance.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Load Testing for 5000 Chicago Users
          </CardTitle>
          <CardDescription>
            Test your app's performance under realistic Chicago transit usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => runLoadTest('light', 2)}
              disabled={isRunning}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Users className="w-4 h-4" />
              <div className="text-center">
                <div className="font-semibold">Light Test</div>
                <div className="text-xs text-muted-foreground">50 users, 2 min</div>
              </div>
            </Button>
            
            <Button
              onClick={() => runLoadTest('medium', 5)}
              disabled={isRunning}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Users className="w-4 h-4" />
              <div className="text-center">
                <div className="font-semibold">Medium Test</div>
                <div className="text-xs text-muted-foreground">200 users, 5 min</div>
              </div>
            </Button>
            
            <Button
              onClick={() => runLoadTest('heavy', 10)}
              disabled={isRunning}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Users className="w-4 h-4" />
              <div className="text-center">
                <div className="font-semibold">Heavy Test</div>
                <div className="text-xs text-muted-foreground">1000 users, 10 min</div>
              </div>
            </Button>
            
            <Button
              onClick={() => runLoadTest('peak', 15)}
              disabled={isRunning}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Users className="w-4 h-4" />
              <div className="text-center">
                <div className="font-semibold">Peak Test</div>
                <div className="text-xs text-muted-foreground">2000 users, 15 min</div>
              </div>
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="text-sm">Running load test...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Load Test Results
              {getPerformanceBadge(results.analysis.performance)}
            </CardTitle>
            <CardDescription>
              Test Type: {results.testType} | Duration: {results.summary.duration}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.summary.totalRequests}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary.successRate}</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.summary.avgResponseTime}</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.summary.requestsPerSecond}</div>
                <div className="text-sm text-muted-foreground">Requests/sec</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                {results.analysis.readyFor5000Users ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                5000 User Readiness: {results.analysis.readyFor5000Users ? 'Ready' : 'Needs Optimization'}
              </h4>
              
              <div className="space-y-2">
                {results.analysis.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm flex items-start gap-2">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-2">
              Test completed: {new Date(results.endTime).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};