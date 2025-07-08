import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRobustScheduleFetch } from '@/hooks/useRobustScheduleFetch';
import { useToast } from '@/hooks/use-toast';

export const CTAApiTester = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [lastTest, setLastTest] = useState<string>('');
  const { toast } = useToast();
  
  const { fetchWithRetry, loading, error } = useRobustScheduleFetch('CTA-Test', {
    timeout: 30000, // Long timeout for testing
    maxRetries: 1 // No retries for testing
  });

  const testCTAAPI = async () => {
    console.log('🧪 Starting CTA API Test...');
    setTestResults(null);
    setLastTest(new Date().toLocaleTimeString());
    
    try {
      // Test with Howard Station (major hub)
      const testPayload = { stopId: '30173' };
      console.log('🧪 Testing with payload:', testPayload);
      
      const result = await fetchWithRetry('cta-schedule', testPayload);
      console.log('🧪 Test result:', result);
      
      setTestResults(result);
      
      toast({
        title: "CTA API Test Complete",
        description: `Status: ${result.success ? 'Success' : 'Failed'} - ${result.data?.length || 0} arrivals`,
        variant: result.success ? "default" : "destructive"
      });
      
    } catch (err) {
      console.error('🧪 Test failed:', err);
      setTestResults({ 
        success: false, 
        error: err.message || 'Test failed',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "CTA API Test Failed",
        description: err.message || 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>CTA API Diagnostic Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={testCTAAPI} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Testing CTA API...' : 'Test CTA API'}
          </Button>
          {lastTest && (
            <span className="text-sm text-muted-foreground">
              Last test: {lastTest}
            </span>
          )}
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">Error:</p>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        {testResults && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Results:</h4>
            <div className="p-3 bg-muted rounded-md">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
            
            {testResults.success && testResults.data?.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Sample Arrivals:</h5>
                <div className="space-y-2">
                  {testResults.data.slice(0, 3).map((arrival: any, idx: number) => (
                    <div key={idx} className="p-2 bg-background border rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{arrival.line} Line</span>
                        <span className="text-sm text-muted-foreground">{arrival.arrivalTime}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {arrival.station} → {arrival.destination}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Testing Howard Station (30173)</strong> - One of CTA's busiest hubs. 
            This should return multiple train arrivals if the API is working correctly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};