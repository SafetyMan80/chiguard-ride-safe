import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocationService } from '@/hooks/useLocationService';

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  image?: string;
  sound?: string;
  priority?: 'high' | 'normal';
  city?: string;
}

export const usePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const { userCity, getCityDisplayName } = useLocationService();
  const { toast } = useToast();

  useEffect(() => {
    initializePushNotifications();
    setupRealtimeSubscription();
  }, [userCity]);

  const initializePushNotifications = async () => {
    try {
      // Request permission to use push notifications
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        setNotificationPermission('granted');
        
        // Register with Apple / Google to receive push notifications
        await PushNotifications.register();
        
        toast({
          title: "🔔 Push Notifications Enabled",
          description: `You'll receive incident alerts${userCity ? ` for ${getCityDisplayName(userCity)}` : ' for all cities'}`
        });
      } else {
        setNotificationPermission('denied');
        console.log('Push notification permission denied');
        
        toast({
          title: "Push Notifications Disabled",
          description: "Enable in settings to receive incident alerts",
          variant: "destructive"
        });
      }

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        setRegistrationToken(token.value);
        setIsRegistered(true);
        
        // Store token in user profile for targeted notifications
        storeNotificationToken(token.value);
      });

      // Some issue with our setup and push will not work
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error during registration: ' + JSON.stringify(error));
        toast({
          title: "Notification Setup Error",
          description: "Unable to setup push notifications",
          variant: "destructive"
        });
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        
        // Show in-app notification
        toast({
          title: notification.title || "🚨 Safety Alert",
          description: notification.body || "New incident reported",
          variant: "destructive"
        });
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
        
        // Navigate to incident report or specific location
        if (notification.notification?.data?.incident_id) {
          // Could navigate to specific incident
          window.location.hash = '#incidents';
        }
      });

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const storeNotificationToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store token with user's location info for targeted notifications
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          push_token: token,
          notification_city: userCity,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing notification token:', error);
      }
    } catch (error) {
      console.error('Error storing notification token:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Listen for new incident reports
    const channel = supabase
      .channel('incident-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'incident_reports'
        },
        (payload) => {
          handleNewIncident(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNewIncident = async (incident: any) => {
    // Filter notifications based on user's location
    const shouldNotify = !userCity || incident.transit_line === userCity;
    
    if (!shouldNotify) {
      console.log('Filtering out incident - not in user city:', incident.transit_line, 'vs', userCity);
      return;
    }

    const notificationData: NotificationPayload = {
      title: "🚨 Safety Alert",
      body: `${incident.incident_type} reported on ${getCityDisplayName(incident.transit_line)} at ${incident.location_name}`,
      data: {
        incident_id: incident.id,
        city: incident.transit_line,
        location: incident.location_name
      },
      priority: incident.incident_type === 'emergency' ? 'high' : 'normal',
      city: incident.transit_line
    };

    // Show local notification immediately for active users
    if (isRegistered) {
      showLocalNotification(notificationData);
    }

    // For emergency incidents, also trigger browser notification
    if (incident.incident_type === 'emergency' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notificationData.title, {
          body: notificationData.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `incident-${incident.id}`,
          requireInteraction: true
        });
      }
    }
  };

  const showLocalNotification = async (notification: NotificationPayload) => {
    try {
      // Use Capacitor's local notifications as fallback
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // Show in 1 second
            sound: 'beep.wav',
            attachments: notification.image ? [{ id: 'incident', url: notification.image }] : undefined,
            extra: notification.data
          }
        ]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
      
      // Fallback to browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192.png'
        });
      }
    }
  };

  const sendTestNotification = async () => {
    const testNotification: NotificationPayload = {
      title: "🧪 Test Alert",
      body: `Test notification for ${userCity ? getCityDisplayName(userCity) : 'all cities'}`,
      data: { test: true },
      priority: 'normal'
    };

    await showLocalNotification(testNotification);
    
    toast({
      title: "Test Notification Sent",
      description: "Check if you received the push notification"
    });
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      await initializePushNotifications();
    } else {
      // Disable notifications
      try {
        await PushNotifications.removeAllListeners();
        setIsRegistered(false);
        setRegistrationToken(null);
        
        toast({
          title: "Notifications Disabled",
          description: "You won't receive incident alerts"
        });
      } catch (error) {
        console.error('Error disabling notifications:', error);
      }
    }
  };

  return {
    isRegistered,
    registrationToken,
    notificationPermission,
    userCity,
    sendTestNotification,
    toggleNotifications,
    getCityDisplayName
  };
};