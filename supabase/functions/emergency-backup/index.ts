import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emergencyReport = await req.json();
    
    console.log('🚨 EMERGENCY BACKUP TRIGGERED:', {
      id: emergencyReport.id,
      type: emergencyReport.type,
      timestamp: emergencyReport.timestamp,
      location: emergencyReport.location
    });

    // Log to Supabase logs for monitoring
    console.log(`CRITICAL: Emergency ${emergencyReport.type} reported at coordinates: ${emergencyReport.location.latitude}, ${emergencyReport.location.longitude}`);
    console.log(`Details: ${emergencyReport.details}`);
    
    // In production, this could:
    // 1. Send to multiple emergency service APIs
    // 2. Trigger SMS/email alerts to administrators
    // 3. Push to emergency dispatch systems
    // 4. Store in redundant backup databases
    
    // For now, ensure the report is logged and acknowledged
    const backupLog = {
      id: emergencyReport.id,
      type: emergencyReport.type,
      timestamp: new Date().toISOString(),
      location: emergencyReport.location,
      details: emergencyReport.details,
      backup_method: 'edge_function',
      status: 'logged'
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Emergency report logged via backup system',
        backup_id: backupLog.id,
        timestamp: backupLog.timestamp
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Emergency backup system error:', error);
    
    // Even if there's an error, we acknowledge receipt
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Emergency report received but processing failed',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});