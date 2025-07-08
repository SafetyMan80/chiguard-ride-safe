import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const CTADebugTester = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCTAAPI = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Testing CTA API directly...');
      
      const { data, error } = await supabase.functions.invoke('cta-schedule', {
        body: { stopId: '30173' } // Howard Station
      });
      
      console.log('🔍 CTA Test Response:', data);
      console.log('🔍 CTA Test Error:', error);
      
      setResult({
        success: !error,
        data: data,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('🔍 CTA Test Exception:', err);
      setResult({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">🚨 CTA API Debug Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testCTAAPI} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Testing CTA API...' : 'Test CTA API (Howard Station)'}
        </Button>
        
        {result && (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Success:</strong> {result.success ? '✅ Yes' : '❌ No'}
            </div>
            
            {result.error && (
              <div className="text-sm text-red-600">
                <strong>Error:</strong> {result.error}
              </div>
            )}
            
            {result.data && (
              <div className="text-sm">
                <strong>Data Length:</strong> {result.data?.data?.length || 0} arrivals
                <br />
                <strong>Source:</strong> {result.data?.source || 'Unknown'}
                <br />
                <strong>API Success:</strong> {result.data?.success ? '✅' : '❌'}
                {result.data?.error && (
                  <>
                    <br />
                    <strong>API Error:</strong> {result.data.error}
                  </>
                )}
              </div>
            )}
            
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Raw Response</summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};