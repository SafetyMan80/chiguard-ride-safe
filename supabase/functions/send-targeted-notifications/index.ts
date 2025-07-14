import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  cityFilter?: string; // Only send to users in this city
  priority?: 'high' | 'normal';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function is triggered by database changes via webhooks
    // or can be called directly for testing
    const payload: NotificationPayload = await req.json();
    
    console.log('📱 Processing targeted notification:', {
      title: payload.title,
      cityFilter: payload.cityFilter,
      priority: payload.priority
    });

    // Get users with push tokens, filtered by city if specified
    let query = supabase
      .from('profiles')
      .select('push_token, notification_city, user_id')
      .not('push_token', 'is', null);

    // If cityFilter is provided, only notify users in that city or users with no city preference
    if (payload.cityFilter) {
      query = query.or(`notification_city.eq.${payload.cityFilter},notification_city.is.null`);
    }

    const { data: usersToNotify, error: queryError } = await query;

    if (queryError) {
      console.error('Error querying users:', queryError);
      throw queryError;
    }

    if (!usersToNotify || usersToNotify.length === 0) {
      console.log('No users to notify');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users to notify',
          usersTargeted: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Targeting ${usersToNotify.length} users for notifications`);

    // In a production environment, you would integrate with:
    // - Firebase Cloud Messaging (FCM) for Android
    // - Apple Push Notification Service (APNs) for iOS
    // - Web Push Protocol for web browsers
    
    // For now, we'll simulate the notification sending and log the results
    const notificationResults = await Promise.allSettled(
      usersToNotify.map(async (user) => {
        try {
          // Simulate push notification sending
          console.log(`📲 Sending notification to user ${user.user_id} in city ${user.notification_city || 'all cities'}`);
          
          // Here you would call the actual push notification service
          // Example for FCM:
          // await sendFCMNotification(user.push_token, payload);
          
          // For now, just simulate success
          return {
            userId: user.user_id,
            success: true,
            city: user.notification_city
          };
        } catch (error) {
          console.error(`Failed to send notification to user ${user.user_id}:`, error);
          return {
            userId: user.user_id,
            success: false,
            error: error.message,
            city: user.notification_city
          };
        }
      })
    );

    const successful = notificationResults.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = notificationResults.length - successful;

    // Log analytics
    await supabase.functions.invoke('track-event', {
      body: {
        event_type: 'push_notification_sent',
        event_data: {
          title: payload.title,
          city_filter: payload.cityFilter,
          users_targeted: usersToNotify.length,
          successful_sends: successful,
          failed_sends: failed,
          priority: payload.priority
        }
      }
    });

    console.log(`✅ Notification campaign completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent',
        usersTargeted: usersToNotify.length,
        successfulSends: successful,
        failedSends: failed,
        results: notificationResults.map(r => 
          r.status === 'fulfilled' ? r.value : { error: r.reason }
        )
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Targeted notification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send targeted notifications',
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

// Helper function for FCM (to be implemented)
async function sendFCMNotification(token: string, payload: NotificationPayload) {
  const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
  
  if (!FCM_SERVER_KEY) {
    throw new Error('FCM_SERVER_KEY not configured');
  }

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        click_action: 'https://railsafeapp.com'
      },
      data: payload.data || {},
      priority: payload.priority === 'high' ? 'high' : 'normal'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FCM request failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}