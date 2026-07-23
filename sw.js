const CACHE_NAME = 'voyage-japon-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install — skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate — delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback (for instant live updates)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
