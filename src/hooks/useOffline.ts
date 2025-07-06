import { useState, useEffect } from 'react';

interface OfflineReport {
  id?: number;
  type: 'incident' | 'emergency';
  data: any;
  timestamp: number;
  synced: boolean;
}

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    // Initialize IndexedDB
    initDB();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initDB = async () => {
    try {
      const database = await openDB();
      setDb(database);
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('rail-savior-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores for offline data
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('emergency_contacts')) {
          db.createObjectStore('emergency_contacts', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('user_profile')) {
          db.createObjectStore('user_profile', { keyPath: 'id' });
        }
      };
    });
  };

  const saveOfflineReport = async (type: 'incident' | 'emergency', data: any) => {
    if (!db) return false;

    try {
      const transaction = db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');
      
      const report: OfflineReport = {
        type,
        data,
        timestamp: Date.now(),
        synced: false
      };
      
      await store.add(report);
      return true;
    } catch (error) {
      console.error('Failed to save offline report:', error);
      return false;
    }
  };

  const saveUserProfile = async (profile: any) => {
    if (!db) return false;

    try {
      const transaction = db.transaction(['user_profile'], 'readwrite');
      const store = transaction.objectStore('user_profile');
      
      await store.put({ id: 'current', ...profile });
      return true;
    } catch (error) {
      console.error('Failed to save user profile offline:', error);
      return false;
    }
  };

  const getUserProfile = async () => {
    if (!db) return null;

    try {
      const transaction = db.transaction(['user_profile'], 'readonly');
      const store = transaction.objectStore('user_profile');
      const request = store.get('current');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  };

  const saveEmergencyContacts = async (contacts: any[]) => {
    if (!db) return false;

    try {
      const transaction = db.transaction(['emergency_contacts'], 'readwrite');
      const store = transaction.objectStore('emergency_contacts');
      
      await store.put({ id: 'contacts', data: contacts });
      return true;
    } catch (error) {
      console.error('Failed to save emergency contacts:', error);
      return false;
    }
  };

  const getEmergencyContacts = async () => {
    if (!db) return [];

    try {
      const transaction = db.transaction(['emergency_contacts'], 'readonly');
      const store = transaction.objectStore('emergency_contacts');
      const request = store.get('contacts');
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result?.data || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get emergency contacts:', error);
      return [];
    }
  };

  const syncOfflineData = async () => {
    if (!db || !isOnline) return;

    try {
      const transaction = db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const reports = request.result.filter((report: OfflineReport) => !report.synced);
        
        for (const report of reports) {
          try {
            // Here you would sync with Supabase
            console.log('Syncing report:', report);
            
            // Mark as synced
            report.synced = true;
            await store.put(report);
          } catch (error) {
            console.error('Failed to sync report:', error);
          }
        }
      };
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  };

  return {
    isOnline,
    saveOfflineReport,
    saveUserProfile,
    getUserProfile,
    saveEmergencyContacts,
    getEmergencyContacts,
    syncOfflineData
  };
};