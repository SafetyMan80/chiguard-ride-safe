const CACHE_NAME = 'chiguard-v2';
const STATIC_CACHE = 'chiguard-static-v2';

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
  console.log('Service Worker: Installing new version');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => {
        console.log('Service Worker: Installed, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating new version');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Taking control of all clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first strategy for better updates
self.addEventListener('fetch', (event) => {
  // Handle navigation requests - always try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the new version
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // For API requests and dynamic content - network first
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/v1/') ||
      event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // For static assets - try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return offline fallback for failed requests
            if (event.request.destination === 'image') {
              return caches.match('/lovable-uploads/a2eac1de-d4f2-41e7-8dc7-468b15f124e9.png');
            }
            return new Response('Offline', { status: 503 });
          });
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