import { useState, useEffect } from 'react';
import { PushNotifications, ActionPerformed, PushNotificationSchema, Token } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useErrorReporting } from './useErrorReporting';

export const usePushNotifications = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string>('');
  const { reportError } = useErrorReporting();

  useEffect(() => {
    // Only initialize push notifications on mobile platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications not available on web platform');
      return;
    }

    const initializePushNotifications = async () => {
      try {
        // Request permission to use push notifications
        const result = await PushNotifications.requestPermissions();
        
        if (result.receive === 'granted') {
          // Register with Apple / Google to receive push via APNS/FCM
          await PushNotifications.register();
        } else {
          console.log('Push notification permission denied');
        }
      } catch (error) {
        reportError(error as Error, {
          component: 'push_notifications',
          severity: 'low'
        });
      }
    };

    const addListeners = async () => {
      try {
        // On success, we should be able to receive notifications
        await PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
          setIsRegistered(true);
        });

        // Some issue with our setup and push will not work
        await PushNotifications.addListener('registrationError', (error: any) => {
          reportError(new Error('Push registration failed: ' + error.error), {
            component: 'push_notifications',
            severity: 'medium'
          });
        });

        // Show us the notification payload if the app is open on our device
        await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push notification received: ', notification);
        });

        // Method called when tapping on a notification
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
        });
      } catch (error) {
        reportError(error as Error, {
          component: 'push_notifications_listeners',
          severity: 'low'
        });
      }
    };

    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
      addListeners();
    }
  }, [reportError]);

  return {
    isRegistered,
    token
  };
};