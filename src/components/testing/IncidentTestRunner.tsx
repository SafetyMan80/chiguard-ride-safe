import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { runComprehensiveIncidentTest } from "@/utils/testIncidentReports";

export const IncidentTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);
    
    addLog("Starting comprehensive incident testing...");
    
    try {
      // Override console.log to capture test output
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        addLog(args.join(" "));
        originalLog(...args);
      };
      
      console.error = (...args) => {
        addLog(`ERROR: ${args.join(" ")}`);
        originalError(...args);
      };
      
      const results = await runComprehensiveIncidentTest();
      
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      
      setTestResults(results);
      
      if (results.success) {
        toast({
          title: "✅ Testing Completed",
          description: `Created ${results.summary.successfulCreations} test incidents across all cities.`,
        });
      } else {
        toast({
          title: "❌ Testing Failed",
          description: results.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Test execution failed:", error);
      toast({
        title: "❌ Test Execution Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Incident Report Testing Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive testing of incident reporting functionality across all cities and transit lines.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Run Comprehensive Test
                </>
              )}
            </Button>
          </div>

          {testResults && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {testResults.summary?.totalTestIncidents || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle className="w-5 h-5" />
                    {testResults.summary?.successfulCreations || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                    <XCircle className="w-5 h-5" />
                    {testResults.summary?.failedCreations || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Trash2 className="w-5 h-5" />
                    {testResults.summary?.deletionTest ? "✅" : "❌"}
                  </div>
                  <div className="text-sm text-muted-foreground">Deletion Test</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
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
                      log.includes("ERROR") 
                        ? "bg-destructive/10 text-destructive" 
                        : log.includes("✅") 
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">This test suite covers:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Incident creation for all available cities (Chicago, NYC, Denver, DC, Philadelphia, Atlanta)</li>
              <li>Multiple stations per transit line testing</li>
              <li>All incident types rotation</li>
              <li>City-specific incident filtering</li>
              <li>Incident deletion functionality</li>
              <li>Database integrity and RLS policy validation</li>
              <li>Geographic coordinates assignment</li>
              <li>Real-time updates verification</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};