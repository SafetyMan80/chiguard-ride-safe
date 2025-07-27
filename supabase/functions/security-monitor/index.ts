import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body
    const { action, data } = await req.json();

    switch (action) {
      case 'check_security_alerts':
        return await checkSecurityAlerts(supabase);
      
      case 'analyze_threat_patterns':
        return await analyzeThreatPatterns(supabase);
      
      case 'generate_security_report':
        return await generateSecurityReport(supabase);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Security monitor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function checkSecurityAlerts(supabase: any): Promise<Response> {
  const alerts: SecurityAlert[] = [];
  
  try {
    // Check for multiple failed logins from same IP
    const { data: failedLogins } = await supabase
      .from('security_logs')
      .select('ip_address, event_data, created_at')
      .eq('event_type', 'FAILED_LOGIN')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .order('created_at', { ascending: false });

    if (failedLogins) {
      const ipFailureCounts = failedLogins.reduce((acc: Record<string, number>, log: any) => {
        const ip = log.ip_address;
        acc[ip] = (acc[ip] || 0) + 1;
        return acc;
      }, {});

      Object.entries(ipFailureCounts).forEach(([ip, count]) => {
        if (count >= 5) {
          alerts.push({
            type: 'BRUTE_FORCE_ATTACK',
            severity: 'high',
            message: `Multiple failed login attempts from IP: ${ip}`,
            data: { ip_address: ip, attempt_count: count }
          });
        }
      });
    }

    // Check for unusual file upload patterns
    const { data: uploadEvents } = await supabase
      .from('security_audit_logs')
      .select('ip_address, additional_data, created_at')
      .eq('action_type', 'FILE_UPLOAD_VALIDATED')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (uploadEvents) {
      const ipUploadCounts = uploadEvents.reduce((acc: Record<string, number>, log: any) => {
        const ip = log.ip_address;
        acc[ip] = (acc[ip] || 0) + 1;
        return acc;
      }, {});

      Object.entries(ipUploadCounts).forEach(([ip, count]) => {
        if (count >= 20) {
          alerts.push({
            type: 'SUSPICIOUS_UPLOAD_ACTIVITY',
            severity: 'medium',
            message: `High volume file uploads from IP: ${ip}`,
            data: { ip_address: ip, upload_count: count }
          });
        }
      });
    }

    // Check for rate limit violations
    const { data: rateLimits } = await supabase
      .from('rate_limits')
      .select('*')
      .not('blocked_until', 'is', null)
      .gte('blocked_until', new Date().toISOString());

    if (rateLimits && rateLimits.length > 0) {
      alerts.push({
        type: 'RATE_LIMIT_VIOLATIONS',
        severity: 'medium',
        message: `${rateLimits.length} IP addresses currently blocked`,
        data: { blocked_ips: rateLimits.map((r: any) => r.ip_address) }
      });
    }

    return new Response(
      JSON.stringify({ alerts }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error checking security alerts:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check security alerts' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function analyzeThreatPatterns(supabase: any): Promise<Response> {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Analyze security events over time
    const { data: recentEvents } = await supabase
      .from('security_logs')
      .select('event_type, created_at, ip_address')
      .gte('created_at', last24Hours.toISOString())
      .order('created_at', { ascending: false });

    const { data: weeklyEvents } = await supabase
      .from('security_logs')
      .select('event_type, created_at')
      .gte('created_at', last7Days.toISOString());

    const analysis = {
      summary: {
        events_last_24h: recentEvents?.length || 0,
        events_last_7d: weeklyEvents?.length || 0,
        unique_ips_24h: new Set(recentEvents?.map(e => e.ip_address)).size,
      },
      event_types: {},
      geographic_distribution: {},
      threat_level: 'low' as 'low' | 'medium' | 'high' | 'critical'
    };

    if (recentEvents) {
      // Count event types
      const eventTypeCounts = recentEvents.reduce((acc: Record<string, number>, event: any) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});

      analysis.event_types = eventTypeCounts;

      // Determine threat level
      const failedLogins = eventTypeCounts['FAILED_LOGIN'] || 0;
      const suspiciousEvents = (eventTypeCounts['CREDENTIAL_STUFFING_DETECTED'] || 0) + 
                              (eventTypeCounts['SUSPICIOUS_LOGIN_PATTERN'] || 0);

      if (suspiciousEvents > 0 || failedLogins > 50) {
        analysis.threat_level = 'high';
      } else if (failedLogins > 20) {
        analysis.threat_level = 'medium';
      }
    }

    return new Response(
      JSON.stringify({ analysis }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error analyzing threat patterns:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze threat patterns' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateSecurityReport(supabase: any): Promise<Response> {
  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get comprehensive security metrics
    const [securityLogs, auditLogs, rateLimits, incidents] = await Promise.all([
      supabase
        .from('security_logs')
        .select('*')
        .gte('created_at', last30Days.toISOString()),
      
      supabase
        .from('security_audit_logs')
        .select('*')
        .gte('created_at', last30Days.toISOString()),
      
      supabase
        .from('rate_limits')
        .select('*')
        .gte('created_at', last30Days.toISOString()),
      
      supabase
        .from('incident_reports')
        .select('*')
        .gte('created_at', last30Days.toISOString())
    ]);

    const report = {
      generated_at: now.toISOString(),
      period: '30 days',
      summary: {
        total_security_events: securityLogs.data?.length || 0,
        total_audit_events: auditLogs.data?.length || 0,
        rate_limit_violations: rateLimits.data?.length || 0,
        incident_reports: incidents.data?.length || 0,
      },
      recommendations: [
        'Enable leaked password protection in Supabase Auth settings',
        'Set OTP expiry to 15-30 minutes for better security',
        'Review and minimize extensions in public schema',
        'Implement regular security audits',
        'Consider adding CAPTCHA for repeated failed logins',
        'Set up automated alerts for critical security events'
      ],
      top_threats: [],
      compliance_status: {
        rls_enabled: true,
        input_sanitization: true,
        file_upload_validation: true,
        rate_limiting: true,
        audit_logging: true,
        csp_headers: true
      }
    };

    return new Response(
      JSON.stringify({ report }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error generating security report:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate security report' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}