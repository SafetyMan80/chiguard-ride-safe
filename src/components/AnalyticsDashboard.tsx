import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, MousePointer, Smartphone } from "lucide-react";

interface AnalyticsData {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  user_id: string | null;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    uniqueUsers: 0,
    pwaInstalls: 0,
    pageViews: 0,
    userActions: 0,
    appLaunches: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load recent events
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      setAnalytics(events || []);

      // Calculate stats
      const totalEvents = events?.length || 0;
      const uniqueUsers = new Set(events?.filter(e => e.user_id).map(e => e.user_id)).size;
      const pwaInstalls = events?.filter(e => e.event_type === 'pwa_install').length || 0;
      const pageViews = events?.filter(e => e.event_type === 'page_view').length || 0;
      const userActions = events?.filter(e => e.event_type === 'user_action').length || 0;
      const appLaunches = events?.filter(e => e.event_type === 'app_launch').length || 0;

      setStats({
        totalEvents,
        uniqueUsers,
        pwaInstalls,
        pageViews,
        userActions,
        appLaunches
      });

    } catch (error: any) {
      console.error('Analytics loading error:', error);
      toast({
        title: "Failed to load analytics",
        description: "You may need admin permissions to view analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              PWA Installs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pwaInstalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">App Launches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appLaunches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              User Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userActions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest user activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No analytics data yet</p>
            ) : (
              analytics.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        event.event_type === 'pwa_install' ? 'default' :
                        event.event_type === 'emergency_button_clicked' ? 'destructive' :
                        'secondary'
                      }>
                        {event.event_type.replace('_', ' ')}
                      </Badge>
                      {event.user_id && (
                        <span className="text-xs text-muted-foreground">
                          User: {event.user_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground max-w-xs">
                    {event.event_data && Object.keys(event.event_data).length > 0 && (
                      <pre className="text-xs bg-muted p-1 rounded">
                        {JSON.stringify(event.event_data, null, 1)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};