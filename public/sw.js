// Service Worker for caching and security (AWS handles HTTPS redirects)
const CACHE_NAME = 'premier-squares-v1';

// Install event - cache important resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/favicon.jpg'
        ]);
      })
  );
});

// Fetch event - handle requests with caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // AWS handles HTTPS redirects at server level
  // Only enforce HTTPS for API calls and external resources
  if (request.url.startsWith('http://') && 
      !request.url.includes('localhost') &&
      (request.url.includes('/api/') || request.url.includes('external-resource'))) {
    const httpsUrl = request.url.replace('http:', 'https:');
    event.respondWith(fetch(httpsUrl));
    return;
  }
  
  // Handle cache strategy for other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
