const CACHE_NAME = 'chiguard-v1';
const STATIC_CACHE = 'chiguard-static-v1';

// Core app shell files to cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/a2eac1de-d4f2-41e7-8dc7-468b15f124e9.png',
  '/assets/chicago-l-train-ai.jpg',
  '/assets/chiguard-logo.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return fetchResponse;
          });
      })
      .catch(() => {
        // Return offline fallback for failed requests
        if (event.request.destination === 'image') {
          return caches.match('/lovable-uploads/a2eac1de-d4f2-41e7-8dc7-468b15f124e9.png');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This will be called when connection returns
  console.log('Syncing offline data...');
  
  // Get offline data from IndexedDB and sync with Supabase
  try {
    const db = await openDB();
    const offlineReports = await getOfflineReports(db);
    
    for (const report of offlineReports) {
      // Attempt to sync with Supabase
      await syncReportToSupabase(report);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('chiguard-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getOfflineReports(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['reports'], 'readonly');
    const store = transaction.objectStore('reports');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function syncReportToSupabase(report) {
  // This would sync with your Supabase endpoint
  // Implementation depends on your API structure
  console.log('Syncing report:', report);
}