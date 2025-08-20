// Service Worker for caching and security (AWS handles HTTPS redirects)
const CACHE_NAME = 'premier-squares-v3';
const STATIC_CACHE_NAME = 'premier-squares-static-v3';
const API_CACHE_NAME = 'premier-squares-api-v3';

// Install event - cache important resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll([
            '/',
            '/favicon.jpg'
          ]);
        }),
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          // Static assets will be cached dynamically as they're requested
          return Promise.resolve();
        }),
      caches.open(API_CACHE_NAME)
        .then((cache) => {
          // Cache API responses for offline use
          return cache.addAll([
            // Add any critical API endpoints here
          ]);
        })
    ])
  );
});

// Fetch event - handle requests with caching and security
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Security: Block potentially dangerous requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }
  
  // Security: Block requests to potentially dangerous protocols
  if (url.protocol === 'data:' || url.protocol === 'blob:') {
    event.respondWith(new Response('Blocked', { status: 403 }));
    return;
  }
  
  // AWS handles HTTPS redirects at server level
  // Only enforce HTTPS for API calls and external resources
  if (request.url.startsWith('http://') && 
      !request.url.includes('localhost') &&
      (request.url.includes('/api/') || request.url.includes('external-resource'))) {
    const httpsUrl = request.url.replace('http:', 'https:');
    event.respondWith(fetch(httpsUrl));
    return;
  }
  
  // Handle cache strategy for different types of requests
  if (request.destination === 'script' || request.destination === 'style') {
    // Cache static assets with network-first strategy
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else if (request.destination === 'image') {
    // Cache images with cache-first strategy
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              if (fetchResponse.status === 200) {
                const responseClone = fetchResponse.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => cache.put(request, responseClone));
              }
              return fetchResponse;
            });
        })
    );
  } else if (url.pathname.startsWith('/api/') || url.hostname.includes('espn.com')) {
    // API requests - network-first with fallback to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    // Default strategy for other requests
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Security: Handle message events
self.addEventListener('message', (event) => {
  // Only allow specific message types for security
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
